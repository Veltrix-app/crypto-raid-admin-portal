import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxFulfillmentRunway,
  getLootboxFulfillmentPolicyForRow,
} from "./lootbox-fulfillment-policy";

const baseRow = {
  id: "inventory-1",
  itemType: "profile_cosmetic",
  rarity: "common",
  status: "owned",
  label: "Profile Glow",
  payloadSummary: "cosmetic: profile-glow",
};

test("lootbox fulfillment policy maps reward item types to operator lanes", () => {
  assert.deepEqual(
    [
      getLootboxFulfillmentPolicyForRow(baseRow).laneId,
      getLootboxFulfillmentPolicyForRow({
        ...baseRow,
        itemType: "season_access",
        rarity: "legendary",
      }).laneId,
      getLootboxFulfillmentPolicyForRow({
        ...baseRow,
        itemType: "sponsored_reward",
        label: "Partner WL Spot",
      }).laneId,
      getLootboxFulfillmentPolicyForRow({
        ...baseRow,
        itemType: "usdc_reward",
        rarity: "mythic",
      }).laneId,
    ],
    ["platform_utility", "season_access", "sponsored_reward", "treasury_reward"]
  );
});

test("lootbox fulfillment policy keeps treasury rewards locked behind manual review", () => {
  const policy = getLootboxFulfillmentPolicyForRow({
    ...baseRow,
    itemType: "usdc_reward",
    rarity: "mythic",
    status: "pending_review",
  });

  assert.equal(policy.risk, "high");
  assert.equal(policy.deliveryMode, "locked");
  assert.equal(policy.canMarkClaimedFromConsole, false);
  assert.equal(policy.recommendedStatus, "pending_review");
  assert.match(policy.nextOperatorStep, /treasury/i);
});

test("lootbox fulfillment runway summarizes claimable locked and review pressure", () => {
  const runway = buildLootboxFulfillmentRunway([
    {
      ...baseRow,
      id: "cosmetic-owned",
      itemType: "profile_cosmetic",
      status: "owned",
    },
    {
      ...baseRow,
      id: "season-review",
      itemType: "season_access",
      rarity: "legendary",
      status: "pending_review",
    },
    {
      ...baseRow,
      id: "usdc-review",
      itemType: "usdc_reward",
      rarity: "mythic",
      status: "pending_review",
    },
  ]);

  assert.deepEqual(runway.summary, {
    total: 3,
    claimable: 1,
    pendingReview: 2,
    locked: 1,
    highRisk: 1,
  });
  assert.equal(runway.recommendedFocus.laneId, "treasury_reward");
  assert.equal(runway.lanes.find((lane) => lane.id === "season_access")?.count, 1);
});
