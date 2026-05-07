export type LootboxFulfillmentLaneId =
  | "platform_utility"
  | "season_access"
  | "sponsored_reward"
  | "treasury_reward";

export type LootboxFulfillmentRisk = "low" | "medium" | "high";
export type LootboxFulfillmentDeliveryMode = "instant" | "manual" | "sponsored" | "locked";
export type LootboxFulfillmentRecommendedStatus =
  | "owned"
  | "pending_review"
  | "claimed"
  | "expired";

export type LootboxFulfillmentPolicyInput = {
  id?: string;
  itemType: string;
  rarity: string;
  status: string;
  label: string;
  payloadSummary: string;
};

export type LootboxFulfillmentLane = {
  id: LootboxFulfillmentLaneId;
  label: string;
  shortLabel: string;
  risk: LootboxFulfillmentRisk;
  deliveryMode: LootboxFulfillmentDeliveryMode;
  gateLabel: string;
  operatorPromise: string;
};

export type LootboxFulfillmentPolicy = LootboxFulfillmentLane & {
  laneId: LootboxFulfillmentLaneId;
  canMarkClaimedFromConsole: boolean;
  recommendedStatus: LootboxFulfillmentRecommendedStatus;
  nextOperatorStep: string;
  auditRequirement: string;
};

export const LOOTBOX_FULFILLMENT_LANES: LootboxFulfillmentLane[] = [
  {
    id: "platform_utility",
    label: "Platform utility",
    shortLabel: "Utility",
    risk: "low",
    deliveryMode: "instant",
    gateLabel: "Owned inventory item",
    operatorPromise: "Titles, profile cosmetics and platform perks can be delivered manually.",
  },
  {
    id: "season_access",
    label: "Season access",
    shortLabel: "Season",
    risk: "medium",
    deliveryMode: "manual",
    gateLabel: "Pass entitlement check",
    operatorPromise: "Season access, discounts and mythic windows need a visible audit trail.",
  },
  {
    id: "sponsored_reward",
    label: "Sponsored reward",
    shortLabel: "Sponsor",
    risk: "medium",
    deliveryMode: "sponsored",
    gateLabel: "Sponsor stock and owner check",
    operatorPromise: "Partner rewards stay tied to funded campaigns and capped stock.",
  },
  {
    id: "treasury_reward",
    label: "Treasury reward",
    shortLabel: "Treasury",
    risk: "high",
    deliveryMode: "locked",
    gateLabel: "Treasury and payout review",
    operatorPromise: "USDC or cash-equivalent outcomes stay locked until treasury review is live.",
  },
];

export function getLootboxFulfillmentPolicyForRow(
  row: LootboxFulfillmentPolicyInput
): LootboxFulfillmentPolicy {
  const lane = getFulfillmentLane(row);
  const normalizedStatus = normalizeStatus(row.status);
  const canMarkClaimedFromConsole =
    lane.deliveryMode !== "locked" && normalizedStatus === "owned";

  return {
    ...lane,
    laneId: lane.id,
    canMarkClaimedFromConsole,
    recommendedStatus: getRecommendedStatus(lane, normalizedStatus),
    nextOperatorStep: getNextOperatorStep(lane, normalizedStatus, row),
    auditRequirement: getAuditRequirement(lane, normalizedStatus),
  };
}

export function buildLootboxFulfillmentRunway(rows: LootboxFulfillmentPolicyInput[]) {
  const policies = rows.map((row) => ({
    row,
    policy: getLootboxFulfillmentPolicyForRow(row),
  }));
  const lanes = LOOTBOX_FULFILLMENT_LANES.map((lane) => {
    const lanePolicies = policies.filter((item) => item.policy.laneId === lane.id);

    return {
      ...lane,
      laneId: lane.id,
      count: lanePolicies.length,
      pendingReview: lanePolicies.filter(
        (item) => normalizeStatus(item.row.status) === "pending_review"
      ).length,
      locked: lanePolicies.filter((item) => item.policy.deliveryMode === "locked").length,
    };
  });
  const summary = {
    total: rows.length,
    claimable: policies.filter((item) => item.policy.canMarkClaimedFromConsole).length,
    pendingReview: policies.filter((item) => normalizeStatus(item.row.status) === "pending_review")
      .length,
    locked: policies.filter((item) => item.policy.deliveryMode === "locked").length,
    highRisk: policies.filter((item) => item.policy.risk === "high").length,
  };
  const recommendedFocus =
    lanes.find((lane) => lane.locked > 0) ??
    lanes.find((lane) => lane.pendingReview > 0) ??
    lanes.find((lane) => lane.count > 0) ??
    lanes[0]!;

  return {
    summary,
    lanes,
    recommendedFocus,
  };
}

function getFulfillmentLane(row: LootboxFulfillmentPolicyInput) {
  const haystack = [
    row.itemType,
    row.rarity,
    row.label,
    row.payloadSummary,
  ]
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("usdc") ||
    haystack.includes("cash") ||
    haystack.includes("payout") ||
    haystack.includes("treasury")
  ) {
    return laneById("treasury_reward");
  }

  if (
    haystack.includes("sponsor") ||
    haystack.includes("partner") ||
    haystack.includes("allowlist") ||
    haystack.includes("whitelist") ||
    haystack.includes("wl ")
  ) {
    return laneById("sponsored_reward");
  }

  if (
    haystack.includes("season") ||
    haystack.includes("member_pass") ||
    haystack.includes("season_access") ||
    haystack.includes("discount")
  ) {
    return laneById("season_access");
  }

  return laneById("platform_utility");
}

function laneById(id: LootboxFulfillmentLaneId) {
  return LOOTBOX_FULFILLMENT_LANES.find((lane) => lane.id === id)!;
}

function getRecommendedStatus(
  lane: LootboxFulfillmentLane,
  status: LootboxFulfillmentRecommendedStatus
) {
  if (status === "expired" || status === "claimed") {
    return status;
  }

  if (lane.deliveryMode === "locked") {
    return "pending_review" as const;
  }

  if (lane.deliveryMode === "instant" && status === "owned") {
    return "claimed" as const;
  }

  return "pending_review" as const;
}

function getNextOperatorStep(
  lane: LootboxFulfillmentLane,
  status: LootboxFulfillmentRecommendedStatus,
  row: LootboxFulfillmentPolicyInput
) {
  if (status === "claimed") {
    return "Keep the claimed record and audit note as the fulfillment reference.";
  }

  if (status === "expired") {
    return "Leave closed unless there is a documented reason to send it back to review.";
  }

  switch (lane.id) {
    case "treasury_reward":
      return "Keep locked in review until treasury budget, payout owner and compliance approval are recorded.";
    case "sponsored_reward":
      return `Confirm sponsor stock and delivery owner before fulfilling ${row.label}.`;
    case "season_access":
      return "Confirm pass entitlement, season window and member eligibility before marking claimed.";
    case "platform_utility":
    default:
      return "Deliver the platform utility, add a short note when useful, then mark claimed.";
  }
}

function getAuditRequirement(
  lane: LootboxFulfillmentLane,
  status: LootboxFulfillmentRecommendedStatus
) {
  if (status === "claimed") {
    return "No new action needed unless the claim record needs correction.";
  }

  if (lane.deliveryMode === "locked") {
    return "Treasury approval, payout reference and operator note are required before delivery.";
  }

  if (lane.deliveryMode === "sponsored") {
    return "Sponsor stock reference and campaign owner note should be attached.";
  }

  if (lane.deliveryMode === "manual") {
    return "Eligibility note should be attached before the reward is claimed.";
  }

  return "Status change creates the audit event; add a note for exceptional cases.";
}

function normalizeStatus(status: string): LootboxFulfillmentRecommendedStatus {
  switch (status) {
    case "pending_review":
    case "claimed":
    case "expired":
    case "owned":
      return status;
    default:
      return "owned";
  }
}
