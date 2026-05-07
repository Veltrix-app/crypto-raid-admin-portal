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
