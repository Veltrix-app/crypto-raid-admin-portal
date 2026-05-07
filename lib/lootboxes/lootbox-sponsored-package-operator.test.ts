import assert from "node:assert/strict";
import test from "node:test";
import { buildLootboxSponsorPackageCreateRequest } from "./lootbox-sponsored-package-operator";
import type { LootboxSponsoredPackageActionPack } from "./lootbox-sponsored-package-actions";

const basePack: LootboxSponsoredPackageActionPack = {
  campaignId: "22222222-2222-4222-8222-222222222222",
  projectName: "VYNTRO",
  campaignTitle: "Holder Activation Sprint",
  packageTier: "premium",
  status: "pitch_ready",
  actionState: "ready",
  exportTitle: "VYNTRO Premium Sponsor Package",
  sponsorBriefText: "Sponsor brief copy",
  auditNoteTemplate: "Internal audit note",
  actions: [
    {
      id: "copy_sponsor_brief",
      label: "Copy sponsor brief",
      detail: "Ready to copy.",
      state: "ready",
    },
    {
      id: "copy_audit_note",
      label: "Copy operator note",
      detail: "Ready to stage.",
      state: "ready",
    },
    {
      id: "share_packet",
      label: "Share packet",
      detail: "Ready to share.",
      state: "ready",
    },
    {
      id: "open_campaign",
      label: "Open campaign route",
      detail: "Verify context.",
      state: "ready",
    },
  ],
};

test("buildLootboxSponsorPackageCreateRequest maps a ready action pack into an API payload", () => {
  const request = buildLootboxSponsorPackageCreateRequest({
    pack: basePack,
    campaign: {
      id: basePack.campaignId,
      projectId: "11111111-1111-4111-8111-111111111111",
      title: basePack.campaignTitle,
      status: "active",
      visibility: "public",
      rewardPoolAmount: 250,
      participants: 128,
      completionRate: 42,
    },
    project: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "VYNTRO",
      slug: "vyntro",
    },
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.payload.projectId, "11111111-1111-4111-8111-111111111111");
    assert.equal(request.payload.campaignId, basePack.campaignId);
    assert.equal(request.payload.packageTier, "premium");
    assert.equal(request.payload.status, "ready_to_pitch");
    assert.equal(request.payload.sponsorBudget, 0);
    assert.equal(request.payload.currency, "USD");
    assert.deepEqual(request.payload.metadata, {
      source: "lootbox_sponsor_action_desk",
      actionState: "ready",
      packageStatus: "pitch_ready",
      actionIds: ["copy_sponsor_brief", "copy_audit_note", "share_packet", "open_campaign"],
    });
    assert.deepEqual(request.payload.packageSnapshot, {
      source: "lootbox_sponsor_action_desk",
      exportTitle: "VYNTRO Premium Sponsor Package",
      projectName: "VYNTRO",
      projectSlug: "vyntro",
      campaignTitle: "Holder Activation Sprint",
      campaignStatus: "active",
      campaignVisibility: "public",
      packageTier: "premium",
      packageStatus: "pitch_ready",
      actionState: "ready",
      rewardPoolAmount: 250,
      participants: 128,
      completionRate: 42,
      sponsorBriefText: "Sponsor brief copy",
      auditNoteTemplate: "Internal audit note",
      actions: basePack.actions,
      guardrails: [
        "No reward inventory is created by saving this sponsor package.",
        "No lootbox open, payout, payment or billing action is triggered.",
        "Operator follow-up remains human-owned until explicit fulfillment controls exist.",
      ],
    });
  }
});

test("buildLootboxSponsorPackageCreateRequest maps non-ready packs into safe statuses", () => {
  const prepRequest = buildLootboxSponsorPackageCreateRequest({
    pack: { ...basePack, status: "prep_needed", actionState: "prep", packageTier: "starter" },
    campaign: {
      id: basePack.campaignId,
      projectId: "11111111-1111-4111-8111-111111111111",
      title: basePack.campaignTitle,
      status: "draft",
      visibility: "private",
    },
    project: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "VYNTRO",
      slug: "vyntro",
    },
  });
  const lockedRequest = buildLootboxSponsorPackageCreateRequest({
    pack: { ...basePack, status: "locked", actionState: "locked", packageTier: "standard" },
    campaign: {
      id: basePack.campaignId,
      projectId: "11111111-1111-4111-8111-111111111111",
      title: basePack.campaignTitle,
      status: "paused",
      visibility: "gated",
    },
    project: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "VYNTRO",
      slug: "vyntro",
    },
  });

  assert.equal(prepRequest.ok, true);
  assert.equal(lockedRequest.ok, true);
  if (prepRequest.ok && lockedRequest.ok) {
    assert.equal(prepRequest.payload.status, "draft");
    assert.equal(lockedRequest.payload.status, "blocked");
  }
});

test("buildLootboxSponsorPackageCreateRequest rejects missing or mismatched context", () => {
  assert.deepEqual(
    buildLootboxSponsorPackageCreateRequest({
      pack: basePack,
      campaign: null,
      project: null,
    }),
    {
      ok: false,
      error: "Campaign context is required before saving a sponsor package.",
    }
  );
  assert.deepEqual(
    buildLootboxSponsorPackageCreateRequest({
      pack: basePack,
      campaign: {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: basePack.campaignTitle,
        status: "active",
        visibility: "public",
      },
      project: {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Wrong Project",
        slug: "wrong",
      },
    }),
    {
      ok: false,
      error: "Project context does not match the campaign.",
    }
  );
});
