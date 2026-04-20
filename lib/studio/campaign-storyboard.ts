import type { BuildTemplateResult } from "@/lib/campaign-templates";
import { formatProjectFieldLabel } from "@/lib/campaign-templates";
import type { CampaignTemplateId } from "@/lib/campaign-templates";
import type { AdminProject } from "@/types/entities/project";

export type CampaignStoryboardBlockId =
  | "goal"
  | "quest_lane"
  | "raid_pressure"
  | "reward_outcome"
  | "launch_posture";

export type CampaignStoryboardBlockStatus = "ready" | "needs_attention" | "draft";

export type CampaignStoryboardBlock = {
  id: CampaignStoryboardBlockId;
  eyebrow: string;
  title: string;
  summary: string;
  metric: string;
  status: CampaignStoryboardBlockStatus;
  notes: string[];
};

function getSelectedQuestDrafts(
  templatePlan: BuildTemplateResult | null | undefined,
  selectedQuestKeys: string[]
) {
  return templatePlan?.questDrafts.filter((quest) => selectedQuestKeys.includes(quest.key)) ?? [];
}

function getSelectedRewardDrafts(
  templatePlan: BuildTemplateResult | null | undefined,
  selectedRewardKeys: string[]
) {
  return (
    templatePlan?.rewardDrafts.filter((reward) => selectedRewardKeys.includes(reward.key)) ?? []
  );
}

function getRaidPressureStatus(templateId?: string | null): CampaignStoryboardBlockStatus {
  if (templateId === "social_raid_push" || templateId === "launch_hype_sprint") {
    return "needs_attention";
  }

  return "draft";
}

export function getCampaignStoryboard({
  project,
  templatePlan,
  templateId,
  selectedQuestKeys,
  selectedRewardKeys,
  intentLabel,
  audienceLabel,
}: {
  project?: AdminProject | null;
  templatePlan?: BuildTemplateResult | null;
  templateId?: CampaignTemplateId | null;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
  intentLabel?: string;
  audienceLabel?: string;
}): CampaignStoryboardBlock[] {
  const selectedQuestDrafts = getSelectedQuestDrafts(templatePlan, selectedQuestKeys);
  const selectedRewardDrafts = getSelectedRewardDrafts(templatePlan, selectedRewardKeys);
  const missingProjectFields = templatePlan?.missingProjectFields ?? [];
  const questsMissingContext = selectedQuestDrafts.filter(
    (quest) => quest.missingProjectFields.length > 0
  );
  const firstQuest = selectedQuestDrafts[0];
  const firstReward = selectedRewardDrafts[0];

  return [
    {
      id: "goal",
      eyebrow: "Story",
      title: "Goal",
      summary:
        templatePlan?.campaignDraft.shortDescription ||
        "Define the campaign promise before you wire in the mechanics.",
      metric: intentLabel && audienceLabel ? `${intentLabel} - ${audienceLabel}` : "Intent not locked",
      status: templatePlan ? "ready" : "draft",
      notes: [
        project ? `${project.name} anchors the campaign workspace.` : "No project selected yet.",
        audienceLabel
          ? `Audience focus: ${audienceLabel}.`
          : "Choose who this campaign is for.",
      ],
    },
    {
      id: "quest_lane",
      eyebrow: "Journey",
      title: "Quest lane",
      summary:
        selectedQuestDrafts.length > 0
          ? `${selectedQuestDrafts.length} quest draft${
              selectedQuestDrafts.length === 1 ? "" : "s"
            } will carry the first member path.`
          : "No quest lane is selected yet.",
      metric:
        selectedQuestDrafts.length > 0
          ? firstQuest?.draft.title ?? `${selectedQuestDrafts.length} selected`
          : "Choose at least one quest",
      status:
        selectedQuestDrafts.length === 0
          ? "needs_attention"
          : questsMissingContext.length > 0
            ? "needs_attention"
            : "ready",
      notes:
        selectedQuestDrafts.length > 0
          ? [
              `First member moment: ${firstQuest?.draft.title ?? "Unnamed quest"}.`,
              questsMissingContext.length > 0
                ? `Missing context: ${questsMissingContext
                    .flatMap((quest) => quest.missingProjectFields)
                    .map((field) => formatProjectFieldLabel(field))
                    .filter((value, index, values) => values.indexOf(value) === index)
                    .join(", ")}.`
                : "Quest lane is fully context-ready.",
            ]
          : ["Select at least one generated quest draft to define the campaign path."],
    },
    {
      id: "raid_pressure",
      eyebrow: "Momentum",
      title: "Raid pressure",
      summary:
        templateId === "social_raid_push" || templateId === "launch_hype_sprint"
          ? "This campaign wants a social pressure wave layered on top of the quest path."
          : "Raids are optional here, but can still be added later to create momentum spikes.",
      metric:
        templateId === "social_raid_push"
          ? "Raid-led posture"
          : "Optional layer",
      status: getRaidPressureStatus(templateId),
      notes:
        templateId === "social_raid_push"
          ? [
              "Plan for one live raid moment once the first quest lane is stable.",
              "Keep raid copy and channel targets aligned with the campaign story.",
            ]
          : [
              "You can keep the first release quest-first and add a raid later.",
              "Use raids only when the campaign needs urgency or broadcast pressure.",
            ],
    },
    {
      id: "reward_outcome",
      eyebrow: "Outcome",
      title: "Reward outcome",
      summary:
        selectedRewardDrafts.length > 0
          ? `${selectedRewardDrafts.length} reward draft${
              selectedRewardDrafts.length === 1 ? "" : "s"
            } define the payoff for contributors.`
          : "No reward outcome has been attached yet.",
      metric:
        selectedRewardDrafts.length > 0
          ? firstReward?.draft.title ?? `${selectedRewardDrafts.length} selected`
          : "Reward still open",
      status: selectedRewardDrafts.length > 0 ? "ready" : "needs_attention",
      notes:
        selectedRewardDrafts.length > 0
          ? [
              `Primary outcome: ${firstReward?.draft.title ?? "Reward draft"}.`,
              "Make sure the reward posture matches the difficulty of the quest lane.",
            ]
          : ["Attach at least one reward if this campaign should clearly telegraph the payoff."],
    },
    {
      id: "launch_posture",
      eyebrow: "Launch",
      title: "Launch posture",
      summary:
        missingProjectFields.length > 0
          ? "The campaign still needs project context before it is launch-safe."
          : "The campaign has enough workspace context to generate a clean first release.",
      metric:
        missingProjectFields.length > 0
          ? `${missingProjectFields.length} context gap${
              missingProjectFields.length === 1 ? "" : "s"
            }`
          : "Launch-safe",
      status: missingProjectFields.length > 0 ? "needs_attention" : "ready",
      notes:
        missingProjectFields.length > 0
          ? [
              `Missing: ${missingProjectFields
                .map((field) => formatProjectFieldLabel(field))
                .join(", ")}.`,
              "Patch the workspace context before turning the campaign live.",
            ]
          : [
              "Project context is strong enough to autofill campaign surfaces cleanly.",
              "Use the launch block to confirm what gets generated first.",
            ],
    },
  ];
}

export function getCampaignStoryboardBlock(
  blocks: CampaignStoryboardBlock[],
  selectedBlockId: CampaignStoryboardBlockId
) {
  return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? null;
}

export function getCampaignStoryboardWarnings(blocks: CampaignStoryboardBlock[]) {
  return blocks
    .filter((block) => block.status !== "ready")
    .map((block) => ({
      label: block.title,
      description: block.notes[0] ?? block.summary,
      tone: block.status === "needs_attention" ? ("warning" as const) : ("default" as const),
    }));
}
