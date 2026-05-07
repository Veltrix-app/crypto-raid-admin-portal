import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsoredPackageActionDesk,
  type LootboxSponsoredPackageActionBrief,
} from "./lootbox-sponsored-package-actions";

const pitchReadyBrief: LootboxSponsoredPackageActionBrief = {
  campaignId: "campaign-ready",
  projectName: "VYNTRO",
  campaignTitle: "Holder activation path",
  packageTier: "premium",
  status: "pitch_ready",
  operatorPitch:
    "VYNTRO can be pitched as a premium sponsored lootbox package with visible hunt pressure.",
  nextOperatorStep:
    "Draft the sponsor brief with package tier, reward promise, stock cap and fulfillment owner.",
  budgetLabel: "1,500 sponsor budget",
  pressureLabel: "220 participants / 48% completion",
  deliverables: [
    {
      label: "Featured hunt boost",
      detail: "1/1 pools, 9,000 shards left.",
    },
    {
      label: "Fulfillment brief",
      detail: "Operator records stock cap before reward delivery.",
    },
  ],
};

test("sponsored package action desk creates copy-ready packets for pitch-ready briefs", () => {
  const desk = buildLootboxSponsoredPackageActionDesk([pitchReadyBrief]);

  assert.equal(desk.summary.total, 1);
  assert.equal(desk.summary.readyToShare, 1);
  assert.equal(desk.summary.copyReady, 2);
  assert.equal(desk.recommendedPack?.campaignId, "campaign-ready");
  assert.equal(desk.packs[0]?.actionState, "ready");
  assert.match(desk.packs[0]?.sponsorBriefText ?? "", /No reward is granted/i);
  assert.match(desk.packs[0]?.sponsorBriefText ?? "", /Payment, billing, fulfillment/i);
});

test("sponsored package action desk keeps setup-needed briefs out of share-ready state", () => {
  const desk = buildLootboxSponsoredPackageActionDesk([
    {
      ...pitchReadyBrief,
      campaignId: "campaign-prep",
      status: "prep_needed",
      packageTier: "standard",
      nextOperatorStep: "Attach a finite shard pool before pitching the package.",
    },
  ]);

  assert.equal(desk.summary.readyToShare, 0);
  assert.equal(desk.summary.needsSetup, 1);
  assert.equal(desk.summary.copyReady, 1);
  assert.equal(desk.recommendedPack?.actionState, "prep");
  assert.match(desk.packs[0]?.actions.find((action) => action.id === "share_packet")?.detail ?? "", /setup/i);
});

test("sponsored package action desk does not recommend fully locked briefs", () => {
  const desk = buildLootboxSponsoredPackageActionDesk([
    {
      ...pitchReadyBrief,
      campaignId: "campaign-locked",
      status: "locked",
      packageTier: "starter",
      nextOperatorStep: "Move the campaign route to public active or scheduled first.",
    },
  ]);

  assert.equal(desk.summary.locked, 1);
  assert.equal(desk.summary.copyReady, 0);
  assert.equal(desk.recommendedPack, null);
  assert.equal(desk.packs[0]?.actions.every((action) => action.state === "locked"), true);
});
