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
