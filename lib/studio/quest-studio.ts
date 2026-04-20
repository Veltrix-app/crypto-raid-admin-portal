import { getQuestVerificationPreview } from "@/lib/quest-verification";
import { AdminQuest } from "@/types/entities/quest";
import { AdminProject } from "@/types/entities/project";

export type QuestStudioFamilyId =
  | "social"
  | "community"
  | "wallet"
  | "onchain"
  | "traffic"
  | "growth"
  | "proof"
  | "custom";

export type QuestMemberPreviewModel = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  rewardLabel: string;
  verificationLabel: string;
};

type QuestStudioFamily = {
  id: QuestStudioFamilyId;
  label: string;
  summary: string;
  questTypes: AdminQuest["questType"][];
};

const QUEST_STUDIO_FAMILIES: QuestStudioFamily[] = [
  {
    id: "social",
    label: "Social",
    summary: "Follow, react, repost, or comment to drive public signal and launch reach.",
    questTypes: ["social_follow", "social_like", "social_repost", "social_comment"],
  },
  {
    id: "community",
    label: "Community",
    summary: "Move contributors into Discord or Telegram and validate membership with low friction.",
    questTypes: ["telegram_join", "discord_join"],
  },
  {
    id: "wallet",
    label: "Wallet",
    summary: "Use wallet connection or holder posture as the trust and access gate.",
    questTypes: ["wallet_connect", "token_hold", "nft_hold"],
  },
  {
    id: "onchain",
    label: "Onchain",
    summary: "Track swaps, mints, or contract actions with stronger onchain verification logic.",
    questTypes: ["onchain_tx"],
  },
  {
    id: "traffic",
    label: "Traffic",
    summary: "Send contributors into docs, landing pages, or specific conversion destinations.",
    questTypes: ["url_visit"],
  },
  {
    id: "growth",
    label: "Growth",
    summary: "Turn contributors into acquisition channels with referral or comeback-style loops.",
    questTypes: ["referral"],
  },
  {
    id: "proof",
    label: "Proof",
    summary: "Collect screenshots, links, or evidence where reviewer-led checks matter most.",
    questTypes: ["manual_proof"],
  },
  {
    id: "custom",
    label: "Custom",
    summary: "Use a flexible path when the mission does not fit a standard mechanic yet.",
    questTypes: ["custom"],
  },
];

export function getQuestStudioFamilies() {
  return QUEST_STUDIO_FAMILIES;
}

export function getQuestStudioFamily(questType: AdminQuest["questType"]): QuestStudioFamily {
  return (
    QUEST_STUDIO_FAMILIES.find((family) => family.questTypes.includes(questType)) ??
    QUEST_STUDIO_FAMILIES[QUEST_STUDIO_FAMILIES.length - 1]
  );
}

export function getQuestMemberPreview(values: Omit<AdminQuest, "id">): QuestMemberPreviewModel {
  const preview = getQuestVerificationPreview(values);
  const family = getQuestStudioFamily(values.questType);

  return {
    eyebrow: family.label,
    title: values.title || "Untitled quest",
    description:
      values.shortDescription || values.description || "Add the member-facing quest copy here.",
    actionLabel: values.actionLabel || "Open Task",
    rewardLabel: `${values.xp} XP`,
    verificationLabel: preview.routeLabel,
  };
}

export function getQuestStudioReadiness({
  values,
  project,
  campaignCount,
}: {
  values: Omit<AdminQuest, "id">;
  project?: AdminProject;
  campaignCount: number;
}) {
  const preview = getQuestVerificationPreview(values);

  return [
    {
      label: "Placement",
      value:
        project && values.campaignId
          ? `${project.name} and campaign placement are selected`
          : "Select a project and campaign before launch",
      complete: Boolean(project && values.campaignId),
    },
    {
      label: "Destination",
      value: values.actionUrl
        ? "Quest CTA is connected to a real destination"
        : "Add an action URL so contributors know where to go",
      complete: Boolean(values.actionUrl),
    },
    {
      label: "Verification",
      value: preview.invalidConfig
        ? "Verification config JSON is invalid"
        : preview.missingConfigKeys.length > 0
          ? `Missing ${preview.missingConfigKeys.join(", ")}`
          : preview.routeLabel,
      complete: !preview.invalidConfig && preview.missingConfigKeys.length === 0,
    },
    {
      label: "Workspace coverage",
      value:
        campaignCount > 0
          ? `${campaignCount} campaigns available in this workspace`
          : "This workspace has no campaigns yet",
      complete: campaignCount > 0,
    },
  ];
}
