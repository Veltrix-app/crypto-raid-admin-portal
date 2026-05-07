import type { LootboxSponsoredPackageActionPack } from "./lootbox-sponsored-package-actions";
import type {
  LootboxSponsorPackageCreatePayload,
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
    },
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
}) {
  const handoffs = params.packages
    .map((row) =>
      buildSponsorActivationHandoff({
        row,
        campaigns: params.campaigns,
        projects: params.projects,
        shardPools: params.shardPools,
      })
    )
    .sort(compareSponsorActivationHandoffs);

  return {
    summary: {
      total: handoffs.length,
      ready: handoffs.filter((handoff) => handoff.activationState === "ready").length,
      setupNeeded: handoffs.filter((handoff) => handoff.activationState === "setup_needed").length,
      locked: handoffs.filter((handoff) => handoff.activationState === "locked").length,
      closed: handoffs.filter((handoff) => handoff.activationState === "closed").length,
      manualOnly: true as const,
    },
    handoffs,
    focus:
      handoffs.find((handoff) => handoff.activationState === "ready") ??
      handoffs.find((handoff) => handoff.activationState === "setup_needed") ??
      handoffs[0] ??
      null,
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
  const projectName =
    project?.name ?? getSnapshotText(row, "projectName", row.project_id ?? "Workspace");
  const campaignTitle =
    campaign?.title ?? getSnapshotText(row, "campaignTitle", row.campaign_id ?? "Campaign");
  const sponsorName = normalizeText(row.sponsor_name) ?? "Unnamed sponsor";

  return {
    packageId: row.id,
    campaignId: row.campaign_id,
    projectId: row.project_id ?? campaign?.projectId ?? null,
    packageTier: normalizeText(row.package_tier) ?? "starter",
    status,
    activationState,
    tone: getSponsorActivationTone(activationState),
    projectName,
    campaignTitle,
    sponsorName,
    budgetLabel: formatCrmBudget(row.sponsor_budget, row.currency),
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
    brief: {
      title: `${sponsorName} x ${projectName} activation handoff`,
      body: buildSponsorActivationBrief({
        sponsorName,
        projectName,
        campaignTitle,
        packageTier: normalizeText(row.package_tier) ?? "starter",
        budgetLabel: formatCrmBudget(row.sponsor_budget, row.currency),
        poolSize,
        remainingShards,
        rewardBudget,
        nextAction: getSponsorActivationNextAction(activationState, checklist),
      }),
    },
  };
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
