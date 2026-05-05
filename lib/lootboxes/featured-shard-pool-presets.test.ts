import test from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_SHARD_POOL_PRESETS,
  buildFeaturedShardPoolDraft,
} from "./featured-shard-pool-presets";

test("featured shard pool presets include no boost base and boost package", () => {
  assert.deepEqual(
    FEATURED_SHARD_POOL_PRESETS.map((preset) => preset.id),
    ["none", "base_featured", "boost"]
  );
});

test("buildFeaturedShardPoolDraft creates the boost payload", () => {
  const draft = buildFeaturedShardPoolDraft({
    presetId: "boost",
    projectId: "project-1",
    campaignId: "campaign-1",
    createdByAuthUserId: "user-1",
    startsAt: "2026-05-06T00:00:00.000Z",
    endsAt: "2026-05-13T00:00:00.000Z",
  });

  assert.equal(draft?.poolSize, 25000);
  assert.equal(draft?.remainingShards, 25000);
  assert.equal(draft?.bonusMin, 40);
  assert.equal(draft?.bonusMax, 70);
  assert.equal(draft?.status, "active");
});
