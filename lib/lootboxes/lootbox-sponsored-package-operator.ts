import type { LootboxSponsoredPackageActionPack } from "./lootbox-sponsored-package-actions";
import type {
  LootboxSponsorPackageCreatePayload,
  LootboxSponsorPackageNotePayload,
  LootboxSponsorPackageStatus,
} from "./lootbox-sponsored-package-persistence";

type CampaignContext = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  visibility: string;
  rewardPoolAmount?: number;
  participants?: number;
  completionRate?: number;
};

type ProjectContext = {
  id: string;
  name: string;
  slug: string;
};

type SponsorPackageCreateRequestResult =
  | { ok: true; payload: LootboxSponsorPackageCreatePayload }
  | { ok: false; error: string };

export type LootboxSponsorPackageDetailPackageRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  package_tier: string | null;
  status: string | null;
  sponsor_name: string | null;
  sponsor_contact: string | null;
  sponsor_budget: number | null;
  currency: string | null;
  owner_auth_user_id: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  package_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_by_auth_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LootboxSponsorPackageDetailNoteRow = {
  id: string;
  sponsor_package_id: string;
  note_type: string;
  note: string;
  metadata: Record<string, unknown> | null;
  follow_up_at: string | null;
  created_by_auth_user_id: string | null;
  created_at: string | null;
};

export type LootboxSponsorPackageDetailAuditRow = {
  id: string;
  auth_user_id: string | null;
  source_table: string | null;
  source_id: string | null;
  action: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

export type LootboxSponsorPackageTimelineItem = {
  id: string;
  kind: "note" | "audit";
  tone: "default" | "success" | "warning" | "danger";
  title: string;
  detail: string;
  actorAuthUserId: string | null;
  followUpAt: string | null;
  createdAt: string | null;
};

export type LootboxSponsorActivationRunHistoryItem = {
  runId: string;
  title: string;
  state: "staged";
  stagedAt: string;
  stagedByAuthUserId: string | null;
  noteId: string | null;
  auditId: string | null;
  routeHref: string | null;
  nextOperatorMove: string | null;
  guardrailCount: number;
  steps: LootboxSponsorActivationRunStep[];
  signoff: LootboxSponsorActivationRunSignoff | null;
};

export type LootboxSponsorPackageCrmChecklistItem = {
  id: "sponsor_name" | "sponsor_contact" | "deal_budget" | "owner" | "follow_up";
  label: string;
  state: "ready" | "missing";
  detail: string;
};

export type LootboxSponsorPackageCrmControls = {
  canProgress: boolean;
  nextStatus: LootboxSponsorPackageStatus | null;
  nextActionLabel: string;
  reason: string;
  blockingFields: string[];
};

export type LootboxSponsorActivationShardPool = {
  id: string;
  campaignId: string | null;
  status: string;
  poolSize: number;
  remainingShards: number;
};

export type LootboxSponsorActivationState =
  | "ready"
  | "setup_needed"
  | "locked"
  | "closed";

export type LootboxSponsorActivationChecklistItem = {
  id: "sponsor_win" | "campaign_route" | "shard_pool" | "reward_budget" | "owner";
  label: string;
  state: "ready" | "missing" | "locked";
  detail: string;
};

export type LootboxSponsorActivationExecutionStepId =
  | "stage_activation_brief"
  | "confirm_campaign_route"
  | "verify_shard_pool"
  | "lock_reward_budget"
  | "assign_owner"
  | "monitor_launch";

export type LootboxSponsorActivationExecutionStep = {
  id: LootboxSponsorActivationExecutionStepId;
  label: string;
  state: "ready" | "action_needed" | "blocked";
  detail: string;
};

export type LootboxSponsorActivationRunStepState = "pending" | "done" | "blocked";

export type LootboxSponsorActivationRunStep = {
  id: LootboxSponsorActivationExecutionStepId;
  label: string;
  state: LootboxSponsorActivationRunStepState;
  detail: string;
  runId: string | null;
  noteId: string | null;
  updatedAt: string | null;
  updatedByAuthUserId: string | null;
  note: string | null;
};

export type LootboxSponsorActivationRunStepUpdate = {
  id: LootboxSponsorActivationExecutionStepId;
  label: string;
  state: Exclude<LootboxSponsorActivationRunStepState, "pending">;
  updatedAt: string;
  updatedByAuthUserId: string;
  runId: string;
  note: string | null;
};

export type LootboxSponsorActivationRunSignoffOutcome =
  | "completed"
  | "needs_follow_up"
  | "paused";

export type LootboxSponsorActivationRunSignoff = {
  runId: string;
  outcome: LootboxSponsorActivationRunSignoffOutcome;
  label: string;
  signedOffAt: string;
  signedOffByAuthUserId: string;
  note: string;
  followUpAt: string | null;
  noteId?: string | null;
};

export type LootboxSponsorPerformanceState =
  | "report_ready"
  | "warming_up"
  | "setup_needed"
  | "closed";

export type LootboxSponsorPerformanceKpi = {
  id: "shards_issued" | "depletion" | "participants" | "completion";
  label: string;
  value: string;
  detail: string;
  tone: "success" | "warning" | "default";
};

export type LootboxSponsorRenewalState = "ready" | "watch" | "not_ready" | "closed";

export type LootboxSponsorRenewalFollowUpUrgency =
  | "overdue"
  | "due_soon"
  | "scheduled"
  | "unscheduled"
  | "closed";

export type LootboxSponsorRenewalPlaybookStep = {
  id: "send_performance_update" | "pitch_next_package" | "schedule_follow_up";
  label: string;
  state: "ready" | "action_needed" | "blocked";
  detail: string;
};

const sponsorCrmStages = [
  {
    id: "ready_to_pitch",
    label: "Ready to pitch",
    detail: "Packet is prepared for sponsor outreach.",
  },
  {
    id: "pitched",
    label: "Pitched",
    detail: "Sponsor has received the package.",
  },
  {
    id: "negotiating",
    label: "Negotiating",
    detail: "Terms, timing or package value are being discussed.",
  },
  {
    id: "won",
    label: "Won",
    detail: "Sponsor package is ready for fulfillment planning.",
  },
] as const;

const sponsorActivationRunSteps = [
  {
    id: "stage_activation_brief",
    label: "Stage activation brief",
    detail: "Copy the sponsor activation brief into the internal launch thread.",
  },
  {
    id: "confirm_campaign_route",
    label: "Confirm campaign route",
    detail: "Verify the campaign is public and active or scheduled before launch.",
  },
  {
    id: "verify_shard_pool",
    label: "Verify shard pool",
    detail: "Confirm the sponsored shard pool is active, finite and has remaining shards.",
  },
  {
    id: "lock_reward_budget",
    label: "Lock reward budget",
    detail: "Confirm visible reward budget and fulfillment posture before public pressure.",
  },
  {
    id: "assign_owner",
    label: "Assign operator owner",
    detail: "Keep one internal owner accountable for sponsor launch and follow-up.",
  },
  {
    id: "monitor_launch",
    label: "Monitor launch window",
    detail: "Watch first-hour shard depletion, member activity and support pressure.",
  },
] satisfies Array<{
  id: LootboxSponsorActivationExecutionStepId;
  label: string;
  detail: string;
}>;

const sponsorActivationRunSignoffOutcomes = [
  {
    id: "completed",
    label: "Completed",
    activationRunState: "completed",
    detail: "The manual activation run was delivered and is ready for performance review.",
  },
  {
    id: "needs_follow_up",
    label: "Needs follow-up",
    activationRunState: "needs_follow_up",
    detail: "The run created a follow-up action before renewal or closure.",
  },
  {
    id: "paused",
    label: "Paused",
    activationRunState: "paused",
    detail: "The run was paused before completion and needs operator review.",
  },
] satisfies Array<{
  id: LootboxSponsorActivationRunSignoffOutcome;
  label: string;
  activationRunState: string;
  detail: string;
}>;

export function buildLootboxSponsorPackageCreateRequest(params: {
  pack: LootboxSponsoredPackageActionPack;
  campaign: CampaignContext | null | undefined;
  project: ProjectContext | null | undefined;
}): SponsorPackageCreateRequestResult {
  const { pack, campaign, project } = params;

  if (!campaign || campaign.id !== pack.campaignId) {
    return {
      ok: false,
      error: "Campaign context is required before saving a sponsor package.",
    };
  }

  if (!project || project.id !== campaign.projectId) {
    return {
      ok: false,
      error: "Project context does not match the campaign.",
    };
  }

  return {
    ok: true,
    payload: {
      projectId: project.id,
      campaignId: campaign.id,
      packageTier: pack.packageTier,
      status: getCreateStatus(pack),
      sponsorName: null,
      sponsorContact: null,
      sponsorBudget: 0,
      currency: "USD",
      ownerAuthUserId: null,
      followUpAt: null,
      packageSnapshot: {
        source: "lootbox_sponsor_action_desk",
        exportTitle: pack.exportTitle,
        projectName: project.name,
        projectSlug: project.slug,
        campaignTitle: campaign.title,
        campaignStatus: campaign.status,
        campaignVisibility: campaign.visibility,
        packageTier: pack.packageTier,
        packageStatus: pack.status,
        actionState: pack.actionState,
        rewardPoolAmount: campaign.rewardPoolAmount ?? 0,
        participants: campaign.participants ?? 0,
        completionRate: campaign.completionRate ?? 0,
        sponsorBriefText: pack.sponsorBriefText,
        auditNoteTemplate: pack.auditNoteTemplate,
        actions: pack.actions,
        guardrails: [
          "No reward inventory is created by saving this sponsor package.",
          "No lootbox open, payout, payment or billing action is triggered.",
          "Operator follow-up remains human-owned until explicit fulfillment controls exist.",
        ],
      },
      metadata: {
        source: "lootbox_sponsor_action_desk",
        actionState: pack.actionState,
        packageStatus: pack.status,
        actionIds: pack.actions.map((action) => action.id),
      },
    },
  };
}

export function buildLootboxSponsorPackageDetailRead(params: {
  packageRow: LootboxSponsorPackageDetailPackageRow;
  notes: LootboxSponsorPackageDetailNoteRow[];
  auditEvents: LootboxSponsorPackageDetailAuditRow[];
}) {
  const activationRuns = buildSponsorActivationRunHistory(params);
  const timeline = [
    ...params.notes.map(toNoteTimelineItem),
    ...params.auditEvents.map(toAuditTimelineItem),
  ].sort(compareTimelineItems);

  return {
    package: params.packageRow,
    notes: params.notes,
    auditEvents: params.auditEvents,
    timeline,
    summary: {
      notes: params.notes.length,
      auditEvents: params.auditEvents.length,
      timelineItems: timeline.length,
      nextAction: getDetailNextAction(params.packageRow),
      activationRuns: activationRuns.length,
      latestActivationRunAt: activationRuns[0]?.stagedAt ?? null,
      nextActivationRunMove: activationRuns[0]?.nextOperatorMove ?? null,
    },
    activationRuns,
  };
}

export type LootboxSponsorPackageDetailRead = ReturnType<
  typeof buildLootboxSponsorPackageDetailRead
>;

export function buildLootboxSponsorActivationHandoffRead(params: {
  packages: LootboxSponsorPackageDetailPackageRow[];
  campaigns: CampaignContext[];
  projects: ProjectContext[];
  shardPools: LootboxSponsorActivationShardPool[];
  now?: string | Date;
}) {
  const now = toReferenceDate(params.now);
  const handoffs = params.packages
    .map((row) =>
      buildSponsorActivationHandoff({
        row,
        campaigns: params.campaigns,
        projects: params.projects,
        shardPools: params.shardPools,
        now,
      })
    )
    .sort(compareSponsorActivationHandoffs);
  const businessCockpit = buildSponsorBusinessCockpit(handoffs);
  const billingReadiness = buildSponsorBillingReadiness(handoffs);
  const dealClosePack = buildSponsorDealClosePack(handoffs);

  return {
    summary: {
      total: handoffs.length,
      ready: handoffs.filter((handoff) => handoff.activationState === "ready").length,
      setupNeeded: handoffs.filter((handoff) => handoff.activationState === "setup_needed").length,
      locked: handoffs.filter((handoff) => handoff.activationState === "locked").length,
      closed: handoffs.filter((handoff) => handoff.activationState === "closed").length,
      renewalReady: handoffs.filter((handoff) => handoff.renewal.state === "ready").length,
      renewalWatch: handoffs.filter((handoff) => handoff.renewal.state === "watch").length,
      stagedRuns: handoffs.filter((handoff) => handoff.activationRun.state === "staged").length,
      signedOffRuns: handoffs.filter((handoff) => Boolean(handoff.activationRun.signoff)).length,
      manualOnly: true as const,
    },
    handoffs,
    focus:
      handoffs.find((handoff) => handoff.activationState === "ready") ??
      handoffs.find((handoff) => handoff.activationState === "setup_needed") ??
      handoffs[0] ??
      null,
    businessCockpit,
    billingReadiness,
    dealClosePack,
    revenueCommand: buildSponsorRevenueCommand({
      businessCockpit,
      billingReadiness,
      dealClosePack,
    }),
    guardrails: [
      "Activation handoff does not create billing, payouts or reward inventory.",
      "Operators still own sponsor follow-up, pool setup and fulfillment decisions.",
      "Shard boosts stay finite and campaign-scoped before any public promise is made.",
    ],
  };
}

export type LootboxSponsorActivationHandoffRead = ReturnType<
  typeof buildLootboxSponsorActivationHandoffRead
>;
export type LootboxSponsorActivationHandoff =
  LootboxSponsorActivationHandoffRead["handoffs"][number];

export type LootboxSponsorActivationRun = {
  runId: string;
  sponsorPackageId: string;
  campaignId: string | null;
  projectId: string | null;
  routeHref: string;
  title: string;
  stagedAt: string;
  nextOperatorMoves: string[];
  guardrails: string[];
};

export type LootboxSponsorActivationRunRequestResult =
  | {
      ok: true;
      activationRun: LootboxSponsorActivationRun;
      notePayload: LootboxSponsorPackageNotePayload;
      audit: {
        action: "lootbox_sponsor_activation_run_staged";
        summary: string;
        metadata: Record<string, unknown>;
      };
    }
  | { ok: false; error: string; blockedBy: string[] };

export function buildLootboxSponsorActivationRunRequest(params: {
  handoff: LootboxSponsorActivationHandoff;
  now?: string | Date;
}): LootboxSponsorActivationRunRequestResult {
  if (!params.handoff.execution.canLaunch || params.handoff.activationState !== "ready") {
    return {
      ok: false,
      error: "Activation run can only be staged when the sponsor handoff is ready.",
      blockedBy: params.handoff.execution.blockedBy.length
        ? params.handoff.execution.blockedBy
        : ["Activation state"],
    };
  }

  const stagedAt = toReferenceDate(params.now).toISOString();
  const runId = `sponsor-activation:${params.handoff.packageId}:${stagedAt}`;
  const guardrails = [
    "Manual-only activation run.",
    "No billing action was triggered.",
    "No payout action was triggered.",
    "No reward inventory was created or mutated.",
    "No public campaign launch was triggered.",
  ];
  const nextOperatorMoves = [...params.handoff.execution.runbook];
  const metrics = {
    activePools: params.handoff.metrics.activePools,
    linkedPools: params.handoff.metrics.linkedPools,
    poolSize: params.handoff.metrics.poolSize,
    remainingShards: params.handoff.metrics.remainingShards,
    rewardBudget: params.handoff.metrics.rewardBudget,
    participants: params.handoff.metrics.participants,
    completionRate: params.handoff.metrics.completionRate,
  };
  const metadata = {
    source: "lootbox_sponsor_activation_run",
    runId,
    stagedAt,
    sponsorPackageId: params.handoff.packageId,
    campaignId: params.handoff.campaignId,
    projectId: params.handoff.projectId,
    routeHref: params.handoff.routeHref,
    activationState: params.handoff.activationState,
    packageTier: params.handoff.packageTier,
    sponsorName: params.handoff.sponsorName,
    campaignTitle: params.handoff.campaignTitle,
    executionPrimaryStepId: params.handoff.execution.primaryStepId,
    executionStepIds: params.handoff.execution.steps.map((step) => step.id),
    nextOperatorMoves,
    metrics,
    guardrails,
    noBillingAction: true,
    noPayoutAction: true,
    noRewardInventoryAction: true,
    noPublicLaunchAction: true,
  };

  return {
    ok: true,
    activationRun: {
      runId,
      sponsorPackageId: params.handoff.packageId,
      campaignId: params.handoff.campaignId,
      projectId: params.handoff.projectId,
      routeHref: params.handoff.routeHref,
      title: `${params.handoff.sponsorName} activation run`,
      stagedAt,
      nextOperatorMoves,
      guardrails,
    },
    notePayload: {
      noteType: "decision",
      note: buildSponsorActivationRunNote({
        handoff: params.handoff,
        nextOperatorMoves,
      }),
      followUpAt: null,
      metadata,
    },
    audit: {
      action: "lootbox_sponsor_activation_run_staged",
      summary: `Staged manual activation run for ${params.handoff.sponsorName}.`,
      metadata,
    },
  };
}

export function buildLootboxSponsorActivationRunMetadataPatch(params: {
  existingMetadata: Record<string, unknown> | null;
  activationRun: LootboxSponsorActivationRun;
  noteId: string;
  stagedByAuthUserId: string;
}) {
  const existing =
    params.existingMetadata && typeof params.existingMetadata === "object"
      ? params.existingMetadata
      : {};

  return {
    ...existing,
    activationRunState: "staged",
    lastActivationRun: {
      runId: params.activationRun.runId,
      title: params.activationRun.title,
      stagedAt: params.activationRun.stagedAt,
      sponsorPackageId: params.activationRun.sponsorPackageId,
      campaignId: params.activationRun.campaignId,
      projectId: params.activationRun.projectId,
      routeHref: params.activationRun.routeHref,
      noteId: params.noteId,
      stagedByAuthUserId: params.stagedByAuthUserId,
      guardrailCount: params.activationRun.guardrails.length,
    },
  };
}

export function buildLootboxSponsorActivationRunStepRequest(params: {
  packageRow: LootboxSponsorPackageDetailPackageRow;
  stepId: LootboxSponsorActivationExecutionStepId | string;
  state: Exclude<LootboxSponsorActivationRunStepState, "pending"> | string;
  note?: string | null;
  adminAuthUserId: string;
  now?: string | Date;
}):
  | {
      ok: true;
      step: LootboxSponsorActivationRunStepUpdate;
      notePayload: LootboxSponsorPackageNotePayload;
      audit: {
        action: "lootbox_sponsor_activation_run_step_updated";
        summary: string;
        metadata: Record<string, unknown>;
      };
    }
  | { ok: false; error: string } {
  const lastRun = readObject(params.packageRow.metadata?.lastActivationRun);
  const runId = readNonEmptyString(lastRun?.runId);
  if (!runId) {
    return {
      ok: false,
      error: "Stage an activation run before updating manual execution steps.",
    };
  }

  const stepDefinition = sponsorActivationRunSteps.find((step) => step.id === params.stepId);
  if (!stepDefinition) {
    return { ok: false, error: "Unsupported activation run step." };
  }

  if (params.state !== "done" && params.state !== "blocked") {
    return { ok: false, error: "Unsupported activation run step state." };
  }

  const note = normalizeStepNote(params.note);
  const updatedAt = toReferenceDate(params.now).toISOString();
  const step: LootboxSponsorActivationRunStepUpdate = {
    id: stepDefinition.id,
    label: stepDefinition.label,
    state: params.state,
    updatedAt,
    updatedByAuthUserId: params.adminAuthUserId,
    runId,
    note,
  };
  const guardrail =
    "Manual-only guardrail: this updates operator execution state only; no billing, payout, reward inventory or public launch was triggered.";
  const noteLines = [
    `Activation run step ${step.state}: ${step.label}.`,
    note,
    guardrail,
  ].filter((line): line is string => Boolean(line));
  const metadata = {
    source: "lootbox_sponsor_activation_run_step",
    runId,
    sponsorPackageId: params.packageRow.id,
    campaignId: params.packageRow.campaign_id,
    projectId: params.packageRow.project_id,
    routeHref: readNonEmptyString(lastRun?.routeHref),
    stepId: step.id,
    stepLabel: step.label,
    stepState: step.state,
    updatedAt,
    note,
    noBillingAction: true,
    noPayoutAction: true,
    noRewardInventoryAction: true,
    noPublicLaunchAction: true,
  };

  return {
    ok: true,
    step,
    notePayload: {
      noteType: "status_change",
      note: noteLines.join("\n"),
      followUpAt: null,
      metadata,
    },
    audit: {
      action: "lootbox_sponsor_activation_run_step_updated",
      summary: `Marked activation run step ${step.label} as ${step.state}.`,
      metadata,
    },
  };
}

export function buildLootboxSponsorActivationRunStepMetadataPatch(params: {
  existingMetadata: Record<string, unknown> | null;
  step: LootboxSponsorActivationRunStepUpdate;
  noteId: string;
}): Record<string, unknown> & { activationRunStepStates: Record<string, unknown> } {
  const existing =
    params.existingMetadata && typeof params.existingMetadata === "object"
      ? params.existingMetadata
      : {};
  const previousStepStates = readObject(existing.activationRunStepStates) ?? {};

  return {
    ...existing,
    activationRunStepStates: {
      ...previousStepStates,
      [params.step.id]: {
        runId: params.step.runId,
        state: params.step.state,
        label: params.step.label,
        updatedAt: params.step.updatedAt,
        updatedByAuthUserId: params.step.updatedByAuthUserId,
        noteId: params.noteId,
        ...(params.step.note ? { note: params.step.note } : {}),
      },
    },
  };
}

export function buildLootboxSponsorActivationRunSignoffRequest(params: {
  packageRow: LootboxSponsorPackageDetailPackageRow;
  outcome: LootboxSponsorActivationRunSignoffOutcome | string;
  note: string | null | undefined;
  followUpAt?: string | null;
  adminAuthUserId: string;
  now?: string | Date;
}):
  | {
      ok: true;
      signoff: LootboxSponsorActivationRunSignoff;
      notePayload: LootboxSponsorPackageNotePayload;
      audit: {
        action: "lootbox_sponsor_activation_run_signed_off";
        summary: string;
        metadata: Record<string, unknown>;
      };
    }
  | { ok: false; error: string } {
  const lastRun = readObject(params.packageRow.metadata?.lastActivationRun);
  const runId = readNonEmptyString(lastRun?.runId);
  if (!runId) {
    return {
      ok: false,
      error: "Stage an activation run before signing off the manual outcome.",
    };
  }

  const outcome = sponsorActivationRunSignoffOutcomes.find(
    (item) => item.id === params.outcome
  );
  if (!outcome) {
    return { ok: false, error: "Unsupported activation run signoff outcome." };
  }

  const note = normalizeSignoffNote(params.note);
  if (!note) {
    return {
      ok: false,
      error: "Add a short outcome note before signing off the activation run.",
    };
  }

  const followUpAt = normalizeOptionalIsoDate(params.followUpAt);
  if (followUpAt === "invalid") {
    return { ok: false, error: "Follow-up date is invalid." };
  }

  const signedOffAt = toReferenceDate(params.now).toISOString();
  const signoff: LootboxSponsorActivationRunSignoff = {
    runId,
    outcome: outcome.id,
    label: outcome.label,
    signedOffAt,
    signedOffByAuthUserId: params.adminAuthUserId,
    note,
    followUpAt,
  };
  const guardrail =
    "Manual-only guardrail: this signs off operator outcome only; no billing, payout, reward inventory or public launch was triggered.";
  const metadata = {
    source: "lootbox_sponsor_activation_run_signoff",
    runId,
    sponsorPackageId: params.packageRow.id,
    campaignId: params.packageRow.campaign_id,
    projectId: params.packageRow.project_id,
    routeHref: readNonEmptyString(lastRun?.routeHref),
    outcome: signoff.outcome,
    outcomeLabel: signoff.label,
    signedOffAt,
    note,
    followUpAt,
    noBillingAction: true,
    noPayoutAction: true,
    noRewardInventoryAction: true,
    noPublicLaunchAction: true,
  };

  return {
    ok: true,
    signoff,
    notePayload: {
      noteType: "decision",
      note: [`Activation run signoff: ${signoff.label}.`, note, guardrail].join("\n"),
      followUpAt,
      metadata,
    },
    audit: {
      action: "lootbox_sponsor_activation_run_signed_off",
      summary: `Signed off activation run as ${signoff.outcome}.`,
      metadata,
    },
  };
}

export function buildLootboxSponsorActivationRunSignoffMetadataPatch(params: {
  existingMetadata: Record<string, unknown> | null;
  signoff: LootboxSponsorActivationRunSignoff;
  noteId: string;
}): Record<string, unknown> & { lastActivationRunSignoff: Record<string, unknown> } {
  const existing =
    params.existingMetadata && typeof params.existingMetadata === "object"
      ? params.existingMetadata
      : {};

  return {
    ...existing,
    activationRunState: params.signoff.outcome,
    lastActivationRunSignoff: {
      runId: params.signoff.runId,
      outcome: params.signoff.outcome,
      label: params.signoff.label,
      signedOffAt: params.signoff.signedOffAt,
      signedOffByAuthUserId: params.signoff.signedOffByAuthUserId,
      noteId: params.noteId,
      note: params.signoff.note,
      followUpAt: params.signoff.followUpAt,
    },
  };
}

export function buildLootboxSponsorPackageCrmRead(
  row: LootboxSponsorPackageDetailPackageRow
) {
  const status = typeof row.status === "string" && row.status ? row.status : "draft";
  const stageIndex = getCrmStageIndex(status);
  const sponsorName = normalizeText(row.sponsor_name) ?? "Unnamed sponsor";
  const sponsorContact = normalizeText(row.sponsor_contact) ?? "No contact saved";
  const budget = Number(row.sponsor_budget ?? 0);
  const budgetReady = Number.isFinite(budget) && budget > 0;
  const checklist: LootboxSponsorPackageCrmChecklistItem[] = [
    {
      id: "sponsor_name",
      label: "Sponsor name",
      state: normalizeText(row.sponsor_name) ? "ready" : "missing",
      detail: normalizeText(row.sponsor_name) ?? "Add the sponsor or buyer name.",
    },
    {
      id: "sponsor_contact",
      label: "Sponsor contact",
      state: normalizeText(row.sponsor_contact) ? "ready" : "missing",
      detail: normalizeText(row.sponsor_contact) ?? "Add email, Telegram or contact route.",
    },
    {
      id: "deal_budget",
      label: "Deal value",
      state: budgetReady ? "ready" : "missing",
      detail: budgetReady ? formatCrmBudget(row.sponsor_budget, row.currency) : "Set the expected package budget.",
    },
    {
      id: "owner",
      label: "Owner",
      state: row.owner_auth_user_id ? "ready" : "missing",
      detail: row.owner_auth_user_id ? "Operator owner is assigned." : "Claim an internal owner.",
    },
    {
      id: "follow_up",
      label: "Follow-up date",
      state: row.follow_up_at ? "ready" : "missing",
      detail: row.follow_up_at ? "Next follow-up is scheduled." : "Set the next sponsor follow-up.",
    },
  ];
  const missingFields = checklist
    .filter((item) => item.state === "missing")
    .map((item) => item.label);

  return {
    identity: {
      sponsorName,
      sponsorContact,
      budgetLabel: formatCrmBudget(row.sponsor_budget, row.currency),
      lastContactedAt: row.last_contacted_at,
      followUpAt: row.follow_up_at,
    },
    stage: {
      id: status,
      label: getCrmStageLabel(status),
      detail: getCrmStageDetail(status),
      index: stageIndex,
      count: sponsorCrmStages.length,
      tone: getCrmStageTone(status, missingFields),
      stages: sponsorCrmStages.map((stage, index) => ({
        ...stage,
        state:
          index < stageIndex
            ? ("complete" as const)
            : index === stageIndex
              ? ("current" as const)
              : ("upcoming" as const),
      })),
    },
    checklist,
    missingFields,
    primaryAction: getCrmPrimaryAction(status, missingFields),
    controls: buildCrmControls(status, checklist),
  };
}

export type LootboxSponsorPackageCrmRead = ReturnType<
  typeof buildLootboxSponsorPackageCrmRead
>;

function buildSponsorActivationHandoff(params: {
  row: LootboxSponsorPackageDetailPackageRow;
  campaigns: CampaignContext[];
  projects: ProjectContext[];
  shardPools: LootboxSponsorActivationShardPool[];
  now: Date;
}) {
  const { row } = params;
  const status = normalizeText(row.status) ?? "draft";
  const campaign = params.campaigns.find((item) => item.id === row.campaign_id) ?? null;
  const project =
    params.projects.find((item) => item.id === row.project_id || item.id === campaign?.projectId) ??
    null;
  const linkedPools = params.shardPools.filter((pool) => pool.campaignId === row.campaign_id);
  const activePools = linkedPools.filter((pool) =>
    ["active", "scheduled"].includes(pool.status)
  );
  const poolSize = linkedPools.reduce((sum, pool) => sum + Math.max(0, Number(pool.poolSize)), 0);
  const remainingShards = linkedPools.reduce(
    (sum, pool) => sum + Math.max(0, Number(pool.remainingShards)),
    0
  );
  const rewardBudget = Math.max(0, Number(campaign?.rewardPoolAmount ?? 0));
  const sponsorWon = status === "won";
  const closed = status === "lost" || status === "archived";
  const campaignRouteReady =
    Boolean(campaign) &&
    campaign?.visibility === "public" &&
    ["active", "scheduled"].includes(campaign.status);
  const shardPoolReady = activePools.length > 0 && poolSize > 0;
  const rewardBudgetReady = rewardBudget > 0;
  const ownerReady = Boolean(row.owner_auth_user_id);
  const checklist: LootboxSponsorActivationChecklistItem[] = [
    {
      id: "sponsor_win",
      label: "Sponsor win",
      state: sponsorWon ? "ready" : closed ? "locked" : "missing",
      detail: sponsorWon
        ? "Sponsor package is marked won and can enter activation planning."
        : closed
          ? "Sponsor route is closed."
          : "Win the sponsor package before activation starts.",
    },
    {
      id: "campaign_route",
      label: "Campaign route",
      state: campaignRouteReady ? "ready" : "missing",
      detail: campaignRouteReady
        ? "Campaign is public and active or scheduled."
        : "Move the campaign to public active or scheduled before launch.",
    },
    {
      id: "shard_pool",
      label: "Shard pool",
      state: shardPoolReady ? "ready" : "missing",
      detail: shardPoolReady
        ? `${activePools.length} active or scheduled pool covers ${poolSize.toLocaleString("en-US")} shards.`
        : "Attach an active shard pool before activation.",
    },
    {
      id: "reward_budget",
      label: "Reward budget",
      state: rewardBudgetReady ? "ready" : "missing",
      detail: rewardBudgetReady
        ? `${rewardBudget.toLocaleString("en-US")} reward budget is visible.`
        : "Add a visible reward budget before sponsor activation.",
    },
    {
      id: "owner",
      label: "Owner",
      state: ownerReady ? "ready" : "missing",
      detail: ownerReady ? "Internal owner is assigned." : "Assign an operator owner.",
    },
  ];
  const activationState = getSponsorActivationState({
    closed,
    sponsorWon,
    campaignRouteReady,
    shardPoolReady,
    rewardBudgetReady,
    ownerReady,
  });
  const execution = buildSponsorActivationExecution({
    activationState,
    checklist,
  });
  const activationRun = buildSponsorActivationRunSummary({
    metadata: row.metadata,
    canStage: execution.canLaunch,
  });
  const activationRunSignoff = activationRun.runId
    ? buildSponsorActivationRunSignoff(row.metadata, activationRun.runId)
    : null;
  const projectName =
    project?.name ?? getSnapshotText(row, "projectName", row.project_id ?? "Workspace");
  const campaignTitle =
    campaign?.title ?? getSnapshotText(row, "campaignTitle", row.campaign_id ?? "Campaign");
  const sponsorName = normalizeText(row.sponsor_name) ?? "Unnamed sponsor";
  const packageTier = normalizeText(row.package_tier) ?? "starter";
  const performance = buildSponsorPerformanceSnapshot({
    activationState,
    signoff: activationRunSignoff,
    sponsorName,
    campaignTitle,
    poolSize,
    remainingShards,
    participants: Math.max(0, Number(campaign?.participants ?? 0)),
    completionRate: Math.max(0, Number(campaign?.completionRate ?? 0)),
  });
  const renewal = buildSponsorRenewalPipeline({
    activationState,
    performance,
    signoff: activationRunSignoff,
    sponsorName,
    campaignTitle,
    packageTier,
    followUpAt: row.follow_up_at,
    now: params.now,
  });

  return {
    packageId: row.id,
    campaignId: row.campaign_id,
    projectId: row.project_id ?? campaign?.projectId ?? null,
    packageTier,
    status,
    activationState,
    tone: getSponsorActivationTone(activationState),
    projectName,
    campaignTitle,
    sponsorName,
    sponsorContact: normalizeText(row.sponsor_contact) ?? null,
    budgetLabel: formatCrmBudget(row.sponsor_budget, row.currency),
    dealValue: Math.max(0, Number(row.sponsor_budget ?? 0)),
    nextAction: getSponsorActivationNextAction(activationState, checklist),
    routeHref: row.campaign_id ? `/campaigns/${row.campaign_id}` : "/campaigns",
    metrics: {
      linkedPools: linkedPools.length,
      activePools: activePools.length,
      poolSize,
      remainingShards,
      rewardBudget,
      participants: Math.max(0, Number(campaign?.participants ?? 0)),
      completionRate: Math.max(0, Number(campaign?.completionRate ?? 0)),
    },
    checklist,
    execution,
    activationRun,
    performance,
    renewal,
    brief: {
      title: `${sponsorName} x ${projectName} activation handoff`,
      body: buildSponsorActivationBrief({
        sponsorName,
        projectName,
        campaignTitle,
        packageTier,
        budgetLabel: formatCrmBudget(row.sponsor_budget, row.currency),
        poolSize,
        remainingShards,
        rewardBudget,
        nextAction: getSponsorActivationNextAction(activationState, checklist),
      }),
    },
  };
}

function buildSponsorRevenueCommand({
  businessCockpit,
  billingReadiness,
  dealClosePack,
}: {
  businessCockpit: ReturnType<typeof buildSponsorBusinessCockpit>;
  billingReadiness: ReturnType<typeof buildSponsorBillingReadiness>;
  dealClosePack: ReturnType<typeof buildSponsorDealClosePack>;
}) {
  const focus =
    dealClosePack.focus?.state === "ready"
      ? dealClosePack.focus
      : billingReadiness.focus?.readiness === "invoice_ready"
        ? billingReadiness.focus
        : businessCockpit.focus ?? dealClosePack.focus ?? billingReadiness.focus ?? null;

  return {
    summary: {
      pipelineValue: businessCockpit.summary.totalValue,
      invoiceReadyValue: billingReadiness.summary.invoiceReadyValue,
      highPriority: businessCockpit.summary.highPriority,
      invoiceReady: billingReadiness.summary.invoiceReady,
      closeReady: dealClosePack.summary.ready,
      copyBlocks: dealClosePack.summary.copyBlocks,
      setupPressure: Math.max(
        billingReadiness.summary.needsFinanceSetup,
        dealClosePack.summary.needsSetup
      ),
      manualOnly: true as const,
      topNextAction:
        dealClosePack.focus?.state === "ready"
          ? dealClosePack.focus.nextAction
          : billingReadiness.focus?.nextAction ??
            businessCockpit.summary.topNextAction,
    },
    focus,
    lanes: [
      {
        id: "business" as const,
        label: "Business priority",
        detail: businessCockpit.summary.topNextAction,
        count: businessCockpit.summary.highPriority,
        value: businessCockpit.summary.totalValue,
        tone: businessCockpit.summary.highPriority > 0 ? ("warning" as const) : ("success" as const),
        routeHref: businessCockpit.focus?.routeHref ?? "/lootboxes",
      },
      {
        id: "finance" as const,
        label: "Finance readiness",
        detail: billingReadiness.summary.topNextAction,
        count: billingReadiness.summary.invoiceReady,
        value: billingReadiness.summary.invoiceReadyValue,
        tone: billingReadiness.summary.invoiceReady > 0 ? ("success" as const) : ("warning" as const),
        routeHref: billingReadiness.focus?.routeHref ?? "/lootboxes",
      },
      {
        id: "close_pack" as const,
        label: "Close pack",
        detail: dealClosePack.summary.topNextAction,
        count: dealClosePack.summary.ready,
        value: dealClosePack.summary.copyBlocks,
        tone: dealClosePack.summary.ready > 0 ? ("success" as const) : ("warning" as const),
        routeHref: dealClosePack.focus?.routeHref ?? "/lootboxes",
      },
    ],
  };
}

function buildSponsorDealClosePack(
  handoffs: ReturnType<typeof buildSponsorActivationHandoff>[]
) {
  const packs = handoffs.map(toSponsorDealClosePack).sort(compareDealClosePacks);
  const readyPacks = packs.filter((pack) => pack.state === "ready");
  const setupPacks = packs.filter((pack) => pack.state === "needs_setup");
  const watchPacks = packs.filter((pack) => pack.state === "watch");
  const focus = readyPacks[0] ?? setupPacks[0] ?? watchPacks[0] ?? packs[0] ?? null;

  return {
    summary: {
      total: packs.length,
      ready: readyPacks.length,
      needsSetup: setupPacks.length,
      watch: watchPacks.length,
      copyBlocks: readyPacks.reduce(
        (sum, pack) => sum + pack.blocks.filter((block) => block.enabled).length,
        0
      ),
      manualOnly: true as const,
      topNextAction:
        focus?.nextAction ?? "Save sponsor packages before creating a close pack.",
    },
    focus,
    packs,
    guardrails: [
      "Close packs are copy-only and do not create invoices, payment links or payouts.",
      "Finance prep stays disabled until sponsor contact, deal value and delivery signoff are ready.",
      "Internal proof is a human handoff for ops and finance, not an automated fulfillment event.",
    ],
  };
}

function toSponsorDealClosePack(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  const closed = ["lost", "blocked", "archived"].includes(handoff.status);
  const won = handoff.status === "won";
  const deliverySignedOff = handoff.activationRun.signoff?.outcome === "completed";
  const blockers = closed
    ? []
    : won
      ? [
          handoff.sponsorContact ? null : "Sponsor contact",
          handoff.dealValue > 0 ? null : "Deal value",
          deliverySignedOff ? null : "Delivery signoff",
        ].filter((item): item is string => Boolean(item))
      : ["Sponsor win"];
  const state = closed
    ? ("closed" as const)
    : !won
      ? ("watch" as const)
      : blockers.length === 0
        ? ("ready" as const)
        : ("needs_setup" as const);
  const enabled = state === "ready";
  const blocks = [
    {
      id: "sponsor_recap" as const,
      label: "Sponsor recap",
      title: `${handoff.sponsorName} sponsor close recap`,
      body: buildSponsorCloseRecapCopy(handoff),
      enabled,
      blockers,
    },
    {
      id: "finance_prep" as const,
      label: "Finance prep",
      title: `${handoff.sponsorName} finance invoice prep`,
      body: buildSponsorCloseFinanceCopy(handoff),
      enabled,
      blockers,
    },
    {
      id: "internal_proof" as const,
      label: "Internal proof",
      title: `${handoff.sponsorName} internal delivery proof`,
      body: buildSponsorCloseInternalProofCopy(handoff),
      enabled,
      blockers,
    },
  ];

  return {
    packageId: handoff.packageId,
    sponsorName: handoff.sponsorName,
    campaignTitle: handoff.campaignTitle,
    projectName: handoff.projectName,
    packageTier: handoff.packageTier,
    routeHref: handoff.routeHref,
    state,
    blockers,
    valueLabel: handoff.budgetLabel,
    dealValue: handoff.dealValue,
    signoffLabel: handoff.activationRun.signoff?.label ?? "No delivery signoff",
    score:
      Math.round(handoff.dealValue / 100) +
      (state === "ready" ? 120 : 0) +
      (state === "needs_setup" ? 40 : 0) +
      (state === "watch" ? 10 : 0),
    nextAction: getSponsorDealCloseNextAction({
      state,
      sponsorName: handoff.sponsorName,
      blockers,
    }),
    blocks,
  };
}

function getSponsorDealCloseNextAction({
  state,
  sponsorName,
  blockers,
}: {
  state: "ready" | "needs_setup" | "watch" | "closed";
  sponsorName: string;
  blockers: string[];
}) {
  if (state === "ready") {
    return `Copy close pack for ${sponsorName}: sponsor recap, finance prep and internal proof.`;
  }

  if (state === "needs_setup") {
    return `Resolve close blockers: ${blockers.join(", ")}.`;
  }

  if (state === "closed") {
    return "Keep closed sponsor package out of deal close.";
  }

  return "Move sponsor package to won before preparing close copy.";
}

function buildSponsorCloseRecapCopy(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  return [
    `${handoff.sponsorName} close recap for ${handoff.campaignTitle}:`,
    `Project: ${handoff.projectName}.`,
    `Package: ${handoff.packageTier}.`,
    `Deal value: ${handoff.budgetLabel}.`,
    `Sponsor contact: ${handoff.sponsorContact ?? "Missing"}.`,
    `Delivery signoff: ${handoff.activationRun.signoff?.label ?? "Not signed off"}.`,
    `Performance: ${handoff.performance.metrics.issuedShards.toLocaleString("en-US")} shards issued, ${handoff.performance.metrics.depletionRate}% depleted, ${handoff.metrics.participants.toLocaleString("en-US")} participants, ${handoff.metrics.completionRate}% completion.`,
    `Next sponsor move: ${handoff.renewal.nextAction}`,
    "Manual-only guardrail: this does not create invoices, payment links, payouts or reward inventory.",
  ].join("\n");
}

function buildSponsorCloseFinanceCopy(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  return [
    `${handoff.sponsorName} finance invoice prep:`,
    `Campaign: ${handoff.campaignTitle}.`,
    `Package: ${handoff.packageTier}.`,
    `Deal value: ${handoff.budgetLabel}.`,
    `Finance contact: ${handoff.sponsorContact ?? "Missing"}.`,
    `Delivery proof: ${handoff.activationRun.signoff?.label ?? "Not signed off"}.`,
    "Finance approval required before sending.",
    "Manual-only guardrail: this does not create invoices, payment links, payouts or reward inventory.",
  ].join("\n");
}

function buildSponsorCloseInternalProofCopy(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  return [
    `${handoff.sponsorName} internal delivery proof:`,
    `Run: ${handoff.activationRun.runId ?? "No staged run"}.`,
    `Campaign: ${handoff.campaignTitle}.`,
    `Shard pool: ${handoff.metrics.poolSize.toLocaleString("en-US")} total / ${handoff.metrics.remainingShards.toLocaleString("en-US")} remaining.`,
    `Reward budget: ${handoff.metrics.rewardBudget.toLocaleString("en-US")}.`,
    `Participants: ${handoff.metrics.participants.toLocaleString("en-US")}.`,
    `Completion: ${handoff.metrics.completionRate}%.`,
    `Signoff: ${handoff.activationRun.signoff?.label ?? "Not signed off"}.`,
    `Operator note: ${handoff.activationRun.signoff?.note ?? "No signoff note yet."}`,
    "Manual-only guardrail: this does not create invoices, payment links, payouts or reward inventory.",
  ].join("\n");
}

function compareDealClosePacks(
  left: ReturnType<typeof toSponsorDealClosePack>,
  right: ReturnType<typeof toSponsorDealClosePack>
) {
  const stateRank = {
    ready: 4,
    needs_setup: 3,
    watch: 2,
    closed: 1,
  };
  const rankDelta = stateRank[right.state] - stateRank[left.state];
  if (rankDelta !== 0) {
    return rankDelta;
  }

  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return right.dealValue - left.dealValue;
}

function buildSponsorBillingReadiness(
  handoffs: ReturnType<typeof buildSponsorActivationHandoff>[]
) {
  const items = handoffs.map(toSponsorBillingReadinessItem).sort(compareBillingItems);
  const invoiceReadyItems = items.filter((item) => item.readiness === "invoice_ready");
  const financeSetupItems = items.filter((item) => item.readiness === "needs_setup");
  const paymentWatchItems = items.filter((item) => item.readiness === "payment_watch");
  const closedItems = items.filter((item) => item.readiness === "closed");
  const focus =
    invoiceReadyItems[0] ??
    financeSetupItems[0] ??
    paymentWatchItems[0] ??
    items[0] ??
    null;

  return {
    summary: {
      totalValue: items.reduce((sum, item) => sum + item.dealValue, 0),
      invoiceReadyValue: invoiceReadyItems.reduce((sum, item) => sum + item.dealValue, 0),
      invoiceReady: invoiceReadyItems.length,
      needsFinanceSetup: financeSetupItems.length,
      paymentWatch: paymentWatchItems.length,
      closed: closedItems.length,
      manualOnly: true as const,
      topNextAction:
        focus?.nextAction ?? "Save sponsor packages before preparing manual finance actions.",
    },
    focus,
    lanes: [
      {
        id: "invoice_ready" as const,
        label: "Invoice ready",
        detail: "Won packages with contact, value and completed delivery signoff.",
        count: invoiceReadyItems.length,
        items: invoiceReadyItems.slice(0, 5),
      },
      {
        id: "finance_setup" as const,
        label: "Finance setup",
        detail: "Won packages that still need contact, value or delivery proof.",
        count: financeSetupItems.length,
        items: financeSetupItems.slice(0, 5),
      },
      {
        id: "payment_watch" as const,
        label: "Payment watch",
        detail: "Deals not won yet; keep commercial context warm before invoicing.",
        count: paymentWatchItems.length,
        items: paymentWatchItems.slice(0, 5),
      },
    ],
    guardrails: [
      "Billing readiness is read-only and does not create invoices or payment links.",
      "Finance approval stays manual before any sponsor charge is requested.",
      "Delivery signoff must be explicit before a won package becomes invoice-ready.",
    ],
  };
}

function toSponsorBillingReadinessItem(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  const closed = ["lost", "blocked", "archived"].includes(handoff.status);
  const won = handoff.status === "won";
  const contactReady = Boolean(handoff.sponsorContact);
  const budgetReady = handoff.dealValue > 0;
  const deliverySignedOff = handoff.activationRun.signoff?.outcome === "completed";
  const blockers = won
    ? [
        contactReady ? null : "Sponsor contact",
        budgetReady ? null : "Deal value",
        deliverySignedOff ? null : "Delivery signoff",
      ].filter((item): item is string => Boolean(item))
    : [];
  const readiness = closed
    ? ("closed" as const)
    : won && blockers.length === 0
      ? ("invoice_ready" as const)
      : won
        ? ("needs_setup" as const)
        : ("payment_watch" as const);
  const score =
    Math.round(handoff.dealValue / 100) +
    (readiness === "invoice_ready" ? 120 : 0) +
    (blockers.includes("Sponsor contact") ? 45 : 0) +
    (blockers.includes("Deal value") ? 40 : 0) +
    (blockers.includes("Delivery signoff") ? 20 : 0) +
    (readiness === "payment_watch" ? 8 : 0);

  return {
    packageId: handoff.packageId,
    sponsorName: handoff.sponsorName,
    sponsorContact: handoff.sponsorContact ?? "No finance contact",
    campaignTitle: handoff.campaignTitle,
    packageTier: handoff.packageTier,
    routeHref: handoff.routeHref,
    status: handoff.status,
    readiness,
    priority:
      readiness === "invoice_ready"
        ? ("high" as const)
        : readiness === "needs_setup"
          ? ("medium" as const)
          : ("watch" as const),
    blockers,
    dealValue: handoff.dealValue,
    valueLabel: handoff.budgetLabel,
    score,
    followUpUrgency: handoff.renewal.followUpUrgency,
    signoffLabel: handoff.activationRun.signoff?.label ?? "No delivery signoff",
    nextAction: getSponsorBillingNextAction({
      readiness,
      sponsorName: handoff.sponsorName,
      blockers,
    }),
  };
}

function getSponsorBillingNextAction({
  readiness,
  sponsorName,
  blockers,
}: {
  readiness: "invoice_ready" | "needs_setup" | "payment_watch" | "closed";
  sponsorName: string;
  blockers: string[];
}) {
  if (readiness === "invoice_ready") {
    return `Prepare manual invoice request for ${sponsorName} after finance approval.`;
  }

  if (readiness === "needs_setup") {
    if (blockers.includes("Sponsor contact")) {
      return "Add sponsor finance contact before invoice prep.";
    }

    if (blockers.includes("Deal value")) {
      return "Confirm package value before invoice prep.";
    }

    if (blockers.includes("Delivery signoff")) {
      return "Complete delivery signoff before invoice prep.";
    }
  }

  if (readiness === "closed") {
    return "Keep closed sponsor package out of billing.";
  }

  return "Keep deal in CRM until the sponsor package is won.";
}

function compareBillingItems(
  left: ReturnType<typeof toSponsorBillingReadinessItem>,
  right: ReturnType<typeof toSponsorBillingReadinessItem>
) {
  const readinessRank = {
    invoice_ready: 4,
    needs_setup: 3,
    payment_watch: 2,
    closed: 1,
  };
  const rankDelta = readinessRank[right.readiness] - readinessRank[left.readiness];
  if (rankDelta !== 0) {
    return rankDelta;
  }

  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return right.dealValue - left.dealValue;
}

function buildSponsorBusinessCockpit(
  handoffs: ReturnType<typeof buildSponsorActivationHandoff>[]
) {
  const items = handoffs.map(toSponsorBusinessCockpitItem).sort(compareBusinessItems);
  const followUpItems = items.filter((item) =>
    item.followUpUrgency === "overdue" || item.followUpUrgency === "due_soon"
  );
  const renewalItems = items.filter((item) =>
    item.renewalState === "ready" || item.renewalState === "watch"
  );
  const focus =
    items.find((item) => item.priority === "high") ??
    renewalItems[0] ??
    followUpItems[0] ??
    items[0] ??
    null;

  return {
    summary: {
      totalValue: items.reduce((sum, item) => sum + item.dealValue, 0),
      highPriority: items.filter((item) => item.priority === "high").length,
      overdueFollowUps: items.filter((item) => item.followUpUrgency === "overdue").length,
      renewalReady: renewalItems.filter((item) => item.renewalState === "ready").length,
      signedOffRuns: items.filter((item) => item.signedOff).length,
      topNextAction: focus?.nextAction ?? "Save a sponsor package to open the business cockpit.",
    },
    focus,
    lanes: [
      {
        id: "revenue" as const,
        label: "Revenue priority",
        detail: "Highest-value packages, signed-off runs and urgent sponsor paths.",
        count: items.length,
        items: items.slice(0, 5),
      },
      {
        id: "follow_up" as const,
        label: "Follow-up pressure",
        detail: "Sponsor touches that are overdue or due soon.",
        count: followUpItems.length,
        items: followUpItems.slice(0, 5),
      },
      {
        id: "renewal" as const,
        label: "Renewal queue",
        detail: "Signed-off or strong-performance packages ready for renewal motion.",
        count: renewalItems.length,
        items: renewalItems.slice(0, 5),
      },
    ],
  };
}

function toSponsorBusinessCockpitItem(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  const signedOff = Boolean(handoff.activationRun.signoff);
  const renewalReady = handoff.renewal.state === "ready";
  const followUpUrgent =
    handoff.renewal.followUpUrgency === "overdue" ||
    handoff.renewal.followUpUrgency === "due_soon";
  const score =
    Math.round(handoff.dealValue / 100) +
    (renewalReady ? 70 : handoff.renewal.state === "watch" ? 35 : 0) +
    (signedOff ? 25 : 0) +
    (handoff.renewal.followUpUrgency === "overdue"
      ? 30
      : handoff.renewal.followUpUrgency === "due_soon"
        ? 15
        : 0) +
    (handoff.activationState === "setup_needed" ? 12 : 0);
  const priority =
    renewalReady ||
    (handoff.renewal.followUpUrgency === "overdue" && handoff.dealValue >= 1000) ||
    score >= 85
      ? ("high" as const)
      : followUpUrgent ||
          handoff.activationState === "setup_needed" ||
          handoff.dealValue > 0
        ? ("medium" as const)
        : ("watch" as const);

  return {
    packageId: handoff.packageId,
    sponsorName: handoff.sponsorName,
    campaignTitle: handoff.campaignTitle,
    packageTier: handoff.packageTier,
    routeHref: handoff.routeHref,
    dealValue: handoff.dealValue,
    valueLabel: handoff.budgetLabel,
    priority,
    score,
    signedOff,
    activationState: handoff.activationState,
    activationLabel: handoff.activationRun.label,
    renewalState: handoff.renewal.state,
    renewalLabel: handoff.renewal.label,
    followUpUrgency: handoff.renewal.followUpUrgency,
    nextAction: getSponsorBusinessNextAction(handoff),
  };
}

function getSponsorBusinessNextAction(
  handoff: ReturnType<typeof buildSponsorActivationHandoff>
) {
  if (handoff.renewal.state === "ready") {
    return handoff.renewal.nextAction;
  }

  if (
    handoff.renewal.followUpUrgency === "overdue" ||
    handoff.renewal.followUpUrgency === "due_soon"
  ) {
    return "Follow up with sponsor before the deal cools down.";
  }

  if (handoff.activationRun.signoff) {
    return handoff.performance.signoff.nextSponsorMove;
  }

  if (handoff.activationState === "setup_needed") {
    return handoff.nextAction;
  }

  return handoff.renewal.nextAction;
}

function compareBusinessItems(
  left: ReturnType<typeof toSponsorBusinessCockpitItem>,
  right: ReturnType<typeof toSponsorBusinessCockpitItem>
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return right.dealValue - left.dealValue;
}

function getSponsorActivationState(params: {
  closed: boolean;
  sponsorWon: boolean;
  campaignRouteReady: boolean;
  shardPoolReady: boolean;
  rewardBudgetReady: boolean;
  ownerReady: boolean;
}): LootboxSponsorActivationState {
  if (params.closed) {
    return "closed";
  }

  if (!params.sponsorWon || !params.campaignRouteReady) {
    return "locked";
  }

  if (!params.shardPoolReady || !params.rewardBudgetReady || !params.ownerReady) {
    return "setup_needed";
  }

  return "ready";
}

function getSponsorActivationTone(state: LootboxSponsorActivationState) {
  switch (state) {
    case "ready":
      return "success" as const;
    case "setup_needed":
      return "warning" as const;
    case "locked":
      return "danger" as const;
    case "closed":
    default:
      return "default" as const;
  }
}

function getSponsorActivationNextAction(
  state: LootboxSponsorActivationState,
  checklist: LootboxSponsorActivationChecklistItem[]
) {
  if (state === "ready") {
    return "Stage activation brief for manual launch.";
  }

  if (state === "closed") {
    return "Archive learnings and keep the package out of activation.";
  }

  const firstMissing = checklist.find((item) => item.state !== "ready");
  switch (firstMissing?.id) {
    case "sponsor_win":
      return "Move sponsor deal to won before activation.";
    case "campaign_route":
      return "Open a public active campaign route before activation.";
    case "shard_pool":
      return "Attach an active shard pool before activation.";
    case "reward_budget":
      return "Add visible reward budget before activation.";
    case "owner":
      return "Assign an operator owner before activation.";
    default:
      return "Review activation setup before launch.";
  }
}

function buildSponsorActivationExecution(params: {
  activationState: LootboxSponsorActivationState;
  checklist: LootboxSponsorActivationChecklistItem[];
}) {
  const checklistById = new Map(params.checklist.map((item) => [item.id, item]));
  const canLaunch = params.activationState === "ready";
  const blockedBy = params.checklist
    .filter((item) => item.state !== "ready")
    .map((item) => item.label);
  const primaryStepId = canLaunch
    ? "stage_activation_brief"
    : getPrimaryActivationExecutionStep(params.checklist);
  const steps: LootboxSponsorActivationExecutionStep[] = [
    {
      id: "stage_activation_brief",
      label: "Stage activation brief",
      state: toExecutionStepState(checklistById.get("sponsor_win")),
      detail: "Copy the sponsor activation brief into the internal launch thread.",
    },
    {
      id: "confirm_campaign_route",
      label: "Confirm campaign route",
      state: toExecutionStepState(checklistById.get("campaign_route")),
      detail: "Verify the campaign is public and active or scheduled before launch.",
    },
    {
      id: "verify_shard_pool",
      label: "Verify shard pool",
      state: toExecutionStepState(checklistById.get("shard_pool")),
      detail: "Confirm the sponsored shard pool is active, finite and has remaining shards.",
    },
    {
      id: "lock_reward_budget",
      label: "Lock reward budget",
      state: toExecutionStepState(checklistById.get("reward_budget")),
      detail: "Confirm visible reward budget and fulfillment posture before public pressure.",
    },
    {
      id: "assign_owner",
      label: "Assign operator owner",
      state: toExecutionStepState(checklistById.get("owner")),
      detail: "Keep one internal owner accountable for sponsor launch and follow-up.",
    },
    {
      id: "monitor_launch",
      label: "Monitor launch window",
      state: canLaunch ? "ready" : "blocked",
      detail: "Watch first-hour shard depletion, member activity and support pressure.",
    },
  ];

  return {
    canLaunch,
    label: canLaunch ? "Ready for manual launch" : "Finish activation setup",
    primaryStepId,
    blockedBy,
    steps,
    runbook: [
      "Copy the activation brief into the internal launch thread.",
      "Confirm campaign route, shard pool, reward budget and owner one final time.",
      "Start the sponsored activation manually and monitor first-hour shard depletion.",
    ],
  };
}

function buildSponsorPerformanceSnapshot(params: {
  activationState: LootboxSponsorActivationState;
  signoff: LootboxSponsorActivationRunSignoff | null;
  sponsorName: string;
  campaignTitle: string;
  poolSize: number;
  remainingShards: number;
  participants: number;
  completionRate: number;
}) {
  const issuedShards = Math.max(0, params.poolSize - params.remainingShards);
  const depletionRate =
    params.poolSize > 0 ? Math.round((issuedShards / params.poolSize) * 100) : 0;
  const state = getSponsorPerformanceState({
    activationState: params.activationState,
    issuedShards,
    participants: params.participants,
    completionRate: params.completionRate,
  });
  const renewalSignal = getSponsorPerformanceRenewalSignal({
    state,
    depletionRate,
    participants: params.participants,
    completionRate: params.completionRate,
  });
  const nextAction = getSponsorPerformanceNextAction(state, renewalSignal, params.signoff);

  return {
    state,
    label: getSponsorPerformanceLabel(state),
    renewalSignal,
    nextAction,
    signoff: buildSponsorPerformanceSignoff(params.signoff),
    metrics: {
      issuedShards,
      depletionRate,
      participants: params.participants,
      completionRate: params.completionRate,
    },
    kpis: buildSponsorPerformanceKpis({
      issuedShards,
      depletionRate,
      participants: params.participants,
      completionRate: params.completionRate,
    }),
    sponsorUpdate: {
      title: `${params.sponsorName} activation performance update`,
      body: buildSponsorPerformanceUpdate({
        sponsorName: params.sponsorName,
        campaignTitle: params.campaignTitle,
        issuedShards,
        depletionRate,
        participants: params.participants,
        completionRate: params.completionRate,
        nextAction,
        signoff: params.signoff,
      }),
    },
  };
}

function buildSponsorRenewalPipeline(params: {
  activationState: LootboxSponsorActivationState;
  performance: ReturnType<typeof buildSponsorPerformanceSnapshot>;
  signoff: LootboxSponsorActivationRunSignoff | null;
  sponsorName: string;
  campaignTitle: string;
  packageTier: string;
  followUpAt: string | null;
  now: Date;
}) {
  const followUpUrgency = getSponsorRenewalFollowUpUrgency({
    followUpAt: params.followUpAt,
    now: params.now,
    closed: params.activationState === "closed" || params.performance.state === "closed",
  });
  const state = getSponsorRenewalState({
    activationState: params.activationState,
    performanceState: params.performance.state,
    renewalSignal: params.performance.renewalSignal,
    signoff: params.signoff,
  });
  const nextPackageTier = getSponsorRenewalPackageTier({
    packageTier: params.packageTier,
    renewalSignal: params.performance.renewalSignal,
  });
  const blockedBy = getSponsorRenewalBlockedBy({
    activationState: params.activationState,
    performanceState: params.performance.state,
    renewalSignal: params.performance.renewalSignal,
    signoff: params.signoff,
  });
  const nextAction = getSponsorRenewalNextAction({
    state,
    blockedBy,
    followUpUrgency,
    signoff: params.signoff,
  });

  return {
    state,
    label: getSponsorRenewalLabel(state),
    signoff: buildSponsorPerformanceSignoff(params.signoff),
    followUpUrgency,
    nextPackageTier,
    nextAction,
    blockedBy,
    playbook: buildSponsorRenewalPlaybook({
      state,
      nextPackageTier,
      followUpUrgency,
      renewalSignal: params.performance.renewalSignal,
      signoff: params.signoff,
    }),
    renewalCopy: {
      title: `${params.sponsorName} renewal follow-up`,
      body: buildSponsorRenewalCopy({
        sponsorName: params.sponsorName,
        campaignTitle: params.campaignTitle,
        nextPackageTier,
        renewalSignal: params.performance.renewalSignal,
        followUpUrgency,
        nextAction,
        signoff: params.signoff,
        issuedShards: params.performance.metrics.issuedShards,
        depletionRate: params.performance.metrics.depletionRate,
        participants: params.performance.metrics.participants,
        completionRate: params.performance.metrics.completionRate,
      }),
    },
  };
}

function getSponsorRenewalState(params: {
  activationState: LootboxSponsorActivationState;
  performanceState: LootboxSponsorPerformanceState;
  renewalSignal: "strong" | "watch" | "none";
  signoff: LootboxSponsorActivationRunSignoff | null;
}): LootboxSponsorRenewalState {
  if (params.activationState === "closed" || params.performanceState === "closed") {
    return "closed";
  }

  if (params.signoff?.outcome === "paused") {
    return "not_ready";
  }

  if (params.signoff?.outcome === "needs_follow_up") {
    return "watch";
  }

  if (
    params.activationState !== "ready" ||
    params.performanceState !== "report_ready" ||
    params.renewalSignal === "none"
  ) {
    return "not_ready";
  }

  return params.renewalSignal === "strong" ? "ready" : "watch";
}

function getSponsorRenewalFollowUpUrgency(params: {
  followUpAt: string | null;
  now: Date;
  closed: boolean;
}): LootboxSponsorRenewalFollowUpUrgency {
  if (params.closed) {
    return "closed";
  }

  if (!params.followUpAt) {
    return "unscheduled";
  }

  const followUpDate = new Date(params.followUpAt);
  if (Number.isNaN(followUpDate.getTime())) {
    return "unscheduled";
  }

  const hoursUntilFollowUp = (followUpDate.getTime() - params.now.getTime()) / 3_600_000;
  if (hoursUntilFollowUp <= 0) {
    return "overdue";
  }

  if (hoursUntilFollowUp <= 72) {
    return "due_soon";
  }

  return "scheduled";
}

function getSponsorRenewalPackageTier(params: {
  packageTier: string;
  renewalSignal: "strong" | "watch" | "none";
}) {
  const tier = normalizeSponsorRenewalPackageTier(params.packageTier);
  if (params.renewalSignal !== "strong") {
    return tier;
  }

  if (tier === "starter") {
    return "standard" as const;
  }

  return "premium" as const;
}

function normalizeSponsorRenewalPackageTier(packageTier: string) {
  const normalized = packageTier.trim().toLowerCase();
  if (normalized === "premium" || normalized === "standard" || normalized === "starter") {
    return normalized;
  }

  return "starter" as const;
}

function getSponsorRenewalBlockedBy(params: {
  activationState: LootboxSponsorActivationState;
  performanceState: LootboxSponsorPerformanceState;
  renewalSignal: "strong" | "watch" | "none";
  signoff: LootboxSponsorActivationRunSignoff | null;
}) {
  if (params.activationState === "closed" || params.performanceState === "closed") {
    return [];
  }

  const blockedBy: string[] = [];
  if (params.signoff?.outcome === "paused") {
    blockedBy.push("Paused activation run");
  }

  if (params.activationState !== "ready") {
    blockedBy.push("Activation setup");
  }

  if (params.performanceState !== "report_ready" || params.renewalSignal === "none") {
    blockedBy.push("Sponsor performance");
  }

  return blockedBy;
}

function getSponsorRenewalNextAction(params: {
  state: LootboxSponsorRenewalState;
  blockedBy: string[];
  followUpUrgency: LootboxSponsorRenewalFollowUpUrgency;
  signoff: LootboxSponsorActivationRunSignoff | null;
}) {
  if (params.state === "closed") {
    return "Keep the package out of renewal outreach.";
  }

  if (params.signoff?.outcome === "paused") {
    return "Resolve paused activation run before renewal outreach.";
  }

  if (params.state === "not_ready") {
    return params.blockedBy.includes("Activation setup")
      ? "Finish activation setup before renewal outreach."
      : "Wait for stronger sponsor performance before renewal outreach.";
  }

  if (params.state === "watch") {
    if (params.signoff?.outcome === "needs_follow_up") {
      return "Close the signoff follow-up before pitching renewal.";
    }

    return "Keep sponsor warm until the next activity proof improves.";
  }

  if (params.followUpUrgency === "unscheduled") {
    return "Schedule renewal follow-up with the performance snapshot.";
  }

  if (params.signoff?.outcome === "completed") {
    return "Send signed-off renewal follow-up with the performance snapshot.";
  }

  return "Send renewal follow-up with the performance snapshot.";
}

function getSponsorRenewalLabel(state: LootboxSponsorRenewalState) {
  switch (state) {
    case "ready":
      return "Renewal ready";
    case "watch":
      return "Watchlist";
    case "closed":
      return "Closed";
    case "not_ready":
    default:
      return "Not ready";
  }
}

function buildSponsorRenewalPlaybook(params: {
  state: LootboxSponsorRenewalState;
  nextPackageTier: string;
  followUpUrgency: LootboxSponsorRenewalFollowUpUrgency;
  renewalSignal: "strong" | "watch" | "none";
  signoff: LootboxSponsorActivationRunSignoff | null;
}): LootboxSponsorRenewalPlaybookStep[] {
  const canAct = params.state === "ready" || params.state === "watch";
  const signoffPaused = params.signoff?.outcome === "paused";
  return [
    {
      id: "send_performance_update",
      label: "Send proof update",
      state: canAct && !signoffPaused ? "ready" : "blocked",
      detail: params.signoff
        ? `Lead with the ${params.signoff.label.toLowerCase()} signoff, shard depletion, participants and completion.`
        : "Lead with shard depletion, participants and completion before asking for another package.",
    },
    {
      id: "pitch_next_package",
      label: `Pitch ${params.nextPackageTier}`,
      state:
        signoffPaused
          ? "blocked"
          : params.state === "ready"
          ? "ready"
          : params.state === "watch"
            ? "action_needed"
            : "blocked",
      detail:
        params.renewalSignal === "strong"
          ? "Performance supports a renewal or expansion conversation."
          : "Use a softer follow-up until the activity proof is stronger.",
    },
    {
      id: "schedule_follow_up",
      label: "Lock next follow-up",
      state:
        params.state === "closed"
          ? "blocked"
          : params.followUpUrgency === "unscheduled"
            ? "action_needed"
            : canAct
              ? "ready"
              : "blocked",
      detail: "Keep the next sponsor touch visible so the deal does not go cold.",
    },
  ];
}

function buildSponsorRenewalCopy(params: {
  sponsorName: string;
  campaignTitle: string;
  nextPackageTier: string;
  renewalSignal: "strong" | "watch" | "none";
  followUpUrgency: LootboxSponsorRenewalFollowUpUrgency;
  nextAction: string;
  signoff: LootboxSponsorActivationRunSignoff | null;
  issuedShards: number;
  depletionRate: number;
  participants: number;
  completionRate: number;
}) {
  const performanceLine = [
    `${params.issuedShards.toLocaleString("en-US")} shards issued`,
    `${params.depletionRate}% depleted`,
    `${params.participants.toLocaleString("en-US")} participants`,
    `${params.completionRate}% completion`,
  ].join(", ");

  return [
    `${params.sponsorName} renewal follow-up for ${params.campaignTitle}:`,
    ...(params.signoff
      ? [
          `Signed-off outcome: ${params.signoff.label}.`,
          `Operator note: ${params.signoff.note}`,
        ]
      : []),
    `${performanceLine}.`,
    `Recommended package: ${params.nextPackageTier} renewal based on a ${params.renewalSignal} renewal signal.`,
    `Follow-up status: ${getSponsorRenewalFollowUpLabel(params.followUpUrgency)}.`,
    `Next operator move: ${params.nextAction}`,
    "Manual-only guardrail: this does not create billing, budget, payout or reward inventory.",
  ].join("\n");
}

function getSponsorRenewalFollowUpLabel(urgency: LootboxSponsorRenewalFollowUpUrgency) {
  switch (urgency) {
    case "overdue":
      return "overdue";
    case "due_soon":
      return "due soon";
    case "scheduled":
      return "scheduled";
    case "closed":
      return "closed";
    case "unscheduled":
    default:
      return "unscheduled";
  }
}

function buildSponsorPerformanceSignoff(signoff: LootboxSponsorActivationRunSignoff | null) {
  if (!signoff) {
    return {
      state: "open" as const,
      outcome: null,
      label: "Not signed off",
      note: null,
      signedOffAt: null,
      followUpAt: null,
      nextSponsorMove: "Sign off the activation run before renewal outreach.",
    };
  }

  return {
    state: "signed_off" as const,
    outcome: signoff.outcome,
    label: signoff.label,
    note: signoff.note,
    signedOffAt: signoff.signedOffAt,
    followUpAt: signoff.followUpAt,
    nextSponsorMove: getSponsorSignoffNextSponsorMove(signoff.outcome),
  };
}

function getSponsorSignoffNextSponsorMove(
  outcome: LootboxSponsorActivationRunSignoffOutcome
) {
  switch (outcome) {
    case "completed":
      return "Send signed-off performance update and renewal follow-up.";
    case "needs_follow_up":
      return "Close the operator follow-up before pitching renewal.";
    case "paused":
      return "Resolve the paused run before sponsor reporting.";
    default:
      return "Review the signed-off run before sponsor outreach.";
  }
}

function getSponsorPerformanceState(params: {
  activationState: LootboxSponsorActivationState;
  issuedShards: number;
  participants: number;
  completionRate: number;
}): LootboxSponsorPerformanceState {
  if (params.activationState === "closed") {
    return "closed";
  }

  if (params.activationState !== "ready") {
    return "setup_needed";
  }

  if (params.issuedShards > 0 || params.participants > 0 || params.completionRate > 0) {
    return "report_ready";
  }

  return "warming_up";
}

function getSponsorPerformanceRenewalSignal(params: {
  state: LootboxSponsorPerformanceState;
  depletionRate: number;
  participants: number;
  completionRate: number;
}) {
  if (params.state !== "report_ready") {
    return "none" as const;
  }

  if (params.depletionRate >= 30 || params.participants >= 100 || params.completionRate >= 35) {
    return "strong" as const;
  }

  return "watch" as const;
}

function getSponsorPerformanceNextAction(
  state: LootboxSponsorPerformanceState,
  renewalSignal: "strong" | "watch" | "none",
  signoff: LootboxSponsorActivationRunSignoff | null
) {
  if (state === "setup_needed") {
    return "Finish activation setup before sending performance updates.";
  }

  if (state === "closed") {
    return "Keep this sponsor package out of performance reporting.";
  }

  if (state === "warming_up") {
    return "Monitor launch before reporting results.";
  }

  if (signoff?.outcome === "paused") {
    return "Resolve paused activation run before sponsor reporting.";
  }

  if (signoff?.outcome === "needs_follow_up") {
    return "Send sponsor performance update and close the signoff follow-up.";
  }

  if (signoff?.outcome === "completed" && renewalSignal === "strong") {
    return "Send signed-off sponsor performance update and tee up renewal.";
  }

  if (renewalSignal === "strong") {
    return "Send sponsor performance update and tee up renewal.";
  }

  return "Send early sponsor update after more activity.";
}

function getSponsorPerformanceLabel(state: LootboxSponsorPerformanceState) {
  switch (state) {
    case "report_ready":
      return "Sponsor update ready";
    case "warming_up":
      return "Warming up";
    case "closed":
      return "Closed";
    case "setup_needed":
    default:
      return "Setup needed";
  }
}

function buildSponsorPerformanceKpis(params: {
  issuedShards: number;
  depletionRate: number;
  participants: number;
  completionRate: number;
}): LootboxSponsorPerformanceKpi[] {
  return [
    {
      id: "shards_issued",
      label: "Shards issued",
      value: params.issuedShards.toLocaleString("en-US"),
      detail: "Bonus shards earned from linked sponsored pools.",
      tone: params.issuedShards > 0 ? "success" : "default",
    },
    {
      id: "depletion",
      label: "Pool depletion",
      value: `${params.depletionRate}%`,
      detail: "How much of the sponsored shard pool has been consumed.",
      tone: params.depletionRate >= 30 ? "success" : params.depletionRate > 0 ? "warning" : "default",
    },
    {
      id: "participants",
      label: "Participants",
      value: params.participants.toLocaleString("en-US"),
      detail: "Campaign participation visible on the campaign snapshot.",
      tone: params.participants >= 100 ? "success" : params.participants > 0 ? "warning" : "default",
    },
    {
      id: "completion",
      label: "Completion",
      value: `${params.completionRate}%`,
      detail: "Campaign completion rate visible to the operator.",
      tone: params.completionRate >= 35 ? "success" : params.completionRate > 0 ? "warning" : "default",
    },
  ];
}

function buildSponsorPerformanceUpdate(params: {
  sponsorName: string;
  campaignTitle: string;
  issuedShards: number;
  depletionRate: number;
  participants: number;
  completionRate: number;
  nextAction: string;
  signoff: LootboxSponsorActivationRunSignoff | null;
}) {
  return [
    `${params.sponsorName} performance snapshot for ${params.campaignTitle}:`,
    ...(params.signoff
      ? [`Signoff: ${params.signoff.label}.`, `Operator note: ${params.signoff.note}`]
      : []),
    `${params.issuedShards.toLocaleString("en-US")} shards issued from the sponsored boost.`,
    `${params.depletionRate}% depleted across the linked shard pool.`,
    `${params.participants.toLocaleString("en-US")} participants with ${params.completionRate}% completion.`,
    `Recommended next move: ${params.nextAction}`,
    "Manual-only note: this is an operator report, not an automated payout, billing or fulfillment action.",
  ].join("\n");
}

function getPrimaryActivationExecutionStep(
  checklist: LootboxSponsorActivationChecklistItem[]
): LootboxSponsorActivationExecutionStepId {
  const firstMissing = checklist.find((item) => item.state !== "ready");
  switch (firstMissing?.id) {
    case "campaign_route":
      return "confirm_campaign_route";
    case "shard_pool":
      return "verify_shard_pool";
    case "reward_budget":
      return "lock_reward_budget";
    case "owner":
      return "assign_owner";
    case "sponsor_win":
    default:
      return "stage_activation_brief";
  }
}

function toExecutionStepState(
  item: LootboxSponsorActivationChecklistItem | undefined
): LootboxSponsorActivationExecutionStep["state"] {
  if (!item || item.state === "missing") {
    return "action_needed";
  }

  if (item.state === "locked") {
    return "blocked";
  }

  return "ready";
}

function buildSponsorActivationBrief(params: {
  sponsorName: string;
  projectName: string;
  campaignTitle: string;
  packageTier: string;
  budgetLabel: string;
  poolSize: number;
  remainingShards: number;
  rewardBudget: number;
  nextAction: string;
}) {
  return [
    `${params.sponsorName} is ready for a ${params.packageTier} VYNTRO lootbox activation with ${params.projectName}.`,
    `Campaign: ${params.campaignTitle}.`,
    `Budget: ${params.budgetLabel}; visible reward budget: ${params.rewardBudget.toLocaleString("en-US")}.`,
    `Shard boost: ${params.poolSize.toLocaleString("en-US")} shard pool with ${params.remainingShards.toLocaleString("en-US")} remaining.`,
    `Next operator move: ${params.nextAction}`,
    "Manual-only guardrail: do not trigger billing, payouts or reward inventory from this handoff.",
  ].join("\n");
}

function buildSponsorActivationRunNote(params: {
  handoff: LootboxSponsorActivationHandoff;
  nextOperatorMoves: string[];
}) {
  return [
    `Activation run staged for ${params.handoff.sponsorName} / ${params.handoff.campaignTitle}.`,
    `Route: ${params.handoff.routeHref}.`,
    `Shard pool: ${params.handoff.metrics.poolSize.toLocaleString("en-US")} total, ${params.handoff.metrics.remainingShards.toLocaleString("en-US")} remaining.`,
    `Reward budget: ${params.handoff.metrics.rewardBudget.toLocaleString("en-US")}.`,
    "Next operator moves:",
    ...params.nextOperatorMoves.map((move, index) => `${index + 1}. ${move}`),
    "Guardrail: this stages an operator run only; no billing, payout, reward inventory or public launch was triggered.",
  ].join("\n");
}

function buildSponsorActivationRunSummary(params: {
  metadata: Record<string, unknown> | null;
  canStage: boolean;
}) {
  const staged = readLastSponsorActivationRun(params.metadata);
  if (staged) {
    const signoff = buildSponsorActivationRunSignoff(params.metadata, staged.runId);
    return {
      state: "staged" as const,
      label: signoff ? "Run signed off" : "Run staged",
      tone: "success" as const,
      canStage: false,
      runId: staged.runId,
      title: staged.title,
      stagedAt: staged.stagedAt,
      noteId: staged.noteId,
      stagedByAuthUserId: staged.stagedByAuthUserId,
      signoff,
      detail: signoff
        ? `${signoff.label} signoff saved; send the sponsor update and move into renewal follow-up.`
        : "Decision note and audit are saved; continue the manual runbook and monitor the launch window.",
    };
  }

  return {
    state: "not_staged" as const,
    label: "Not staged",
    tone: params.canStage ? ("warning" as const) : ("default" as const),
    canStage: params.canStage,
    runId: null,
    title: null,
    stagedAt: null,
    noteId: null,
    stagedByAuthUserId: null,
    signoff: null,
    detail: params.canStage
      ? "Stage a decision note and audit event before the manual launch starts."
      : "Finish activation setup before staging the manual run.",
  };
}

function readLastSponsorActivationRun(metadata: Record<string, unknown> | null) {
  const run = readObject(metadata?.lastActivationRun);
  const runId = readNonEmptyString(run?.runId);
  const stagedAt = readNonEmptyString(run?.stagedAt);

  if (!runId || !stagedAt) {
    return null;
  }

  return {
    runId,
    stagedAt,
    title: readNonEmptyString(run?.title),
    noteId: readNonEmptyString(run?.noteId),
    stagedByAuthUserId: readNonEmptyString(run?.stagedByAuthUserId),
  };
}

function compareSponsorActivationHandoffs(
  left: ReturnType<typeof buildSponsorActivationHandoff>,
  right: ReturnType<typeof buildSponsorActivationHandoff>
) {
  const stateRank = {
    ready: 4,
    setup_needed: 3,
    locked: 2,
    closed: 1,
  } satisfies Record<LootboxSponsorActivationState, number>;
  const stateDiff = stateRank[right.activationState] - stateRank[left.activationState];
  if (stateDiff !== 0) {
    return stateDiff;
  }

  return right.metrics.rewardBudget - left.metrics.rewardBudget;
}

function getCreateStatus(pack: LootboxSponsoredPackageActionPack): LootboxSponsorPackageStatus {
  switch (pack.status) {
    case "pitch_ready":
      return "ready_to_pitch";
    case "locked":
      return "blocked";
    case "prep_needed":
    default:
      return "draft";
  }
}

function toNoteTimelineItem(
  note: LootboxSponsorPackageDetailNoteRow
): LootboxSponsorPackageTimelineItem {
  return {
    id: note.id,
    kind: "note",
    tone: note.note_type === "decision" ? "success" : "warning",
    title: note.note_type.replace(/_/g, " "),
    detail: note.note,
    actorAuthUserId: note.created_by_auth_user_id,
    followUpAt: note.follow_up_at,
    createdAt: note.created_at,
  };
}

function toAuditTimelineItem(
  audit: LootboxSponsorPackageDetailAuditRow
): LootboxSponsorPackageTimelineItem {
  return {
    id: audit.id,
    kind: "audit",
    tone: getAuditTone(audit.action),
    title: (audit.action ?? "audit event").replace(/_/g, " "),
    detail: audit.summary ?? "Sponsor package audit event recorded.",
    actorAuthUserId: audit.auth_user_id,
    followUpAt: null,
    createdAt: audit.created_at,
  };
}

function buildSponsorActivationRunHistory(params: {
  packageRow: LootboxSponsorPackageDetailPackageRow;
  notes: LootboxSponsorPackageDetailNoteRow[];
  auditEvents: LootboxSponsorPackageDetailAuditRow[];
}): LootboxSponsorActivationRunHistoryItem[] {
  type ActivationRunHistoryDraft = Omit<
    LootboxSponsorActivationRunHistoryItem,
    "steps" | "signoff"
  >;
  const byRunId = new Map<string, ActivationRunHistoryDraft>();

  const upsert = (
    runId: string | null,
    item: Partial<ActivationRunHistoryDraft>
  ) => {
    if (!runId) {
      return;
    }

    const previous = byRunId.get(runId);
    byRunId.set(runId, {
      runId,
      title: item.title ?? previous?.title ?? "Sponsor activation run",
      state: "staged",
      stagedAt: item.stagedAt ?? previous?.stagedAt ?? "",
      stagedByAuthUserId:
        item.stagedByAuthUserId !== undefined
          ? item.stagedByAuthUserId
          : previous?.stagedByAuthUserId ?? null,
      noteId: item.noteId !== undefined ? item.noteId : previous?.noteId ?? null,
      auditId: item.auditId !== undefined ? item.auditId : previous?.auditId ?? null,
      routeHref: item.routeHref !== undefined ? item.routeHref : previous?.routeHref ?? null,
      nextOperatorMove:
        item.nextOperatorMove !== undefined
          ? item.nextOperatorMove
          : previous?.nextOperatorMove ?? null,
      guardrailCount:
        item.guardrailCount !== undefined ? item.guardrailCount : previous?.guardrailCount ?? 0,
    });
  };

  const lastRun = readObject(params.packageRow.metadata?.lastActivationRun);
  const lastRunId = readNonEmptyString(lastRun?.runId);
  upsert(lastRunId, {
    title: readNonEmptyString(lastRun?.title) ?? undefined,
    stagedAt: readNonEmptyString(lastRun?.stagedAt) ?? undefined,
    stagedByAuthUserId: readNonEmptyString(lastRun?.stagedByAuthUserId),
    noteId: readNonEmptyString(lastRun?.noteId),
    routeHref: readNonEmptyString(lastRun?.routeHref),
    guardrailCount: readNumber(lastRun?.guardrailCount) ?? undefined,
  });

  params.notes.forEach((note) => {
    const metadata = readObject(note.metadata);
    if (metadata?.source !== "lootbox_sponsor_activation_run") {
      return;
    }

    const runId = readNonEmptyString(metadata.runId);
    upsert(runId, {
      title: readNonEmptyString(metadata.title) ?? readNonEmptyString(lastRun?.title) ?? undefined,
      stagedAt: readNonEmptyString(metadata.stagedAt) ?? note.created_at ?? undefined,
      stagedByAuthUserId: note.created_by_auth_user_id,
      noteId: note.id,
      routeHref: readNonEmptyString(metadata.routeHref),
      nextOperatorMove: readStringArray(metadata.nextOperatorMoves)[0] ?? null,
      guardrailCount: readStringArray(metadata.guardrails).length,
    });
  });

  params.auditEvents.forEach((audit) => {
    if (audit.action !== "lootbox_sponsor_activation_run_staged") {
      return;
    }

    const metadata = readObject(audit.metadata);
    const runId = readNonEmptyString(metadata?.runId);
    upsert(runId, {
      stagedAt: readNonEmptyString(metadata?.stagedAt) ?? audit.created_at ?? undefined,
      stagedByAuthUserId: audit.auth_user_id,
      noteId: readNonEmptyString(metadata?.noteId),
      auditId: audit.id,
    });
  });

  return [...byRunId.values()]
    .filter((item) => item.stagedAt)
    .map((item) => ({
      ...item,
      steps: buildSponsorActivationRunSteps(params.packageRow.metadata, item.runId),
      signoff: buildSponsorActivationRunSignoff(params.packageRow.metadata, item.runId),
    }))
    .sort((left, right) => getTimelineTime(right.stagedAt) - getTimelineTime(left.stagedAt));
}

function buildSponsorActivationRunSteps(
  metadata: Record<string, unknown> | null,
  runId: string
): LootboxSponsorActivationRunStep[] {
  const stepStates = readObject(metadata?.activationRunStepStates) ?? {};

  return sponsorActivationRunSteps.map((definition) => {
    const raw = readObject(stepStates[definition.id]);
    const rawRunId = readNonEmptyString(raw?.runId);
    const belongsToRun = rawRunId === runId;
    const rawState = raw?.state;
    const state =
      belongsToRun && (rawState === "done" || rawState === "blocked")
        ? rawState
        : "pending";

    return {
      id: definition.id,
      label: definition.label,
      detail: definition.detail,
      state,
      runId: belongsToRun ? rawRunId : null,
      noteId: belongsToRun ? readNonEmptyString(raw?.noteId) : null,
      updatedAt: belongsToRun ? readNonEmptyString(raw?.updatedAt) : null,
      updatedByAuthUserId: belongsToRun
        ? readNonEmptyString(raw?.updatedByAuthUserId)
        : null,
      note: belongsToRun ? readNonEmptyString(raw?.note) : null,
    };
  });
}

function buildSponsorActivationRunSignoff(
  metadata: Record<string, unknown> | null,
  runId: string
): LootboxSponsorActivationRunSignoff | null {
  const raw = readObject(metadata?.lastActivationRunSignoff);
  const signoffRunId = readNonEmptyString(raw?.runId);
  const outcome = raw?.outcome;
  const signedOffAt = readNonEmptyString(raw?.signedOffAt);
  const signedOffByAuthUserId = readNonEmptyString(raw?.signedOffByAuthUserId);
  const note = readNonEmptyString(raw?.note);

  if (
    signoffRunId !== runId ||
    !isSponsorActivationRunSignoffOutcome(outcome) ||
    !signedOffAt ||
    !signedOffByAuthUserId ||
    !note
  ) {
    return null;
  }

  return {
    runId,
    outcome,
    label:
      readNonEmptyString(raw?.label) ??
      getSponsorActivationRunSignoffOutcomeLabel(outcome),
    signedOffAt,
    signedOffByAuthUserId,
    note,
    followUpAt: readNonEmptyString(raw?.followUpAt),
    noteId: readNonEmptyString(raw?.noteId),
  };
}

function compareTimelineItems(
  left: LootboxSponsorPackageTimelineItem,
  right: LootboxSponsorPackageTimelineItem
) {
  return getTimelineTime(right.createdAt) - getTimelineTime(left.createdAt);
}

function getTimelineTime(value: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getAuditTone(action: string | null): LootboxSponsorPackageTimelineItem["tone"] {
  if (action?.includes("created")) {
    return "success";
  }

  if (action?.includes("note")) {
    return "warning";
  }

  return "default";
}

function getDetailNextAction(row: LootboxSponsorPackageDetailPackageRow) {
  switch (row.status) {
    case "won":
      return "Record fulfillment plan";
    case "lost":
    case "archived":
      return "Archive learnings";
    case "blocked":
      return "Unblock package context";
    case "pitched":
    case "negotiating":
      return row.follow_up_at ? "Follow up with sponsor" : "Set sponsor follow-up";
    case "ready_to_pitch":
      return "Send sponsor package";
    case "draft":
    default:
      return "Prepare sponsor package";
  }
}

function getCrmStageIndex(status: string) {
  if (status === "pitched") {
    return 1;
  }

  if (status === "negotiating") {
    return 2;
  }

  if (status === "won" || status === "lost" || status === "archived") {
    return 3;
  }

  return 0;
}

function getCrmStageLabel(status: string) {
  const stage = sponsorCrmStages.find((item) => item.id === status);
  if (stage) {
    return stage.label;
  }

  if (status === "draft") {
    return "Draft";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  if (status === "lost") {
    return "Lost";
  }

  if (status === "archived") {
    return "Archived";
  }

  return status.replace(/_/g, " ");
}

function getCrmStageDetail(status: string) {
  const stage = sponsorCrmStages.find((item) => item.id === status);
  if (stage) {
    return stage.detail;
  }

  if (status === "blocked") {
    return "Campaign or sponsor context needs work before outreach continues.";
  }

  if (status === "lost") {
    return "The sponsor route is closed without a package win.";
  }

  if (status === "archived") {
    return "The package is kept for history only.";
  }

  return "Prepare sponsor details before moving the package forward.";
}

function getCrmStageTone(
  status: string,
  missingFields: string[]
): "success" | "warning" | "danger" {
  if (status === "won") {
    return "success";
  }

  if (status === "lost" || status === "archived" || status === "blocked") {
    return "danger";
  }

  return missingFields.length ? "warning" : "success";
}

function getCrmPrimaryAction(status: string, missingFields: string[]) {
  if (status === "won") {
    return "Record fulfillment plan";
  }

  if (status === "lost" || status === "archived") {
    return "Archive sponsor learnings";
  }

  if (status === "blocked") {
    return "Unblock package context";
  }

  if (missingFields.includes("Sponsor contact")) {
    return "Add sponsor contact before next follow-up";
  }

  if (missingFields.includes("Deal value")) {
    return "Set expected sponsor package value";
  }

  if (missingFields.includes("Owner")) {
    return "Claim an internal owner";
  }

  if (missingFields.includes("Follow-up date")) {
    return "Schedule next sponsor follow-up";
  }

  if (status === "ready_to_pitch" || status === "draft") {
    return "Send sponsor package";
  }

  return "Keep sponsor motion moving";
}

function buildCrmControls(
  status: string,
  checklist: LootboxSponsorPackageCrmChecklistItem[]
): LootboxSponsorPackageCrmControls {
  const nextStatus = getNextSponsorPackageStatus(status);
  const nextActionLabel = nextStatus ? `Mark ${nextStatus.replace(/_/g, " ")}` : "No next stage";
  if (!nextStatus) {
    return {
      canProgress: false,
      nextStatus: null,
      nextActionLabel,
      reason: "Sponsor package is already in a terminal or archived stage.",
      blockingFields: [],
    };
  }

  const blockingFields = checklist
    .filter((item) => isCrmFieldRequiredForStatus(nextStatus, item.label) && item.state === "missing")
    .map((item) => item.label);

  if (blockingFields.length) {
    return {
      canProgress: false,
      nextStatus,
      nextActionLabel,
      reason: `Add ${formatBlockingFields(blockingFields)} before moving to ${nextStatus.replace(/_/g, " ")}.`,
      blockingFields,
    };
  }

  return {
    canProgress: true,
    nextStatus,
    nextActionLabel,
    reason: `Sponsor package can safely move to ${nextStatus.replace(/_/g, " ")}.`,
    blockingFields: [],
  };
}

function getNextSponsorPackageStatus(status: string): LootboxSponsorPackageStatus | null {
  switch (status) {
    case "draft":
    case "blocked":
      return "ready_to_pitch";
    case "ready_to_pitch":
      return "pitched";
    case "pitched":
      return "negotiating";
    case "negotiating":
      return "won";
    case "won":
    case "lost":
    case "archived":
    default:
      return null;
  }
}

function isCrmFieldRequiredForStatus(
  nextStatus: LootboxSponsorPackageStatus,
  label: string
) {
  if (nextStatus === "ready_to_pitch") {
    return ["Sponsor name", "Deal value", "Owner"].includes(label);
  }

  if (nextStatus === "pitched") {
    return ["Sponsor contact", "Deal value", "Owner", "Follow-up date"].includes(label);
  }

  if (nextStatus === "negotiating" || nextStatus === "won") {
    return ["Sponsor contact", "Deal value", "Owner"].includes(label);
  }

  return false;
}

function formatBlockingFields(fields: string[]) {
  if (fields.length <= 1) {
    return fields[0] ?? "the missing fields";
  }

  return `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
}

function normalizeText(value: string | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function normalizeStepNote(value: string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, 1000) : null;
}

function normalizeSignoffNote(value: string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, 1200) : null;
}

function normalizeOptionalIsoDate(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "invalid" as const;
  }

  return parsed.toISOString();
}

function isSponsorActivationRunSignoffOutcome(
  value: unknown
): value is LootboxSponsorActivationRunSignoffOutcome {
  return sponsorActivationRunSignoffOutcomes.some((outcome) => outcome.id === value);
}

function getSponsorActivationRunSignoffOutcomeLabel(
  value: LootboxSponsorActivationRunSignoffOutcome
) {
  return (
    sponsorActivationRunSignoffOutcomes.find((outcome) => outcome.id === value)?.label ??
    value.replace(/_/g, " ")
  );
}

function readObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function readNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toReferenceDate(value: string | Date | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function getSnapshotText(
  row: { package_snapshot: Record<string, unknown> | null },
  key: string,
  fallback: string
) {
  const value = row.package_snapshot?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function formatCrmBudget(value: number | null, currency: string | null) {
  const normalizedCurrency = normalizeText(currency)?.toUpperCase() ?? "USD";
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return `${normalizedCurrency} 0`;
  }

  return `${normalizedCurrency} ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)}`;
}
