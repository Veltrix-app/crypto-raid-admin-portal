import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbPayoutCase } from "@/types/database";
import type {
  PayoutCaseEscalationState,
  PayoutCaseSeverity,
  PayoutCaseSourceType,
  PayoutCaseStatus,
  PayoutCaseType,
} from "./payout-config";

export type PayoutCaseEventType =
  | "case_opened"
  | "case_refreshed"
  | "annotated"
  | "escalated"
  | "project_input_requested"
  | "retry_queued"
  | "dismissed"
  | "resolved"
  | "reward_frozen"
  | "claim_rail_paused"
  | "payout_override_applied"
  | "permission_updated";

export type UpsertPayoutCaseRecordInput = {
  projectId: string;
  campaignId?: string | null;
  rewardId?: string | null;
  claimId?: string | null;
  authUserId?: string | null;
  walletAddress?: string | null;
  caseType: PayoutCaseType;
  severity?: PayoutCaseSeverity;
  status?: Exclude<PayoutCaseStatus, "resolved" | "dismissed">;
  sourceType: PayoutCaseSourceType;
  sourceId: string;
  dedupeKey: string;
  summary: string;
  evidenceSummary?: string | null;
  rawPayload?: Record<string, unknown>;
  escalationState?: PayoutCaseEscalationState;
  metadata?: Record<string, unknown>;
  eventSummary?: string;
};

export function buildPayoutCaseDedupeKey(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(":");
}

export async function insertPayoutCaseEvent(input: {
  payoutCaseId: string;
  projectId: string;
  eventType: PayoutCaseEventType;
  summary: string;
  visibilityScope?: "internal" | "project" | "both";
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  eventPayload?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("payout_case_events").insert({
    payout_case_id: input.payoutCaseId,
    project_id: input.projectId,
    event_type: input.eventType,
    visibility_scope: input.visibilityScope ?? "both",
    actor_auth_user_id: input.actorAuthUserId ?? null,
    actor_role: input.actorRole ?? null,
    summary: input.summary,
    event_payload: input.eventPayload ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to write payout case timeline event.");
  }
}

export async function loadPayoutCaseRecord(caseId: string, projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let query = supabase.from("payout_cases").select("*").eq("id", caseId);
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load payout case.");
  }

  if (!data) {
    return null;
  }

  return data as DbPayoutCase;
}

export async function upsertPayoutCaseRecord(input: UpsertPayoutCaseRecordInput) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data: existingCase, error: existingCaseError } = await supabase
    .from("payout_cases")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (existingCaseError) {
    throw new Error(existingCaseError.message || "Failed to load existing payout case.");
  }

  const payload = {
    project_id: input.projectId,
    campaign_id: input.campaignId ?? null,
    reward_id: input.rewardId ?? null,
    claim_id: input.claimId ?? null,
    auth_user_id: input.authUserId ?? null,
    wallet_address: input.walletAddress ?? null,
    case_type: input.caseType,
    severity: input.severity ?? "medium",
    status: input.status ?? "open",
    source_type: input.sourceType,
    source_id: input.sourceId,
    dedupe_key: input.dedupeKey,
    summary: input.summary,
    evidence_summary: input.evidenceSummary ?? null,
    raw_payload: input.rawPayload ?? {},
    escalation_state: input.escalationState ?? "none",
    metadata: input.metadata ?? {},
    resolution_notes: null,
    resolved_at: null,
    dismissed_at: null,
    updated_at: now,
  };

  let payoutCaseId = existingCase?.id ?? null;

  if (payoutCaseId) {
    const { error: updateError } = await supabase
      .from("payout_cases")
      .update(payload)
      .eq("id", payoutCaseId);

    if (updateError) {
      throw new Error(updateError.message || "Failed to update payout case.");
    }

    await insertPayoutCaseEvent({
      payoutCaseId,
      projectId: input.projectId,
      eventType: "case_refreshed",
      summary: input.eventSummary ?? input.summary,
      eventPayload: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        caseType: input.caseType,
      },
    });
  } else {
    const { data: insertedCase, error: insertError } = await supabase
      .from("payout_cases")
      .insert({
        ...payload,
        opened_at: now,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message || "Failed to create payout case.");
    }

    payoutCaseId = insertedCase.id as string;
    await insertPayoutCaseEvent({
      payoutCaseId,
      projectId: input.projectId,
      eventType: "case_opened",
      summary: input.eventSummary ?? input.summary,
      eventPayload: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        caseType: input.caseType,
      },
    });
  }

  return payoutCaseId;
}

export async function resolvePayoutCaseRecordByDedupeKey(input: {
  projectId: string;
  dedupeKey: string;
  summary: string;
  notes?: string | null;
  actorAuthUserId?: string | null;
  actorRole?: string | null;
}) {
  const supabase = getServiceSupabaseClient();
  const { data: payoutCase, error } = await supabase
    .from("payout_cases")
    .select("id, status")
    .eq("project_id", input.projectId)
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load payout case.");
  }

  if (!payoutCase?.id) {
    return null;
  }

  if (payoutCase.status !== "resolved") {
    const resolvedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("payout_cases")
      .update({
        status: "resolved",
        escalation_state: "none",
        resolution_notes: input.notes ?? null,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq("id", payoutCase.id);

    if (updateError) {
      throw new Error(updateError.message || "Failed to resolve payout case.");
    }
  }

  await insertPayoutCaseEvent({
    payoutCaseId: payoutCase.id as string,
    projectId: input.projectId,
    eventType: "resolved",
    summary: input.summary,
    actorAuthUserId: input.actorAuthUserId ?? null,
    actorRole: input.actorRole ?? null,
    eventPayload: {
      notes: input.notes ?? null,
    },
  });

  return payoutCase.id as string;
}
