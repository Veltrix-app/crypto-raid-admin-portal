export type TrustCockpitRiskLevel = "clear" | "low" | "medium" | "high" | "critical";

export type TrustCockpitRecommendedAction =
  | "allow"
  | "watch"
  | "review_required"
  | "reward_hold"
  | "xp_suspended"
  | "suspend"
  | "ban";

export type TrustCockpitAccess = {
  projectId: string;
  canSeeMemberDetail: boolean;
  canSeeWalletDetail: boolean;
  canSeeRawSignalDetail: boolean;
  canSeeResolutionHistory: boolean;
};

export type TrustCockpitRollupInput = {
  projectId: string;
  authUserId: string;
  riskLevel: TrustCockpitRiskLevel;
  openEventCount: number;
  highEventCount: number;
  criticalEventCount: number;
  latestRecommendedAction: TrustCockpitRecommendedAction;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
};

export type TrustCockpitRiskEventInput = {
  id: string;
  projectId: string;
  authUserId: string;
  walletAddress: string | null;
  eventType: string;
  riskCategory: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceType: string;
  sourceId: string;
  reason: string;
  evidence: Record<string, unknown> | null;
  scoreDelta: number;
  recommendedAction: TrustCockpitRecommendedAction;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type TrustCockpitHeldRewardInput = {
  id: string;
  projectId: string;
  campaignId: string;
  campaignTitle: string;
  authUserId: string;
  rewardAsset: string;
  rewardAmount: number;
  status: string;
  calculationSnapshot: Record<string, unknown> | null;
  updatedAt: string;
};

export type TrustCockpitDecisionInput = {
  id: string;
  projectId: string | null;
  authUserId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string;
  reason: string;
  actorRole: string | null;
  createdAt: string;
};

export type TrustCockpitProfileInput = {
  authUserId: string;
  username: string;
  avatarUrl: string | null;
};

export type TrustCockpitReputationInput = {
  authUserId: string;
  status: string;
  trustScore: number;
  sybilScore: number;
  totalXp: number;
  level: number;
};

export type TrustCockpitInput = {
  projectId: string;
  generatedAt: string;
  rollups: TrustCockpitRollupInput[];
  events: TrustCockpitRiskEventInput[];
  heldRewards: TrustCockpitHeldRewardInput[];
  decisions: TrustCockpitDecisionInput[];
  profiles: TrustCockpitProfileInput[];
  reputations: TrustCockpitReputationInput[];
};

export type TrustCockpitReviewRow = {
  authUserId: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  riskLevel: TrustCockpitRiskLevel;
  openEventCount: number;
  highEventCount: number;
  criticalEventCount: number;
  recommendedAction: TrustCockpitRecommendedAction;
  recommendedActionLabel: string;
  status: string;
  trustScore: number | null;
  sybilScore: number | null;
  heldRewardCount: number;
  reasonCodes: string[];
  updatedAt: string;
};

export type TrustCockpitSnapshot = {
  generatedAt: string;
  scope: {
    projectId: string;
    visibilityLabel: string;
    rawEvidenceVisible: boolean;
    memberDetailVisible: boolean;
  };
  summary: {
    flaggedMembers: number;
    highRiskMembers: number;
    criticalEvents: number;
    openEvents: number;
    heldRewards: number;
    recentDecisions: number;
  };
  commandRead: {
    now: string;
    next: string;
    watch: string;
  };
  reviewQueue: TrustCockpitReviewRow[];
  events: Array<{
    id: string;
    authUserId: string;
    displayName: string;
    walletAddress: string | null;
    riskCategory: string;
    severity: string;
    reason: string;
    evidence: Record<string, unknown> | null;
    recommendedActionLabel: string;
    createdAt: string;
  }>;
  heldRewards: Array<{
    id: string;
    authUserId: string;
    displayName: string;
    campaignTitle: string;
    rewardAsset: string;
    rewardAmount: number;
    status: string;
    reason: string;
    updatedAt: string;
  }>;
  decisions: Array<{
    id: string;
    authUserId: string;
    displayName: string;
    action: string;
    previousStatus: string | null;
    newStatus: string;
    reason: string;
    actorRole: string | null;
    createdAt: string;
  }>;
};

const riskLevelWeight: Record<TrustCockpitRiskLevel, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  clear: 1,
};

const actionLabels: Record<TrustCockpitRecommendedAction, string> = {
  allow: "Allow",
  watch: "Watch",
  review_required: "Review required",
  reward_hold: "Hold rewards",
  xp_suspended: "Suspend XP",
  suspend: "Suspend account",
  ban: "Ban",
};

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toReasonCodes(value: Record<string, unknown> | null) {
  const raw = value?.reasonCodes ?? value?.reason_codes;
  return Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function byNewest(left: { updatedAt?: string; createdAt?: string }, right: { updatedAt?: string; createdAt?: string }) {
  return (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? "");
}

function getDisplayName(
  authUserId: string,
  profileByAuthUserId: Map<string, TrustCockpitProfileInput>,
  canSeeMemberDetail: boolean
) {
  if (!canSeeMemberDetail) {
    return "Restricted member";
  }

  return profileByAuthUserId.get(authUserId)?.username ?? "Unknown member";
}

function getRewardReason(reward: TrustCockpitHeldRewardInput) {
  const trustGate =
    reward.calculationSnapshot?.trustGate && typeof reward.calculationSnapshot.trustGate === "object"
      ? (reward.calculationSnapshot.trustGate as Record<string, unknown>)
      : null;
  const reason = trustGate?.reason;
  return typeof reason === "string" && reason.trim() ? reason : "Reward is paused by Trust Engine review.";
}

export function getTrustCockpitActionLabel(action: TrustCockpitRecommendedAction | string) {
  return action in actionLabels
    ? actionLabels[action as TrustCockpitRecommendedAction]
    : action.replaceAll("_", " ");
}

export function buildProjectTrustCockpit(
  input: TrustCockpitInput,
  access: TrustCockpitAccess
): TrustCockpitSnapshot {
  const projectId = access.projectId || input.projectId;
  const rollups = input.rollups.filter((row) => row.projectId === projectId);
  const events = input.events.filter((row) => row.projectId === projectId);
  const heldRewards = input.heldRewards.filter(
    (row) => row.projectId === projectId && ["held_for_review", "blocked"].includes(row.status)
  );
  const decisions = access.canSeeResolutionHistory
    ? input.decisions.filter((row) => row.projectId === projectId)
    : [];

  const profileByAuthUserId = new Map(input.profiles.map((profile) => [profile.authUserId, profile]));
  const reputationByAuthUserId = new Map(
    input.reputations.map((reputation) => [reputation.authUserId, reputation])
  );
  const walletByAuthUserId = new Map<string, string>();
  for (const event of events) {
    if (event.walletAddress && !walletByAuthUserId.has(event.authUserId)) {
      walletByAuthUserId.set(event.authUserId, event.walletAddress);
    }
  }

  const heldRewardCountByAuthUserId = new Map<string, number>();
  for (const reward of heldRewards) {
    heldRewardCountByAuthUserId.set(
      reward.authUserId,
      (heldRewardCountByAuthUserId.get(reward.authUserId) ?? 0) + 1
    );
  }

  const reviewQueue = rollups
    .filter((rollup) => rollup.openEventCount > 0 || rollup.riskLevel !== "clear")
    .map((rollup): TrustCockpitReviewRow => {
      const reputation = reputationByAuthUserId.get(rollup.authUserId);
      return {
        authUserId: rollup.authUserId,
        displayName: getDisplayName(rollup.authUserId, profileByAuthUserId, access.canSeeMemberDetail),
        avatarUrl: access.canSeeMemberDetail ? profileByAuthUserId.get(rollup.authUserId)?.avatarUrl ?? null : null,
        walletAddress: access.canSeeWalletDetail ? walletByAuthUserId.get(rollup.authUserId) ?? null : null,
        riskLevel: rollup.riskLevel,
        openEventCount: toNumber(rollup.openEventCount),
        highEventCount: toNumber(rollup.highEventCount),
        criticalEventCount: toNumber(rollup.criticalEventCount),
        recommendedAction: rollup.latestRecommendedAction,
        recommendedActionLabel: getTrustCockpitActionLabel(rollup.latestRecommendedAction),
        status: reputation?.status ?? rollup.latestRecommendedAction,
        trustScore: reputation ? toNumber(reputation.trustScore) : null,
        sybilScore: reputation ? toNumber(reputation.sybilScore) : null,
        heldRewardCount: heldRewardCountByAuthUserId.get(rollup.authUserId) ?? 0,
        reasonCodes: access.canSeeRawSignalDetail ? toReasonCodes(rollup.metadata) : [],
        updatedAt: rollup.updatedAt,
      };
    })
    .sort(
      (left, right) =>
        riskLevelWeight[right.riskLevel] - riskLevelWeight[left.riskLevel] ||
        right.criticalEventCount - left.criticalEventCount ||
        right.highEventCount - left.highEventCount ||
        byNewest(left, right)
    );

  const shapedEvents = events
    .sort(byNewest)
    .slice(0, 12)
    .map((event) => ({
      id: event.id,
      authUserId: event.authUserId,
      displayName: getDisplayName(event.authUserId, profileByAuthUserId, access.canSeeMemberDetail),
      walletAddress: access.canSeeWalletDetail ? event.walletAddress : null,
      riskCategory: event.riskCategory,
      severity: event.severity,
      reason: event.reason,
      evidence: access.canSeeRawSignalDetail ? event.evidence ?? {} : null,
      recommendedActionLabel: getTrustCockpitActionLabel(event.recommendedAction),
      createdAt: event.createdAt,
    }));

  const shapedHeldRewards = heldRewards.sort(byNewest).slice(0, 10).map((reward) => ({
    id: reward.id,
    authUserId: reward.authUserId,
    displayName: getDisplayName(reward.authUserId, profileByAuthUserId, access.canSeeMemberDetail),
    campaignTitle: reward.campaignTitle,
    rewardAsset: reward.rewardAsset,
    rewardAmount: reward.rewardAmount,
    status: reward.status,
    reason: getRewardReason(reward),
    updatedAt: reward.updatedAt,
  }));

  const shapedDecisions = decisions.sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8).map(
    (decision) => ({
      id: decision.id,
      authUserId: decision.authUserId,
      displayName: getDisplayName(decision.authUserId, profileByAuthUserId, access.canSeeMemberDetail),
      action: decision.action,
      previousStatus: decision.previousStatus,
      newStatus: decision.newStatus,
      reason: decision.reason,
      actorRole: decision.actorRole,
      createdAt: decision.createdAt,
    })
  );

  const criticalEvents = events.filter((event) => event.severity === "critical").length;
  const highRiskMembers = reviewQueue.filter((row) => row.riskLevel === "high" || row.riskLevel === "critical").length;
  const openEvents = events.filter((event) => event.status === "open").length;

  return {
    generatedAt: input.generatedAt,
    scope: {
      projectId,
      visibilityLabel:
        access.canSeeMemberDetail && access.canSeeRawSignalDetail
          ? "Full project trust view"
          : "Summary-only project view",
      rawEvidenceVisible: access.canSeeRawSignalDetail,
      memberDetailVisible: access.canSeeMemberDetail,
    },
    summary: {
      flaggedMembers: reviewQueue.length,
      highRiskMembers,
      criticalEvents,
      openEvents,
      heldRewards: heldRewards.length,
      recentDecisions: shapedDecisions.length,
    },
    commandRead: {
      now:
        criticalEvents > 0
          ? `${plural(criticalEvents, "critical event")} need review before rewards move.`
          : openEvents > 0
            ? `${plural(openEvents, "open signal")} need a quick trust read.`
            : "No urgent trust signals are open for this project.",
      next:
        heldRewards.length > 0
          ? `${plural(heldRewards.length, "held reward")} should be reviewed before claim release.`
          : "No project rewards are currently held by Trust Engine.",
      watch:
        reviewQueue.length > 0
          ? `${plural(reviewQueue.length, "contributor")} are visible in the project trust queue.`
          : "The project trust queue is calm.",
    },
    reviewQueue,
    events: shapedEvents,
    heldRewards: shapedHeldRewards,
    decisions: shapedDecisions,
  };
}
