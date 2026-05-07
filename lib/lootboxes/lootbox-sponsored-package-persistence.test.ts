import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackageInsertRow,
  buildLootboxSponsorPackageNoteInsertRow,
  buildLootboxSponsorPackagePatchRow,
  buildLootboxSponsoredPackagePersistenceReadiness,
  parseLootboxSponsorPackageCreateBody,
  parseLootboxSponsorPackageNoteBody,
  parseLootboxSponsorPackagePatchBody,
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

test("sponsored package persistence readiness can mark write gates live after api enablement", () => {
  const read = buildLootboxSponsoredPackagePersistenceReadiness({
    ...input,
    apiState: "live",
  });

  assert.equal(read.summary.liveWrites, true);
  assert.equal(read.writeGates.every((gate) => gate.state === "live"), true);
  assert.match(read.nextStep, /use the sponsor package APIs/i);
});

test("parseLootboxSponsorPackageCreateBody normalizes safe create payloads", () => {
  const parsed = parseLootboxSponsorPackageCreateBody({
    projectId: "11111111-1111-4111-8111-111111111111",
    campaignId: "22222222-2222-4222-8222-222222222222",
    packageTier: "premium",
    status: "ready_to_pitch",
    sponsorName: "  VYNTRO Labs  ",
    sponsorContact: "  sponsor@vyntro.test  ",
    sponsorBudget: "2500",
    currency: "eur",
    followUpAt: "2026-05-08T10:30:00+02:00",
    packageSnapshot: {
      campaignTitle: "Holder Quest Sprint",
      deliverables: ["Featured hunt boost"],
    },
    metadata: {
      source: "action_desk",
    },
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.payload, {
      projectId: "11111111-1111-4111-8111-111111111111",
      campaignId: "22222222-2222-4222-8222-222222222222",
      packageTier: "premium",
      status: "ready_to_pitch",
      sponsorName: "VYNTRO Labs",
      sponsorContact: "sponsor@vyntro.test",
      sponsorBudget: 2500,
      currency: "EUR",
      ownerAuthUserId: null,
      followUpAt: "2026-05-08T08:30:00.000Z",
      packageSnapshot: {
        campaignTitle: "Holder Quest Sprint",
        deliverables: ["Featured hunt boost"],
      },
      metadata: {
        source: "action_desk",
      },
    });
  }
});

test("parseLootboxSponsorPackageCreateBody rejects unsafe create payloads", () => {
  assert.deepEqual(parseLootboxSponsorPackageCreateBody({}), {
    ok: false,
    error: "Project id is required.",
  });
  assert.deepEqual(
    parseLootboxSponsorPackageCreateBody({
      projectId: "11111111-1111-4111-8111-111111111111",
      campaignId: "22222222-2222-4222-8222-222222222222",
      packageTier: "mythic",
      packageSnapshot: {},
    }),
    {
      ok: false,
      error: "Unsupported sponsor package tier.",
    }
  );
  assert.deepEqual(
    parseLootboxSponsorPackageCreateBody({
      projectId: "11111111-1111-4111-8111-111111111111",
      campaignId: "22222222-2222-4222-8222-222222222222",
      packageTier: "starter",
      sponsorBudget: -1,
      packageSnapshot: {},
    }),
    {
      ok: false,
      error: "Sponsor budget must be zero or higher.",
    }
  );
});

test("sponsor package insert rows stay scoped to package persistence only", () => {
  const parsed = parseLootboxSponsorPackageCreateBody({
    projectId: "11111111-1111-4111-8111-111111111111",
    campaignId: "22222222-2222-4222-8222-222222222222",
    packageTier: "standard",
    packageSnapshot: { campaignTitle: "Holder Sprint" },
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const row = buildLootboxSponsorPackageInsertRow({
      payload: parsed.payload,
      createdByAuthUserId: "admin-auth-1",
      now: "2026-05-07T12:00:00.000Z",
    });

    assert.deepEqual(row, {
      project_id: "11111111-1111-4111-8111-111111111111",
      campaign_id: "22222222-2222-4222-8222-222222222222",
      package_tier: "standard",
      status: "draft",
      sponsor_name: null,
      sponsor_contact: null,
      sponsor_budget: 0,
      currency: "USD",
      owner_auth_user_id: null,
      follow_up_at: null,
      package_snapshot: { campaignTitle: "Holder Sprint" },
      metadata: {},
      created_by_auth_user_id: "admin-auth-1",
      last_contacted_at: null,
      created_at: "2026-05-07T12:00:00.000Z",
      updated_at: "2026-05-07T12:00:00.000Z",
    });
  }
});

test("parseLootboxSponsorPackagePatchBody accepts only explicit package fields", () => {
  const parsed = parseLootboxSponsorPackagePatchBody({
    status: "negotiating",
    ownerAuthUserId: "33333333-3333-4333-8333-333333333333",
    followUpAt: null,
    lastContactedAt: "2026-05-07T15:30:00+02:00",
    sponsorBudget: 750,
    sponsorName: "  Atlas Labs  ",
    sponsorContact: "  sponsor@atlas.test  ",
    currency: "eur",
    metadata: { crmId: "deal-77" },
    payoutStatus: "paid",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.payload, {
      status: "negotiating",
      ownerAuthUserId: "33333333-3333-4333-8333-333333333333",
      followUpAt: null,
      lastContactedAt: "2026-05-07T13:30:00.000Z",
      sponsorBudget: 750,
      sponsorName: "Atlas Labs",
      sponsorContact: "sponsor@atlas.test",
      currency: "EUR",
      metadata: { crmId: "deal-77" },
    });
    assert.deepEqual(buildLootboxSponsorPackagePatchRow(parsed.payload, "2026-05-07T12:01:00.000Z"), {
      status: "negotiating",
      owner_auth_user_id: "33333333-3333-4333-8333-333333333333",
      follow_up_at: null,
      last_contacted_at: "2026-05-07T13:30:00.000Z",
      sponsor_budget: 750,
      sponsor_name: "Atlas Labs",
      sponsor_contact: "sponsor@atlas.test",
      currency: "EUR",
      metadata: { crmId: "deal-77" },
      updated_at: "2026-05-07T12:01:00.000Z",
    });
  }
});

test("parseLootboxSponsorPackagePatchBody rejects empty and unsafe patch payloads", () => {
  assert.deepEqual(parseLootboxSponsorPackagePatchBody({}), {
    ok: false,
    error: "At least one sponsor package field is required.",
  });
  assert.deepEqual(parseLootboxSponsorPackagePatchBody({ status: "paid" }), {
    ok: false,
    error: "Unsupported sponsor package status.",
  });
  assert.deepEqual(parseLootboxSponsorPackagePatchBody({ followUpAt: "soon" }), {
    ok: false,
    error: "Follow-up date must be a valid ISO date.",
  });
});

test("sponsor package notes normalize note rows and audit payloads", () => {
  const parsed = parseLootboxSponsorPackageNoteBody({
    noteType: "sponsor_follow_up",
    note: "  Sponsor asked for a Friday follow-up.  ",
    followUpAt: "2026-05-09T15:00:00.000Z",
    metadata: { channel: "email" },
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(
      buildLootboxSponsorPackageNoteInsertRow({
        sponsorPackageId: "package-1",
        adminAuthUserId: "admin-auth-1",
        payload: parsed.payload,
        now: "2026-05-07T12:02:00.000Z",
      }),
      {
        sponsor_package_id: "package-1",
        note_type: "sponsor_follow_up",
        note: "Sponsor asked for a Friday follow-up.",
        metadata: { channel: "email" },
        follow_up_at: "2026-05-09T15:00:00.000Z",
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T12:02:00.000Z",
      }
    );

    assert.deepEqual(
      buildLootboxSponsorPackageAuditPayload({
        adminAuthUserId: "admin-auth-1",
        projectId: "11111111-1111-4111-8111-111111111111",
        sponsorPackageId: "package-1",
        action: "lootbox_sponsor_package_note_added",
        summary: "Added sponsor follow-up note.",
        metadata: { noteType: parsed.payload.noteType },
      }),
      {
        auth_user_id: "admin-auth-1",
        project_id: "11111111-1111-4111-8111-111111111111",
        source_table: "lootbox_sponsor_packages",
        source_id: "package-1",
        action: "lootbox_sponsor_package_note_added",
        summary: "Added sponsor follow-up note.",
        metadata: { noteType: "sponsor_follow_up" },
      }
    );
  }
});
