export type LootboxRewardOpsLaneId =
  | "season_access"
  | "member_pass"
  | "sponsored_reward"
  | "usdc_reward";

export type LootboxRewardOpsLaneStatus = "live" | "planned";
export type LootboxRewardOpsLaneRisk = "low" | "medium" | "high";

export type LootboxRewardOpsLane = {
  id: LootboxRewardOpsLaneId;
  label: string;
  status: LootboxRewardOpsLaneStatus;
  risk: LootboxRewardOpsLaneRisk;
  operatorAction: string;
  controlSurface: string;
  deliveryGate: string;
  memberPromise: string;
};

export const LOOTBOX_REWARD_OPS_LANES: LootboxRewardOpsLane[] = [
  {
    id: "season_access",
    label: "Season access pass",
    status: "live",
    risk: "low",
    operatorAction: "Verify active pass rewards from inventory and keep audit notes visible.",
    controlSurface: "Inventory status, fulfillment notes and mythic gate posture.",
    deliveryGate: "Owned or claimed season_access item.",
    memberPromise: "Public pass signal and mythic season-window eligibility.",
  },
  {
    id: "member_pass",
    label: "Monthly member pass",
    status: "planned",
    risk: "medium",
    operatorAction: "Define Spark, Surge and Mythic perks before checkout is connected.",
    controlSurface: "Pass catalog, perk copy, pricing and entitlement mapping.",
    deliveryGate: "Payment entitlement and monthly renewal state.",
    memberPromise: "Shard boosts, pass identity and premium chase utility.",
  },
  {
    id: "sponsored_reward",
    label: "Sponsored reward lane",
    status: "planned",
    risk: "medium",
    operatorAction: "Attach sponsor-funded rewards to featured campaigns with capped stock.",
    controlSurface: "Pool stock, sponsor budget, campaign link and fulfillment owner.",
    deliveryGate: "Project-funded campaign reward budget.",
    memberPromise: "Partner rewards tied to verified featured quest or raid activity.",
  },
  {
    id: "usdc_reward",
    label: "USDC reward lane",
    status: "planned",
    risk: "high",
    operatorAction: "Hold USDC outcomes behind treasury, compliance and payout review gates.",
    controlSurface: "Treasury cap, claim case, payout audit and risk approval.",
    deliveryGate: "Funded treasury budget and manual payout review.",
    memberPromise: "Cash-equivalent rewards when the platform can safely afford them.",
  },
];

export function buildLootboxRewardOpsSummary(lanes = LOOTBOX_REWARD_OPS_LANES) {
  return {
    total: lanes.length,
    live: lanes.filter((lane) => lane.status === "live").length,
    planned: lanes.filter((lane) => lane.status === "planned").length,
    highRisk: lanes.filter((lane) => lane.risk === "high").length,
  };
}

export function getRecommendedLootboxRewardOpsLane(params: {
  pendingReviewInventory: number;
  activeShardPools: number;
}) {
  if (params.pendingReviewInventory > 0) {
    return LOOTBOX_REWARD_OPS_LANES.find((lane) => lane.id === "season_access")!;
  }

  if (params.activeShardPools > 0) {
    return LOOTBOX_REWARD_OPS_LANES.find((lane) => lane.id === "sponsored_reward")!;
  }

  return LOOTBOX_REWARD_OPS_LANES.find((lane) => lane.id === "member_pass")!;
}
