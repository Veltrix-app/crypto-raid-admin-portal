import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxActivityRead,
  buildLootboxInventoryCommandCounts,
  filterLootboxInventoryCommandRows,
} from "./lootbox-activity";

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
    auditRows: [
      {
        id: "audit-note",
        auth_user_id: "admin-33333333",
        source_table: "user_inventory",
        source_id: "item-review",
        action: "lootbox_inventory_note_added",
        summary: "Added fulfillment note for Season Pass Discount.",
        metadata: {
          note: "Manual delivery queued after holder verification.",
          reference: "DISCORD-ROLE-77",
        },
        created_at: "2026-05-06T10:24:00.000Z",
      },
      {
        id: "audit-newer",
        auth_user_id: "admin-22222222",
        source_table: "user_inventory",
        source_id: "item-review",
        action: "lootbox_inventory_status_changed",
        summary: "Mark claimed for Season Pass Discount.",
        metadata: {
          previousStatus: "pending_review",
          nextStatus: "claimed",
          targetAuthUserId: "44444444-4444-4444-8444-444444444444",
        },
        created_at: "2026-05-06T10:22:00.000Z",
      },
      {
        id: "audit-older",
        auth_user_id: "admin-11111111",
        source_table: "user_inventory",
        source_id: "item-review",
        action: "lootbox_inventory_status_changed",
        summary: "Send to review for Season Pass Discount.",
        metadata: {
          previousStatus: "owned",
          nextStatus: "pending_review",
        },
        created_at: "2026-05-06T10:14:00.000Z",
      },
    ],
  });

  assert.equal(read.inventoryTable?.[0]?.id, "item-review");
  assert.equal(read.inventoryTable?.[0]?.lootboxOpenId, "open-4");
  assert.equal(read.inventoryTable?.[0]?.payloadSummary, "refund: 25%");
  assert.deepEqual(read.inventoryTable?.[0]?.payloadEntries, [
    { label: "refundPercent", value: "25" },
  ]);
  assert.equal(read.inventoryTable?.[0]?.fulfillment.label, "Manual review required");
  assert.equal(
    read.inventoryTable?.[0]?.fulfillment.nextStep,
    "Validate payload, member eligibility and reward budget before marking this reward claimed."
  );
  assert.equal(read.inventoryTable?.[0]?.auditCount, 3);
  assert.equal(read.inventoryTable?.[0]?.auditTrail[0]?.id, "audit-note");
  assert.equal(read.inventoryTable?.[0]?.auditTrail[0]?.actorLabel, "admin-33...3333");
  assert.equal(
    read.inventoryTable?.[0]?.auditTrail[0]?.note,
    "Manual delivery queued after holder verification."
  );
  assert.equal(read.inventoryTable?.[0]?.auditTrail[0]?.reference, "DISCORD-ROLE-77");
  assert.equal(read.inventoryTable?.[0]?.auditTrail[1]?.previousStatus, "pending_review");
  assert.equal(read.inventoryTable?.[0]?.auditTrail[1]?.nextStatus, "claimed");
  assert.equal(read.inventoryTable?.[1]?.auditCount, 0);
  assert.deepEqual(read.inventoryTable?.[0]?.actionStatuses, [
    "pending_review",
    "claimed",
    "expired",
  ]);
  assert.equal(read.inventoryTable?.[1]?.payloadSummary, "cosmetic: nebula-profile-frame");
});

test("lootbox inventory command helpers filter rows and count operator states", () => {
  const read = buildLootboxActivityRead({
    openRows: [],
    inventoryRows: [
      {
        id: "review-item",
        auth_user_id: "33333333-3333-4333-8333-333333333333",
        lootbox_open_id: "open-3",
        item_type: "profile_cosmetic",
        rarity: "mythic",
        label: "Nebula Profile Frame",
        payload: { cosmetic: "nebula-profile-frame" },
        status: "pending_review",
        created_at: "2026-05-06T10:20:00.000Z",
        updated_at: "2026-05-06T10:20:00.000Z",
      },
      {
        id: "claimed-item",
        auth_user_id: "44444444-4444-4444-8444-444444444444",
        lootbox_open_id: "open-4",
        item_type: "season_pass",
        rarity: "legendary",
        label: "Season Pass Discount",
        payload: { refundPercent: 25 },
        status: "claimed",
        created_at: "2026-05-06T10:12:00.000Z",
        updated_at: "2026-05-06T10:12:00.000Z",
      },
      {
        id: "owned-item",
        auth_user_id: "55555555-5555-4555-8555-555555555555",
        lootbox_open_id: "open-5",
        item_type: "title",
        rarity: "common",
        label: "Shard Hunter Title",
        payload: { title: "Shard Hunter" },
        status: "owned",
        created_at: "2026-05-06T10:05:00.000Z",
        updated_at: "2026-05-06T10:05:00.000Z",
      },
    ],
  });

  const counts = buildLootboxInventoryCommandCounts(read.inventoryTable);

  assert.equal(counts.all, 3);
  assert.equal(counts.pending_review, 1);
  assert.equal(counts.owned, 1);
  assert.equal(counts.claimed, 1);
  assert.equal(counts.expired, 0);
  assert.equal(counts.high_rarity, 2);
  assert.deepEqual(
    filterLootboxInventoryCommandRows(read.inventoryTable, {
      filter: "pending_review",
      query: "nebula",
    }).map((row) => row.id),
    ["review-item"]
  );
  assert.deepEqual(
    filterLootboxInventoryCommandRows(read.inventoryTable, {
      filter: "high_rarity",
      query: "season",
    }).map((row) => row.id),
    ["claimed-item"]
  );
  assert.deepEqual(
    filterLootboxInventoryCommandRows(read.inventoryTable, {
      filter: "all",
      query: "5555",
    }).map((row) => row.id),
    ["owned-item"]
  );
});

test("buildLootboxActivityRead handles empty activity safely", () => {
  const read = buildLootboxActivityRead({ openRows: [], inventoryRows: [] });

  assert.equal(read.summary.totalOpens, 0);
  assert.equal(read.summary.totalShardSpend, 0);
  assert.deepEqual(read.recentOpens, []);
  assert.deepEqual(read.inventoryQueue, []);
  assert.deepEqual(read.inventoryTable, []);
});
