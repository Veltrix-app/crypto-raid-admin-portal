export type LootboxSponsoredCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "archived"
  | string;

export type LootboxSponsoredCampaignVisibility = "public" | "private" | "gated" | string;

export type LootboxSponsoredRewardSetupCampaign = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: LootboxSponsoredCampaignStatus;
  visibility: LootboxSponsoredCampaignVisibility;
  featured: boolean;
  rewardType?: string;
  rewardPoolAmount?: number;
  participants?: number;
  completionRate?: number;
  xpBudget?: number;
};

export type LootboxSponsoredRewardSetupShardPool = {
  id: string;
  campaignId: string | null;
  status: string;
  poolSize: number;
  remainingShards: number;
};

export type LootboxSponsoredRewardSetupReadiness = "ready" | "setup_needed" | "locked";
export type LootboxSponsoredRewardSetupLane =
  | "boosted_ready"
  | "needs_budget"
  | "needs_shard_pool"
  | "locked_visibility";

export type LootboxSponsoredRewardSetupGuardrail = {
  label: string;
  status: "ready" | "missing" | "locked";
  detail: string;
};

export type LootboxSponsoredRewardSetupRow = {
  campaignId: string;
  projectName: string;
  title: string;
  status: string;
  visibility: string;
  featured: boolean;
  rewardType: string;
  rewardBudget: number;
  participants: number;
  completionRate: number;
  linkedPoolCount: number;
  activePoolCount: number;
  poolSize: number;
  remainingShards: number;
  pressureScore: number;
  readiness: LootboxSponsoredRewardSetupReadiness;
  lane: LootboxSponsoredRewardSetupLane;
  operatorStep: string;
  guardrails: LootboxSponsoredRewardSetupGuardrail[];
};

export function buildLootboxSponsoredRewardSetupRead(params: {
  campaigns: LootboxSponsoredRewardSetupCampaign[];
  shardPools: LootboxSponsoredRewardSetupShardPool[];
}) {
  const rows = params.campaigns
    .map((campaign) => buildSponsoredRewardSetupRow(campaign, params.shardPools))
    .sort(compareSponsoredRewardSetupRows);

  const summary = {
    total: rows.length,
    ready: rows.filter((row) => row.readiness === "ready").length,
    setupNeeded: rows.filter((row) => row.readiness === "setup_needed").length,
    locked: rows.filter((row) => row.readiness === "locked").length,
    needsBudget: rows.filter((row) => row.lane === "needs_budget").length,
    needsShardPool: rows.filter((row) => row.lane === "needs_shard_pool").length,
  };
  const recommendedSetup =
    rows.find((row) => row.readiness === "setup_needed") ??
    rows.find((row) => row.readiness === "ready") ??
    rows[0] ??
    null;

  return {
    summary,
    rows,
    recommendedSetup,
  };
}

function buildSponsoredRewardSetupRow(
  campaign: LootboxSponsoredRewardSetupCampaign,
  pools: LootboxSponsoredRewardSetupShardPool[]
): LootboxSponsoredRewardSetupRow {
  const linkedPools = pools.filter((pool) => pool.campaignId === campaign.id);
  const activePools = linkedPools.filter((pool) =>
    ["active", "scheduled"].includes(pool.status)
  );
  const rewardBudget = Math.max(0, Number(campaign.rewardPoolAmount ?? 0));
  const participants = Math.max(0, Number(campaign.participants ?? 0));
  const completionRate = Math.max(0, Number(campaign.completionRate ?? 0));
  const poolSize = linkedPools.reduce((sum, pool) => sum + Math.max(0, pool.poolSize), 0);
  const remainingShards = linkedPools.reduce(
    (sum, pool) => sum + Math.max(0, pool.remainingShards),
    0
  );
  const visibilityReady = campaign.visibility === "public";
  const statusReady = ["active", "scheduled"].includes(campaign.status);
  const budgetReady = rewardBudget > 0;
  const poolReady = activePools.length > 0 && poolSize > 0;
  const pressureScore = participants + completionRate + (campaign.featured ? 50 : 0);
  const lane = getSponsoredRewardSetupLane({
    visibilityReady,
    statusReady,
    budgetReady,
    poolReady,
  });
  const readiness = getSponsoredRewardSetupReadiness(lane);

  return {
    campaignId: campaign.id,
    projectName: campaign.projectName,
    title: campaign.title,
    status: campaign.status,
    visibility: campaign.visibility,
    featured: campaign.featured,
    rewardType: campaign.rewardType ?? "campaign_pool",
    rewardBudget,
    participants,
    completionRate,
    linkedPoolCount: linkedPools.length,
    activePoolCount: activePools.length,
    poolSize,
    remainingShards,
    pressureScore,
    readiness,
    lane,
    operatorStep: getSponsoredRewardOperatorStep(lane),
    guardrails: [
      {
        label: "Campaign route",
        status: visibilityReady && statusReady ? "ready" : "locked",
        detail:
          visibilityReady && statusReady
            ? "Public campaign route can receive sponsored pressure."
            : "Campaign must be public and active or scheduled before sponsor packaging.",
      },
      {
        label: "Sponsor budget",
        status: budgetReady ? "ready" : "missing",
        detail: budgetReady
          ? `${rewardBudget.toLocaleString("en-US")} reward budget is visible.`
          : "Add a project-funded reward budget before promising sponsor outcomes.",
      },
      {
        label: "Shard pool",
        status: poolReady ? "ready" : "missing",
        detail: poolReady
          ? `${activePools.length} active or scheduled pool keeps the hunt visible.`
          : "Attach a finite active or scheduled shard pool to create hunt pressure.",
      },
    ],
  };
}

function getSponsoredRewardSetupLane(params: {
  visibilityReady: boolean;
  statusReady: boolean;
  budgetReady: boolean;
  poolReady: boolean;
}): LootboxSponsoredRewardSetupLane {
  if (!params.visibilityReady || !params.statusReady) {
    return "locked_visibility";
  }

  if (!params.budgetReady) {
    return "needs_budget";
  }

  if (!params.poolReady) {
    return "needs_shard_pool";
  }

  return "boosted_ready";
}

function getSponsoredRewardSetupReadiness(
  lane: LootboxSponsoredRewardSetupLane
): LootboxSponsoredRewardSetupReadiness {
  if (lane === "boosted_ready") {
    return "ready";
  }

  if (lane === "locked_visibility") {
    return "locked";
  }

  return "setup_needed";
}

function getSponsoredRewardOperatorStep(lane: LootboxSponsoredRewardSetupLane) {
  switch (lane) {
    case "boosted_ready":
      return "Package this as a sponsor-ready reward lane with stock cap, owner and audit note.";
    case "needs_budget":
      return "Add sponsor budget before attaching any partner reward promise.";
    case "needs_shard_pool":
      return "Attach a finite shard pool so the sponsored reward has a measurable hunt boost.";
    case "locked_visibility":
    default:
      return "Move the campaign to public active or scheduled before sponsor setup.";
  }
}

function compareSponsoredRewardSetupRows(
  left: LootboxSponsoredRewardSetupRow,
  right: LootboxSponsoredRewardSetupRow
) {
  const readinessRank = {
    setup_needed: 3,
    ready: 2,
    locked: 1,
  } satisfies Record<LootboxSponsoredRewardSetupReadiness, number>;
  const readinessDiff = readinessRank[right.readiness] - readinessRank[left.readiness];

  if (readinessDiff !== 0) {
    return readinessDiff;
  }

  return right.pressureScore - left.pressureScore;
}
