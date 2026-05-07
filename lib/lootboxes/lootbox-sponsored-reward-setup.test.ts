import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxSponsoredRewardSetupRead } from "./lootbox-sponsored-reward-setup";

const baseCampaign = {
  id: "campaign-1",
  projectId: "project-1",
  projectName: "VYNTRO",
  title: "Holder activation path",
  status: "active",
  visibility: "public",
  featured: true,
  rewardType: "perk",
  rewardPoolAmount: 500,
  participants: 128,
  completionRate: 41,
  xpBudget: 12000,
};

test("sponsored reward setup marks campaigns ready only when budget pool and visibility are aligned", () => {
  const read = buildLootboxSponsoredRewardSetupRead({
    campaigns: [
      baseCampaign,
      {
        ...baseCampaign,
        id: "campaign-no-budget",
        title: "Social sprint",
        rewardPoolAmount: 0,
      },
      {
        ...baseCampaign,
        id: "campaign-private",
        title: "Private alpha",
        visibility: "private",
      },
    ],
    shardPools: [
      {
        id: "pool-ready",
        campaignId: "campaign-1",
        status: "active",
        poolSize: 8000,
        remainingShards: 6200,
      },
      {
        id: "pool-private",
        campaignId: "campaign-private",
        status: "active",
        poolSize: 6000,
        remainingShards: 5900,
      },
    ],
  });

  assert.deepEqual(
    read.rows.map((row) => [row.campaignId, row.readiness, row.lane]),
    [
      ["campaign-no-budget", "setup_needed", "needs_budget"],
      ["campaign-1", "ready", "boosted_ready"],
      ["campaign-private", "locked", "locked_visibility"],
    ]
  );
  assert.equal(read.summary.ready, 1);
  assert.equal(read.summary.needsBudget, 1);
  assert.equal(read.summary.locked, 1);
});

test("sponsored reward setup recommends the highest pressure missing setup first", () => {
  const read = buildLootboxSponsoredRewardSetupRead({
    campaigns: [
      {
        ...baseCampaign,
        id: "campaign-missing-pool",
        participants: 240,
      },
      {
        ...baseCampaign,
        id: "campaign-no-budget",
        participants: 50,
        rewardPoolAmount: 0,
      },
    ],
    shardPools: [],
  });

  assert.equal(read.summary.needsShardPool, 1);
  assert.equal(read.recommendedSetup?.campaignId, "campaign-missing-pool");
  assert.match(read.recommendedSetup?.operatorStep ?? "", /Attach/i);
});

test("sponsored reward setup handles an empty campaign board safely", () => {
  const read = buildLootboxSponsoredRewardSetupRead({ campaigns: [], shardPools: [] });

  assert.deepEqual(read.summary, {
    total: 0,
    ready: 0,
    setupNeeded: 0,
    locked: 0,
    needsBudget: 0,
    needsShardPool: 0,
  });
  assert.equal(read.recommendedSetup, null);
});
