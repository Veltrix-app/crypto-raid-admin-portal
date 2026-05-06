import assert from "node:assert/strict";
import test from "node:test";
import { LOOTBOX_STUDIO_POOL_ITEMS } from "./lootbox-studio-catalog";
import { buildLootboxPoolDraft, getLootboxPoolDraftKey } from "./lootbox-pool-draft";

const commonPoolItems = LOOTBOX_STUDIO_POOL_ITEMS.filter((item) => item.tierId === "common");

test("buildLootboxPoolDraft normalizes enabled outcome odds from draft weights", () => {
  const [common, rare, epic] = commonPoolItems;

  const draft = buildLootboxPoolDraft(commonPoolItems, [
    { key: getLootboxPoolDraftKey(common), weight: 50 },
    { key: getLootboxPoolDraftKey(rare), weight: 50 },
    { key: getLootboxPoolDraftKey(epic), enabled: false },
  ]);

  assert.equal(draft.summary.totalWeight, 102);
  assert.equal(draft.summary.enabledCount, 4);
  assert.equal(draft.summary.readiness, "ready");
  assert.equal(draft.rows.find((row) => row.key === getLootboxPoolDraftKey(common))?.oddsPercent, 49);
  assert.equal(draft.rows.find((row) => row.key === getLootboxPoolDraftKey(rare))?.oddsPercent, 49);
  assert.equal(draft.rows.find((row) => row.key === getLootboxPoolDraftKey(epic))?.oddsPercent, 0);
});

test("buildLootboxPoolDraft reports an empty enabled pool before it can be staged", () => {
  const draft = buildLootboxPoolDraft(
    commonPoolItems,
    commonPoolItems.map((item) => ({
      key: getLootboxPoolDraftKey(item),
      enabled: false,
    }))
  );

  assert.equal(draft.summary.readiness, "needs_outcome");
  assert.equal(draft.summary.enabledCount, 0);
  assert.deepEqual(draft.summary.warnings, ["Enable at least one reward outcome."]);
});

test("buildLootboxPoolDraft reports zero weighted enabled outcomes", () => {
  const draft = buildLootboxPoolDraft(
    commonPoolItems,
    commonPoolItems.map((item) => ({
      key: getLootboxPoolDraftKey(item),
      weight: 0,
    }))
  );

  assert.equal(draft.summary.readiness, "needs_weight");
  assert.equal(draft.summary.totalWeight, 0);
  assert.deepEqual(draft.summary.warnings, ["Give enabled outcomes a positive weight."]);
});

test("buildLootboxPoolDraft tracks finite stock controls separately from unlimited rewards", () => {
  const [firstItem] = commonPoolItems;

  const draft = buildLootboxPoolDraft(commonPoolItems, [
    { key: getLootboxPoolDraftKey(firstItem), stockLimit: 150 },
  ]);

  assert.equal(draft.summary.finiteStockCount, 1);
  assert.equal(draft.rows.find((row) => row.key === getLootboxPoolDraftKey(firstItem))?.stockLimit, 150);
});
