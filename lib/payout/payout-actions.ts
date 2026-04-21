import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbPayoutCase } from "@/types/database";
import {
  createProjectOperationAudit,
  upsertProjectOperationOverride,
} from "@/lib/platform/core-ops";
import {
  hasPayoutActionPermission,
  type ProjectPayoutAccessResult,
  PayoutAccessError,
} from "./project-payout-auth";
import { insertPayoutCaseEvent, loadPayoutCaseRecord } from "./payout-case-records";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export const PAYOUT_CASE_ACTIONS = [
  "annotate",
  "request_project_input",
  "escalate",
  "retry",
  "dismiss",
  "resolve",
  "freeze_reward",
  "pause_claim_rail",
  "payout_override",
] as const;

export type PayoutCaseAction = (typeof PAYOUT_CASE_ACTIONS)[number];

type InternalPayoutActionInput = {
  caseId: string;
  actorAuthUserId: string;
  actorRole: string;
  action: PayoutCaseAction;
  notes?: string | null;
};

type ProjectPayoutActionInput = {
  access: ProjectPayoutAccessResult;
  caseId: string;
  action: Exclude<PayoutCaseAction, "request_project_input" | "dismiss">;
  notes?: string | null;
};

type PayoutCaseActionResult = {
  id: string;
  projectId: string;
};

function normalizeNotes(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function appendCaseMetadata(row: DbPayoutCase, action: PayoutCaseAction, actorAuthUserId: string) {
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

function actionPermissionForProjectAction(
  action: ProjectPayoutActionInput["action"]
) {
  switch (action) {
    case "annotate":
      return "annotate_case";
    case "escalate":
      return "escalate_case";
    case "retry":
      return "retry_project_flow";
    case "resolve":
      return "resolve_project_blocker";
    case "freeze_reward":
      return "freeze_reward";
    case "pause_claim_rail":
      return "pause_claim_rail";
    case "payout_override":
      return "payout_override";
  }
}

function assertProjectPayoutActionAllowed(
  access: ProjectPayoutAccessResult,
  action: ProjectPayoutActionInput["action"]
) {
  const permission = actionPermissionForProjectAction(action);
  if (!hasPayoutActionPermission(access, permission)) {
    throw new PayoutAccessError(403, "You do not have permission to run this payout action.");
  }
}

function buildActionMutation(params: {
  row: DbPayoutCase;
  actorAuthUserId: string;
  actorRole: string;
  action: PayoutCaseAction;
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
        summary: params.notes ?? "Added payout case annotation.",
        auditAction: "payout_case_annotated",
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
        summary: params.notes ?? "Requested project input on this payout case.",
        auditAction: "payout_case_project_input_requested",
      } as const;
    case "escalate":
      return {
        casePatch: {
          ...basePatch,
          status: "needs_project_input",
          escalation_state: params.scope === "internal" ? "awaiting_project" : "awaiting_internal",
        },
        eventType: "escalated",
        visibilityScope: "both",
        summary:
          params.notes ??
          (params.scope === "internal"
            ? "Escalated payout case to the project team."
            : "Escalated payout case back to internal payout ops."),
        auditAction: "payout_case_escalated",
      } as const;
    case "retry":
      return {
        casePatch: {
          ...basePatch,
          metadata: {
            ...nextMetadata,
            lastRetryRequestedAt: timestamp,
            lastRetryRequestedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "retry_queued",
        visibilityScope: "both",
        summary: params.notes ?? "Queued or triggered a payout retry path.",
        auditAction: "payout_case_retry_queued",
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
        summary: params.notes ?? "Dismissed payout case.",
        auditAction: "payout_case_dismissed",
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
        summary: params.notes ?? "Resolved payout case.",
        auditAction: "payout_case_resolved",
      } as const;
    case "freeze_reward":
      return {
        casePatch: {
          ...basePatch,
          status: params.row.status === "open" ? "blocked" : params.row.status,
          metadata: {
            ...nextMetadata,
            rewardFrozenAt: timestamp,
            rewardFrozenByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "reward_frozen",
        visibilityScope: "both",
        summary: params.notes ?? "Froze reward claims while the payout case is under review.",
        auditAction: "payout_case_reward_frozen",
      } as const;
    case "pause_claim_rail":
      return {
        casePatch: {
          ...basePatch,
          status: params.row.status === "open" ? "blocked" : params.row.status,
          metadata: {
            ...nextMetadata,
            claimRailPausedAt: timestamp,
            claimRailPausedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "claim_rail_paused",
        visibilityScope: "both",
        summary: params.notes ?? "Paused the claim rail while this payout case is handled.",
        auditAction: "payout_case_claim_rail_paused",
      } as const;
    case "payout_override":
      return {
        casePatch: {
          ...basePatch,
          metadata: {
            ...nextMetadata,
            payoutOverrideAt: timestamp,
            payoutOverrideByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "payout_override_applied",
        visibilityScope: params.scope === "internal" ? "internal" : "project",
        summary: params.notes ?? "Applied a payout override.",
        auditAction: "payout_case_override_applied",
      } as const;
  }
}

async function triggerPayoutRetry(row: DbPayoutCase, notes: string | null) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();

  if (row.source_type === "campaign_finalization" && row.campaign_id) {
    if (!communityBotUrl) {
      throw new Error("COMMUNITY_BOT_URL is missing for campaign payout retry.");
    }

    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/aesp/rewards/${row.campaign_id}/finalize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityBotWebhookSecret
            ? { "x-community-bot-secret": communityBotWebhookSecret }
            : {}),
        },
        body: JSON.stringify({ notes }),
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "Campaign payout retry failed."
      );
    }

    return;
  }

  if (row.claim_id) {
    const { data: claimRow, error: claimError } = await supabase
      .from("reward_claims")
      .select("delivery_payload")
      .eq("id", row.claim_id)
      .maybeSingle();

    if (claimError) {
      throw new Error(claimError.message || "Failed to load claim retry context.");
    }

    const { error: claimUpdateError } = await supabase
      .from("reward_claims")
      .update({
        status: "processing",
        updated_at: timestamp,
        fulfillment_notes: notes ?? "",
      })
      .eq("id", row.claim_id);

    if (claimUpdateError) {
      throw new Error(claimUpdateError.message || "Failed to update claim retry state.");
    }

    const deliveryPayload =
      claimRow?.delivery_payload && typeof claimRow.delivery_payload === "object"
        ? (claimRow.delivery_payload as Record<string, unknown>)
        : {};
    const distributionId =
      typeof deliveryPayload.distributionId === "string" ? deliveryPayload.distributionId : "";

    if (distributionId) {
      const { error: distributionError } = await supabase
        .from("reward_distributions")
        .update({
          status: "processing",
          updated_at: timestamp,
        })
        .eq("id", distributionId);

      if (distributionError) {
        throw new Error(distributionError.message || "Failed to update payout distribution retry state.");
      }
    }
  }
}

async function maybeApplyOperationalOverride(params: {
  row: DbPayoutCase;
  action: PayoutCaseAction;
  actorAuthUserId: string;
  notes: string | null;
}) {
  if (params.action === "freeze_reward" && params.row.reward_id) {
    await upsertProjectOperationOverride({
      projectId: params.row.project_id,
      objectType: "reward",
      objectId: params.row.reward_id,
      overrideType: "pause",
      reason: params.notes ?? "Reward frozen from payout console.",
      actorAuthUserId: params.actorAuthUserId,
      metadata: {
        payoutCaseId: params.row.id,
      },
    });
  }

  if (params.action === "pause_claim_rail") {
    await upsertProjectOperationOverride({
      projectId: params.row.project_id,
      objectType: "claim",
      objectId: "fulfillment-queue",
      overrideType: "pause",
      reason: params.notes ?? "Claim rail paused from payout console.",
      actorAuthUserId: params.actorAuthUserId,
      metadata: {
        payoutCaseId: params.row.id,
      },
    });
  }
}

async function writePayoutActionArtifacts(params: {
  row: DbPayoutCase;
  actorAuthUserId: string;
  actorRole: string;
  eventType: string;
  visibilityScope: "internal" | "project" | "both";
  summary: string;
  notes: string | null;
  action: PayoutCaseAction;
  auditAction: string;
}) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();

  const objectType = params.row.reward_id
    ? "reward"
    : params.row.claim_id
      ? "claim"
      : params.row.campaign_id
        ? "campaign"
        : "claim";
  const objectId = params.row.reward_id ?? params.row.claim_id ?? params.row.campaign_id ?? params.row.id;

  const [{ error: auditError }] = await Promise.all([
    supabase.from("admin_audit_logs").insert({
      auth_user_id: params.actorAuthUserId,
      project_id: params.row.project_id,
      source_table: "payout_cases",
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
    createProjectOperationAudit({
      projectId: params.row.project_id,
      objectType,
      objectId,
      actionType:
        params.action === "dismiss"
          ? "dismissed"
          : params.action === "resolve"
            ? "resolved"
            : params.action === "retry"
              ? "retried"
              : "updated",
      actorAuthUserId: params.actorAuthUserId,
      actorRole: params.actorRole,
      metadata: {
        payoutCaseId: params.row.id,
        action: params.action,
        notes: params.notes,
      },
    }),
  ]);

  if (auditError) {
    throw new Error(auditError.message || "Failed to write payout case audit log.");
  }

  await insertPayoutCaseEvent({
    payoutCaseId: params.row.id,
    projectId: params.row.project_id,
    eventType: params.eventType as Parameters<typeof insertPayoutCaseEvent>[0]["eventType"],
    visibilityScope: params.visibilityScope,
    actorAuthUserId: params.actorAuthUserId,
    actorRole: params.actorRole,
    summary: params.summary,
    eventPayload: {
      action: params.action,
      notes: params.notes,
    },
  });
}

export async function applyInternalPayoutCaseAction(input: InternalPayoutActionInput) {
  const row = await loadPayoutCaseRecord(input.caseId);
  if (!row) {
    throw new PayoutAccessError(404, "Payout case not found.");
  }

  const notes = normalizeNotes(input.notes);
  if (input.action === "retry") {
    await triggerPayoutRetry(row, notes);
  }
  await maybeApplyOperationalOverride({
    row,
    action: input.action,
    actorAuthUserId: input.actorAuthUserId,
    notes,
  });

  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    action: input.action,
    notes,
    scope: "internal",
  });
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("payout_cases")
    .update(mutation.casePatch)
    .eq("id", row.id)
    .eq("project_id", row.project_id);

  if (error) {
    throw new Error(error.message || "Failed to update payout case.");
  }

  await writePayoutActionArtifacts({
    row,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    eventType: mutation.eventType,
    visibilityScope: mutation.visibilityScope,
    summary: mutation.summary,
    notes,
    action: input.action,
    auditAction: mutation.auditAction,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  } satisfies PayoutCaseActionResult;
}

export async function applyProjectPayoutCaseAction(input: ProjectPayoutActionInput) {
  assertProjectPayoutActionAllowed(input.access, input.action);

  const row = await loadPayoutCaseRecord(input.caseId, input.access.projectId);
  if (!row) {
    throw new PayoutAccessError(404, "Payout case not found.");
  }

  const notes = normalizeNotes(input.notes);
  if (input.action === "retry") {
    await triggerPayoutRetry(row, notes);
  }
  await maybeApplyOperationalOverride({
    row,
    action: input.action,
    actorAuthUserId: input.access.authUserId,
    notes,
  });

  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.access.authUserId,
    actorRole: input.access.membershipRole ?? "project_member",
    action: input.action,
    notes,
    scope: "project",
  });
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("payout_cases")
    .update(mutation.casePatch)
    .eq("id", row.id)
    .eq("project_id", row.project_id);

  if (error) {
    throw new Error(error.message || "Failed to update project payout case.");
  }

  await writePayoutActionArtifacts({
    row,
    actorAuthUserId: input.access.authUserId,
    actorRole: input.access.membershipRole ?? "project_member",
    eventType: mutation.eventType,
    visibilityScope: mutation.visibilityScope,
    summary: mutation.summary,
    notes,
    action: input.action,
    auditAction: mutation.auditAction,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  } satisfies PayoutCaseActionResult;
}
