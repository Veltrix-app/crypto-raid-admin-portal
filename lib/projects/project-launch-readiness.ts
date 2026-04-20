import { assertProjectAccess } from "@/lib/community/project-community-auth";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  listProjectOperationAudits,
  listProjectOperationIncidents,
  listProjectOperationOverrides,
} from "@/lib/platform/core-ops";
import {
  deriveProjectOnboardingSnapshot,
  ProjectLaunchFactSnapshot,
  ProjectOnboardingSnapshot,
} from "@/lib/projects/project-onboarding";

type IntegrationRow = {
  provider: string;
  status: string;
  config: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  onboarding_status: string;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  logo: string | null;
  banner_url: string | null;
  launch_post_url: string | null;
};

type CampaignRow = {
  id: string;
  status: string;
  visibility: string | null;
};

type QuestRow = {
  id: string;
  status: string;
};

type RaidRow = {
  id: string;
  status: string;
};

type RewardRow = {
  id: string;
  visible: boolean | null;
  claimable?: boolean | null;
};

export type ProjectLaunchIssueSeverity = "critical" | "warning";
export type ProjectReadinessGroupStatus = "ready" | "watching" | "blocked";
export type ProjectLaunchReadinessTier =
  | "blocked"
  | "warming_up"
  | "launchable"
  | "live_ready";

export type ProjectLaunchReadinessIssue = {
  id: string;
  title: string;
  summary: string;
  severity: ProjectLaunchIssueSeverity;
  href: string;
};

export type ProjectLaunchReadinessAction = {
  title: string;
  summary: string;
  href: string;
};

export type ProjectLaunchReadinessGroup = {
  id: "identity" | "community" | "content" | "rewards" | "operations";
  title: string;
  status: ProjectReadinessGroupStatus;
  score: number;
  summary: string;
  signals: string[];
};

export type ProjectLaunchReadinessSnapshot = {
  score: number;
  tier: ProjectLaunchReadinessTier;
  hardBlockers: ProjectLaunchReadinessIssue[];
  softBlockers: ProjectLaunchReadinessIssue[];
  recommendedAction: ProjectLaunchReadinessAction | null;
  groups: ProjectLaunchReadinessGroup[];
  ops: {
    openIncidents: number;
    criticalIncidents: number;
    activeOverrides: number;
  };
};

export type ProjectLaunchWorkspaceSnapshot = {
  projectId: string;
  projectName: string;
  facts: ProjectLaunchFactSnapshot;
  onboarding: ProjectOnboardingSnapshot;
  readiness: ProjectLaunchReadinessSnapshot;
};

function asConfiguredCommunityTargetCount(integrations: IntegrationRow[]) {
  return integrations.filter((integration) => {
    if (!["discord", "telegram"].includes(integration.provider)) {
      return false;
    }

    const config =
      integration.config && typeof integration.config === "object" ? integration.config : {};
    const pushSettings =
      config.pushSettings && typeof config.pushSettings === "object"
        ? (config.pushSettings as Record<string, unknown>)
        : {};

    const targetChannelId =
      typeof pushSettings.targetChannelId === "string" ? pushSettings.targetChannelId.trim() : "";
    const targetChatId =
      typeof pushSettings.targetChatId === "string" ? pushSettings.targetChatId.trim() : "";
    const legacyChatId =
      typeof config.chatId === "string"
        ? config.chatId.trim()
        : typeof config.groupId === "string"
          ? config.groupId.trim()
          : "";

    return integration.provider === "discord"
      ? Boolean(targetChannelId)
      : Boolean(targetChatId || legacyChatId);
  }).length;
}

function toHref(projectId: string, suffix: string) {
  return `/projects/${projectId}${suffix}`;
}

function buildReadinessGroups(
  projectId: string,
  facts: ProjectLaunchFactSnapshot
): ProjectLaunchReadinessGroup[] {
  const liveMissionCount = facts.liveQuestCount + facts.liveRaidCount;
  const identityScore =
    (facts.hasProfileBasics ? 40 : 0) +
    (facts.hasBrandSurface ? 35 : 0) +
    (facts.hasContactEmail ? 25 : 0);
  const communityScore =
    (facts.connectedProviderCount > 0 ? 30 : 0) +
    (facts.configuredCommunityTargets > 0 ? 35 : 0) +
    (facts.testedProviderCount > 0 ? 20 : 0) +
    (facts.criticalIncidentCount === 0 ? 15 : 0);
  const contentScore =
    (facts.campaignCount > 0 ? 30 : 0) +
    (facts.questCount > 0 ? 25 : 0) +
    (facts.raidCount > 0 ? 20 : 0) +
    (liveMissionCount > 0 ? 25 : 0);
  const rewardScore =
    (facts.rewardCount > 0 ? 45 : 0) +
    (facts.liveRewardCount > 0 ? 25 : 0) +
    (facts.activeWalletCount > 0 ? 15 : 0) +
    (facts.activeAssetCount > 0 ? 15 : 0);
  const operationsScore =
    (facts.criticalIncidentCount === 0 ? 45 : 0) +
    (facts.openIncidentCount <= 2 ? 25 : 0) +
    (facts.activeOverrideCount === 0 ? 30 : 0);

  const toStatus = (score: number): ProjectReadinessGroupStatus =>
    score >= 80 ? "ready" : score >= 45 ? "watching" : "blocked";

  return [
    {
      id: "identity",
      title: "Identity",
      status: toStatus(identityScore),
      score: identityScore,
      summary:
        identityScore >= 80
          ? "Project identity is ready for launch surfaces."
          : "Profile, brand, and contact posture still need tightening.",
      signals: [
        facts.hasProfileBasics ? "Profile basics live" : "Profile basics incomplete",
        facts.hasBrandSurface ? "Brand assets present" : "Brand assets missing",
        facts.hasContactEmail ? "Contact path present" : "Contact path missing",
      ],
    },
    {
      id: "community",
      title: "Community rail",
      status: toStatus(communityScore),
      score: communityScore,
      summary:
        communityScore >= 80
          ? "Community distribution and provider rails are healthy."
          : "Provider setup or delivery targeting still needs work.",
      signals: [
        facts.connectedProviderCount > 0
          ? `${facts.connectedProviderCount} provider rail(s) connected`
          : "No live providers",
        facts.configuredCommunityTargets > 0
          ? `${facts.configuredCommunityTargets} community target(s) configured`
          : "No community targets configured",
        facts.testedProviderCount > 0
          ? `${facts.testedProviderCount} push test(s) logged`
          : "No push tests logged",
      ],
    },
    {
      id: "content",
      title: "Content spine",
      status: toStatus(contentScore),
      score: contentScore,
      summary:
        contentScore >= 80
          ? "Campaign and mission architecture is ready to run."
          : "The project still needs more launch content or live posture.",
      signals: [
        facts.campaignCount > 0 ? `${facts.campaignCount} campaign(s)` : "No campaign container",
        facts.questCount > 0 ? `${facts.questCount} quest(s)` : "No quest rail yet",
        facts.raidCount > 0 ? `${facts.raidCount} raid(s)` : "No raid rail yet",
        liveMissionCount > 0 ? `${liveMissionCount} live mission(s)` : "No live mission yet",
      ],
    },
    {
      id: "rewards",
      title: "Rewards",
      status: toStatus(rewardScore),
      score: rewardScore,
      summary:
        rewardScore >= 80
          ? "Reward and asset posture supports launch conversion."
          : "Rewards or on-chain support are still thin.",
      signals: [
        facts.rewardCount > 0 ? `${facts.rewardCount} reward(s)` : "No reward defined",
        facts.liveRewardCount > 0 ? `${facts.liveRewardCount} live reward(s)` : "No live reward",
        facts.activeWalletCount > 0 ? `${facts.activeWalletCount} active wallet(s)` : "No active wallet",
        facts.activeAssetCount > 0 ? `${facts.activeAssetCount} tracked asset(s)` : "No tracked asset",
      ],
    },
    {
      id: "operations",
      title: "Operations",
      status: toStatus(operationsScore),
      score: operationsScore,
      summary:
        operationsScore >= 80
          ? "Ops rails are calm enough for launch."
          : "Open incidents or overrides still need attention.",
      signals: [
        facts.criticalIncidentCount > 0
          ? `${facts.criticalIncidentCount} critical incident(s)`
          : "No critical incidents",
        facts.openIncidentCount > 0
          ? `${facts.openIncidentCount} open incident(s)`
          : "No open incidents",
        facts.activeOverrideCount > 0
          ? `${facts.activeOverrideCount} active override(s)`
          : "No active overrides",
      ],
    },
  ];
}

function buildReadinessSnapshot(
  projectId: string,
  facts: ProjectLaunchFactSnapshot,
  onboarding: ProjectOnboardingSnapshot
): ProjectLaunchReadinessSnapshot {
  const hardBlockers: ProjectLaunchReadinessIssue[] = [];
  const softBlockers: ProjectLaunchReadinessIssue[] = [];

  if (!facts.hasProfileBasics || !facts.hasBrandSurface || !facts.hasContactEmail) {
    hardBlockers.push({
      id: "profile_posture",
      title: "Project identity is incomplete",
      summary: "Finish the project profile, brand surface, and contact path before launch.",
      severity: "critical",
      href: toHref(projectId, "/settings"),
    });
  }

  if (facts.connectedProviderCount === 0) {
    hardBlockers.push({
      id: "provider_coverage",
      title: "No live providers connected",
      summary: "Connect verification or community providers before launch.",
      severity: "critical",
      href: toHref(projectId, "/community"),
    });
  }

  if (facts.configuredCommunityTargets === 0) {
    hardBlockers.push({
      id: "community_targets",
      title: "Community delivery targets are missing",
      summary: "Add at least one Discord or Telegram target before launch.",
      severity: "critical",
      href: toHref(projectId, "/community"),
    });
  }

  if (facts.campaignCount === 0) {
    hardBlockers.push({
      id: "campaign_spine",
      title: "No campaign spine exists yet",
      summary: "Create the first campaign so launch content has somewhere to live.",
      severity: "critical",
      href: toHref(projectId, "/campaigns"),
    });
  }

  if (facts.questCount + facts.raidCount === 0) {
    hardBlockers.push({
      id: "mission_spine",
      title: "No quest or raid is ready",
      summary: "Launch needs at least one quest or raid so members have something to do.",
      severity: "critical",
      href: "/quests/new?projectId=" + projectId,
    });
  }

  if (facts.criticalIncidentCount > 0) {
    hardBlockers.push({
      id: "critical_incidents",
      title: "Critical incidents are still open",
      summary: "Resolve the critical ops incidents before pushing launch traffic.",
      severity: "critical",
      href: toHref(projectId, "/community"),
    });
  }

  if (facts.rewardCount === 0) {
    softBlockers.push({
      id: "reward_posture",
      title: "No reward surface is prepared",
      summary: "Add a reward so launch has a clear conversion or recognition outcome.",
      severity: "warning",
      href: "/rewards/new?projectId=" + projectId,
    });
  }

  if (facts.testedProviderCount === 0) {
    softBlockers.push({
      id: "push_test",
      title: "Push rail has not been tested",
      summary: "Run at least one live Discord or Telegram push test before launch.",
      severity: "warning",
      href: toHref(projectId, "/community"),
    });
  }

  if (facts.activeOverrideCount > 0) {
    softBlockers.push({
      id: "active_overrides",
      title: "Active overrides still exist",
      summary: "Review the active overrides so launch does not start from a muted or paused state.",
      severity: "warning",
      href: toHref(projectId, "/community"),
    });
  }

  if (facts.liveCampaignCount === 0 || facts.liveQuestCount + facts.liveRaidCount === 0) {
    softBlockers.push({
      id: "live_posture",
      title: "Nothing is live yet",
      summary: "Move the first campaign and at least one mission into live posture before launch day.",
      severity: "warning",
      href: toHref(projectId, "/campaigns"),
    });
  }

  const groups = buildReadinessGroups(projectId, facts);
  const score =
    groups.length === 0
      ? 0
      : Math.round(groups.reduce((sum, group) => sum + group.score, 0) / groups.length);
  const tier: ProjectLaunchReadinessTier =
    hardBlockers.length > 0
      ? "blocked"
      : score >= 88 && softBlockers.length === 0
        ? "live_ready"
        : score >= 70
          ? "launchable"
          : "warming_up";

  const recommendedAction =
    hardBlockers[0]
      ? {
          title: hardBlockers[0].title,
          summary: hardBlockers[0].summary,
          href: hardBlockers[0].href,
        }
      : onboarding.nextAction
        ? {
            title: onboarding.nextAction.title,
            summary: onboarding.nextAction.summary,
            href: onboarding.nextAction.href,
          }
        : softBlockers[0]
          ? {
              title: softBlockers[0].title,
              summary: softBlockers[0].summary,
              href: softBlockers[0].href,
            }
          : null;

  return {
    score,
    tier,
    hardBlockers,
    softBlockers,
    recommendedAction,
    groups,
    ops: {
      openIncidents: facts.openIncidentCount,
      criticalIncidents: facts.criticalIncidentCount,
      activeOverrides: facts.activeOverrideCount,
    },
  };
}

export async function loadProjectLaunchWorkspaceSnapshot(
  projectId: string
): Promise<ProjectLaunchWorkspaceSnapshot> {
  const access = await assertProjectAccess(projectId);
  const supabase = getServiceSupabaseClient();

  const [
    { data: project, error: projectError },
    { data: integrations, error: integrationsError },
    { count: walletCount, error: walletError },
    { count: assetCount, error: assetError },
    { data: campaigns, error: campaignsError },
    { data: quests, error: questsError },
    { data: raids, error: raidsError },
    { data: rewards, error: rewardsError },
    audits,
    incidents,
    overrides,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, status, onboarding_status, description, website, contact_email, logo, banner_url, launch_post_url"
      )
      .eq("id", access.projectId)
      .maybeSingle(),
    supabase
      .from("project_integrations")
      .select("provider, status, config")
      .eq("project_id", access.projectId),
    supabase
      .from("project_wallets")
      .select("id", { count: "exact", head: true })
      .eq("project_id", access.projectId)
      .eq("is_active", true),
    supabase
      .from("project_assets")
      .select("id", { count: "exact", head: true })
      .eq("project_id", access.projectId)
      .eq("is_active", true),
    supabase
      .from("campaigns")
      .select("id, status, visibility")
      .eq("project_id", access.projectId),
    supabase
      .from("quests")
      .select("id, status")
      .eq("project_id", access.projectId),
    supabase
      .from("raids")
      .select("id, status")
      .eq("project_id", access.projectId),
    supabase
      .from("rewards")
      .select("id, visible, claimable")
      .eq("project_id", access.projectId),
    listProjectOperationAudits(access.projectId),
    listProjectOperationIncidents(access.projectId),
    listProjectOperationOverrides(access.projectId),
  ]);

  if (projectError) {
    throw new Error(projectError.message || "Failed to load project launch data.");
  }
  if (!project) {
    throw new Error("Project not found for launch readiness.");
  }
  if (integrationsError) {
    throw new Error(integrationsError.message || "Failed to load project integrations.");
  }
  if (walletError) {
    throw new Error(walletError.message || "Failed to load project wallets.");
  }
  if (assetError) {
    throw new Error(assetError.message || "Failed to load project assets.");
  }
  if (campaignsError) {
    throw new Error(campaignsError.message || "Failed to load campaigns.");
  }
  if (questsError) {
    throw new Error(questsError.message || "Failed to load quests.");
  }
  if (raidsError) {
    throw new Error(raidsError.message || "Failed to load raids.");
  }
  if (rewardsError) {
    throw new Error(rewardsError.message || "Failed to load rewards.");
  }

  const integrationRows = (integrations ?? []) as IntegrationRow[];
  const usableIntegrations = integrationRows.filter((row) =>
    ["connected", "needs_attention"].includes(row.status)
  );
  const usableCommunityIntegrations = usableIntegrations.filter((row) =>
    ["discord", "telegram"].includes(row.provider)
  );
  const pushTestCount = audits.filter(
    (audit) => audit.object_type === "provider_sync" && audit.action_type === "tested"
  ).length;
  const openIncidents = incidents.filter((incident) =>
    ["open", "watching"].includes(incident.status)
  );
  const criticalIncidents = openIncidents.filter((incident) => incident.severity === "critical");
  const activeOverrides = overrides.filter((override) => override.status === "active");
  const campaignRows = (campaigns ?? []) as CampaignRow[];
  const questRows = (quests ?? []) as QuestRow[];
  const raidRows = (raids ?? []) as RaidRow[];
  const rewardRows = (rewards ?? []) as RewardRow[];
  const projectRow = project as ProjectRow;

  const facts: ProjectLaunchFactSnapshot = {
    projectId: access.projectId,
    projectName: projectRow.name,
    projectStatus: projectRow.status,
    onboardingStatus: projectRow.onboarding_status,
    hasProfileBasics: Boolean(
      projectRow.description?.trim() &&
        projectRow.website?.trim()
    ),
    hasBrandSurface: Boolean(projectRow.logo?.trim() && projectRow.banner_url?.trim()),
    hasContactEmail: Boolean(projectRow.contact_email?.trim()),
    connectedProviderCount: usableIntegrations.length,
    connectedCommunityProviderCount: usableCommunityIntegrations.length,
    configuredCommunityTargets: asConfiguredCommunityTargetCount(usableCommunityIntegrations),
    activeWalletCount: walletCount ?? 0,
    activeAssetCount: assetCount ?? 0,
    campaignCount: campaignRows.length,
    liveCampaignCount: campaignRows.filter((row) => row.status === "active").length,
    questCount: questRows.length,
    liveQuestCount: questRows.filter((row) => row.status === "active").length,
    raidCount: raidRows.length,
    liveRaidCount: raidRows.filter((row) => row.status === "active").length,
    rewardCount: rewardRows.length,
    liveRewardCount: rewardRows.filter(
      (row) => row.visible !== false || row.claimable === true
    ).length,
    testedProviderCount: pushTestCount,
    openIncidentCount: openIncidents.length,
    criticalIncidentCount: criticalIncidents.length,
    activeOverrideCount: activeOverrides.length,
  };

  const onboarding = deriveProjectOnboardingSnapshot(facts);
  const readiness = buildReadinessSnapshot(access.projectId, facts, onboarding);

  return {
    projectId: access.projectId,
    projectName: projectRow.name,
    facts,
    onboarding,
    readiness,
  };
}
