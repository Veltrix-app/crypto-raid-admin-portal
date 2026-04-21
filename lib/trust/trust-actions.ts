import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbTrustCase } from "@/types/database";
import {
  hasTrustActionPermission,
  type ProjectTrustAccessResult,
  TrustAccessError,
} from "./project-trust-auth";

export const TRUST_CASE_ACTIONS = [
  "annotate",
  "request_project_input",
  "escalate",
  "dismiss",
  "resolve",
  "mute_member",
  "freeze_reward_eligibility",
  "trust_override",
  "reward_override",
] as const;

export type TrustCaseAction = (typeof TRUST_CASE_ACTIONS)[number];

type InternalTrustActionInput = {
  caseId: string;
  actorAuthUserId: string;
  actorRole: string;
  action: TrustCaseAction;
  notes?: string | null;
};

type ProjectTrustActionInput = {
  access: ProjectTrustAccessResult;
  caseId: string;
  action: Exclude<TrustCaseAction, "request_project_input" | "dismiss">;
  notes?: string | null;
};

type TrustCaseActionResult = {
  id: string;
  projectId: string;
};

function normalizeNotes(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function loadTrustCase(caseId: string, projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let query = supabase.from("trust_cases").select("*").eq("id", caseId);
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load trust case.");
  }
  if (!data) {
    throw new TrustAccessError(404, "Trust case not found.");
  }

  return data as DbTrustCase;
}

function appendCaseMetadata(row: DbTrustCase, action: TrustCaseAction, actorAuthUserId: string) {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? { ...(row.metadata as Record<string, unknown>) }
      : {};
  const manualActions = Array.isArray(metadata.manualActions)
    ? [...(metadata.manualActions as Record<string, unknown>[])]
    : [];

  manualActions.unshift({
    action,
    actorAuthUserId,
    at: new Date().toISOString(),
  });

  return {
    ...metadata,
    manualActions: manualActions.slice(0, 12),
  };
}

function buildActionMutation(params: {
  row: DbTrustCase;
  actorAuthUserId: string;
  actorRole: string;
  action: TrustCaseAction;
  notes: string | null;
  scope: "internal" | "project";
}) {
  const timestamp = new Date().toISOString();
  const nextMetadata = appendCaseMetadata(params.row, params.action, params.actorAuthUserId);
  const basePatch: Record<string, unknown> = {
    updated_at: timestamp,
    metadata: nextMetadata,
  };

  if (params.scope === "internal") {
    basePatch.internal_owner_auth_user_id = params.actorAuthUserId;
  } else {
    basePatch.project_owner_auth_user_id = params.actorAuthUserId;
  }

  switch (params.action) {
    case "annotate":
      return {
        casePatch: basePatch,
        eventType: "annotated",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Added case annotation.",
        auditAction: "trust_case_annotated",
      } as const;
    case "request_project_input":
      return {
        casePatch: {
          ...basePatch,
          status: "needs_project_input",
          escalation_state: "awaiting_project",
        },
        eventType: "project_input_requested",
        visibilityScope: "both",
        summary: params.notes ?? "Requested project input on this trust case.",
        auditAction: "trust_case_project_input_requested",
      } as const;
    case "escalate":
      return {
        casePatch: {
          ...basePatch,
          status: "escalated",
          escalation_state: params.scope === "internal" ? "escalated" : "awaiting_internal",
        },
        eventType: "escalated",
        visibilityScope: "both",
        summary:
          params.notes ??
          (params.scope === "internal"
            ? "Escalated trust case for internal resolution."
            : "Escalated trust case back to Veltrix trust ops."),
        auditAction: "trust_case_escalated",
      } as const;
    case "dismiss":
      return {
        casePatch: {
          ...basePatch,
          status: "dismissed",
          escalation_state: "none",
          resolution_notes: params.notes,
          dismissed_at: timestamp,
        },
        eventType: "dismissed",
        visibilityScope: "both",
        summary: params.notes ?? "Dismissed trust case.",
        auditAction: "trust_case_dismissed",
      } as const;
    case "resolve":
      return {
        casePatch: {
          ...basePatch,
          status: "resolved",
          escalation_state: "none",
          resolution_notes: params.notes,
          resolved_at: timestamp,
        },
        eventType: "resolved",
        visibilityScope: "both",
        summary: params.notes ?? "Resolved trust case.",
        auditAction: "trust_case_resolved",
      } as const;
    case "mute_member":
      return {
        casePatch: {
          ...basePatch,
          status: params.row.status === "open" ? "triaging" : params.row.status,
          metadata: {
            ...nextMetadata,
            mutedAt: timestamp,
            mutedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "annotated",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Muted member while the trust case is being reviewed.",
        auditAction: "trust_case_member_muted",
      } as const;
    case "freeze_reward_eligibility":
      return {
        casePatch: {
          ...basePatch,
          status: params.row.status === "open" ? "triaging" : params.row.status,
          metadata: {
            ...nextMetadata,
            rewardEligibilityFrozenAt: timestamp,
            rewardEligibilityFrozenByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "annotated",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Froze reward eligibility while the trust case is being reviewed.",
        auditAction: "trust_case_reward_eligibility_frozen",
      } as const;
    case "trust_override":
      return {
        casePatch: {
          ...basePatch,
          metadata: {
            ...nextMetadata,
            trustOverrideAt: timestamp,
            trustOverrideByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "trust_override_applied",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Applied a trust override.",
        auditAction: "trust_case_trust_override_applied",
      } as const;
    case "reward_override":
      return {
        casePatch: {
          ...basePatch,
          metadata: {
            ...nextMetadata,
            rewardOverrideAt: timestamp,
            rewardOverrideByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "reward_override_applied",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Applied a reward trust override.",
        auditAction: "trust_case_reward_override_applied",
      } as const;
  }
}

async function writeTrustActionArtifacts(params: {
  row: DbTrustCase;
  actorAuthUserId: string;
  actorRole: string;
  eventType: string;
  visibilityScope: "internal" | "project" | "both";
  summary: string;
  notes: string | null;
  action: TrustCaseAction;
  auditAction: string;
}) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();

  const [{ error: eventError }, { error: auditError }] = await Promise.all([
    supabase.from("trust_case_events").insert({
      trust_case_id: params.row.id,
      project_id: params.row.project_id,
      event_type: params.eventType,
      visibility_scope: params.visibilityScope,
      actor_auth_user_id: params.actorAuthUserId,
      actor_role: params.actorRole,
      summary: params.summary,
      event_payload: {
        action: params.action,
        notes: params.notes,
      },
      created_at: timestamp,
      updated_at: timestamp,
    }),
    supabase.from("admin_audit_logs").insert({
      auth_user_id: params.actorAuthUserId,
      project_id: params.row.project_id,
      source_table: "trust_cases",
      source_id: params.row.id,
      action: params.auditAction,
      summary: params.summary,
      metadata: {
        caseType: params.row.case_type,
        severity: params.row.severity,
        status: params.row.status,
        action: params.action,
        notes: params.notes,
        visibilityScope: params.visibilityScope,
      },
      created_at: timestamp,
    }),
  ]);

  if (eventError) {
    throw new Error(eventError.message || "Failed to write trust case timeline event.");
  }
  if (auditError) {
    throw new Error(auditError.message || "Failed to write trust case audit log.");
  }
}

export async function applyInternalTrustCaseAction(input: InternalTrustActionInput) {
  const row = await loadTrustCase(input.caseId);
  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    action: input.action,
    notes: normalizeNotes(input.notes),
    scope: "internal",
  });
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("trust_cases")
    .update(mutation.casePatch)
    .eq("id", row.id)
    .eq("project_id", row.project_id);

  if (error) {
    throw new Error(error.message || "Failed to update trust case.");
  }

  await writeTrustActionArtifacts({
    row,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    eventType: mutation.eventType,
    visibilityScope: mutation.visibilityScope,
    summary: mutation.summary,
    notes: normalizeNotes(input.notes),
    action: input.action,
    auditAction: mutation.auditAction,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  } satisfies TrustCaseActionResult;
}

function assertProjectTrustActionAllowed(
  access: ProjectTrustAccessResult,
  action: ProjectTrustActionInput["action"]
) {
  const permission =
    action === "annotate"
      ? "annotate_case"
      : action === "escalate"
        ? "escalate_case"
        : action === "resolve"
          ? "resolve_project_case"
          : action === "mute_member"
            ? "mute_member"
            : action === "freeze_reward_eligibility"
              ? "freeze_reward_eligibility"
              : action === "trust_override"
                ? "trust_override"
                : "reward_trust_override";

  if (!hasTrustActionPermission(access, permission)) {
    throw new TrustAccessError(403, "You do not have permission to run this trust action.");
  }
}

export async function applyProjectTrustCaseAction(input: ProjectTrustActionInput) {
  assertProjectTrustActionAllowed(input.access, input.action);

  const row = await loadTrustCase(input.caseId, input.access.projectId);
  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.access.authUserId,
    actorRole: input.access.membershipRole ?? "project_member",
    action: input.action,
    notes: normalizeNotes(input.notes),
    scope: "project",
  });
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("trust_cases")
    .update(mutation.casePatch)
    .eq("id", row.id)
    .eq("project_id", row.project_id);

  if (error) {
    throw new Error(error.message || "Failed to update project trust case.");
  }

  await writeTrustActionArtifacts({
    row,
    actorAuthUserId: input.access.authUserId,
    actorRole: input.access.membershipRole ?? "project_member",
    eventType: mutation.eventType,
    visibilityScope: mutation.visibilityScope,
    summary: mutation.summary,
    notes: normalizeNotes(input.notes),
    action: input.action,
    auditAction: mutation.auditAction,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  } satisfies TrustCaseActionResult;
}
