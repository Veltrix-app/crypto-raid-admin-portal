import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxStockSafetyRead } from "./lootbox-stock-safety";

test("buildLootboxStockSafetyRead marks stock reservation ready only when both rpcs are live", () => {
  const read = buildLootboxStockSafetyRead({
    reserveRpcReady: true,
    restoreRpcReady: true,
    totalOutcomes: 19,
    activeOutcomes: 18,
    finiteStockOutcomes: 4,
    finiteActiveOutcomes: 3,
  });

  assert.equal(read.status, "ready");
  assert.equal(read.label, "Stock RPC live");
  assert.equal(read.summary, "3 active limited outcomes are protected before shard spend.");
  assert.equal(read.metrics[0]?.label, "Finite live");
  assert.equal(read.metrics[0]?.value, 3);
});

test("buildLootboxStockSafetyRead reports migration setup before operators use finite stock", () => {
  const read = buildLootboxStockSafetyRead({
    reserveRpcReady: true,
    restoreRpcReady: false,
    totalOutcomes: 19,
    activeOutcomes: 18,
    finiteStockOutcomes: 2,
    finiteActiveOutcomes: 2,
  });

  assert.equal(read.status, "needs_setup");
  assert.equal(read.label, "Stock RPC pending");
  assert.match(read.summary, /Run the stock reservation migration/i);
});
