import type { DbPayoutCase, DbPayoutCaseEvent } from "@/types/database";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  hasPayoutVisibilityPermission,
  type ProjectPayoutAccessResult,
  PayoutAccessError,
} from "./project-payout-auth";
import { syncPayoutCaseSources } from "./payout-case-sync";

export type ProjectPayoutCaseSummary = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username: string | null;
  rewardTitle: string | null;
  campaignTitle: string | null;
  openedAt: string;
  updatedAt: string;
};

export type ProjectPayoutCaseDetail = ProjectPayoutCaseSummary & {
  claimId: string | null;
  rewardId: string | null;
  campaignId: string | null;
  authUserId: string | null;
  walletAddress: string | null;
  rawPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  sourceType: string;
  sourceId: string | null;
  claimMethod: string | null;
  events: Array<{
    id: string;
    eventType: string;
    summary: string | null;
    createdAt: string;
    eventPayload: Record<string, unknown> | null;
  }>;
};

async function buildUsernameMap(authUserIds: string[]) {
  if (authUserIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("auth_user_id, username")
    .in("auth_user_id", authUserIds);

  if (error) {
    throw new Error(error.message || "Failed to load payout usernames.");
  }

  return new Map(
    ((data ?? []) as Array<{ auth_user_id: string; username: string | null }>).map((row) => [
      row.auth_user_id,
      row.username ?? "Unknown user",
    ])
  );
}

function shapeProjectPayoutCaseSummary(
  row: DbPayoutCase,
  usernameByAuthUserId: Map<string, string>,
  access: ProjectPayoutAccessResult
): ProjectPayoutCaseSummary {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const canSeeMemberDetail = hasPayoutVisibilityPermission(access, "member_claim_detail");
  return {
    id: row.id,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    escalationState: row.escalation_state,
    username:
      canSeeMemberDetail && row.auth_user_id
        ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user"
        : null,
    rewardTitle: typeof metadata.rewardTitle === "string" ? metadata.rewardTitle : null,
    campaignTitle: typeof metadata.campaignTitle === "string" ? metadata.campaignTitle : null,
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectPayoutCases(access: ProjectPayoutAccessResult) {
  await syncPayoutCaseSources(access.projectId);

  if (!hasPayoutVisibilityPermission(access, "claim_list")) {
    throw new PayoutAccessError(403, "You do not have access to the project payout case list.");
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("payout_cases")
    .select("*")
    .eq("project_id", access.projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message || "Failed to load project payout cases.");
  }

  const rows = (data ?? []) as DbPayoutCase[];
  const usernameByAuthUserId = await buildUsernameMap(
    Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
  );

  return rows.map((row) => shapeProjectPayoutCaseSummary(row, usernameByAuthUserId, access));
}

export async function loadProjectPayoutCaseDetail(caseId: string, access: ProjectPayoutAccessResult) {
  if (!hasPayoutVisibilityPermission(access, "claim_list")) {
    throw new PayoutAccessError(403, "You do not have access to project payout cases.");
  }

  const supabase = getServiceSupabaseClient();
  const [{ data: caseRow, error: caseError }, { data: eventRows, error: eventError }] =
    await Promise.all([
      supabase
        .from("payout_cases")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("id", caseId)
        .maybeSingle(),
      supabase
        .from("payout_case_events")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("payout_case_id", caseId)
        .in("visibility_scope", ["project", "both"])
        .order("created_at", { ascending: false }),
    ]);

  if (caseError) {
    throw new Error(caseError.message || "Failed to load payout case detail.");
  }
  if (eventError) {
    throw new Error(eventError.message || "Failed to load payout case timeline.");
  }
  if (!caseRow) {
    return null;
  }

  const row = caseRow as DbPayoutCase;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const usernameByAuthUserId = await buildUsernameMap(
    row.auth_user_id ? [row.auth_user_id] : []
  );

  const canSeeMemberDetail = hasPayoutVisibilityPermission(access, "member_claim_detail");
  const canSeeWalletDetail = hasPayoutVisibilityPermission(access, "wallet_delivery_detail");
  const canSeeFailureDetail = hasPayoutVisibilityPermission(access, "payout_failure_detail");
  const canSeeHistory = hasPayoutVisibilityPermission(access, "resolution_history");

  return {
    ...shapeProjectPayoutCaseSummary(row, usernameByAuthUserId, access),
    claimId: row.claim_id,
    rewardId: row.reward_id,
    campaignId: row.campaign_id,
    authUserId: canSeeMemberDetail ? row.auth_user_id : null,
    walletAddress: canSeeWalletDetail ? row.wallet_address : null,
    rawPayload: canSeeFailureDetail ? row.raw_payload : null,
    resolutionNotes: canSeeHistory ? row.resolution_notes : null,
    metadata: canSeeFailureDetail ? row.metadata : null,
    sourceType: row.source_type,
    sourceId: row.source_id,
    claimMethod: typeof metadata.claimMethod === "string" ? metadata.claimMethod : null,
    events: canSeeHistory
      ? ((eventRows ?? []) as DbPayoutCaseEvent[]).map((event) => ({
          id: event.id,
          eventType: event.event_type,
          summary: event.summary,
          createdAt: event.created_at,
          eventPayload: canSeeFailureDetail ? event.event_payload : null,
        }))
      : [],
  } satisfies ProjectPayoutCaseDetail;
}
