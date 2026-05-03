import type { AdminReward } from "@/types/entities/reward";

export type RewardFundingModel =
  | "not_required"
  | "project_safe"
  | "vyntro_escrow"
  | "external_escrow"
  | "manual_commitment";

export type RewardFundingStatus =
  | "not_required"
  | "needs_funding"
  | "pending_verification"
  | "verified"
  | "underfunded";

export type RewardDistributionRule =
  | "guaranteed_claim"
  | "first_come"
  | "leaderboard"
  | "raffle"
  | "manual_review";

export type RewardTreasuryConfig = {
  fundingModel: RewardFundingModel;
  fundingStatus: RewardFundingStatus;
  network: string;
  assetSymbol: string;
  assetAddress: string;
  totalAmount: string;
  treasuryAddress: string;
  proofUrl: string;
  externalProvider: string;
  distributionRule: RewardDistributionRule;
  payoutWindow: string;
  notes: string;
};

export const REWARD_FUNDING_MODELS: Array<{
  value: RewardFundingModel;
  label: string;
  description: string;
}> = [
  {
    value: "project_safe",
    label: "Project Safe",
    description: "Project keeps funds in its own Safe while VYNTRO verifies balance and payout readiness.",
  },
  {
    value: "vyntro_escrow",
    label: "VYNTRO escrow",
    description: "Future strongest guarantee path: reward funds locked into a campaign escrow contract.",
  },
  {
    value: "external_escrow",
    label: "External escrow",
    description: "Use a provider such as vesting, drop or claim tooling while VYNTRO tracks proof.",
  },
  {
    value: "manual_commitment",
    label: "Manual commitment",
    description: "Manual fulfillment only. Useful for physical, role or bespoke rewards, but weaker for token guarantees.",
  },
  {
    value: "not_required",
    label: "No funding required",
    description: "For role, badge or access rewards that do not require a token pool.",
  },
];

export const REWARD_FUNDING_STATUSES: Array<{
  value: RewardFundingStatus;
  label: string;
}> = [
  { value: "needs_funding", label: "Needs funding" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "verified", label: "Verified / funded" },
  { value: "underfunded", label: "Underfunded" },
  { value: "not_required", label: "Not required" },
];

export const REWARD_DISTRIBUTION_RULES: Array<{
  value: RewardDistributionRule;
  label: string;
}> = [
  { value: "guaranteed_claim", label: "Guaranteed claim" },
  { value: "first_come", label: "First come first served" },
  { value: "leaderboard", label: "Leaderboard payout" },
  { value: "raffle", label: "Raffle / lucky draw" },
  { value: "manual_review", label: "Manual review" },
];

export function rewardNeedsFunding(
  rewardType: AdminReward["rewardType"],
  claimable: boolean
) {
  if (!claimable) return false;
  return ["token", "nft", "allowlist", "physical"].includes(rewardType);
}

export function getDefaultRewardTreasuryConfig(
  rewardType: AdminReward["rewardType"],
  claimable: boolean
): RewardTreasuryConfig {
  const needsFunding = rewardNeedsFunding(rewardType, claimable);

  return {
    fundingModel: needsFunding ? "project_safe" : "not_required",
    fundingStatus: needsFunding ? "needs_funding" : "not_required",
    network: "Base",
    assetSymbol: rewardType === "token" ? "USDC" : "",
    assetAddress: "",
    totalAmount: "",
    treasuryAddress: "",
    proofUrl: "",
    externalProvider: "",
    distributionRule: rewardType === "physical" ? "manual_review" : "guaranteed_claim",
    payoutWindow: "After eligibility review",
    notes: "",
  };
}

export function safeParseDeliveryConfig(raw: string | undefined) {
  if (!raw?.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function getRewardTreasuryConfig(
  raw: string | undefined,
  context: {
    rewardType: AdminReward["rewardType"];
    claimable: boolean;
  }
): RewardTreasuryConfig {
  const base = getDefaultRewardTreasuryConfig(context.rewardType, context.claimable);
  const parsed = safeParseDeliveryConfig(raw);
  const source =
    parsed.rewardTreasury && typeof parsed.rewardTreasury === "object"
      ? (parsed.rewardTreasury as Record<string, unknown>)
      : {};

  return {
    fundingModel: readString(source.fundingModel, base.fundingModel) as RewardFundingModel,
    fundingStatus: readString(source.fundingStatus, base.fundingStatus) as RewardFundingStatus,
    network: readString(source.network, base.network),
    assetSymbol: readString(source.assetSymbol, base.assetSymbol),
    assetAddress: readString(source.assetAddress, base.assetAddress),
    totalAmount: readString(source.totalAmount, base.totalAmount),
    treasuryAddress: readString(source.treasuryAddress, base.treasuryAddress),
    proofUrl: readString(source.proofUrl, base.proofUrl),
    externalProvider: readString(source.externalProvider, base.externalProvider),
    distributionRule: readString(
      source.distributionRule,
      base.distributionRule
    ) as RewardDistributionRule,
    payoutWindow: readString(source.payoutWindow, base.payoutWindow),
    notes: readString(source.notes, base.notes),
  };
}

export function setRewardTreasuryConfig(
  raw: string | undefined,
  patch: Partial<RewardTreasuryConfig>,
  context: {
    rewardType: AdminReward["rewardType"];
    claimable: boolean;
  }
) {
  const parsed = safeParseDeliveryConfig(raw);
  const current = getRewardTreasuryConfig(raw, context);

  return JSON.stringify(
    {
      ...parsed,
      rewardTreasury: {
        ...current,
        ...patch,
      },
    },
    null,
    2
  );
}

export function getRewardTreasuryPosture(
  treasury: RewardTreasuryConfig,
  rewardType: AdminReward["rewardType"],
  claimable: boolean
): {
  requiresFunding: boolean;
  ready: boolean;
  label: string;
  tone: "default" | "success" | "warning" | "danger";
  summary: string;
  nextAction: string;
} {
  const requiresFunding = rewardNeedsFunding(rewardType, claimable);

  if (!requiresFunding || treasury.fundingStatus === "not_required") {
    return {
      requiresFunding: false,
      ready: true,
      label: "No escrow required",
      tone: "default",
      summary: "This reward does not need a token pool before launch.",
      nextAction: "Keep delivery instructions clear.",
    };
  }

  if (treasury.fundingStatus === "verified") {
    return {
      requiresFunding: true,
      ready: true,
      label: "Funded / verified",
      tone: "success",
      summary: "Funding proof is marked as verified, so this reward can be presented as backed.",
      nextAction: "Keep claim rules and payout timing visible.",
    };
  }

  if (treasury.fundingStatus === "underfunded") {
    return {
      requiresFunding: true,
      ready: false,
      label: "Underfunded",
      tone: "danger",
      summary: "The reward promise is stronger than the detected or declared funding.",
      nextAction: "Top up the pool or reduce the reward promise before launch.",
    };
  }

  if (treasury.fundingStatus === "pending_verification") {
    return {
      requiresFunding: true,
      ready: false,
      label: "Verification pending",
      tone: "warning",
      summary: "Funding details exist, but VYNTRO has not marked them verified yet.",
      nextAction: "Add proof and verify the treasury balance before making this claimable.",
    };
  }

  return {
    requiresFunding: true,
    ready: false,
    label: "Needs funding",
    tone: "warning",
    summary: "This reward needs a funded treasury route before it should be launched.",
    nextAction: "Choose Safe, escrow or external provider and add proof.",
  };
}
