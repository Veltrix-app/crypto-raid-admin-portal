import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsoredPackagePersistenceReadiness,
  type LootboxSponsoredPackagePersistenceInput,
} from "./lootbox-sponsored-package-persistence";

const input: LootboxSponsoredPackagePersistenceInput = {
  totalPackages: 3,
  readyToPitch: 1,
  setupQueue: 1,
  blocked: 1,
};

test("sponsored package persistence readiness names required tables and fields", () => {
  const read = buildLootboxSponsoredPackagePersistenceReadiness(input);

  assert.equal(read.summary.requiredTables, 2);
  assert.equal(read.summary.liveWrites, false);
  assert.deepEqual(
    read.tables.map((table) => table.name),
    ["lootbox_sponsor_packages", "lootbox_sponsor_package_notes"]
  );
  assert.deepEqual(read.fields.status, ["draft", "ready_to_pitch", "pitched", "negotiating", "won", "lost", "blocked", "archived"]);
  assert.deepEqual(read.fields.noteTypes, ["operator_note", "sponsor_follow_up", "status_change", "decision"]);
});

test("sponsored package persistence readiness keeps write gates manual until sql is run", () => {
  const read = buildLootboxSponsoredPackagePersistenceReadiness(input);

  assert.match(read.nextStep, /run the Phase 2E-L SQL/i);
  assert.equal(read.writeGates.every((gate) => gate.state === "planned"), true);
  assert.match(read.guardrails.join(" "), /No reward inventory/i);
});

test("sponsored package persistence readiness reports package pressure", () => {
  const read = buildLootboxSponsoredPackagePersistenceReadiness(input);

  assert.equal(read.summary.totalPackages, 3);
  assert.equal(read.summary.readyToPitch, 1);
  assert.equal(read.summary.needsOperatorSetup, 2);
});
