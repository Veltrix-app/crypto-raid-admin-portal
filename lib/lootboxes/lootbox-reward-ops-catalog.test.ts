import assert from "node:assert/strict";
import test from "node:test";
import {
  LOOTBOX_REWARD_OPS_LANES,
  buildLootboxRewardOpsSummary,
  getRecommendedLootboxRewardOpsLane,
} from "./lootbox-reward-ops-catalog";

test("lootbox reward ops lanes keep live and planned reward surfaces explicit", () => {
  assert.deepEqual(
    LOOTBOX_REWARD_OPS_LANES.map((lane) => [lane.id, lane.status, lane.risk]),
    [
      ["season_access", "live", "low"],
      ["member_pass", "planned", "medium"],
      ["sponsored_reward", "planned", "medium"],
      ["usdc_reward", "planned", "high"],
    ]
  );
});

test("lootbox reward ops summary exposes live planned and high-risk counts", () => {
  assert.deepEqual(buildLootboxRewardOpsSummary(), {
    total: 4,
    live: 1,
    planned: 3,
    highRisk: 1,
  });
});

test("lootbox reward ops recommendation follows operator pressure", () => {
  assert.equal(
    getRecommendedLootboxRewardOpsLane({
      pendingReviewInventory: 2,
      activeShardPools: 0,
    }).id,
    "season_access"
  );
  assert.equal(
    getRecommendedLootboxRewardOpsLane({
      pendingReviewInventory: 0,
      activeShardPools: 1,
    }).id,
    "sponsored_reward"
  );
  assert.equal(
    getRecommendedLootboxRewardOpsLane({
      pendingReviewInventory: 0,
      activeShardPools: 0,
    }).id,
    "member_pass"
  );
});
