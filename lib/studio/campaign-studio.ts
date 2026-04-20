import {
  BuildTemplateResult,
  CampaignTemplateId,
  CampaignTemplateOption,
  ResolvedQuestDraft,
  ResolvedRewardDraft,
  formatProjectFieldLabel,
} from "@/lib/campaign-templates";
import { AdminProject } from "@/types/entities/project";

export type CampaignStudioIntentId =
  | "grow_community"
  | "launch_moment"
  | "drive_onchain"
  | "reactivate_members"
  | "reward_core"
  | "hybrid_launch";

export type CampaignStudioAudienceId =
  | "newcomers"
  | "community_members"
  | "holders"
  | "creators"
  | "power_users"
  | "mixed";

export type CampaignMissionMapItem = {
  id: string;
  kind: "entry" | "quest" | "reward" | "raid";
  title: string;
  description: string;
  status: "ready" | "needs_context" | "draft";
  meta: string;
};

export type CampaignStudioReadinessItem = {
  label: string;
  value: string;
  complete: boolean;
};

type CampaignStudioIntentOption = {
  id: CampaignStudioIntentId;
  label: string;
  summary: string;
};

type CampaignStudioAudienceOption = {
  id: CampaignStudioAudienceId;
  label: string;
  summary: string;
};

const INTENT_OPTIONS: CampaignStudioIntentOption[] = [
  {
    id: "grow_community",
    label: "Grow community",
    summary: "Turn discovery into joined members, first actions, and owned channel growth.",
  },
  {
    id: "launch_moment",
    label: "Launch a moment",
    summary: "Focus the campaign around one social, traffic, or announcement push.",
  },
  {
    id: "drive_onchain",
    label: "Drive onchain",
    summary: "Move contributors toward wallet connection, holder proof, or contract activity.",
  },
  {
    id: "reactivate_members",
    label: "Reactivate members",
    summary: "Bring known contributors back into an active lane with a clean comeback loop.",
  },
  {
    id: "reward_core",
    label: "Reward core contributors",
    summary: "Recognize trusted contributors with a tighter, higher-quality campaign posture.",
  },
  {
    id: "hybrid_launch",
    label: "Run a hybrid launch",
    summary: "Blend community, social, and onchain mechanics into one launch-ready flow.",
  },
];

const AUDIENCE_OPTIONS: CampaignStudioAudienceOption[] = [
  {
    id: "newcomers",
    label: "Newcomers",
    summary: "People seeing the project for the first time and needing a simple first path.",
  },
  {
    id: "community_members",
    label: "Community members",
    summary: "Existing channel members who need structure, activation, and momentum.",
  },
  {
    id: "holders",
    label: "Holders",
    summary: "Wallet-aware users who should move from passive holding into active participation.",
  },
  {
    id: "creators",
    label: "Creators",
    summary: "Contributors creating content, proof, or visible ecosystem advocacy.",
  },
  {
    id: "power_users",
    label: "Power users",
    summary: "High-intent operators who can handle deeper loops, proof, and gated access.",
  },
  {
    id: "mixed",
    label: "Mixed audience",
    summary: "A broader campaign that blends multiple contributor types in one launch lane.",
  },
];

function deriveIntent(templateId?: CampaignTemplateId | null): CampaignStudioIntentId {
  switch (templateId) {
    case "community_growth_starter":
      return "grow_community";
    case "launch_hype_sprint":
    case "social_raid_push":
      return "launch_moment";
    case "holder_activation_path":
      return "drive_onchain";
    case "referral_growth_loop":
      return "reactivate_members";
    case "content_creator_flywheel":
      return "reward_core";
    case "ecosystem_onboarding_loop":
    case "blank_campaign_canvas":
    default:
      return "hybrid_launch";
  }
}

function deriveAudience(templateId?: CampaignTemplateId | null): CampaignStudioAudienceId {
  switch (templateId) {
    case "community_growth_starter":
    case "ecosystem_onboarding_loop":
      return "newcomers";
    case "launch_hype_sprint":
    case "social_raid_push":
      return "community_members";
    case "holder_activation_path":
      return "holders";
    case "content_creator_flywheel":
      return "creators";
    case "referral_growth_loop":
      return "power_users";
    case "blank_campaign_canvas":
    default:
      return "mixed";
  }
}

function questMissionItem(quest: ResolvedQuestDraft): CampaignMissionMapItem {
  return {
    id: quest.key,
    kind: "quest",
    title: quest.draft.title,
    description: quest.draft.shortDescription || quest.draft.description,
    status: quest.missingProjectFields.length > 0 ? "needs_context" : "ready",
    meta: `${quest.draft.xp} XP - ${quest.draft.questType.replace(/_/g, " ")}`,
  };
}

function rewardMissionItem(reward: ResolvedRewardDraft): CampaignMissionMapItem {
  return {
    id: reward.key,
    kind: "reward",
    title: reward.draft.title,
    description: reward.draft.description,
    status: "ready",
    meta: `${reward.draft.cost} XP - ${reward.draft.rewardType}`,
  };
}

export function getCampaignStudioIntentOptions() {
  return INTENT_OPTIONS;
}

export function getCampaignStudioAudienceOptions() {
  return AUDIENCE_OPTIONS;
}

export function getCampaignStudioIntentState({
  selectedTemplate,
}: {
  selectedTemplate?: CampaignTemplateOption | null;
}) {
  const intentId = deriveIntent(selectedTemplate?.id ?? null);
  const audienceId = deriveAudience(selectedTemplate?.id ?? null);

  return {
    intentId,
    audienceId,
    intent: INTENT_OPTIONS.find((option) => option.id === intentId) ?? INTENT_OPTIONS[0],
    audience:
      AUDIENCE_OPTIONS.find((option) => option.id === audienceId) ?? AUDIENCE_OPTIONS[0],
  };
}

export function getCampaignMissionMap({
  project,
  templatePlan,
  selectedQuestKeys,
  selectedRewardKeys,
}: {
  project?: AdminProject | null;
  templatePlan?: BuildTemplateResult | null;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
}): CampaignMissionMapItem[] {
  if (!templatePlan) return [];

  const items: CampaignMissionMapItem[] = [
    {
      id: "entry",
      kind: "entry",
      title: project ? `${project.name} launch entry` : "Campaign entry",
      description: "The first touchpoint contributors will see when this campaign goes live.",
      status: templatePlan.missingProjectFields.length > 0 ? "needs_context" : "ready",
      meta: templatePlan.campaignDraft.visibility,
    },
  ];

  templatePlan.questDrafts
    .filter((quest) => selectedQuestKeys.includes(quest.key))
    .forEach((quest) => {
      items.push(questMissionItem(quest));
    });

  templatePlan.rewardDrafts
    .filter((reward) => selectedRewardKeys.includes(reward.key))
    .forEach((reward) => {
      items.push(rewardMissionItem(reward));
    });

  return items;
}

export function getCampaignStudioReadiness({
  project,
  templatePlan,
  selectedQuestKeys,
  selectedRewardKeys,
}: {
  project?: AdminProject | null;
  templatePlan?: BuildTemplateResult | null;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
}): CampaignStudioReadinessItem[] {
  const missingProjectFields = templatePlan?.missingProjectFields ?? [];
  const includedQuestCount = templatePlan?.questDrafts.filter((quest) =>
    selectedQuestKeys.includes(quest.key)
  ).length ?? 0;
  const includedRewardCount = templatePlan?.rewardDrafts.filter((reward) =>
    selectedRewardKeys.includes(reward.key)
  ).length ?? 0;

  return [
    {
      label: "Workspace context",
      value:
        missingProjectFields.length > 0
          ? `Missing ${missingProjectFields
              .map((field) => formatProjectFieldLabel(field))
              .join(", ")}`
          : `${project?.name || "Project"} is ready for template autofill`,
      complete: missingProjectFields.length === 0,
    },
    {
      label: "Mission flow",
      value:
        includedQuestCount > 0
          ? `${includedQuestCount} quest drafts are in the first wave`
          : "Pick at least one quest draft for the launch lane",
      complete: includedQuestCount > 0,
    },
    {
      label: "Reward posture",
      value:
        includedRewardCount > 0
          ? `${includedRewardCount} reward drafts will anchor the campaign outcome`
          : "No reward draft selected yet",
      complete: includedRewardCount > 0,
    },
  ];
}

export function getCampaignStudioCompactReadiness(args: {
  project?: AdminProject | null;
  templatePlan?: BuildTemplateResult | null;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
}) {
  return getCampaignStudioReadiness(args).filter((item) => !item.complete);
}

export function getCampaignLaunchPreview({
  project,
  templatePlan,
  selectedQuestKeys,
  selectedRewardKeys,
}: {
  project?: AdminProject | null;
  templatePlan?: BuildTemplateResult | null;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
}) {
  const missionMap = getCampaignMissionMap({
    project,
    templatePlan,
    selectedQuestKeys,
    selectedRewardKeys,
  });
  const readiness = getCampaignStudioReadiness({
    project,
    templatePlan,
    selectedQuestKeys,
    selectedRewardKeys,
  });

  return {
    campaignTitle: templatePlan?.campaignDraft.title || "Draft campaign",
    missingContextCount: templatePlan?.missingProjectFields.length ?? 0,
    questCount: missionMap.filter((item) => item.kind === "quest").length,
    rewardCount: missionMap.filter((item) => item.kind === "reward").length,
    firstMemberMoment:
      missionMap.find((item) => item.kind === "quest")?.title ||
      "No first-wave quest selected yet",
    readiness,
  };
}
