import {
  getRecommendedCampaignTemplateOptions,
  type CampaignTemplateId,
} from "@/lib/campaign-templates";
import type { AdminProject } from "@/types/entities/project";
import type {
  AdminProjectBuilderTemplate,
  AdminProjectBuilderTemplateKind,
} from "@/types/entities/project-builder-template";

type ProjectLibraryProject = {
  id: string;
  name: string;
};

function toTemplateProject(project: ProjectLibraryProject): AdminProject {
  return {
    id: project.id,
    name: project.name,
    slug: "",
    chain: "",
    category: "",
    status: "draft",
    onboardingStatus: "draft",
    description: "",
    longDescription: "",
    members: 0,
    campaigns: 0,
    logo: "",
    bannerUrl: "",
    website: "",
    xUrl: "",
    telegramUrl: "",
    discordUrl: "",
    docsUrl: "",
    waitlistUrl: "",
    launchPostUrl: "",
    tokenContractAddress: "",
    nftContractAddress: "",
    primaryWallet: "",
    brandAccent: "",
    brandMood: "",
    contactEmail: "",
    isFeatured: false,
    isPublic: true,
  };
}

export type ProjectBuilderLibraryItem = {
  id: string;
  kind: AdminProjectBuilderTemplateKind;
  title: string;
  summary: string;
  href: string;
  cta: string;
  source: "built_in" | "project_saved";
  fitLabel?: string;
  fitReasons?: string[];
};

export type ProjectBuilderLibrarySection = {
  kind: AdminProjectBuilderTemplateKind;
  title: string;
  description: string;
  items: ProjectBuilderLibraryItem[];
};

function withCampaignContext(basePath: string, projectId: string, campaignId?: string | null) {
  const params = new URLSearchParams({ projectId });
  if (campaignId) {
    params.set("campaignId", campaignId);
  }
  return `${basePath}?${params.toString()}`;
}

function buildCampaignSection(input: {
  project: ProjectLibraryProject;
  savedTemplates: AdminProjectBuilderTemplate[];
}) {
  const savedItems = input.savedTemplates
    .filter((template) => template.templateKind === "campaign")
    .map<ProjectBuilderLibraryItem>((template) => ({
      id: template.id,
      kind: "campaign",
      title: template.name,
      summary:
        template.description ||
        "A saved project campaign variant ready to reopen in Campaign Studio.",
      href: `/campaigns/new?projectId=${input.project.id}&savedTemplateId=${template.legacyCampaignTemplateId ?? template.id}`,
      cta: "Open saved variant",
      source: "project_saved",
    }));

  const builtInItems = getRecommendedCampaignTemplateOptions(
    toTemplateProject(input.project)
  )
    .slice(0, 4)
    .map<ProjectBuilderLibraryItem>((template) => ({
      id: `builtin:${template.id}`,
      kind: "campaign",
      title: template.label,
      summary: template.summary,
      href: `/campaigns/new?projectId=${input.project.id}&templateId=${template.id satisfies CampaignTemplateId}`,
      cta: "Open Campaign Studio",
      source: "built_in",
      fitLabel: template.fitLabel,
      fitReasons: template.fitReasons,
    }));

  return {
    kind: "campaign" as const,
    title: "Campaign packs",
    description:
      "Start from proven campaign playbooks or reopen saved project variants without losing workspace context.",
    items: [...savedItems, ...builtInItems],
  };
}

function buildQuestSection(input: {
  project: ProjectLibraryProject;
  campaignId?: string | null;
}): ProjectBuilderLibrarySection {
  return {
    kind: "quest",
    title: "Quest kits",
    description:
      "Use project-aware quest starters when the next step is a member action, not a full campaign architecture pass.",
    items: [
      {
        id: "quest-community-join",
        kind: "quest",
        title: "Community join quest",
        summary:
          "Spin up a clean first quest for follows, joins or a first visit without losing project context.",
        href: withCampaignContext("/quests/new", input.project.id, input.campaignId),
        cta: "Open Quest Studio",
        source: "built_in",
      },
      {
        id: "quest-proof-lane",
        kind: "quest",
        title: "Proof-based quest",
        summary:
          "Start a higher-trust quest when the member must submit public proof, a URL or a manual confirmation.",
        href: withCampaignContext("/quests/new", input.project.id, input.campaignId),
        cta: "Open Quest Studio",
        source: "built_in",
      },
    ],
  };
}

function buildRaidSection(input: {
  project: ProjectLibraryProject;
  campaignId?: string | null;
}): ProjectBuilderLibrarySection {
  return {
    kind: "raid",
    title: "Raid kits",
    description:
      "Launch pressure-based missions with the right project and campaign context already attached.",
    items: [
      {
        id: "raid-launch-wave",
        kind: "raid",
        title: "Launch pressure wave",
        summary:
          "Create a focused raid for a launch post, announcement or short-lived attention moment.",
        href: withCampaignContext("/raids/new", input.project.id, input.campaignId),
        cta: "Open Raid Builder",
        source: "built_in",
      },
      {
        id: "raid-reminder-wave",
        kind: "raid",
        title: "Reminder wave",
        summary:
          "Set up a smaller follow-up raid when the campaign needs one more pressure spike before results cool off.",
        href: withCampaignContext("/raids/new", input.project.id, input.campaignId),
        cta: "Open Raid Builder",
        source: "built_in",
      },
    ],
  };
}

function buildPlaybookSection(input: {
  project: ProjectLibraryProject;
}): ProjectBuilderLibrarySection {
  return {
    kind: "playbook",
    title: "Playbooks",
    description:
      "Jump straight into the project operating rails when the right move is coordination, readiness or community execution.",
    items: [
      {
        id: "playbook-launch-workspace",
        kind: "playbook",
        title: "Launch readiness rail",
        summary:
          "Open the launch workspace to move through setup, blockers, first content and launch posture in order.",
        href: `/projects/${input.project.id}/launch`,
        cta: "Open launch rail",
        source: "built_in",
      },
      {
        id: "playbook-community-os",
        kind: "playbook",
        title: "Community activation rail",
        summary:
          "Move into Community OS when the next step is channels, leaderboards, automations or captain operations.",
        href: `/projects/${input.project.id}/community`,
        cta: "Open Community OS",
        source: "built_in",
      },
    ],
  };
}

export function buildProjectBuilderLibrary(input: {
  project: ProjectLibraryProject;
  campaignId?: string | null;
  savedTemplates?: AdminProjectBuilderTemplate[];
}) {
  return [
    buildCampaignSection({
      project: input.project,
      savedTemplates: input.savedTemplates ?? [],
    }),
    buildQuestSection({
      project: input.project,
      campaignId: input.campaignId,
    }),
    buildRaidSection({
      project: input.project,
      campaignId: input.campaignId,
    }),
    buildPlaybookSection({
      project: input.project,
    }),
  ] satisfies ProjectBuilderLibrarySection[];
}
