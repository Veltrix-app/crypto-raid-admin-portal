import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsorActivationHandoffRead,
  buildLootboxSponsorActivationRunMetadataPatch,
  buildLootboxSponsorActivationRunRequest,
  buildLootboxSponsorActivationRunSignoffMetadataPatch,
  buildLootboxSponsorActivationRunSignoffRequest,
  buildLootboxSponsorActivationRunStepMetadataPatch,
  buildLootboxSponsorActivationRunStepRequest,
  buildLootboxSponsorPackageCreateRequest,
  buildLootboxSponsorPackageCrmRead,
  buildLootboxSponsorPackageDetailRead,
} from "./lootbox-sponsored-package-operator";
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

test("buildLootboxSponsorPackageDetailRead merges notes and audit events into a newest-first timeline", () => {
  const detail = buildLootboxSponsorPackageDetailRead({
    packageRow: {
      id: "package-1",
      project_id: "11111111-1111-4111-8111-111111111111",
      campaign_id: basePack.campaignId,
      package_tier: "premium",
      status: "negotiating",
      sponsor_name: "VYNTRO Labs",
      sponsor_contact: "sponsor@vyntro.test",
      sponsor_budget: 2500,
      currency: "USD",
      owner_auth_user_id: "admin-auth-1",
      follow_up_at: "2026-05-09T12:00:00.000Z",
      last_contacted_at: null,
      package_snapshot: {
        projectName: "VYNTRO",
        campaignTitle: "Holder Activation Sprint",
      },
      metadata: {},
      created_by_auth_user_id: "admin-auth-1",
      created_at: "2026-05-07T10:00:00.000Z",
      updated_at: "2026-05-07T11:00:00.000Z",
    },
    notes: [
      {
        id: "note-1",
        sponsor_package_id: "package-1",
        note_type: "sponsor_follow_up",
        note: "Sponsor asked for Friday follow-up.",
        metadata: {},
        follow_up_at: "2026-05-09T12:00:00.000Z",
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T11:30:00.000Z",
      },
    ],
    auditEvents: [
      {
        id: "audit-1",
        auth_user_id: "admin-auth-1",
        source_table: "lootbox_sponsor_packages",
        source_id: "package-1",
        action: "lootbox_sponsor_package_updated",
        summary: "Updated sponsor package status.",
        metadata: { nextStatus: "negotiating" },
        created_at: "2026-05-07T11:15:00.000Z",
      },
      {
        id: "audit-2",
        auth_user_id: "admin-auth-1",
        source_table: "lootbox_sponsor_packages",
        source_id: "package-1",
        action: "lootbox_sponsor_package_created",
        summary: "Created premium sponsor package.",
        metadata: {},
        created_at: "2026-05-07T10:00:00.000Z",
      },
    ],
  });

  assert.equal(detail.summary.notes, 1);
  assert.equal(detail.summary.auditEvents, 2);
  assert.equal(detail.summary.timelineItems, 3);
  assert.equal(detail.summary.nextAction, "Follow up with sponsor");
  assert.deepEqual(
    detail.timeline.map((item) => `${item.kind}:${item.id}`),
    ["note:note-1", "audit:audit-1", "audit:audit-2"]
  );
  assert.deepEqual(detail.timeline[0], {
    id: "note-1",
    kind: "note",
    tone: "warning",
    title: "sponsor follow up",
    detail: "Sponsor asked for Friday follow-up.",
    actorAuthUserId: "admin-auth-1",
    followUpAt: "2026-05-09T12:00:00.000Z",
    createdAt: "2026-05-07T11:30:00.000Z",
  });
});

test("buildLootboxSponsorPackageDetailRead chooses next action from package status", () => {
  const blocked = buildLootboxSponsorPackageDetailRead({
    packageRow: {
      id: "package-1",
      project_id: null,
      campaign_id: null,
      package_tier: "starter",
      status: "blocked",
      sponsor_name: null,
      sponsor_contact: null,
      sponsor_budget: 0,
      currency: "USD",
      owner_auth_user_id: null,
      follow_up_at: null,
      last_contacted_at: null,
      package_snapshot: {},
      metadata: {},
      created_by_auth_user_id: null,
      created_at: "2026-05-07T10:00:00.000Z",
      updated_at: "2026-05-07T10:00:00.000Z",
    },
    notes: [],
    auditEvents: [],
  });
  const won = buildLootboxSponsorPackageDetailRead({
    packageRow: {
      ...blocked.package,
      status: "won",
    },
    notes: [],
    auditEvents: [],
  });

  assert.equal(blocked.summary.nextAction, "Unblock package context");
  assert.equal(won.summary.nextAction, "Record fulfillment plan");
});

test("buildLootboxSponsorPackageDetailRead extracts activation run history", () => {
  const detail = buildLootboxSponsorPackageDetailRead({
    packageRow: {
      id: "package-1",
      project_id: "11111111-1111-4111-8111-111111111111",
      campaign_id: basePack.campaignId,
      package_tier: "premium",
      status: "won",
      sponsor_name: "Atlas Labs",
      sponsor_contact: "atlas@labs.test",
      sponsor_budget: 2500,
      currency: "USD",
      owner_auth_user_id: "admin-auth-1",
      follow_up_at: "2026-05-09T12:00:00.000Z",
      last_contacted_at: null,
      package_snapshot: {
        projectName: "VYNTRO",
        campaignTitle: "Holder Activation Sprint",
      },
      metadata: {
        lastActivationRun: {
          runId: "sponsor-activation:package-1:2026-05-10T12:00:00.000Z",
          title: "Atlas Labs activation run",
          stagedAt: "2026-05-10T12:00:00.000Z",
          sponsorPackageId: "package-1",
          campaignId: basePack.campaignId,
          projectId: "11111111-1111-4111-8111-111111111111",
          routeHref: `/campaigns/${basePack.campaignId}`,
          noteId: "note-1",
          stagedByAuthUserId: "admin-auth-1",
          guardrailCount: 5,
        },
      },
      created_by_auth_user_id: "admin-auth-1",
      created_at: "2026-05-07T10:00:00.000Z",
      updated_at: "2026-05-07T11:00:00.000Z",
    },
    notes: [
      {
        id: "note-1",
        sponsor_package_id: "package-1",
        note_type: "decision",
        note: "Activation run staged for Atlas Labs / Holder Activation Sprint.",
        metadata: {
          source: "lootbox_sponsor_activation_run",
          runId: "sponsor-activation:package-1:2026-05-10T12:00:00.000Z",
          stagedAt: "2026-05-10T12:00:00.000Z",
          routeHref: `/campaigns/${basePack.campaignId}`,
          nextOperatorMoves: [
            "Copy the activation brief into the internal launch thread.",
            "Confirm campaign route, shard pool, reward budget and owner one final time.",
          ],
          guardrails: [
            "Manual-only activation run.",
            "No billing action was triggered.",
          ],
        },
        follow_up_at: null,
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-10T12:00:00.000Z",
      },
    ],
    auditEvents: [
      {
        id: "audit-1",
        auth_user_id: "admin-auth-1",
        source_table: "lootbox_sponsor_packages",
        source_id: "package-1",
        action: "lootbox_sponsor_activation_run_staged",
        summary: "Staged manual activation run for Atlas Labs.",
        metadata: {
          runId: "sponsor-activation:package-1:2026-05-10T12:00:00.000Z",
          stagedAt: "2026-05-10T12:00:00.000Z",
          noteId: "note-1",
        },
        created_at: "2026-05-10T12:00:01.000Z",
      },
    ],
  });

  assert.equal(detail.summary.activationRuns, 1);
  assert.equal(detail.summary.latestActivationRunAt, "2026-05-10T12:00:00.000Z");
  assert.equal(detail.summary.nextActivationRunMove, "Copy the activation brief into the internal launch thread.");
  const [run] = detail.activationRuns;
  assert.deepEqual(
    run
      ? {
          runId: run.runId,
          title: run.title,
          state: run.state,
          stagedAt: run.stagedAt,
          stagedByAuthUserId: run.stagedByAuthUserId,
          noteId: run.noteId,
          auditId: run.auditId,
          routeHref: run.routeHref,
          nextOperatorMove: run.nextOperatorMove,
          guardrailCount: run.guardrailCount,
        }
      : null,
    {
      runId: "sponsor-activation:package-1:2026-05-10T12:00:00.000Z",
      title: "Atlas Labs activation run",
      state: "staged",
      stagedAt: "2026-05-10T12:00:00.000Z",
      stagedByAuthUserId: "admin-auth-1",
      noteId: "note-1",
      auditId: "audit-1",
      routeHref: `/campaigns/${basePack.campaignId}`,
      nextOperatorMove: "Copy the activation brief into the internal launch thread.",
      guardrailCount: 2,
    }
  );
  assert.equal(run?.steps.length, 6);
  assert.deepEqual(
    run?.steps.map((step) => `${step.id}:${step.state}`),
    [
      "stage_activation_brief:pending",
      "confirm_campaign_route:pending",
      "verify_shard_pool:pending",
      "lock_reward_budget:pending",
      "assign_owner:pending",
      "monitor_launch:pending",
    ]
  );
});

test("buildLootboxSponsorPackageCrmRead turns package fields into an operator deal cockpit", () => {
  const read = buildLootboxSponsorPackageCrmRead({
    id: "package-1",
    project_id: "11111111-1111-4111-8111-111111111111",
    campaign_id: basePack.campaignId,
    package_tier: "premium",
    status: "negotiating",
    sponsor_name: "Atlas Labs",
    sponsor_contact: "",
    sponsor_budget: 2500,
    currency: "eur",
    owner_auth_user_id: "admin-auth-1",
    follow_up_at: null,
    last_contacted_at: "2026-05-07T12:00:00.000Z",
    package_snapshot: {
      projectName: "VYNTRO",
      campaignTitle: "Holder Activation Sprint",
    },
    metadata: {},
    created_by_auth_user_id: "admin-auth-1",
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T11:00:00.000Z",
  });

  assert.equal(read.stage.label, "Negotiating");
  assert.equal(read.stage.index, 2);
  assert.equal(read.stage.count, 4);
  assert.equal(read.stage.tone, "warning");
  assert.equal(read.identity.sponsorName, "Atlas Labs");
  assert.equal(read.identity.sponsorContact, "No contact saved");
  assert.equal(read.identity.budgetLabel, "EUR 2,500");
  assert.deepEqual(read.missingFields, ["Sponsor contact", "Follow-up date"]);
  assert.deepEqual(
    read.checklist.map((item) => `${item.id}:${item.state}`),
    [
      "sponsor_name:ready",
      "sponsor_contact:missing",
      "deal_budget:ready",
      "owner:ready",
      "follow_up:missing",
    ]
  );
  assert.equal(read.primaryAction, "Add sponsor contact before next follow-up");
});

test("buildLootboxSponsorPackageCrmRead adds safe next controls for sponsor progress", () => {
  const baseRow = {
    id: "package-1",
    project_id: "11111111-1111-4111-8111-111111111111",
    campaign_id: basePack.campaignId,
    package_tier: "premium",
    status: "ready_to_pitch",
    sponsor_name: "Atlas Labs",
    sponsor_contact: null,
    sponsor_budget: 0,
    currency: "USD",
    owner_auth_user_id: null,
    follow_up_at: null,
    last_contacted_at: null,
    package_snapshot: {},
    metadata: {},
    created_by_auth_user_id: "admin-auth-1",
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T11:00:00.000Z",
  };
  const blockedRead = buildLootboxSponsorPackageCrmRead(baseRow);
  const readyRead = buildLootboxSponsorPackageCrmRead({
    ...baseRow,
    sponsor_contact: "atlas@labs.test",
    sponsor_budget: 2500,
    owner_auth_user_id: "admin-auth-1",
    follow_up_at: "2026-05-09T12:00:00.000Z",
  });

  assert.deepEqual(blockedRead.controls, {
    canProgress: false,
    nextStatus: "pitched",
    nextActionLabel: "Mark pitched",
    reason: "Add Sponsor contact, Deal value, Owner and Follow-up date before moving to pitched.",
    blockingFields: ["Sponsor contact", "Deal value", "Owner", "Follow-up date"],
  });
  assert.deepEqual(readyRead.controls, {
    canProgress: true,
    nextStatus: "pitched",
    nextActionLabel: "Mark pitched",
    reason: "Sponsor package can safely move to pitched.",
    blockingFields: [],
  });
});

test("buildLootboxSponsorActivationHandoffRead turns won packages into ready activation handoffs", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 900,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "No Pool Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "No Pool Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.deepEqual(read.summary, {
    total: 2,
    ready: 1,
    setupNeeded: 1,
    locked: 0,
    closed: 0,
    renewalReady: 1,
    renewalWatch: 0,
    stagedRuns: 0,
    signedOffRuns: 0,
    manualOnly: true,
  });
  assert.deepEqual(
    read.handoffs.map((handoff) => `${handoff.packageId}:${handoff.activationState}`),
    ["package-ready:ready", "package-setup:setup_needed"]
  );
  assert.equal(read.focus?.packageId, "package-ready");
  assert.equal(read.handoffs[0]?.nextAction, "Stage activation brief for manual launch.");
  assert.equal(read.handoffs[0]?.brief.title, "Atlas Labs x VYNTRO activation handoff");
  assert.match(read.handoffs[0]?.brief.body ?? "", /10,000 shard pool/);
  assert.deepEqual(
    read.handoffs[1]?.checklist.map((item) => `${item.id}:${item.state}`),
    [
      "sponsor_win:ready",
      "campaign_route:ready",
      "shard_pool:missing",
      "reward_budget:ready",
      "owner:ready",
    ]
  );
  assert.equal(read.handoffs[1]?.nextAction, "Attach an active shard pool before activation.");
});

test("buildLootboxSponsorActivationHandoffRead adds the manual execution checklist", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 900,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "No Pool Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "No Pool Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  const ready = read.handoffs[0];
  const setup = read.handoffs[1];

  assert.equal(ready?.execution.canLaunch, true);
  assert.equal(ready?.execution.primaryStepId, "stage_activation_brief");
  assert.deepEqual(ready?.execution.blockedBy, []);
  assert.deepEqual(
    ready?.execution.steps.map((step) => `${step.id}:${step.state}`),
    [
      "stage_activation_brief:ready",
      "confirm_campaign_route:ready",
      "verify_shard_pool:ready",
      "lock_reward_budget:ready",
      "assign_owner:ready",
      "monitor_launch:ready",
    ]
  );
  assert.deepEqual(ready?.execution.runbook, [
    "Copy the activation brief into the internal launch thread.",
    "Confirm campaign route, shard pool, reward budget and owner one final time.",
    "Start the sponsored activation manually and monitor first-hour shard depletion.",
  ]);

  assert.equal(setup?.execution.canLaunch, false);
  assert.equal(setup?.execution.primaryStepId, "verify_shard_pool");
  assert.deepEqual(setup?.execution.blockedBy, ["Shard pool"]);
  assert.deepEqual(
    setup?.execution.steps.map((step) => `${step.id}:${step.state}`),
    [
      "stage_activation_brief:ready",
      "confirm_campaign_route:ready",
      "verify_shard_pool:action_needed",
      "lock_reward_budget:ready",
      "assign_owner:ready",
      "monitor_launch:blocked",
    ]
  );
});

test("buildLootboxSponsorActivationHandoffRead adds sponsor performance snapshots", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 900,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "No Pool Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "No Pool Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  const ready = read.handoffs[0];
  const setup = read.handoffs[1];

  assert.equal(ready?.performance.state, "report_ready");
  assert.equal(ready?.performance.renewalSignal, "strong");
  assert.equal(ready?.performance.nextAction, "Send sponsor performance update and tee up renewal.");
  assert.deepEqual(
    ready?.performance.kpis.map((kpi) => `${kpi.id}:${kpi.value}`),
    [
      "shards_issued:3,600",
      "depletion:36%",
      "participants:128",
      "completion:42%",
    ]
  );
  assert.equal(ready?.performance.sponsorUpdate.title, "Atlas Labs activation performance update");
  assert.match(ready?.performance.sponsorUpdate.body ?? "", /3,600 shards issued/);
  assert.match(ready?.performance.sponsorUpdate.body ?? "", /36% depleted/);
  assert.match(ready?.performance.sponsorUpdate.body ?? "", /128 participants/);

  assert.equal(setup?.performance.state, "setup_needed");
  assert.equal(setup?.performance.renewalSignal, "none");
  assert.equal(setup?.performance.nextAction, "Finish activation setup before sending performance updates.");
});

test("buildLootboxSponsorActivationHandoffRead adds sponsor renewal pipeline", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T10:00:00.000Z",
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 900,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "No Pool Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "No Pool Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  const ready = read.handoffs[0];
  const setup = read.handoffs[1];

  assert.equal(read.summary.renewalReady, 1);
  assert.equal(ready?.renewal.state, "ready");
  assert.equal(ready?.renewal.followUpUrgency, "overdue");
  assert.equal(ready?.renewal.nextPackageTier, "premium");
  assert.equal(ready?.renewal.nextAction, "Send renewal follow-up with the performance snapshot.");
  assert.equal(ready?.renewal.renewalCopy.title, "Atlas Labs renewal follow-up");
  assert.match(ready?.renewal.renewalCopy.body ?? "", /premium renewal/);
  assert.match(ready?.renewal.renewalCopy.body ?? "", /3,600 shards issued/);
  assert.match(ready?.renewal.renewalCopy.body ?? "", /36% depleted/);
  assert.match(ready?.renewal.renewalCopy.body ?? "", /128 participants/);

  assert.equal(setup?.renewal.state, "not_ready");
  assert.equal(setup?.renewal.nextAction, "Finish activation setup before renewal outreach.");
  assert.deepEqual(setup?.renewal.blockedBy, ["Activation setup", "Sponsor performance"]);
});

test("buildLootboxSponsorActivationRunRequest stages only ready manual activation runs", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T10:00:00.000Z",
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 900,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "No Pool Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "No Pool Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  const ready = read.handoffs.find((handoff) => handoff.packageId === "package-ready");
  const setup = read.handoffs.find((handoff) => handoff.packageId === "package-setup");
  assert.ok(ready);
  assert.ok(setup);

  const run = buildLootboxSponsorActivationRunRequest({
    handoff: ready,
    now: "2026-05-10T12:00:00.000Z",
  });
  const blocked = buildLootboxSponsorActivationRunRequest({
    handoff: setup,
    now: "2026-05-10T12:00:00.000Z",
  });

  assert.equal(run.ok, true);
  if (run.ok) {
    assert.equal(run.activationRun.runId, "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z");
    assert.equal(run.notePayload.noteType, "decision");
    assert.match(run.notePayload.note, /Activation run staged for Atlas Labs/);
    assert.match(run.notePayload.note, /no billing, payout, reward inventory or public launch was triggered/i);
    assert.deepEqual(run.notePayload.metadata.guardrails, [
      "Manual-only activation run.",
      "No billing action was triggered.",
      "No payout action was triggered.",
      "No reward inventory was created or mutated.",
      "No public campaign launch was triggered.",
    ]);
    assert.equal(run.audit.summary, "Staged manual activation run for Atlas Labs.");
    assert.equal(run.audit.metadata.activationState, "ready");
    assert.deepEqual(run.audit.metadata.metrics, {
      activePools: 1,
      linkedPools: 1,
      poolSize: 10000,
      remainingShards: 6400,
      rewardBudget: 500,
      participants: 128,
      completionRate: 42,
    });
  }

  assert.deepEqual(blocked, {
    ok: false,
    error: "Activation run can only be staged when the sponsor handoff is ready.",
    blockedBy: ["Shard pool"],
  });
});

test("buildLootboxSponsorActivationHandoffRead surfaces staged activation run state", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.equal(read.summary.stagedRuns, 1);
  assert.equal(read.handoffs[0]?.activationRun.state, "staged");
  assert.equal(read.handoffs[0]?.activationRun.label, "Run staged");
  assert.equal(read.handoffs[0]?.activationRun.canStage, false);
  assert.equal(read.handoffs[0]?.activationRun.stagedAt, "2026-05-10T12:00:00.000Z");
  assert.equal(read.handoffs[0]?.activationRun.noteId, "note-1");
  assert.match(read.handoffs[0]?.activationRun.detail ?? "", /manual runbook/);
});

test("buildLootboxSponsorActivationHandoffRead routes completed signoff into performance and renewal follow-up", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T14:00:00.000Z",
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-11T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-ready",
            campaignId: basePack.campaignId,
            projectId: "11111111-1111-4111-8111-111111111111",
            routeHref: `/campaigns/${basePack.campaignId}`,
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-1",
            noteId: "note-signoff",
            note: "Launch completed and shard pressure stayed healthy.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  const handoff = read.handoffs[0];

  assert.equal(read.summary.signedOffRuns, 1);
  assert.equal(handoff?.activationRun.signoff?.outcome, "completed");
  assert.equal(handoff?.performance.signoff.outcome, "completed");
  assert.equal(
    handoff?.performance.nextAction,
    "Send signed-off sponsor performance update and tee up renewal."
  );
  assert.match(handoff?.performance.sponsorUpdate.body ?? "", /Signoff: Completed/);
  assert.match(
    handoff?.performance.sponsorUpdate.body ?? "",
    /Launch completed and shard pressure stayed healthy/
  );
  assert.equal(handoff?.renewal.signoff.outcome, "completed");
  assert.equal(
    handoff?.renewal.nextAction,
    "Send signed-off renewal follow-up with the performance snapshot."
  );
  assert.match(handoff?.renewal.renewalCopy.body ?? "", /Signed-off outcome: Completed/);
});

test("buildLootboxSponsorActivationHandoffRead builds a sponsor business cockpit", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T14:00:00.000Z",
    packages: [
      {
        id: "package-renewal",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-10T10:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: "sponsor-activation:package-renewal:2026-05-10T12:00:00.000Z",
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-renewal",
            campaignId: basePack.campaignId,
            projectId: "11111111-1111-4111-8111-111111111111",
            routeHref: `/campaigns/${basePack.campaignId}`,
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: "sponsor-activation:package-renewal:2026-05-10T12:00:00.000Z",
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-1",
            noteId: "note-signoff",
            note: "Launch completed and shard pressure stayed healthy.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-follow-up",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "negotiating",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@guild.test",
        sponsor_budget: 1800,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: "2026-05-09T10:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Beta Push",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: "44444444-4444-4444-8444-444444444444",
        package_tier: "starter",
        status: "won",
        sponsor_name: "Gamma Crew",
        sponsor_contact: "gamma@test.local",
        sponsor_budget: 600,
        currency: "USD",
        owner_auth_user_id: "admin-auth-3",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Gamma Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-3",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Beta Push",
        status: "scheduled",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 25,
        completionRate: 18,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Gamma Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 0,
        participants: 0,
        completionRate: 0,
      },
    ],
    projects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "VYNTRO",
        slug: "vyntro",
      },
    ],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.deepEqual(read.businessCockpit.summary, {
    totalValue: 4900,
    highPriority: 2,
    overdueFollowUps: 2,
    renewalReady: 1,
    signedOffRuns: 1,
    topNextAction: "Send signed-off renewal follow-up with the performance snapshot.",
  });
  assert.equal(read.businessCockpit.focus?.packageId, "package-renewal");
  assert.deepEqual(
    read.businessCockpit.lanes.map((lane) => `${lane.id}:${lane.count}`),
    ["revenue:3", "follow_up:2", "renewal:1"]
  );
  assert.deepEqual(
    read.businessCockpit.lanes[0]?.items.map((item) => `${item.packageId}:${item.priority}`),
    ["package-renewal:high", "package-follow-up:high", "package-setup:medium"]
  );
});

test("buildLootboxSponsorActivationHandoffRead builds sponsor billing readiness", () => {
  const projectId = "11111111-1111-4111-8111-111111111111";
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T14:00:00.000Z",
    packages: [
      {
        id: "package-invoice",
        project_id: projectId,
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-11T10:00:00.000Z",
        last_contacted_at: "2026-05-09T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: "sponsor-activation:package-invoice:2026-05-10T12:00:00.000Z",
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-invoice",
            campaignId: basePack.campaignId,
            projectId,
            routeHref: `/campaigns/${basePack.campaignId}`,
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: "sponsor-activation:package-invoice:2026-05-10T12:00:00.000Z",
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-1",
            noteId: "note-signoff",
            note: "Launch completed and sponsor proof is ready.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-missing-contact",
        project_id: projectId,
        campaign_id: "33333333-3333-4333-8333-333333333333",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Beta Guild",
        sponsor_contact: null,
        sponsor_budget: 1200,
        currency: "USD",
        owner_auth_user_id: "admin-auth-2",
        follow_up_at: "2026-05-11T10:00:00.000Z",
        last_contacted_at: "2026-05-08T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Beta Push",
        },
        metadata: {
          lastActivationRun: {
            runId: "sponsor-activation:package-missing-contact:2026-05-10T12:00:00.000Z",
            title: "Beta Guild activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-missing-contact",
            campaignId: "33333333-3333-4333-8333-333333333333",
            projectId,
            routeHref: "/campaigns/33333333-3333-4333-8333-333333333333",
            noteId: "note-2",
            stagedByAuthUserId: "admin-auth-2",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: "sponsor-activation:package-missing-contact:2026-05-10T12:00:00.000Z",
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-2",
            noteId: "note-signoff-2",
            note: "Delivery proof is ready, but finance contact is missing.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-2",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-awaiting-signoff",
        project_id: projectId,
        campaign_id: "44444444-4444-4444-8444-444444444444",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Gamma Crew",
        sponsor_contact: "gamma@test.local",
        sponsor_budget: 1500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-3",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Gamma Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-3",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-watch",
        project_id: projectId,
        campaign_id: "55555555-5555-4555-8555-555555555555",
        package_tier: "starter",
        status: "negotiating",
        sponsor_name: "Delta DAO",
        sponsor_contact: "delta@test.local",
        sponsor_budget: 1800,
        currency: "USD",
        owner_auth_user_id: "admin-auth-4",
        follow_up_at: "2026-05-12T10:00:00.000Z",
        last_contacted_at: "2026-05-08T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Delta Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-4",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId,
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        projectId,
        title: "Beta Push",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 300,
        participants: 44,
        completionRate: 35,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        projectId,
        title: "Gamma Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 200,
        participants: 12,
        completionRate: 12,
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        projectId,
        title: "Delta Sprint",
        status: "scheduled",
        visibility: "public",
        rewardPoolAmount: 100,
        participants: 0,
        completionRate: 0,
      },
    ],
    projects: [{ id: projectId, name: "VYNTRO", slug: "vyntro" }],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.deepEqual(read.billingReadiness.summary, {
    totalValue: 7000,
    invoiceReadyValue: 2500,
    invoiceReady: 1,
    needsFinanceSetup: 2,
    paymentWatch: 1,
    closed: 0,
    manualOnly: true,
    topNextAction: "Prepare manual invoice request for Atlas Labs after finance approval.",
  });
  assert.equal(read.billingReadiness.focus?.packageId, "package-invoice");
  assert.deepEqual(
    read.billingReadiness.lanes.map((lane) => `${lane.id}:${lane.count}`),
    ["invoice_ready:1", "finance_setup:2", "payment_watch:1"]
  );
  assert.deepEqual(
    read.billingReadiness.lanes[1]?.items.map((item) => `${item.packageId}:${item.blockers.join("|")}`),
    [
      "package-missing-contact:Sponsor contact",
      "package-awaiting-signoff:Delivery signoff",
    ]
  );
});

test("buildLootboxSponsorActivationHandoffRead builds a sponsor deal close pack and revenue command", () => {
  const projectId = "11111111-1111-4111-8111-111111111111";
  const readyRunId = "sponsor-activation:package-close:2026-05-10T12:00:00.000Z";
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T14:00:00.000Z",
    packages: [
      {
        id: "package-close",
        project_id: projectId,
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "finance@atlas.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-11T10:00:00.000Z",
        last_contacted_at: "2026-05-09T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: readyRunId,
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-close",
            campaignId: basePack.campaignId,
            projectId,
            routeHref: `/campaigns/${basePack.campaignId}`,
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: readyRunId,
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-1",
            noteId: "note-signoff",
            note: "Launch completed and sponsor proof is ready.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: projectId,
        campaign_id: "44444444-4444-4444-8444-444444444444",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Gamma Crew",
        sponsor_contact: "gamma@test.local",
        sponsor_budget: 1500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-3",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Gamma Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-3",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId,
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        projectId,
        title: "Gamma Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 200,
        participants: 12,
        completionRate: 12,
      },
    ],
    projects: [{ id: projectId, name: "VYNTRO", slug: "vyntro" }],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.deepEqual(read.dealClosePack.summary, {
    total: 2,
    ready: 1,
    needsSetup: 1,
    watch: 0,
    copyBlocks: 3,
    manualOnly: true,
    topNextAction: "Copy close pack for Atlas Labs: sponsor recap, finance prep and internal proof.",
  });
  assert.equal(read.dealClosePack.focus?.packageId, "package-close");

  const readyPack = read.dealClosePack.packs.find((pack) => pack.packageId === "package-close");
  assert.deepEqual(
    readyPack?.blocks.map((block) => `${block.id}:${block.enabled}`),
    ["sponsor_recap:true", "finance_prep:true", "internal_proof:true"]
  );
  assert.match(readyPack?.blocks[0]?.body ?? "", /Atlas Labs close recap for Holder Activation Sprint/);
  assert.match(readyPack?.blocks[1]?.body ?? "", /Finance contact: finance@atlas.test/);
  assert.match(readyPack?.blocks[1]?.body ?? "", /Finance approval required before sending/);
  assert.match(readyPack?.blocks[2]?.body ?? "", /Launch completed and sponsor proof is ready/);
  assert.match(
    readyPack?.blocks[2]?.body ?? "",
    /Manual-only guardrail: this does not create invoices, payment links, payouts or reward inventory/
  );

  const setupPack = read.dealClosePack.packs.find((pack) => pack.packageId === "package-setup");
  assert.equal(setupPack?.state, "needs_setup");
  assert.deepEqual(setupPack?.blockers, ["Delivery signoff"]);
  assert.equal(setupPack?.blocks.every((block) => !block.enabled), true);

  assert.deepEqual(read.revenueCommand.summary, {
    pipelineValue: 4000,
    invoiceReadyValue: 2500,
    highPriority: 1,
    invoiceReady: 1,
    closeReady: 1,
    copyBlocks: 3,
    setupPressure: 1,
    manualOnly: true,
    topNextAction: "Copy close pack for Atlas Labs: sponsor recap, finance prep and internal proof.",
  });
  assert.equal(read.revenueCommand.focus?.packageId, "package-close");
  assert.deepEqual(
    read.revenueCommand.lanes.map((lane) => `${lane.id}:${lane.count}:${lane.value}`),
    ["business:1:4000", "finance:1:2500", "close_pack:1:3"]
  );
});

test("buildLootboxSponsorActivationHandoffRead builds a sponsor follow-up timeline", () => {
  const projectId = "11111111-1111-4111-8111-111111111111";
  const readyRunId = "sponsor-activation:package-close:2026-05-10T12:00:00.000Z";
  const read = buildLootboxSponsorActivationHandoffRead({
    now: "2026-05-10T14:00:00.000Z",
    packages: [
      {
        id: "package-close",
        project_id: projectId,
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "finance@atlas.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-10T10:00:00.000Z",
        last_contacted_at: "2026-05-09T12:00:00.000Z",
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Holder Activation Sprint",
        },
        metadata: {
          lastActivationRun: {
            runId: readyRunId,
            title: "Atlas Labs activation run",
            stagedAt: "2026-05-10T12:00:00.000Z",
            sponsorPackageId: "package-close",
            campaignId: basePack.campaignId,
            projectId,
            routeHref: `/campaigns/${basePack.campaignId}`,
            noteId: "note-1",
            stagedByAuthUserId: "admin-auth-1",
            guardrailCount: 5,
          },
          lastActivationRunSignoff: {
            runId: readyRunId,
            outcome: "completed",
            label: "Completed",
            signedOffAt: "2026-05-10T13:00:00.000Z",
            signedOffByAuthUserId: "admin-auth-1",
            noteId: "note-signoff",
            note: "Launch completed and sponsor proof is ready.",
            followUpAt: "2026-05-11T12:00:00.000Z",
          },
        },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-setup",
        project_id: projectId,
        campaign_id: "44444444-4444-4444-8444-444444444444",
        package_tier: "standard",
        status: "won",
        sponsor_name: "Gamma Crew",
        sponsor_contact: "gamma@test.local",
        sponsor_budget: 1500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-3",
        follow_up_at: null,
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Gamma Sprint",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-3",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "package-watch",
        project_id: projectId,
        campaign_id: "55555555-5555-4555-8555-555555555555",
        package_tier: "starter",
        status: "negotiating",
        sponsor_name: "Beta Guild",
        sponsor_contact: "beta@test.local",
        sponsor_budget: 1000,
        currency: "USD",
        owner_auth_user_id: "admin-auth-4",
        follow_up_at: "2026-05-12T10:00:00.000Z",
        last_contacted_at: null,
        package_snapshot: {
          projectName: "VYNTRO",
          campaignTitle: "Beta Warmup",
        },
        metadata: {},
        created_by_auth_user_id: "admin-auth-4",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId,
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        projectId,
        title: "Gamma Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 200,
        participants: 12,
        completionRate: 12,
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        projectId,
        title: "Beta Warmup",
        status: "scheduled",
        visibility: "public",
        rewardPoolAmount: 150,
        participants: 0,
        completionRate: 0,
      },
    ],
    projects: [{ id: projectId, name: "VYNTRO", slug: "vyntro" }],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });

  assert.deepEqual(read.followUpTimeline.summary, {
    total: 7,
    now: 4,
    next: 1,
    proof: 2,
    overdue: 1,
    manualOnly: true,
    topNextAction: "Copy close pack for Atlas Labs: sponsor recap, finance prep and internal proof.",
  });
  assert.equal(read.followUpTimeline.focus?.packageId, "package-close");
  assert.deepEqual(
    read.followUpTimeline.lanes.map((lane) => `${lane.id}:${lane.count}`),
    ["now:4", "next:1", "proof:2"]
  );
  assert.deepEqual(
    read.followUpTimeline.lanes[0]?.items.map(
      (item) => `${item.kind}:${item.packageId}:${item.state}`
    ),
    [
      "close_pack:package-close:ready",
      "finance_prep:package-close:ready",
      "sponsor_follow_up:package-close:overdue",
      "setup_needed:package-setup:setup_needed",
    ]
  );
  assert.deepEqual(
    read.followUpTimeline.lanes[1]?.items.map(
      (item) => `${item.kind}:${item.packageId}:${item.state}`
    ),
    ["sponsor_follow_up:package-watch:due_soon"]
  );
  assert.deepEqual(
    read.followUpTimeline.lanes[2]?.items.map(
      (item) => `${item.kind}:${item.packageId}:${item.state}`
    ),
    [
      "delivery_signoff:package-close:proof",
      "last_contact:package-close:proof",
    ]
  );
});

test("buildLootboxSponsorActivationRunMetadataPatch preserves metadata and stores run visibility", () => {
  const read = buildLootboxSponsorActivationHandoffRead({
    packages: [
      {
        id: "package-ready",
        project_id: "11111111-1111-4111-8111-111111111111",
        campaign_id: basePack.campaignId,
        package_tier: "premium",
        status: "won",
        sponsor_name: "Atlas Labs",
        sponsor_contact: "atlas@labs.test",
        sponsor_budget: 2500,
        currency: "USD",
        owner_auth_user_id: "admin-auth-1",
        follow_up_at: "2026-05-09T12:00:00.000Z",
        last_contacted_at: "2026-05-07T12:00:00.000Z",
        package_snapshot: {},
        metadata: { source: "existing", untouched: true },
        created_by_auth_user_id: "admin-auth-1",
        created_at: "2026-05-07T10:00:00.000Z",
        updated_at: "2026-05-07T11:00:00.000Z",
      },
    ],
    campaigns: [
      {
        id: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        title: "Holder Activation Sprint",
        status: "active",
        visibility: "public",
        rewardPoolAmount: 500,
        participants: 128,
        completionRate: 42,
      },
    ],
    projects: [{ id: "11111111-1111-4111-8111-111111111111", name: "VYNTRO", slug: "vyntro" }],
    shardPools: [
      {
        id: "pool-1",
        campaignId: basePack.campaignId,
        status: "active",
        poolSize: 10_000,
        remainingShards: 6_400,
      },
    ],
  });
  const run = buildLootboxSponsorActivationRunRequest({
    handoff: read.handoffs[0]!,
    now: "2026-05-10T12:00:00.000Z",
  });
  assert.equal(run.ok, true);

  if (run.ok) {
    const metadata = buildLootboxSponsorActivationRunMetadataPatch({
      existingMetadata: { source: "existing", untouched: true },
      activationRun: run.activationRun,
      noteId: "note-1",
      stagedByAuthUserId: "admin-auth-1",
    });

    assert.deepEqual(metadata, {
      source: "existing",
      untouched: true,
      activationRunState: "staged",
      lastActivationRun: {
        runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
        title: "Atlas Labs activation run",
        stagedAt: "2026-05-10T12:00:00.000Z",
        sponsorPackageId: "package-ready",
        campaignId: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        routeHref: `/campaigns/${basePack.campaignId}`,
        noteId: "note-1",
        stagedByAuthUserId: "admin-auth-1",
        guardrailCount: 5,
      },
    });
  }
});

test("buildLootboxSponsorActivationRunStepRequest creates safe manual step updates", () => {
  const packageRow = {
    id: "package-ready",
    project_id: "11111111-1111-4111-8111-111111111111",
    campaign_id: basePack.campaignId,
    package_tier: "premium",
    status: "won",
    sponsor_name: "Atlas Labs",
    sponsor_contact: "atlas@labs.test",
    sponsor_budget: 2500,
    currency: "USD",
    owner_auth_user_id: "admin-auth-1",
    follow_up_at: "2026-05-09T12:00:00.000Z",
    last_contacted_at: "2026-05-07T12:00:00.000Z",
    package_snapshot: {},
    metadata: {
      lastActivationRun: {
        runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
        title: "Atlas Labs activation run",
        stagedAt: "2026-05-10T12:00:00.000Z",
        sponsorPackageId: "package-ready",
        campaignId: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        routeHref: `/campaigns/${basePack.campaignId}`,
        noteId: "note-1",
        stagedByAuthUserId: "admin-auth-1",
        guardrailCount: 5,
      },
    },
    created_by_auth_user_id: "admin-auth-1",
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T11:00:00.000Z",
  };

  const request = buildLootboxSponsorActivationRunStepRequest({
    packageRow,
    stepId: "confirm_campaign_route",
    state: "done",
    note: "Campaign route checked.",
    adminAuthUserId: "admin-auth-1",
    now: "2026-05-10T12:15:00.000Z",
  });
  const blocked = buildLootboxSponsorActivationRunStepRequest({
    packageRow: { ...packageRow, metadata: {} },
    stepId: "confirm_campaign_route",
    state: "done",
    note: "",
    adminAuthUserId: "admin-auth-1",
    now: "2026-05-10T12:15:00.000Z",
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.step.id, "confirm_campaign_route");
    assert.equal(request.step.state, "done");
    assert.equal(request.step.label, "Confirm campaign route");
    assert.equal(request.notePayload.noteType, "status_change");
    assert.match(request.notePayload.note, /Activation run step done: Confirm campaign route/);
    assert.equal(request.notePayload.metadata.source, "lootbox_sponsor_activation_run_step");
    assert.equal(request.notePayload.metadata.noBillingAction, true);
    assert.equal(request.notePayload.metadata.noPayoutAction, true);
    assert.equal(request.notePayload.metadata.noRewardInventoryAction, true);
    assert.equal(request.notePayload.metadata.noPublicLaunchAction, true);
    assert.equal(
      request.audit.summary,
      "Marked activation run step Confirm campaign route as done."
    );
  }

  assert.deepEqual(blocked, {
    ok: false,
    error: "Stage an activation run before updating manual execution steps.",
  });
});

test("buildLootboxSponsorActivationRunStepMetadataPatch stores step state without replacing metadata", () => {
  const metadata = buildLootboxSponsorActivationRunStepMetadataPatch({
    existingMetadata: {
      source: "existing",
      lastActivationRun: {
        runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
        title: "Atlas Labs activation run",
      },
      activationRunStepStates: {
        stage_activation_brief: {
          runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
          state: "done",
          label: "Stage activation brief",
          updatedAt: "2026-05-10T12:05:00.000Z",
          updatedByAuthUserId: "admin-auth-1",
          noteId: "note-1",
        },
      },
    },
    step: {
      id: "confirm_campaign_route",
      label: "Confirm campaign route",
      state: "blocked",
      updatedAt: "2026-05-10T12:15:00.000Z",
      updatedByAuthUserId: "admin-auth-2",
      runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
      note: "Waiting on campaign schedule.",
    },
    noteId: "note-2",
  });

  assert.deepEqual(metadata.activationRunStepStates, {
    stage_activation_brief: {
      runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
      state: "done",
      label: "Stage activation brief",
      updatedAt: "2026-05-10T12:05:00.000Z",
      updatedByAuthUserId: "admin-auth-1",
      noteId: "note-1",
    },
    confirm_campaign_route: {
      runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
      state: "blocked",
      label: "Confirm campaign route",
      updatedAt: "2026-05-10T12:15:00.000Z",
      updatedByAuthUserId: "admin-auth-2",
      noteId: "note-2",
      note: "Waiting on campaign schedule.",
    },
  });
  assert.equal(metadata.source, "existing");
});

test("buildLootboxSponsorActivationRunSignoffRequest creates safe final run outcomes", () => {
  const packageRow = {
    id: "package-ready",
    project_id: "11111111-1111-4111-8111-111111111111",
    campaign_id: basePack.campaignId,
    package_tier: "premium",
    status: "won",
    sponsor_name: "Atlas Labs",
    sponsor_contact: "atlas@labs.test",
    sponsor_budget: 2500,
    currency: "USD",
    owner_auth_user_id: "admin-auth-1",
    follow_up_at: "2026-05-09T12:00:00.000Z",
    last_contacted_at: "2026-05-07T12:00:00.000Z",
    package_snapshot: {},
    metadata: {
      lastActivationRun: {
        runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
        title: "Atlas Labs activation run",
        stagedAt: "2026-05-10T12:00:00.000Z",
        sponsorPackageId: "package-ready",
        campaignId: basePack.campaignId,
        projectId: "11111111-1111-4111-8111-111111111111",
        routeHref: `/campaigns/${basePack.campaignId}`,
        noteId: "note-1",
        stagedByAuthUserId: "admin-auth-1",
        guardrailCount: 5,
      },
    },
    created_by_auth_user_id: "admin-auth-1",
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T11:00:00.000Z",
  };

  const request = buildLootboxSponsorActivationRunSignoffRequest({
    packageRow,
    outcome: "completed",
    note: "Launch completed and shard pressure stayed healthy.",
    followUpAt: "2026-05-12T09:00:00.000Z",
    adminAuthUserId: "admin-auth-1",
    now: "2026-05-10T13:00:00.000Z",
  });
  const missingRun = buildLootboxSponsorActivationRunSignoffRequest({
    packageRow: { ...packageRow, metadata: {} },
    outcome: "completed",
    note: "Launch completed.",
    followUpAt: null,
    adminAuthUserId: "admin-auth-1",
    now: "2026-05-10T13:00:00.000Z",
  });
  const missingNote = buildLootboxSponsorActivationRunSignoffRequest({
    packageRow,
    outcome: "completed",
    note: " ",
    followUpAt: null,
    adminAuthUserId: "admin-auth-1",
    now: "2026-05-10T13:00:00.000Z",
  });

  assert.equal(request.ok, true);
  if (request.ok) {
    assert.equal(request.signoff.outcome, "completed");
    assert.equal(request.signoff.label, "Completed");
    assert.equal(request.signoff.signedOffAt, "2026-05-10T13:00:00.000Z");
    assert.equal(request.notePayload.noteType, "decision");
    assert.match(request.notePayload.note, /Activation run signoff: Completed/);
    assert.equal(request.notePayload.metadata.source, "lootbox_sponsor_activation_run_signoff");
    assert.equal(request.notePayload.metadata.noBillingAction, true);
    assert.equal(request.notePayload.metadata.noPayoutAction, true);
    assert.equal(request.notePayload.metadata.noRewardInventoryAction, true);
    assert.equal(request.notePayload.metadata.noPublicLaunchAction, true);
    assert.equal(request.audit.summary, "Signed off activation run as completed.");
  }

  assert.deepEqual(missingRun, {
    ok: false,
    error: "Stage an activation run before signing off the manual outcome.",
  });
  assert.deepEqual(missingNote, {
    ok: false,
    error: "Add a short outcome note before signing off the activation run.",
  });
});

test("buildLootboxSponsorActivationRunSignoffMetadataPatch preserves metadata and stores the outcome", () => {
  const metadata = buildLootboxSponsorActivationRunSignoffMetadataPatch({
    existingMetadata: {
      source: "existing",
      lastActivationRun: {
        runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
        title: "Atlas Labs activation run",
      },
      activationRunStepStates: {
        monitor_launch: {
          runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
          state: "done",
          label: "Monitor launch window",
          updatedAt: "2026-05-10T12:45:00.000Z",
          updatedByAuthUserId: "admin-auth-1",
          noteId: "note-step",
        },
      },
    },
    signoff: {
      runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
      outcome: "needs_follow_up",
      label: "Needs follow-up",
      signedOffAt: "2026-05-10T13:00:00.000Z",
      signedOffByAuthUserId: "admin-auth-2",
      note: "Sponsor wants a second push tomorrow.",
      followUpAt: "2026-05-11T09:00:00.000Z",
    },
    noteId: "note-signoff",
  });

  assert.equal(metadata.source, "existing");
  assert.equal(metadata.activationRunState, "needs_follow_up");
  assert.deepEqual(metadata.lastActivationRunSignoff, {
    runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
    outcome: "needs_follow_up",
    label: "Needs follow-up",
    signedOffAt: "2026-05-10T13:00:00.000Z",
    signedOffByAuthUserId: "admin-auth-2",
    noteId: "note-signoff",
    note: "Sponsor wants a second push tomorrow.",
    followUpAt: "2026-05-11T09:00:00.000Z",
  });
  assert.deepEqual(metadata.activationRunStepStates, {
    monitor_launch: {
      runId: "sponsor-activation:package-ready:2026-05-10T12:00:00.000Z",
      state: "done",
      label: "Monitor launch window",
      updatedAt: "2026-05-10T12:45:00.000Z",
      updatedByAuthUserId: "admin-auth-1",
      noteId: "note-step",
    },
  });
});
