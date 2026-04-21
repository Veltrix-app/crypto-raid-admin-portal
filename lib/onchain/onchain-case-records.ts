import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbOnchainCase } from "@/types/database";
import type {
  OnchainCaseEscalationState,
  OnchainCaseSeverity,
  OnchainCaseSourceType,
  OnchainCaseStatus,
  OnchainCaseType,
} from "./onchain-config";

export type OnchainCaseEventType =
  | "case_opened"
  | "case_refreshed"
  | "annotated"
  | "retry_queued"
  | "retry_completed"
  | "retry_failed"
  | "project_input_requested"
  | "asset_rescan_queued"
  | "enrichment_rerun_queued"
  | "escalated"
  | "resolved"
  | "dismissed"
  | "permission_updated";

export type UpsertOnchainCaseRecordInput = {
  projectId: string;
  authUserId?: string | null;
  walletAddress?: string | null;
  assetId?: string | null;
  caseType: OnchainCaseType;
  severity?: OnchainCaseSeverity;
  status?: Exclude<OnchainCaseStatus, "resolved" | "dismissed">;
  sourceType: OnchainCaseSourceType;
  sourceId: string;
  dedupeKey: string;
  summary: string;
  evidenceSummary?: string | null;
  rawPayload?: Record<string, unknown>;
  escalationState?: OnchainCaseEscalationState;
  metadata?: Record<string, unknown>;
  eventSummary?: string;
};

export function buildOnchainCaseDedupeKey(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim().toLowerCase() : ""))
    .filter(Boolean)
    .join(":");
}

export async function insertOnchainCaseEvent(input: {
  onchainCaseId: string;
  projectId: string;
  eventType: OnchainCaseEventType;
  summary: string;
  visibilityScope?: "internal" | "project" | "both";
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  eventPayload?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("onchain_case_events").insert({
    onchain_case_id: input.onchainCaseId,
    project_id: input.projectId,
    event_type: input.eventType,
    visibility_scope: input.visibilityScope ?? "both",
    actor_auth_user_id: input.actorAuthUserId ?? null,
    actor_role: input.actorRole ?? null,
    summary: input.summary,
    event_payload: input.eventPayload ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to write on-chain case timeline event.");
  }
}

export async function loadOnchainCaseRecord(caseId: string, projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let query = supabase.from("onchain_cases").select("*").eq("id", caseId);
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load on-chain case.");
  }

  if (!data) {
    return null;
  }

  return data as DbOnchainCase;
}
