import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxInventoryStatusPatch,
  getLootboxInventoryStatusActionLabel,
  isLootboxInventoryStatus,
} from "./lootbox-inventory-actions";

test("isLootboxInventoryStatus only allows inventory lifecycle states", () => {
  assert.equal(isLootboxInventoryStatus("owned"), true);
  assert.equal(isLootboxInventoryStatus("pending_review"), true);
  assert.equal(isLootboxInventoryStatus("claimed"), true);
  assert.equal(isLootboxInventoryStatus("expired"), true);
  assert.equal(isLootboxInventoryStatus("paid"), false);
  assert.equal(isLootboxInventoryStatus(null), false);
});

test("buildLootboxInventoryStatusPatch creates a timestamped status update", () => {
  assert.deepEqual(
    buildLootboxInventoryStatusPatch({
      status: "claimed",
      now: "2026-05-06T12:00:00.000Z",
    }),
    {
      status: "claimed",
      updated_at: "2026-05-06T12:00:00.000Z",
    }
  );
});

test("getLootboxInventoryStatusActionLabel names admin actions clearly", () => {
  assert.equal(getLootboxInventoryStatusActionLabel("pending_review"), "Send to review");
  assert.equal(getLootboxInventoryStatusActionLabel("claimed"), "Mark claimed");
  assert.equal(getLootboxInventoryStatusActionLabel("expired"), "Expire reward");
});
