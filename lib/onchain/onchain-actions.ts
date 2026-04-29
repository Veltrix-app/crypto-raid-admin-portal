import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { createProjectOperationAudit } from "@/lib/platform/core-ops";
import type { DbOnchainCase } from "@/types/database";
import {
  hasOnchainActionPermission,
  type ProjectOnchainAccessResult,
  OnchainAccessError,
} from "./project-onchain-auth";
import {
  insertOnchainCaseEvent,
  loadOnchainCaseRecord,
  type OnchainCaseEventType,
} from "./onchain-case-records";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityJobSecret =
  process.env.COMMUNITY_RETRY_JOB_SECRET ?? process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export const ONCHAIN_CASE_ACTIONS = [
  "annotate",
  "request_project_input",
  "escalate",
  "retry",
  "rerun_enrichment",
  "rescan_assets",
  "dismiss",
  "resolve",
] as const;

export type OnchainCaseAction = (typeof ONCHAIN_CASE_ACTIONS)[number];

type InternalOnchainActionInput = {
  caseId: string;
  actorAuthUserId: string;
  actorRole: string;
  action: OnchainCaseAction;
  notes?: string | null;
};

type ProjectOnchainActionInput = {
  access: ProjectOnchainAccessResult;
  caseId: string;
  action: Exclude<OnchainCaseAction, "request_project_input" | "dismiss">;
  notes?: string | null;
};

type OnchainActionMutation = {
  casePatch: Record<string, unknown>;
  eventType: OnchainCaseEventType;
  visibilityScope: "internal" | "project" | "both";
  summary: string;
  auditAction: "updated" | "retried" | "dismissed" | "resolved";
};

function normalizeNotes(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function appendCaseMetadata(row: DbOnchainCase, action: OnchainCaseAction, actorAuthUserId: string) {
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
  row: DbOnchainCase;
  actorAuthUserId: string;
  action: OnchainCaseAction;
  notes: string | null;
  scope: "internal" | "project";
}): OnchainActionMutation {
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
        summary: params.notes ?? "Added on-chain case annotation.",
        auditAction: "updated",
      };
    case "request_project_input":
      return {
        casePatch: {
          ...basePatch,
          status: "needs_project_input",
          escalation_state: "awaiting_project",
        },
        eventType: "project_input_requested",
        visibilityScope: "both",
        summary: params.notes ?? "Requested project input on this on-chain case.",
        auditAction: "updated",
      };
    case "escalate":
      return {
        casePatch: {
          ...basePatch,
          status: params.scope === "internal" ? "triaging" : "needs_project_input",
          escalation_state: params.scope === "internal" ? "escalated" : "awaiting_internal",
        },
        eventType: "escalated",
        visibilityScope: "both",
        summary:
          params.notes ??
          (params.scope === "internal"
            ? "Escalated on-chain case for deeper internal resolution."
            : "Escalated on-chain case back to VYNTRO on-chain ops."),
        auditAction: "updated",
      };
    case "retry":
      return {
        casePatch: {
          ...basePatch,
          status: "retry_queued",
          metadata: {
            ...nextMetadata,
            lastRetryRequestedAt: timestamp,
            lastRetryRequestedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "retry_queued",
        visibilityScope: "both",
        summary: params.notes ?? "Queued an on-chain retry path.",
        auditAction: "retried",
      };
    case "rerun_enrichment":
      return {
        casePatch: {
          ...basePatch,
          status: "retry_queued",
          metadata: {
            ...nextMetadata,
            lastEnrichmentRerunRequestedAt: timestamp,
            lastEnrichmentRerunRequestedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "enrichment_rerun_queued",
        visibilityScope: "both",
        summary: params.notes ?? "Queued an enrichment rerun for this on-chain issue.",
        auditAction: "retried",
      };
    case "rescan_assets":
      return {
        casePatch: {
          ...basePatch,
          status: "retry_queued",
          metadata: {
            ...nextMetadata,
            lastAssetRescanRequestedAt: timestamp,
            lastAssetRescanRequestedByAuthUserId: params.actorAuthUserId,
          },
        },
        eventType: "asset_rescan_queued",
        visibilityScope: "both",
        summary: params.notes ?? "Queued a tracked-asset rescan for this on-chain issue.",
        auditAction: "retried",
      };
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
        summary: params.notes ?? "Dismissed on-chain case.",
        auditAction: "dismissed",
      };
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
        summary: params.notes ?? "Resolved on-chain case.",
        auditAction: "resolved",
      };
  }
}

function actionPermissionForProjectAction(action: ProjectOnchainActionInput["action"]) {
  switch (action) {
    case "annotate":
      return "annotate_case";
    case "escalate":
      return "escalate_case";
    case "retry":
      return "retry_project_case";
    case "rerun_enrichment":
      return "rerun_project_enrichment";
    case "rescan_assets":
      return "rescan_project_assets";
    case "resolve":
      return "resolve_project_blocker";
  }
}

function assertProjectOnchainActionAllowed(
  access: ProjectOnchainAccessResult,
  action: ProjectOnchainActionInput["action"]
) {
  const permission = actionPermissionForProjectAction(action);
  if (!hasOnchainActionPermission(access, permission)) {
    throw new OnchainAccessError(403, "You do not have permission to run this on-chain action.");
  }
}

async function triggerProjectSafeOnchainAction(params: {
  row: DbOnchainCase;
  action: ProjectOnchainActionInput["action"];
  notes: string | null;
}) {
  if (!communityBotUrl || !communityJobSecret) {
    return;
  }

  if (params.action === "rescan_assets") {
    await fetch(`${communityBotUrl.replace(/\/+$/, "")}/jobs/sync-onchain-provider`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-community-job-secret": communityJobSecret,
      },
      body: JSON.stringify({
        projectId: params.row.project_id,
        limit: 50,
        maxBlocks: 1500,
        notes: params.notes,
      }),
      cache: "no-store",
    }).catch(() => undefined);
  }
}

async function persistOnchainAction(params: {
  row: DbOnchainCase;
  actorAuthUserId: string;
  actorRole: string;
  action: OnchainCaseAction;
  notes: string | null;
  mutation: OnchainActionMutation;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("onchain_cases")
    .update(params.mutation.casePatch)
    .eq("id", params.row.id)
    .eq("project_id", params.row.project_id);

  if (error) {
    throw new Error(error.message || "Failed to update on-chain case.");
  }

  await Promise.all([
    insertOnchainCaseEvent({
      onchainCaseId: params.row.id,
      projectId: params.row.project_id,
      eventType: params.mutation.eventType,
      visibilityScope: params.mutation.visibilityScope,
      actorAuthUserId: params.actorAuthUserId,
      actorRole: params.actorRole,
      summary: params.mutation.summary,
      eventPayload: {
        action: params.action,
        notes: params.notes,
      },
    }),
    createProjectOperationAudit({
      projectId: params.row.project_id,
      objectType: "provider_sync",
      objectId: params.row.id,
      actionType: params.mutation.auditAction,
      actorAuthUserId: params.actorAuthUserId,
      actorRole: params.actorRole,
      metadata: {
        caseType: params.row.case_type,
        severity: params.row.severity,
        status: params.row.status,
        action: params.action,
        notes: params.notes,
        visibilityScope: params.mutation.visibilityScope,
      },
    }),
  ]);
}

export async function applyInternalOnchainCaseAction(input: InternalOnchainActionInput) {
  const row = await loadOnchainCaseRecord(input.caseId);
  if (!row) {
    throw new OnchainAccessError(404, "On-chain case not found.");
  }

  const notes = normalizeNotes(input.notes);
  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.actorAuthUserId,
    action: input.action,
    notes,
    scope: "internal",
  });

  await persistOnchainAction({
    row,
    actorAuthUserId: input.actorAuthUserId,
    actorRole: input.actorRole,
    action: input.action,
    notes,
    mutation,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  };
}

export async function applyProjectOnchainCaseAction(input: ProjectOnchainActionInput) {
  assertProjectOnchainActionAllowed(input.access, input.action);

  const row = await loadOnchainCaseRecord(input.caseId, input.access.projectId);
  if (!row) {
    throw new OnchainAccessError(404, "On-chain case not found.");
  }

  const notes = normalizeNotes(input.notes);
  const mutation = buildActionMutation({
    row,
    actorAuthUserId: input.access.authUserId,
    action: input.action,
    notes,
    scope: "project",
  });

  await persistOnchainAction({
    row,
    actorAuthUserId: input.access.authUserId,
    actorRole: input.access.membershipRole ?? "project_member",
    action: input.action,
    notes,
    mutation,
  });

  await triggerProjectSafeOnchainAction({
    row,
    action: input.action,
    notes,
  });

  return {
    id: row.id,
    projectId: row.project_id,
  };
}
