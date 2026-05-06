import assert from "node:assert/strict";
import test from "node:test";
import {
  LOOTBOX_STUDIO_POOL_ITEMS,
  LOOTBOX_STUDIO_TIERS,
  buildLootboxStudioReadiness,
  getLootboxPoolItemsForTier,
} from "./lootbox-studio-catalog";

test("lootbox studio tiers mirror the five public rarity lanes", () => {
  assert.deepEqual(
    LOOTBOX_STUDIO_TIERS.map((tier) => tier.id),
    ["common", "rare", "epic", "legendary", "mythic"]
  );
});

test("lootbox studio tier odds stay normalized for every tier", () => {
  for (const tier of LOOTBOX_STUDIO_TIERS) {
    const total = Object.values(tier.odds).reduce((sum, value) => sum + value, 0);
    assert.equal(total, 100, `${tier.id} odds should equal 100`);
  }
});

test("every studio pool item belongs to a configured tier", () => {
  const tierIds = new Set(LOOTBOX_STUDIO_TIERS.map((tier) => tier.id));

  for (const item of LOOTBOX_STUDIO_POOL_ITEMS) {
    assert.equal(tierIds.has(item.tierId), true, `${item.label} has a valid tier`);
  }
});

test("tier readiness exposes outcome count and lock posture", () => {
  const readiness = buildLootboxStudioReadiness();
  const mythicRead = readiness.find((item) => item.tier.id === "mythic");

  assert.equal(getLootboxPoolItemsForTier("common").length, 5);
  assert.equal(mythicRead?.outcomeCount, 2);
  assert.equal(mythicRead?.lockedBy.includes("Season window"), true);
});
