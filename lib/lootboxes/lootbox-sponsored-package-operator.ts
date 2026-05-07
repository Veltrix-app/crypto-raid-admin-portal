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
  };
}

export type LootboxSponsorPackageCrmRead = ReturnType<
  typeof buildLootboxSponsorPackageCrmRead
>;

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

function normalizeText(value: string | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
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
