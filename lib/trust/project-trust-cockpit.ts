import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  hasTrustVisibilityPermission,
  type ProjectTrustAccessResult,
  TrustAccessError,
} from "@/lib/trust/project-trust-auth";
import {
  buildProjectTrustCockpit,
  type TrustCockpitDecisionInput,
  type TrustCockpitHeldRewardInput,
  type TrustCockpitInput,
  type TrustCockpitProfileInput,
  type TrustCockpitReputationInput,
  type TrustCockpitRiskEventInput,
  type TrustCockpitRollupInput,
} from "@/lib/trust/trust-cockpit";

type CampaignRow = {
  id: string;
  title: string | null;
};

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function collectAuthUserIds(parts: {
  rollups: TrustCockpitRollupInput[];
  events: TrustCockpitRiskEventInput[];
  heldRewards: TrustCockpitHeldRewardInput[];
  decisions: TrustCockpitDecisionInput[];
}) {
  return Array.from(
    new Set(
      [
        ...parts.rollups.map((row) => row.authUserId),
        ...parts.events.map((row) => row.authUserId),
        ...parts.heldRewards.map((row) => row.authUserId),
        ...parts.decisions.map((row) => row.authUserId),
      ].filter(Boolean)
    )
  );
}

function shapeRollup(row: Record<string, any>): TrustCockpitRollupInput {
  return {
    projectId: row.project_id,
    authUserId: row.auth_user_id,
    riskLevel: row.risk_level ?? "clear",
    openEventCount: safeNumber(row.open_event_count),
    highEventCount: safeNumber(row.high_event_count),
    criticalEventCount: safeNumber(row.critical_event_count),
    latestRecommendedAction: row.latest_recommended_action ?? "allow",
    metadata: row.metadata ?? {},
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function shapeRiskEvent(row: Record<string, any>): TrustCockpitRiskEventInput {
  return {
    id: row.id,
    projectId: row.project_id,
    authUserId: row.auth_user_id,
    walletAddress: row.wallet_address ?? null,
    eventType: row.event_type,
    riskCategory: row.risk_category,
    severity: row.severity ?? "low",
    sourceType: row.source_type,
    sourceId: row.source_id,
    reason: row.reason,
    evidence: row.evidence ?? {},
    scoreDelta: safeNumber(row.score_delta),
    recommendedAction: row.recommended_action ?? "allow",
    status: row.status ?? "open",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function shapeDecision(row: Record<string, any>): TrustCockpitDecisionInput {
  return {
    id: row.id,
    projectId: row.project_id ?? null,
    authUserId: row.auth_user_id,
    action: row.action,
    previousStatus: row.previous_status ?? null,
    newStatus: row.new_status,
    reason: row.reason,
    actorRole: row.actor_role ?? null,
    createdAt: row.created_at,
  };
}

function shapeProfile(row: Record<string, any>): TrustCockpitProfileInput {
  return {
    authUserId: row.auth_user_id,
    username: row.username ?? "Unknown member",
    avatarUrl: row.avatar_url ?? null,
  };
}

function shapeReputation(row: Record<string, any>): TrustCockpitReputationInput {
  return {
    authUserId: row.auth_user_id,
    status: row.status ?? "active",
    trustScore: safeNumber(row.trust_score, 100),
    sybilScore: safeNumber(row.sybil_score),
    totalXp: safeNumber(row.total_xp),
    level: safeNumber(row.level, 1),
  };
}

function shapeHeldReward(
  row: Record<string, any>,
  campaignTitleById: Map<string, string>
): TrustCockpitHeldRewardInput {
  const campaignId = row.campaign_id;

  return {
    id: row.id,
    projectId: row.project_id,
    campaignId,
    campaignTitle: campaignTitleById.get(campaignId) ?? "Campaign",
    authUserId: row.auth_user_id,
    rewardAsset: row.reward_asset ?? "Reward",
    rewardAmount: safeNumber(row.reward_amount),
    status: row.status ?? "held_for_review",
    calculationSnapshot: row.calculation_snapshot ?? {},
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

export async function loadProjectTrustCockpit(access: ProjectTrustAccessResult) {
  if (!hasTrustVisibilityPermission(access, "trust_summary")) {
    throw new TrustAccessError(403, "You do not have access to this project's trust summary.");
  }

  const supabase = getServiceSupabaseClient();
  const [
    { data: rollupRows, error: rollupError },
    { data: eventRows, error: eventError },
    { data: decisionRows, error: decisionError },
    { data: campaignRows, error: campaignError },
  ] = await Promise.all([
    supabase
      .from("risk_event_rollups")
      .select(
        "project_id, auth_user_id, risk_level, open_event_count, high_event_count, critical_event_count, latest_recommended_action, metadata, created_at, updated_at"
      )
      .eq("project_id", access.projectId)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("risk_events")
      .select(
        "id, project_id, auth_user_id, wallet_address, event_type, risk_category, severity, source_type, source_id, reason, evidence, score_delta, recommended_action, status, created_at, updated_at"
      )
      .eq("project_id", access.projectId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("trust_decisions")
      .select(
        "id, project_id, auth_user_id, action, previous_status, new_status, reason, actor_role, created_at"
      )
      .eq("project_id", access.projectId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("campaigns").select("id, title").eq("project_id", access.projectId),
  ]);

  if (rollupError) throw new Error(rollupError.message || "Failed to load risk rollups.");
  if (eventError) throw new Error(eventError.message || "Failed to load risk events.");
  if (decisionError) throw new Error(decisionError.message || "Failed to load trust decisions.");
  if (campaignError) throw new Error(campaignError.message || "Failed to load project campaigns.");

  const campaignTitleById = new Map(
    ((campaignRows ?? []) as CampaignRow[]).map((campaign) => [
      campaign.id,
      campaign.title ?? "Campaign",
    ])
  );
  const campaignIds = Array.from(campaignTitleById.keys());
  const { data: rewardRows, error: rewardError } =
    campaignIds.length > 0
      ? await supabase
          .from("reward_distributions")
          .select(
            "id, campaign_id, auth_user_id, reward_asset, reward_amount, calculation_snapshot, status, created_at, updated_at"
          )
          .in("campaign_id", campaignIds)
          .in("status", ["held_for_review", "blocked"])
          .order("updated_at", { ascending: false })
          .limit(80)
      : { data: [], error: null };

  if (rewardError) throw new Error(rewardError.message || "Failed to load held rewards.");

  const rollups = ((rollupRows ?? []) as Record<string, any>[]).map(shapeRollup);
  const events = ((eventRows ?? []) as Record<string, any>[]).map(shapeRiskEvent);
  const decisions = ((decisionRows ?? []) as Record<string, any>[]).map(shapeDecision);
  const heldRewards = ((rewardRows ?? []) as Record<string, any>[]).map((row) =>
    shapeHeldReward({ ...row, project_id: access.projectId }, campaignTitleById)
  );
  const authUserIds = collectAuthUserIds({ rollups, events, heldRewards, decisions });

  const [{ data: profileRows, error: profileError }, { data: reputationRows, error: reputationError }] =
    authUserIds.length > 0
      ? await Promise.all([
          supabase
            .from("user_profiles")
            .select("auth_user_id, username, avatar_url")
            .in("auth_user_id", authUserIds),
          supabase
            .from("user_global_reputation")
            .select("auth_user_id, status, trust_score, sybil_score, total_xp, level")
            .in("auth_user_id", authUserIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (profileError) throw new Error(profileError.message || "Failed to load trust profiles.");
  if (reputationError) throw new Error(reputationError.message || "Failed to load trust reputation.");

  const input: TrustCockpitInput = {
    projectId: access.projectId,
    generatedAt: new Date().toISOString(),
    rollups,
    events,
    heldRewards,
    decisions,
    profiles: ((profileRows ?? []) as Record<string, any>[]).map(shapeProfile),
    reputations: ((reputationRows ?? []) as Record<string, any>[]).map(shapeReputation),
  };

  return buildProjectTrustCockpit(input, {
    projectId: access.projectId,
    canSeeMemberDetail: hasTrustVisibilityPermission(access, "member_case_detail"),
    canSeeWalletDetail: hasTrustVisibilityPermission(access, "wallet_detail"),
    canSeeRawSignalDetail: hasTrustVisibilityPermission(access, "raw_signal_detail"),
    canSeeResolutionHistory: hasTrustVisibilityPermission(access, "resolution_history"),
  });
}
