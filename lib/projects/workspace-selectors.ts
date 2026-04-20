import type { AdminProject } from "@/types/entities/project";

type ProjectWorkspaceHealthInput = {
  project: AdminProject;
  campaignCount: number;
  questCount: number;
  rewardCount: number;
  operatorIncidentCount: number;
};

export type ProjectOverviewStats = {
  campaignCount: number;
  questCount: number;
  rewardCount: number;
  memberCount: number;
  connectedLinks: number;
  templateContextCount: number;
};

export function buildProjectWorkspaceHealthPills({
  project,
  campaignCount,
  questCount,
  rewardCount,
  operatorIncidentCount,
}: ProjectWorkspaceHealthInput) {
  return [
    {
      label: project.status === "active" ? "Workspace live" : `Workspace ${project.status}`,
      tone: project.status === "active" ? ("success" as const) : ("warning" as const),
    },
    {
      label:
        project.onboardingStatus === "approved"
          ? "Onboarding cleared"
          : `Onboarding ${project.onboardingStatus}`,
      tone:
        project.onboardingStatus === "approved"
          ? ("success" as const)
          : ("warning" as const),
    },
    {
      label: `${campaignCount} campaigns`,
      tone: campaignCount > 0 ? ("success" as const) : ("default" as const),
    },
    {
      label: `${questCount + rewardCount} mechanics`,
      tone: questCount + rewardCount > 0 ? ("success" as const) : ("default" as const),
    },
    {
      label:
        operatorIncidentCount > 0
          ? `${operatorIncidentCount} open incidents`
          : "No open incidents",
      tone: operatorIncidentCount > 0 ? ("warning" as const) : ("success" as const),
    },
  ];
}

export function buildProjectOverviewStats(input: ProjectOverviewStats) {
  return [
    {
      label: "Members",
      value: input.memberCount.toLocaleString(),
      sublabel: "public footprint",
    },
    {
      label: "Campaigns",
      value: String(input.campaignCount),
      sublabel: "workspace lanes",
    },
    {
      label: "Quests",
      value: String(input.questCount),
      sublabel: "active mission rails",
    },
    {
      label: "Rewards",
      value: String(input.rewardCount),
      sublabel: "claim surfaces",
    },
    {
      label: "Connected links",
      value: String(input.connectedLinks),
      sublabel: "distribution channels",
    },
    {
      label: "Template context",
      value: String(input.templateContextCount),
      sublabel: "autofill fields",
    },
  ];
}
