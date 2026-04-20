export type ProjectOnboardingStepId =
  | "project_profile"
  | "integrations"
  | "community_targets"
  | "first_campaign"
  | "first_quest"
  | "first_raid"
  | "first_reward"
  | "push_test";

export type ProjectOnboardingStepStatus = "complete" | "attention" | "blocked";

export type ProjectLaunchFactSnapshot = {
  projectId: string;
  projectName: string;
  projectStatus: string;
  onboardingStatus: string;
  hasProfileBasics: boolean;
  hasBrandSurface: boolean;
  hasContactEmail: boolean;
  connectedProviderCount: number;
  connectedCommunityProviderCount: number;
  configuredCommunityTargets: number;
  activeWalletCount: number;
  activeAssetCount: number;
  campaignCount: number;
  liveCampaignCount: number;
  questCount: number;
  liveQuestCount: number;
  raidCount: number;
  liveRaidCount: number;
  rewardCount: number;
  liveRewardCount: number;
  testedProviderCount: number;
  openIncidentCount: number;
  criticalIncidentCount: number;
  activeOverrideCount: number;
};

export type ProjectOnboardingStep = {
  id: ProjectOnboardingStepId;
  title: string;
  summary: string;
  metric: string;
  status: ProjectOnboardingStepStatus;
  href: string;
  blockers: string[];
};

export type ProjectOnboardingAction = {
  stepId: ProjectOnboardingStepId;
  title: string;
  summary: string;
  href: string;
};

export type ProjectOnboardingSnapshot = {
  totalSteps: number;
  completedSteps: number;
  completionRatio: number;
  steps: ProjectOnboardingStep[];
  nextAction: ProjectOnboardingAction | null;
};

function buildProjectPath(projectId: string, suffix: string) {
  return `/projects/${projectId}${suffix}`;
}

function buildProjectBuilderPath(pathname: string, projectId: string) {
  return `${pathname}?projectId=${projectId}`;
}

export function deriveProjectOnboardingSnapshot(
  facts: ProjectLaunchFactSnapshot
): ProjectOnboardingSnapshot {
  const profileComplete =
    facts.hasProfileBasics && facts.hasBrandSurface && facts.hasContactEmail;
  const hasCommunityTargets = facts.configuredCommunityTargets > 0;
  const hasMissionRail = facts.questCount + facts.raidCount > 0;
  const hasPushTests = facts.testedProviderCount > 0;

  const steps: ProjectOnboardingStep[] = [
    {
      id: "project_profile",
      title: "Project profile",
      summary: profileComplete
        ? "Identity, brand surface and contact details are present."
        : "Finish the core project profile before the team starts launching content.",
      metric: profileComplete ? "Ready" : "Needs profile polish",
      status: profileComplete ? "complete" : "blocked",
      href: buildProjectPath(facts.projectId, "/settings"),
      blockers: profileComplete
        ? []
        : [
            ...(!facts.hasProfileBasics ? ["Add website, description and project basics."] : []),
            ...(!facts.hasBrandSurface ? ["Add logo and banner so the launch surface feels real."] : []),
            ...(!facts.hasContactEmail ? ["Add a contact email for operator handoff."] : []),
          ],
    },
    {
      id: "integrations",
      title: "Integrations",
      summary:
        facts.connectedProviderCount > 0
          ? "At least one verification or community provider is connected."
          : "Connect Discord, Telegram or X so the project can verify and distribute missions.",
      metric:
        facts.connectedProviderCount > 0
          ? `${facts.connectedProviderCount} provider${facts.connectedProviderCount === 1 ? "" : "s"} online`
          : "No live providers",
      status: facts.connectedProviderCount > 0 ? "complete" : "blocked",
      href: buildProjectPath(facts.projectId, "/community"),
      blockers:
        facts.connectedProviderCount > 0
          ? []
          : ["Connect at least one live provider before launch."],
    },
    {
      id: "community_targets",
      title: "Community targets",
      summary: hasCommunityTargets
        ? "Community channels are configured for delivery and bot operations."
        : facts.connectedCommunityProviderCount > 0
          ? "Providers exist, but the delivery targets are still missing."
          : "Add Discord or Telegram targets so pushes and bot actions land somewhere real.",
      metric: hasCommunityTargets
        ? `${facts.configuredCommunityTargets} target${facts.configuredCommunityTargets === 1 ? "" : "s"} configured`
        : "Targets missing",
      status: hasCommunityTargets
        ? "complete"
        : facts.connectedCommunityProviderCount > 0
          ? "attention"
          : "blocked",
      href: buildProjectPath(facts.projectId, "/community"),
      blockers:
        hasCommunityTargets
          ? []
          : ["Configure a Discord channel or Telegram chat for launch delivery."],
    },
    {
      id: "first_campaign",
      title: "First campaign",
      summary:
        facts.campaignCount > 0
          ? "The project already has a campaign container."
          : "Create the first campaign so quests, raids and rewards have a launch spine.",
      metric:
        facts.campaignCount > 0
          ? `${facts.campaignCount} campaign${facts.campaignCount === 1 ? "" : "s"}`
          : "No campaign yet",
      status: facts.campaignCount > 0 ? "complete" : "blocked",
      href: buildProjectPath(facts.projectId, "/campaigns"),
      blockers:
        facts.campaignCount > 0 ? [] : ["Create the first campaign before building the launch stack."],
    },
    {
      id: "first_quest",
      title: "First quest",
      summary:
        facts.questCount > 0
          ? "At least one quest is ready for the member journey."
          : facts.campaignCount > 0
            ? "Add the first quest so the campaign has a clear member action."
            : "Create a campaign first so the quest has somewhere to live.",
      metric:
        facts.questCount > 0
          ? `${facts.questCount} quest${facts.questCount === 1 ? "" : "s"}`
          : "No quest yet",
      status:
        facts.questCount > 0 ? "complete" : facts.campaignCount > 0 ? "attention" : "blocked",
      href: buildProjectBuilderPath("/quests/new", facts.projectId),
      blockers:
        facts.questCount > 0
          ? []
          : facts.campaignCount > 0
            ? ["Create the first quest so the launch has a direct member CTA."]
            : ["Create a campaign before adding quests."],
    },
    {
      id: "first_raid",
      title: "First raid",
      summary:
        facts.raidCount > 0
          ? "The project has a pressure mission ready."
          : facts.campaignCount > 0
            ? "Add a raid if the project wants community pressure and live coordination."
            : "Create a campaign first so raid pressure can attach to a launch lane.",
      metric:
        facts.raidCount > 0
          ? `${facts.raidCount} raid${facts.raidCount === 1 ? "" : "s"}`
          : "No raid yet",
      status:
        facts.raidCount > 0 ? "complete" : facts.campaignCount > 0 ? "attention" : "blocked",
      href: buildProjectBuilderPath("/raids/new", facts.projectId),
      blockers:
        facts.raidCount > 0
          ? []
          : facts.campaignCount > 0
            ? ["Create a raid if you want a live pressure lane at launch."]
            : ["Create a campaign before adding raids."],
    },
    {
      id: "first_reward",
      title: "First reward",
      summary:
        facts.rewardCount > 0
          ? "The project has a reward or claim surface prepared."
          : "Add a reward so the launch has an explicit conversion or recognition layer.",
      metric:
        facts.rewardCount > 0
          ? `${facts.rewardCount} reward${facts.rewardCount === 1 ? "" : "s"}`
          : "No reward yet",
      status: facts.rewardCount > 0 ? "complete" : "attention",
      href: buildProjectBuilderPath("/rewards/new", facts.projectId),
      blockers:
        facts.rewardCount > 0 ? [] : ["Create the first reward or claimable outcome."],
    },
    {
      id: "push_test",
      title: "Push test",
      summary: hasPushTests
        ? "A live provider test was already sent through the project rail."
        : hasCommunityTargets
          ? "Run one live push test before launch day."
          : "Configure delivery targets first, then run a push test.",
      metric: hasPushTests
        ? `${facts.testedProviderCount} test${facts.testedProviderCount === 1 ? "" : "s"} logged`
        : "No push test yet",
      status: hasPushTests ? "complete" : hasCommunityTargets ? "attention" : "blocked",
      href: buildProjectPath(facts.projectId, "/community"),
      blockers:
        hasPushTests
          ? []
          : hasCommunityTargets
            ? ["Run a Discord or Telegram test push before launch."]
            : ["Configure a community target before running a push test."],
    },
  ];

  const completedSteps = steps.filter((step) => step.status === "complete").length;
  const nextStep =
    steps.find((step) => step.status === "blocked") ??
    steps.find((step) => step.status === "attention") ??
    null;

  return {
    totalSteps: steps.length,
    completedSteps,
    completionRatio: steps.length === 0 ? 0 : completedSteps / steps.length,
    steps,
    nextAction: nextStep
      ? {
          stepId: nextStep.id,
          title: nextStep.title,
          summary: nextStep.summary,
          href: nextStep.href,
        }
      : null,
  };
}
