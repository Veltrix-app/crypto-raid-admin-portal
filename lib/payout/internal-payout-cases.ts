import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbPayoutCase, DbPayoutCaseEvent } from "@/types/database";
import { syncPayoutCaseSources } from "./payout-case-sync";

export type InternalPayoutCaseSummary = {
  id: string;
  projectId: string;
  projectName: string;
  campaignId: string | null;
  campaignTitle: string | null;
  rewardId: string | null;
  rewardTitle: string | null;
  claimId: string | null;
  authUserId: string | null;
  username: string | null;
  walletAddress: string | null;
  caseType: string;
  severity: string;
  status: string;
  sourceType: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  claimMethod: string | null;
  openedAt: string;
  updatedAt: string;
};

export type InternalPayoutCaseDetail = InternalPayoutCaseSummary & {
  sourceId: string | null;
  dedupeKey: string;
  rawPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
};

export type InternalPayoutCaseEvent = {
  id: string;
  payoutCaseId: string;
  eventType: string;
  visibilityScope: string;
  actorAuthUserId: string | null;
  summary: string | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

async function buildProjectNameMap(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id, name").in("id", projectIds);

  if (error) {
    throw new Error(error.message || "Failed to load payout-case project names.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; name: string | null }>).map((row) => [
      row.id,
      row.name ?? "Project",
    ])
  );
}

async function buildCampaignTitleMap(campaignIds: string[]) {
  if (campaignIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title")
    .in("id", campaignIds);

  if (error) {
    throw new Error(error.message || "Failed to load payout-case campaign titles.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; title: string | null }>).map((row) => [
      row.id,
      row.title ?? "Campaign",
    ])
  );
}

async function buildRewardTitleMap(rewardIds: string[]) {
  if (rewardIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("rewards").select("id, title").in("id", rewardIds);

  if (error) {
    throw new Error(error.message || "Failed to load payout-case reward titles.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; title: string | null }>).map((row) => [
      row.id,
      row.title ?? "Reward",
    ])
  );
}

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
    throw new Error(error.message || "Failed to load payout-case usernames.");
  }

  return new Map(
    ((data ?? []) as Array<{ auth_user_id: string; username: string | null }>).map((row) => [
      row.auth_user_id,
      row.username ?? "Unknown user",
    ])
  );
}

function shapeInternalCase(
  row: DbPayoutCase,
  projectNameById: Map<string, string>,
  campaignTitleById: Map<string, string>,
  rewardTitleById: Map<string, string>,
  usernameByAuthUserId: Map<string, string>
): InternalPayoutCaseDetail {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: row.id,
    projectId: row.project_id,
    projectName:
      (typeof metadata.projectName === "string" ? metadata.projectName : null) ??
      projectNameById.get(row.project_id) ??
      "Project",
    campaignId: row.campaign_id,
    campaignTitle:
      (typeof metadata.campaignTitle === "string" ? metadata.campaignTitle : null) ??
      (row.campaign_id ? campaignTitleById.get(row.campaign_id) ?? null : null),
    rewardId: row.reward_id,
    rewardTitle:
      (typeof metadata.rewardTitle === "string" ? metadata.rewardTitle : null) ??
      (row.reward_id ? rewardTitleById.get(row.reward_id) ?? null : null),
    claimId: row.claim_id,
    authUserId: row.auth_user_id,
    username:
      row.auth_user_id ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user" : null,
    walletAddress: row.wallet_address,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    sourceType: row.source_type,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    rawPayload: row.raw_payload,
    resolutionNotes: row.resolution_notes,
    escalationState: row.escalation_state,
    metadata: row.metadata,
    claimMethod: typeof metadata.claimMethod === "string" ? metadata.claimMethod : null,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    updatedAt: row.updated_at,
  };
}

export async function listInternalPayoutCases() {
  await syncPayoutCaseSources();

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("payout_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(160);

  if (error) {
    throw new Error(error.message || "Failed to load internal payout cases.");
  }

  const rows = (data ?? []) as DbPayoutCase[];
  const [projectNameById, campaignTitleById, rewardTitleById, usernameByAuthUserId] =
    await Promise.all([
      buildProjectNameMap(Array.from(new Set(rows.map((row) => row.project_id).filter(Boolean)))),
      buildCampaignTitleMap(
        Array.from(new Set(rows.map((row) => row.campaign_id).filter(Boolean) as string[]))
      ),
      buildRewardTitleMap(
        Array.from(new Set(rows.map((row) => row.reward_id).filter(Boolean) as string[]))
      ),
      buildUsernameMap(
        Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
      ),
    ]);

  return rows.map((row) =>
    shapeInternalCase(row, projectNameById, campaignTitleById, rewardTitleById, usernameByAuthUserId)
  );
}

export async function loadInternalPayoutCaseDetail(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("payout_cases").select("*").eq("id", caseId).maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load payout case.");
  }

  if (!data) {
    return null;
  }

  const row = data as DbPayoutCase;
  const [projectNameById, campaignTitleById, rewardTitleById, usernameByAuthUserId] =
    await Promise.all([
      buildProjectNameMap([row.project_id]),
      buildCampaignTitleMap(row.campaign_id ? [row.campaign_id] : []),
      buildRewardTitleMap(row.reward_id ? [row.reward_id] : []),
      buildUsernameMap(row.auth_user_id ? [row.auth_user_id] : []),
    ]);

  return shapeInternalCase(row, projectNameById, campaignTitleById, rewardTitleById, usernameByAuthUserId);
}

export async function listInternalPayoutCaseEvents(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("payout_case_events")
    .select("*")
    .eq("payout_case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load payout case events.");
  }

  return ((data ?? []) as DbPayoutCaseEvent[]).map((row) => ({
    id: row.id,
    payoutCaseId: row.payout_case_id,
    eventType: row.event_type,
    visibilityScope: row.visibility_scope,
    actorAuthUserId: row.actor_auth_user_id,
    summary: row.summary,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  })) satisfies InternalPayoutCaseEvent[];
}
