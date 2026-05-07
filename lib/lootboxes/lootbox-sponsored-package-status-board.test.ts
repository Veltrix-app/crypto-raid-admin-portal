import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsoredPackageStatusBoard,
  type LootboxSponsoredPackageStatusBoardInputPack,
} from "./lootbox-sponsored-package-status-board";

const readyPack: LootboxSponsoredPackageStatusBoardInputPack = {
  campaignId: "campaign-ready",
  projectName: "VYNTRO",
  campaignTitle: "Holder activation path",
  packageTier: "premium",
  status: "pitch_ready",
  actionState: "ready",
  exportTitle: "VYNTRO Premium Sponsor Package",
  sponsorBriefText: "Sponsor copy",
  auditNoteTemplate: "Audit note",
  actions: [
    {
      id: "share_packet",
      label: "Share packet",
      detail: "Ready to share after operator confirms the cap.",
      state: "ready",
    },
  ],
};

test("sponsored package status board groups packs into operator lanes", () => {
  const board = buildLootboxSponsoredPackageStatusBoard([
    readyPack,
    {
      ...readyPack,
      campaignId: "campaign-prep",
      actionState: "prep",
      status: "prep_needed",
      packageTier: "standard",
    },
    {
      ...readyPack,
      campaignId: "campaign-locked",
      actionState: "locked",
      status: "locked",
      packageTier: "starter",
    },
  ]);

  assert.equal(board.summary.total, 3);
  assert.equal(board.summary.readyToPitch, 1);
  assert.equal(board.summary.setupQueue, 1);
  assert.equal(board.summary.blocked, 1);
  assert.equal(board.summary.manualOnly, true);
  assert.equal(board.focus?.columnId, "ready_to_pitch");
  assert.deepEqual(
    board.columns.map((column) => [column.id, column.items.length]),
    [
      ["ready_to_pitch", 1],
      ["setup_queue", 1],
      ["blocked", 1],
    ]
  );
});

test("sponsored package status board focuses setup queue when nothing is ready", () => {
  const board = buildLootboxSponsoredPackageStatusBoard([
    {
      ...readyPack,
      campaignId: "campaign-prep",
      actionState: "prep",
      status: "prep_needed",
    },
  ]);

  assert.equal(board.focus?.columnId, "setup_queue");
  assert.match(board.focus?.detail ?? "", /finish setup/i);
  assert.equal(board.columns[1]?.items[0]?.primaryAction, "Finish setup");
});

test("sponsored package status board keeps locked-only boards visible but manual", () => {
  const board = buildLootboxSponsoredPackageStatusBoard([
    {
      ...readyPack,
      campaignId: "campaign-locked",
      actionState: "locked",
      status: "locked",
      packageTier: "starter",
    },
  ]);

  assert.equal(board.focus?.columnId, "blocked");
  assert.equal(board.columns[2]?.items[0]?.primaryAction, "Unblock route");
  assert.match(board.guardrails[0] ?? "", /No package status writes/i);
});

test("sponsored package status board handles an empty package board", () => {
  const board = buildLootboxSponsoredPackageStatusBoard([]);

  assert.equal(board.summary.total, 0);
  assert.equal(board.focus, null);
  assert.equal(board.columns.length, 3);
  assert.equal(board.columns.every((column) => column.items.length === 0), true);
});
