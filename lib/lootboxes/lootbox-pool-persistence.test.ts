import assert from "node:assert/strict";
import test from "node:test";
import { LOOTBOX_STUDIO_POOL_ITEMS } from "./lootbox-studio-catalog";
import { buildLootboxPoolDraft, getLootboxPoolDraftKey } from "./lootbox-pool-draft";
import { buildLootboxPoolPersistencePayload } from "./lootbox-pool-persistence";

const commonItems = LOOTBOX_STUDIO_POOL_ITEMS.filter((item) => item.tierId === "common");

test("buildLootboxPoolPersistencePayload converts a draft into db-safe row updates", () => {
  const [common, rare, epic] = commonItems;
  const draft = buildLootboxPoolDraft(commonItems, [
    { key: getLootboxPoolDraftKey(common), weight: 80 },
    { key: getLootboxPoolDraftKey(rare), weight: 20, stockLimit: 250 },
    { key: getLootboxPoolDraftKey(epic), enabled: false },
  ]);

  const payload = buildLootboxPoolPersistencePayload({
    tierId: "common",
    rows: draft.rows,
  });

  assert.equal(payload.tierId, "common");
  assert.equal(payload.rows.length, commonItems.length);
  assert.equal(payload.rows.find((row) => row.label === common.label)?.weight, 80);
  assert.equal(payload.rows.find((row) => row.label === rare.label)?.unlimitedStock, false);
  assert.equal(payload.rows.find((row) => row.label === rare.label)?.stock, 250);
  assert.equal(payload.rows.find((row) => row.label === epic.label)?.active, false);
  assert.equal(payload.odds.common, 78.4);
  assert.equal(payload.odds.rare, 19.6);
});

test("buildLootboxPoolPersistencePayload rejects drafts without enabled outcomes", () => {
  const draft = buildLootboxPoolDraft(
    commonItems,
    commonItems.map((item) => ({
      key: getLootboxPoolDraftKey(item),
      enabled: false,
    }))
  );

  assert.throws(
    () =>
      buildLootboxPoolPersistencePayload({
        tierId: "common",
        rows: draft.rows,
      }),
    /Enable at least one reward outcome/
  );
});

test("buildLootboxPoolPersistencePayload rejects enabled zero-weight outcomes", () => {
  const draft = buildLootboxPoolDraft(
    commonItems,
    commonItems.map((item) => ({
      key: getLootboxPoolDraftKey(item),
      weight: 0,
    }))
  );

  assert.throws(
    () =>
      buildLootboxPoolPersistencePayload({
        tierId: "common",
        rows: draft.rows,
      }),
    /Give enabled outcomes a positive weight/
  );
});

test("buildLootboxPoolPersistencePayload rejects cross-tier draft rows", () => {
  const rareItem = LOOTBOX_STUDIO_POOL_ITEMS.find((item) => item.tierId === "rare");
  assert.ok(rareItem);
  const draft = buildLootboxPoolDraft([...commonItems, rareItem], []);

  assert.throws(
    () =>
      buildLootboxPoolPersistencePayload({
        tierId: "common",
        rows: draft.rows,
      }),
    /does not belong to common/
  );
});
