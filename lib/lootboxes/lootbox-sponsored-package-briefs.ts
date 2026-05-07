import type {
  LootboxSponsoredRewardSetupLane,
  LootboxSponsoredRewardSetupReadiness,
} from "./lootbox-sponsored-reward-setup";

export type LootboxSponsoredPackageTier = "starter" | "standard" | "premium";
export type LootboxSponsoredPackageStatus = "pitch_ready" | "prep_needed" | "locked";

export type LootboxSponsoredPackageBriefInputRow = {
  campaignId: string;
  projectName: string;
  title: string;
  readiness: LootboxSponsoredRewardSetupReadiness;
  lane: LootboxSponsoredRewardSetupLane;
  rewardBudget: number;
  participants: number;
  completionRate: number;
  activePoolCount: number;
  linkedPoolCount: number;
  poolSize: number;
  remainingShards: number;
  pressureScore: number;
};

export type LootboxSponsoredPackageDeliverable = {
  label: string;
  detail: string;
};

export type LootboxSponsoredPackageBrief = {
  campaignId: string;
  projectName: string;
  campaignTitle: string;
  packageTier: LootboxSponsoredPackageTier;
  status: LootboxSponsoredPackageStatus;
  operatorPitch: string;
  nextOperatorStep: string;
  budgetLabel: string;
  pressureLabel: string;
  deliverables: LootboxSponsoredPackageDeliverable[];
};

export function buildLootboxSponsoredPackageBriefs(
  rows: LootboxSponsoredPackageBriefInputRow[]
) {
  const briefs = rows.map(buildSponsoredPackageBrief).sort(compareSponsoredPackageBriefs);
  const summary = {
    total: briefs.length,
    pitchReady: briefs.filter((brief) => brief.status === "pitch_ready").length,
    needsSetup: briefs.filter((brief) => brief.status === "prep_needed").length,
    locked: briefs.filter((brief) => brief.status === "locked").length,
    premium: briefs.filter((brief) => brief.packageTier === "premium").length,
  };
  const recommendedBrief =
    briefs.find((brief) => brief.status === "pitch_ready") ??
    briefs.find((brief) => brief.status === "prep_needed") ??
    null;

  return {
    summary,
    briefs,
    recommendedBrief,
  };
}

function buildSponsoredPackageBrief(
  row: LootboxSponsoredPackageBriefInputRow
): LootboxSponsoredPackageBrief {
  const packageTier = getPackageTier(row);
  const status = getPackageStatus(row);

  return {
    campaignId: row.campaignId,
    projectName: row.projectName,
    campaignTitle: row.title,
    packageTier,
    status,
    operatorPitch: getOperatorPitch(row, packageTier, status),
    nextOperatorStep: getNextOperatorStep(row),
    budgetLabel: formatBudget(row.rewardBudget),
    pressureLabel: `${row.participants.toLocaleString("en-US")} participants / ${row.completionRate}% completion`,
    deliverables: getDeliverables(row, packageTier),
  };
}

function getPackageTier(row: LootboxSponsoredPackageBriefInputRow): LootboxSponsoredPackageTier {
  if (row.readiness !== "ready") {
    if (row.rewardBudget >= 250 || row.pressureScore >= 160) {
      return "standard";
    }

    return "starter";
  }

  if (row.rewardBudget >= 1000 || row.pressureScore >= 300 || row.poolSize >= 10000) {
    return "premium";
  }

  if (row.rewardBudget >= 250 || row.pressureScore >= 160 || row.poolSize >= 5000) {
    return "standard";
  }

  return "starter";
}

function getPackageStatus(row: LootboxSponsoredPackageBriefInputRow): LootboxSponsoredPackageStatus {
  if (row.readiness === "locked") {
    return "locked";
  }

  if (row.readiness === "ready") {
    return "pitch_ready";
  }

  return "prep_needed";
}

function getOperatorPitch(
  row: LootboxSponsoredPackageBriefInputRow,
  tier: LootboxSponsoredPackageTier,
  status: LootboxSponsoredPackageStatus
) {
  if (status === "locked") {
    return `${row.projectName} needs a public active campaign before a sponsored lootbox package can be pitched.`;
  }

  if (status === "prep_needed") {
    return `${row.projectName} has campaign pressure, but the sponsored reward package still needs setup before pitching.`;
  }

  return `${row.projectName} can be pitched as a ${tier} sponsored lootbox package with visible hunt pressure and capped reward delivery.`;
}

function getNextOperatorStep(row: LootboxSponsoredPackageBriefInputRow) {
  switch (row.lane) {
    case "boosted_ready":
      return "Draft the sponsor brief with package tier, reward promise, stock cap and fulfillment owner.";
    case "needs_budget":
      return "Add sponsor budget before turning this into a package brief.";
    case "needs_shard_pool":
      return "Attach a finite shard pool before pitching the package.";
    case "locked_visibility":
    default:
      return "Move the campaign route to public active or scheduled first.";
  }
}

function getDeliverables(
  row: LootboxSponsoredPackageBriefInputRow,
  tier: LootboxSponsoredPackageTier
): LootboxSponsoredPackageDeliverable[] {
  return [
    {
      label: "Featured hunt boost",
      detail: `${row.activePoolCount}/${row.linkedPoolCount} pools, ${row.remainingShards.toLocaleString("en-US")} shards left.`,
    },
    {
      label: "Lootbox reward lane",
      detail: `${tier} package maps project-funded reward pressure into the sponsored reward lane.`,
    },
    {
      label: "Fulfillment brief",
      detail: "Operator records stock cap, sponsor owner and audit note before any reward delivery.",
    },
  ];
}

function formatBudget(value: number) {
  if (value <= 0) {
    return "No sponsor budget";
  }

  return `${value.toLocaleString("en-US")} sponsor budget`;
}

function compareSponsoredPackageBriefs(
  left: LootboxSponsoredPackageBrief,
  right: LootboxSponsoredPackageBrief
) {
  const statusRank = {
    pitch_ready: 3,
    prep_needed: 2,
    locked: 1,
  } satisfies Record<LootboxSponsoredPackageStatus, number>;
  const tierRank = {
    premium: 3,
    standard: 2,
    starter: 1,
  } satisfies Record<LootboxSponsoredPackageTier, number>;
  const statusDiff = statusRank[right.status] - statusRank[left.status];

  if (statusDiff !== 0) {
    return statusDiff;
  }

  return tierRank[right.packageTier] - tierRank[left.packageTier];
}
