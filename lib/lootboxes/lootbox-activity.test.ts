import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxActivityRead } from "./lootbox-activity";

test("buildLootboxActivityRead summarizes recent opens and inventory posture", () => {
  const read = buildLootboxActivityRead({
    openRows: [
      {
        id: "open-1",
        auth_user_id: "11111111-1111-4111-8111-111111111111",
        tier_id: "rare",
        shard_spend: 750,
        pool_item_id: "pool-1",
        status: "granted",
        result_snapshot: {
          rarity: "legendary",
          label: "Profile Glow",
          itemType: "profile_cosmetic",
        },
        created_at: "2026-05-06T10:10:00.000Z",
      },
      {
        id: "open-2",
        auth_user_id: "22222222-2222-4222-8222-222222222222",
        tier_id: "common",
        shard_spend: 250,
        pool_item_id: "pool-2",
        status: "granted",
        result_snapshot: {
          rarity: "common",
          label: "Shard Hunter Title",
          itemType: "title",
        },
        created_at: "2026-05-06T10:00:00.000Z",
      },
    ],
    inventoryRows: [
      {
        id: "item-1",
        auth_user_id: "11111111-1111-4111-8111-111111111111",
        lootbox_open_id: "open-1",
        item_type: "profile_cosmetic",
        rarity: "legendary",
        label: "Profile Glow",
        payload: { cosmetic: "profile-glow-gold" },
        status: "pending_review",
        created_at: "2026-05-06T10:11:00.000Z",
        updated_at: "2026-05-06T10:11:00.000Z",
      },
      {
        id: "item-2",
        auth_user_id: "22222222-2222-4222-8222-222222222222",
        lootbox_open_id: "open-2",
        item_type: "title",
        rarity: "common",
        label: "Shard Hunter Title",
        payload: { title: "Shard Hunter" },
        status: "owned",
        created_at: "2026-05-06T10:01:00.000Z",
        updated_at: "2026-05-06T10:01:00.000Z",
      },
    ],
  });

  assert.equal(read.summary.totalOpens, 2);
  assert.equal(read.summary.totalShardSpend, 1000);
  assert.equal(read.summary.uniqueMembers, 2);
  assert.equal(read.summary.highRarityWins, 1);
  assert.equal(read.summary.pendingReviewInventory, 1);
  assert.equal(read.recentOpens[0]?.memberLabel, "11111111...1111");
  assert.equal(read.recentOpens[0]?.rewardLabel, "Profile Glow");
  assert.equal(read.inventoryQueue[0]?.statusTone, "warning");
});

test("buildLootboxActivityRead builds inventory command table rows", () => {
  const read = buildLootboxActivityRead({
    openRows: [],
    inventoryRows: [
      {
        id: "item-new",
        auth_user_id: "33333333-3333-4333-8333-333333333333",
        lootbox_open_id: "open-3",
        item_type: "profile_cosmetic",
        rarity: "mythic",
        label: "Nebula Profile Frame",
        payload: { cosmetic: "nebula-profile-frame" },
        status: "owned",
        created_at: "2026-05-06T10:20:00.000Z",
        updated_at: "2026-05-06T10:20:00.000Z",
      },
      {
        id: "item-review",
        auth_user_id: "44444444-4444-4444-8444-444444444444",
        lootbox_open_id: "open-4",
        item_type: "season_pass",
        rarity: "legendary",
        label: "Season Pass Discount",
        payload: { refundPercent: 25 },
        status: "pending_review",
        created_at: "2026-05-06T10:12:00.000Z",
        updated_at: "2026-05-06T10:12:00.000Z",
      },
    ],
  });

  assert.equal(read.inventoryTable?.[0]?.id, "item-review");
  assert.equal(read.inventoryTable?.[0]?.payloadSummary, "refund: 25%");
  assert.deepEqual(read.inventoryTable?.[0]?.actionStatuses, [
    "pending_review",
    "claimed",
    "expired",
  ]);
  assert.equal(read.inventoryTable?.[1]?.payloadSummary, "cosmetic: nebula-profile-frame");
});

test("buildLootboxActivityRead handles empty activity safely", () => {
  const read = buildLootboxActivityRead({ openRows: [], inventoryRows: [] });

  assert.equal(read.summary.totalOpens, 0);
  assert.equal(read.summary.totalShardSpend, 0);
  assert.deepEqual(read.recentOpens, []);
  assert.deepEqual(read.inventoryQueue, []);
  assert.deepEqual(read.inventoryTable, []);
});
