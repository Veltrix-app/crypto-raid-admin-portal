import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxSponsorActivationHandoffRead,
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
