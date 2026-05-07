import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsoredPackageBriefs,
  type LootboxSponsoredPackageBriefInputRow,
} from "./lootbox-sponsored-package-briefs";

const readyRow: LootboxSponsoredPackageBriefInputRow = {
  campaignId: "campaign-ready",
  projectName: "VYNTRO",
  title: "Holder activation path",
  readiness: "ready",
  lane: "boosted_ready",
  rewardBudget: 1500,
  participants: 220,
  completionRate: 48,
  activePoolCount: 1,
  linkedPoolCount: 1,
  poolSize: 12000,
  remainingShards: 9000,
  pressureScore: 318,
};

test("sponsored package briefs convert ready campaign pressure into sponsor package copy", () => {
  const read = buildLootboxSponsoredPackageBriefs([readyRow]);

  assert.equal(read.summary.total, 1);
  assert.equal(read.summary.pitchReady, 1);
  assert.equal(read.briefs[0]?.campaignId, "campaign-ready");
  assert.equal(read.briefs[0]?.packageTier, "premium");
  assert.equal(read.briefs[0]?.status, "pitch_ready");
  assert.match(read.briefs[0]?.operatorPitch ?? "", /sponsored/i);
  assert.deepEqual(
    read.briefs[0]?.deliverables.map((item) => item.label),
    ["Featured hunt boost", "Lootbox reward lane", "Fulfillment brief"]
  );
});

test("sponsored package briefs keep setup-needed campaigns in prep mode", () => {
  const read = buildLootboxSponsoredPackageBriefs([
    {
      ...readyRow,
      campaignId: "campaign-missing-pool",
      readiness: "setup_needed",
      lane: "needs_shard_pool",
      activePoolCount: 0,
      linkedPoolCount: 0,
      poolSize: 0,
      remainingShards: 0,
    },
  ]);

  assert.equal(read.summary.needsSetup, 1);
  assert.equal(read.briefs[0]?.status, "prep_needed");
  assert.equal(read.briefs[0]?.packageTier, "standard");
  assert.match(read.briefs[0]?.nextOperatorStep ?? "", /shard pool/i);
});

test("sponsored package briefs exclude locked campaigns from pitch-ready count", () => {
  const read = buildLootboxSponsoredPackageBriefs([
    {
      ...readyRow,
      campaignId: "campaign-locked",
      readiness: "locked",
      lane: "locked_visibility",
      pressureScore: 20,
    },
  ]);

  assert.equal(read.summary.locked, 1);
  assert.equal(read.summary.pitchReady, 0);
  assert.equal(read.recommendedBrief, null);
  assert.equal(read.briefs[0]?.status, "locked");
});
