import {
  getServiceSupabaseClient,
  loadCommunitySettingsRows,
} from "@/lib/community/project-community-ops";

type ConnectedProvider = "discord" | "telegram" | "x";
type ContributorCohort = "newcomer" | "warming_up" | "core" | "watchlist" | "reactivation";
type CaptainRole = "community_captain" | "raid_lead" | "growth_lead";

type CaptainAssignmentRow = {
  authUserId?: string;
  role?: string;
  label?: string;
};

type TrustReasons = Record<string, unknown>;

type ContributorBaseRow = {
  auth_user_id: string;
  xp: number | null;
  level: number | null;
  trust_score: number | null;
  quests_completed: number | null;
  raids_completed: number | null;
};

type CommunityGrowthContributor = {
  authUserId: string;
  username: string;
  xp: number;
  level: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
  linkedProviders: ConnectedProvider[];
  walletVerified: boolean;
  riskLabel: string;
  openFlagCount: number;
  recentXp: number;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  cohort: ContributorCohort;
  readinessGaps: string[];
  trustReasons: string[];
  recentFlagReasons: string[];
  commandReady: boolean;
  fullStackReady: boolean;
};

type CommunityCaptainAssignment = {
  authUserId: string;
  role: CaptainRole;
  label: string;
};

type CommunityCaptainCard = CommunityCaptainAssignment & {
  username: string;
  xp: number;
  trust: number;
  linkedProviders: ConnectedProvider[];
  walletVerified: boolean;
  openFlagCount: number;
  readinessSummary: string;
};

type CommunityCaptainCandidate = {
  authUserId: string;
  username: string;
  source: "team" | "contributors";
  roleHint: string;
  xp: number;
  trust: number;
  linkedProviders: ConnectedProvider[];
  walletVerified: boolean;
  openFlagCount: number;
};

type CohortSummary = {
  totalContributors: number;
  newcomers: number;
  warmingUp: number;
  core: number;
  highTrust: number;
  watchlist: number;
  reactivation: number;
  commandReady: number;
  fullStackReady: number;
  openFlags: number;
};

type CommunityAnalytics = {
  contributorCount: number;
  commandReadyRate: number;
  walletVerifiedRate: number;
  fullStackReadyRate: number;
  recentActiveRate: number;
  newcomerReadyCount: number;
  reactivationReadyCount: number;
  highTrustCount: number;
  highTrustRate: number;
  commandGapCount: number;
  walletGapCount: number;
  xGapCount: number;
  retentionPressureCount: number;
  averageTrust: number;
  watchlistCount: number;
  openFlagCount: number;
  captainCount: number;
  activeCampaignCount: number;
  activationReadyCount: number;
  recentXp: number;
};

type ActivationBoard = {
  campaignId: string;
  title: string;
  featured: boolean;
  activationScore: number;
  readyContributors: number;
  newcomerCandidates: number;
  reactivationCandidates: number;
  coreCandidates: number;
  questCount: number;
  raidCount: number;
  rewardCount: number;
  recommendedLane: "newcomer" | "reactivation" | "core";
  recommendedCopy: string;
};

export type ProjectCommunityGrowthPayload = {
  captains: {
    enabled: boolean;
    assignments: CommunityCaptainCard[];
    candidates: CommunityCaptainCandidate[];
  };
  cohorts: {
    summary: CohortSummary;
    newcomers: CommunityGrowthContributor[];
    warmingUp: CommunityGrowthContributor[];
    core: CommunityGrowthContributor[];
    highTrust: CommunityGrowthContributor[];
    watchlist: CommunityGrowthContributor[];
    reactivation: CommunityGrowthContributor[];
  };
  analytics: CommunityAnalytics;
  trust: {
    averageTrust: number;
    openFlagCount: number;
    watchlistCount: number;
    latestIssue: string;
  };
  activationBoards: ActivationBoard[];
  settings: {
    captainsEnabled: boolean;
    newcomerFunnelEnabled: boolean;
    reactivationFunnelEnabled: boolean;
    activationBoardsEnabled: boolean;
    activationBoardCadence: "manual" | "daily" | "weekly";
    captainAssignments: CommunityCaptainAssignment[];
    lastNewcomerPushAt: string;
    lastReactivationPushAt: string;
    lastActivationBoardAt: string;
  };
};

function roundPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function daysSince(value: string | null) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  return diff >= 0 ? Math.floor(diff / (24 * 60 * 60 * 1000)) : 0;
}

function normalizeCaptainRole(value: unknown): CaptainRole {
  return value === "raid_lead" || value === "growth_lead" ? value : "community_captain";
}

function sanitizeCaptainAssignments(input: unknown) {
  if (!Array.isArray(input)) return [] as CommunityCaptainAssignment[];

  return input
    .map((candidate) => {
      const row =
        candidate && typeof candidate === "object"
          ? (candidate as CaptainAssignmentRow)
          : ({} as CaptainAssignmentRow);

      const authUserId =
        typeof row.authUserId === "string" ? row.authUserId.trim() : "";
      const label = typeof row.label === "string" ? row.label.trim() : "";

      return {
        authUserId,
        role: normalizeCaptainRole(row.role),
        label,
      };
    })
    .filter((row) => row.authUserId.length > 0);
}

function humanizeCaptainRole(role: CaptainRole) {
  if (role === "raid_lead") return "Raid lead";
  if (role === "growth_lead") return "Growth lead";
  return "Community captain";
}

function parseTrustReasons(value: unknown) {
  if (!value || typeof value !== "object") return [] as string[];
  return Object.keys(value as TrustReasons)
    .map((key) => key.replace(/[_-]+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildReadinessGaps(input: {
  linkedProviders: ConnectedProvider[];
  walletVerified: boolean;
  trust: number;
  openFlagCount: number;
}) {
  const gaps: string[] = [];

  if (!input.linkedProviders.includes("discord") && !input.linkedProviders.includes("telegram")) {
    gaps.push("Connect Discord or Telegram");
  }
  if (!input.linkedProviders.includes("x")) {
    gaps.push("Link X");
  }
  if (!input.walletVerified) {
    gaps.push("Verify wallet");
  }
  if (input.trust < 60) {
    gaps.push("Raise trust");
  }
  if (input.openFlagCount > 0) {
    gaps.push("Resolve review flags");
  }

  return gaps;
}

function classifyContributor(input: {
  xp: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
  riskLabel: string;
  openFlagCount: number;
  lastActiveAt: string | null;
  fullStackReady: boolean;
}) {
  const totalActions = input.questsCompleted + input.raidsCompleted;
  const daysInactive = daysSince(input.lastActiveAt);
  const flaggedRiskLabels = new Set(["watch", "watched", "flagged", "high_risk"]);

  if (
    input.openFlagCount > 0 ||
    flaggedRiskLabels.has(input.riskLabel) ||
    input.trust < 45
  ) {
    return "watchlist" as const;
  }

  if (input.xp < 150 || totalActions <= 1) {
    return "newcomer" as const;
  }

  if (daysInactive !== null && daysInactive >= 14 && input.xp >= 250) {
    return "reactivation" as const;
  }

  if (input.fullStackReady && input.trust >= 70 && totalActions >= 4) {
    return "core" as const;
  }

  return "warming_up" as const;
}

function buildActivationScore(input: {
  featured: boolean;
  readyContributors: number;
  newcomerCandidates: number;
  reactivationCandidates: number;
  coreCandidates: number;
  questCount: number;
  raidCount: number;
  rewardCount: number;
}) {
  const raw =
    (input.featured ? 12 : 0) +
    input.questCount * 8 +
    input.raidCount * 12 +
    input.rewardCount * 5 +
    input.readyContributors * 2 +
    input.coreCandidates * 3 +
    input.newcomerCandidates +
    input.reactivationCandidates * 2;

  return Math.max(0, Math.min(100, raw));
}

export async function loadProjectCommunityGrowth(
  projectId: string
): Promise<ProjectCommunityGrowthPayload> {
  const supabase = getServiceSupabaseClient();

  const [
    { data: reputationRows, error: reputationError },
    { data: teamRows, error: teamError },
    { data: reviewFlagRows, error: reviewFlagError },
    { data: projectRow, error: projectError },
    { data: campaignRows, error: campaignError },
    { data: questRows, error: questError },
    { data: raidRows, error: raidError },
    { data: rewardRows, error: rewardError },
    settingsRows,
  ] = await Promise.all([
    supabase
      .from("user_project_reputation")
      .select("auth_user_id, xp, level, trust_score, quests_completed, raids_completed")
      .eq("project_id", projectId)
      .order("xp", { ascending: false })
      .limit(250),
    supabase
      .from("team_members")
      .select("auth_user_id, name, email, role, status")
      .eq("project_id", projectId)
      .eq("status", "active"),
    supabase
      .from("review_flags")
      .select("auth_user_id, severity, reason, status")
      .eq("project_id", projectId)
      .eq("status", "open"),
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, title, featured, status")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("quests")
      .select("id, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active"),
    supabase
      .from("raids")
      .select("id, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active"),
    supabase
      .from("rewards")
      .select("id, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .eq("visible", true),
    loadCommunitySettingsRows(projectId),
  ]);

  if (reputationError) throw new Error(reputationError.message);
  if (teamError) throw new Error(teamError.message);
  if (reviewFlagError) throw new Error(reviewFlagError.message);
  if (projectError) throw new Error(projectError.message || "Project not found.");
  if (campaignError) throw new Error(campaignError.message);
  if (questError) throw new Error(questError.message);
  if (raidError) throw new Error(raidError.message);
  if (rewardError) throw new Error(rewardError.message);

  const normalizedReputationRows = (reputationRows ?? []) as ContributorBaseRow[];
  const authUserIds = Array.from(
    new Set(normalizedReputationRows.map((row) => row.auth_user_id).filter(Boolean))
  );

  const [
    { data: connectedAccounts, error: accountError },
    { data: walletRows, error: walletError },
    { data: profileRows, error: profileError },
    { data: trustRows, error: trustError },
    { data: xpEventRows, error: xpEventError },
  ] = authUserIds.length
    ? await Promise.all([
        supabase
          .from("user_connected_accounts")
          .select("auth_user_id, provider")
          .eq("status", "connected")
          .in("provider", ["discord", "telegram", "x"])
          .in("auth_user_id", authUserIds),
        supabase
          .from("wallet_links")
          .select("auth_user_id, risk_label")
          .in("auth_user_id", authUserIds),
        supabase
          .from("user_profiles")
          .select("auth_user_id, username")
          .in("auth_user_id", authUserIds),
        supabase
          .from("trust_snapshots")
          .select("auth_user_id, score, reasons, created_at")
          .in("auth_user_id", authUserIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("xp_events")
          .select("auth_user_id, effective_xp, created_at")
          .eq("project_id", projectId)
          .gte(
            "created_at",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order("created_at", { ascending: false })
          .limit(5000),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (accountError) throw new Error(accountError.message);
  if (walletError) throw new Error(walletError.message);
  if (profileError) throw new Error(profileError.message);
  if (trustError) throw new Error(trustError.message);
  if (xpEventError) throw new Error(xpEventError.message);

  const connectedByAuthUserId = new Map<string, Set<ConnectedProvider>>();
  for (const account of (connectedAccounts ?? []) as Array<{
    auth_user_id: string;
    provider: ConnectedProvider;
  }>) {
    const providers = connectedByAuthUserId.get(account.auth_user_id) ?? new Set<ConnectedProvider>();
    providers.add(account.provider);
    connectedByAuthUserId.set(account.auth_user_id, providers);
  }

  const usernameByAuthUserId = new Map<string, string>();
  for (const profile of (profileRows ?? []) as Array<{
    auth_user_id: string;
    username: string | null;
  }>) {
    if (profile.username?.trim()) {
      usernameByAuthUserId.set(profile.auth_user_id, profile.username.trim());
    }
  }

  const walletRowsByAuthUserId = new Map<string, Array<{ risk_label: string | null }>>();
  for (const walletRow of (walletRows ?? []) as Array<{
    auth_user_id: string;
    risk_label: string | null;
  }>) {
    const current = walletRowsByAuthUserId.get(walletRow.auth_user_id) ?? [];
    current.push(walletRow);
    walletRowsByAuthUserId.set(walletRow.auth_user_id, current);
  }

  const latestTrustByAuthUserId = new Map<
    string,
    { score: number; reasons: string[]; createdAt: string }
  >();
  for (const trustRow of (trustRows ?? []) as Array<{
    auth_user_id: string;
    score: number | null;
    reasons: unknown;
    created_at: string;
  }>) {
    if (!latestTrustByAuthUserId.has(trustRow.auth_user_id)) {
      latestTrustByAuthUserId.set(trustRow.auth_user_id, {
        score: Number(trustRow.score ?? 50),
        reasons: parseTrustReasons(trustRow.reasons),
        createdAt: trustRow.created_at,
      });
    }
  }

  const xpActivityByAuthUserId = new Map<
    string,
    { recentXp: number; lastActiveAt: string | null }
  >();
  for (const event of (xpEventRows ?? []) as Array<{
    auth_user_id: string;
    effective_xp: number | null;
    created_at: string;
  }>) {
    const current =
      xpActivityByAuthUserId.get(event.auth_user_id) ?? { recentXp: 0, lastActiveAt: null };
    current.recentXp += Number(event.effective_xp ?? 0);
    if (!current.lastActiveAt) {
      current.lastActiveAt = event.created_at;
    }
    xpActivityByAuthUserId.set(event.auth_user_id, current);
  }

  const reviewFlagsByAuthUserId = new Map<string, Array<{ reason: string; severity: string }>>();
  for (const flag of (reviewFlagRows ?? []) as Array<{
    auth_user_id: string | null;
    reason: string;
    severity: string;
  }>) {
    if (!flag.auth_user_id) continue;
    const current = reviewFlagsByAuthUserId.get(flag.auth_user_id) ?? [];
    current.push({ reason: flag.reason, severity: flag.severity });
    reviewFlagsByAuthUserId.set(flag.auth_user_id, current);
  }

  const contributors = normalizedReputationRows.map((row) => {
    const linkedProviders = Array.from(
      connectedByAuthUserId.get(row.auth_user_id) ?? new Set<ConnectedProvider>()
    );
    const walletInfo = walletRowsByAuthUserId.get(row.auth_user_id) ?? [];
    const riskLabel =
      walletInfo.find((item) => item.risk_label && item.risk_label !== "unknown")?.risk_label ??
      walletInfo[0]?.risk_label ??
      "unknown";
    const walletVerified = walletInfo.length > 0;
    const latestTrust = latestTrustByAuthUserId.get(row.auth_user_id);
    const xpActivity = xpActivityByAuthUserId.get(row.auth_user_id);
    const trust = latestTrust?.score ?? Number(row.trust_score ?? 50);
    const commandReady =
      linkedProviders.includes("discord") || linkedProviders.includes("telegram");
    const fullStackReady = commandReady && linkedProviders.includes("x") && walletVerified;
    const openFlags = reviewFlagsByAuthUserId.get(row.auth_user_id) ?? [];
    const readinessGaps = buildReadinessGaps({
      linkedProviders,
      walletVerified,
      trust,
      openFlagCount: openFlags.length,
    });
    const cohort = classifyContributor({
      xp: Number(row.xp ?? 0),
      trust,
      questsCompleted: Number(row.quests_completed ?? 0),
      raidsCompleted: Number(row.raids_completed ?? 0),
      riskLabel,
      openFlagCount: openFlags.length,
      lastActiveAt: xpActivity?.lastActiveAt ?? null,
      fullStackReady,
    });

    return {
      authUserId: row.auth_user_id,
      username:
        usernameByAuthUserId.get(row.auth_user_id) ?? `pilot-${row.auth_user_id.slice(0, 6)}`,
      xp: Number(row.xp ?? 0),
      level: Number(row.level ?? 1),
      trust,
      questsCompleted: Number(row.quests_completed ?? 0),
      raidsCompleted: Number(row.raids_completed ?? 0),
      linkedProviders,
      walletVerified,
      riskLabel,
      openFlagCount: openFlags.length,
      recentXp: xpActivity?.recentXp ?? 0,
      lastActiveAt: xpActivity?.lastActiveAt ?? null,
      daysSinceActive: daysSince(xpActivity?.lastActiveAt ?? null),
      cohort,
      readinessGaps,
      trustReasons: latestTrust?.reasons ?? [],
      recentFlagReasons: openFlags.map((flag) => flag.reason).slice(0, 3),
      commandReady,
      fullStackReady,
    } satisfies CommunityGrowthContributor;
  });

  const contributorsByAuthUserId = new Map(
    contributors.map((contributor) => [contributor.authUserId, contributor])
  );

  const primaryIntegration =
    settingsRows.integrations.find((integration) => integration.provider === "discord") ??
    settingsRows.integrations[0] ??
    null;
  const primarySettingsRow = primaryIntegration
    ? settingsRows.settingsByIntegrationId.get(primaryIntegration.id)
    : null;
  const metadata =
    primarySettingsRow?.metadata && typeof primarySettingsRow.metadata === "object"
      ? (primarySettingsRow.metadata as Record<string, unknown>)
      : {};
  const captainAssignments = sanitizeCaptainAssignments(metadata.captainAssignments);

  const captainRoster: CommunityCaptainCard[] = captainAssignments
    .map((assignment) => {
      const contributor = contributorsByAuthUserId.get(assignment.authUserId);
      const matchingTeamMember = (teamRows ?? []).find(
        (teamMember) => teamMember.auth_user_id === assignment.authUserId
      ) as
        | {
            auth_user_id: string | null;
            name: string;
            role: string;
          }
        | undefined;

      const username =
        contributor?.username ??
        matchingTeamMember?.name ??
        `pilot-${assignment.authUserId.slice(0, 6)}`;
      const linkedProviders = contributor?.linkedProviders ?? [];
      const readinessSummary =
        contributor?.readinessGaps.length && contributor.readinessGaps[0]
          ? contributor.readinessGaps[0]
          : "Ready for live community work";

      return {
        ...assignment,
        username,
        xp: contributor?.xp ?? 0,
        trust: contributor?.trust ?? 50,
        linkedProviders,
        walletVerified: contributor?.walletVerified ?? false,
        openFlagCount: contributor?.openFlagCount ?? 0,
        readinessSummary,
      };
    })
    .sort((left, right) => right.xp - left.xp);

  const captainCandidates = Array.from(
    new Map(
      [
        ...((teamRows ?? []) as Array<{
          auth_user_id: string | null;
          name: string;
          role: string;
        }>)
          .filter((member) => member.auth_user_id)
          .map((member) => {
            const authUserId = member.auth_user_id as string;
            const contributor = contributorsByAuthUserId.get(authUserId);
            return [
              authUserId,
              {
                authUserId,
                username: contributor?.username ?? member.name,
                source: "team" as const,
                roleHint: member.role,
                xp: contributor?.xp ?? 0,
                trust: contributor?.trust ?? 50,
                linkedProviders: contributor?.linkedProviders ?? [],
                walletVerified: contributor?.walletVerified ?? false,
                openFlagCount: contributor?.openFlagCount ?? 0,
              },
            ];
          }),
        ...contributors.slice(0, 18).map((contributor) => [
          contributor.authUserId,
          {
            authUserId: contributor.authUserId,
            username: contributor.username,
            source: "contributors" as const,
            roleHint: contributor.cohort === "core" ? "core contributor" : contributor.cohort,
            xp: contributor.xp,
            trust: contributor.trust,
            linkedProviders: contributor.linkedProviders,
            walletVerified: contributor.walletVerified,
            openFlagCount: contributor.openFlagCount,
          },
        ]),
      ].map((entry) => entry as [string, CommunityCaptainCandidate])
    ).values()
  ).sort((left, right) => right.xp - left.xp);

  const cohorts = {
    newcomers: contributors.filter((item) => item.cohort === "newcomer").slice(0, 8),
    warmingUp: contributors.filter((item) => item.cohort === "warming_up").slice(0, 8),
    core: contributors.filter((item) => item.cohort === "core").slice(0, 8),
    highTrust: contributors
      .filter((item) => item.trust >= 80 && item.openFlagCount === 0)
      .slice(0, 8),
    watchlist: contributors.filter((item) => item.cohort === "watchlist").slice(0, 8),
    reactivation: contributors.filter((item) => item.cohort === "reactivation").slice(0, 8),
  };

  const commandReadyCount = contributors.filter((item) => item.commandReady).length;
  const fullStackReadyCount = contributors.filter((item) => item.fullStackReady).length;
  const walletVerifiedCount = contributors.filter((item) => item.walletVerified).length;
  const xReadyCount = contributors.filter((item) => item.linkedProviders.includes("x")).length;
  const recentActiveCount = contributors.filter(
    (item) => item.daysSinceActive !== null && item.daysSinceActive <= 14
  ).length;
  const averageTrust =
    contributors.length > 0
      ? Math.round(
          contributors.reduce((sum, contributor) => sum + contributor.trust, 0) /
            contributors.length
        )
      : 0;
  const openFlagCount = contributors.reduce(
    (sum, contributor) => sum + contributor.openFlagCount,
    0
  );
  const activationReadyCount = contributors.filter(
    (item) => item.commandReady && item.walletVerified
  ).length;
  const recentXp = contributors.reduce((sum, contributor) => sum + contributor.recentXp, 0);

  const summary: CohortSummary = {
    totalContributors: contributors.length,
    newcomers: contributors.filter((item) => item.cohort === "newcomer").length,
    warmingUp: contributors.filter((item) => item.cohort === "warming_up").length,
    core: contributors.filter((item) => item.cohort === "core").length,
    highTrust: contributors.filter((item) => item.trust >= 80 && item.openFlagCount === 0).length,
    watchlist: contributors.filter((item) => item.cohort === "watchlist").length,
    reactivation: contributors.filter((item) => item.cohort === "reactivation").length,
    commandReady: commandReadyCount,
    fullStackReady: fullStackReadyCount,
    openFlags: openFlagCount,
  };

  const analytics: CommunityAnalytics = {
    contributorCount: contributors.length,
    commandReadyRate: roundPercentage(commandReadyCount, contributors.length),
    walletVerifiedRate: roundPercentage(
      walletVerifiedCount,
      contributors.length
    ),
    fullStackReadyRate: roundPercentage(fullStackReadyCount, contributors.length),
    recentActiveRate: roundPercentage(recentActiveCount, contributors.length),
    newcomerReadyCount: cohorts.newcomers.filter((item) => item.commandReady).length,
    reactivationReadyCount: cohorts.reactivation.filter((item) => item.commandReady).length,
    highTrustCount: summary.highTrust,
    highTrustRate: roundPercentage(summary.highTrust, contributors.length),
    commandGapCount: Math.max(0, contributors.length - commandReadyCount),
    walletGapCount: Math.max(0, contributors.length - walletVerifiedCount),
    xGapCount: Math.max(0, contributors.length - xReadyCount),
    retentionPressureCount: summary.reactivation,
    averageTrust,
    watchlistCount: summary.watchlist,
    openFlagCount,
    captainCount: captainRoster.length,
    activeCampaignCount: (campaignRows ?? []).length,
    activationReadyCount,
    recentXp,
  };

  const questCountByCampaignId = new Map<string, number>();
  for (const quest of (questRows ?? []) as Array<{ campaign_id: string | null }>) {
    if (!quest.campaign_id) continue;
    questCountByCampaignId.set(
      quest.campaign_id,
      (questCountByCampaignId.get(quest.campaign_id) ?? 0) + 1
    );
  }

  const raidCountByCampaignId = new Map<string, number>();
  for (const raid of (raidRows ?? []) as Array<{ campaign_id: string | null }>) {
    if (!raid.campaign_id) continue;
    raidCountByCampaignId.set(
      raid.campaign_id,
      (raidCountByCampaignId.get(raid.campaign_id) ?? 0) + 1
    );
  }

  const rewardCountByCampaignId = new Map<string, number>();
  for (const reward of (rewardRows ?? []) as Array<{ campaign_id: string | null }>) {
    if (!reward.campaign_id) continue;
    rewardCountByCampaignId.set(
      reward.campaign_id,
      (rewardCountByCampaignId.get(reward.campaign_id) ?? 0) + 1
    );
  }

  const activationBoards: ActivationBoard[] = ((campaignRows ?? []) as Array<{
    id: string;
    title: string;
    featured: boolean | null;
    status: string;
  }>).map((campaign) => {
    const newcomerCandidates = contributors.filter(
      (item) => item.cohort === "newcomer" && item.commandReady
    ).length;
    const reactivationCandidates = contributors.filter(
      (item) => item.cohort === "reactivation" && item.commandReady
    ).length;
    const coreCandidates = contributors.filter(
      (item) => item.cohort === "core" && item.commandReady
    ).length;
    const recommendedLane =
      reactivationCandidates > newcomerCandidates && reactivationCandidates >= coreCandidates
        ? "reactivation"
        : coreCandidates > newcomerCandidates
          ? "core"
          : "newcomer";

    return {
      campaignId: campaign.id,
      title: campaign.title,
      featured: campaign.featured === true,
      activationScore: buildActivationScore({
        featured: campaign.featured === true,
        readyContributors: activationReadyCount,
        newcomerCandidates,
        reactivationCandidates,
        coreCandidates,
        questCount: questCountByCampaignId.get(campaign.id) ?? 0,
        raidCount: raidCountByCampaignId.get(campaign.id) ?? 0,
        rewardCount: rewardCountByCampaignId.get(campaign.id) ?? 0,
      }),
      readyContributors: activationReadyCount,
      newcomerCandidates,
      reactivationCandidates,
      coreCandidates,
      questCount: questCountByCampaignId.get(campaign.id) ?? 0,
      raidCount: raidCountByCampaignId.get(campaign.id) ?? 0,
      rewardCount: rewardCountByCampaignId.get(campaign.id) ?? 0,
      recommendedLane,
      recommendedCopy:
        recommendedLane === "reactivation"
          ? "Re-ignite recently inactive contributors with a comeback board."
          : recommendedLane === "core"
            ? "Push the core rail with deeper raids and leaderboard pressure."
            : "Use a newcomer starter board to move fresh contributors into action fast.",
    };
  });

  const latestQualityIssue =
    cohorts.watchlist[0]?.recentFlagReasons[0] ??
    cohorts.watchlist[0]?.trustReasons[0] ??
    (projectRow?.name ? `${projectRow.name} has no active trust incidents right now.` : "No trust incidents.");

  return {
    captains: {
      enabled: metadata.captainsEnabled === true,
      assignments: captainRoster,
      candidates: captainCandidates,
    },
    cohorts: {
      summary,
      newcomers: cohorts.newcomers,
      warmingUp: cohorts.warmingUp,
      core: cohorts.core,
      highTrust: cohorts.highTrust,
      watchlist: cohorts.watchlist,
      reactivation: cohorts.reactivation,
    },
    analytics,
    trust: {
      averageTrust,
      openFlagCount,
      watchlistCount: summary.watchlist,
      latestIssue: latestQualityIssue,
    },
    activationBoards,
    settings: {
      captainsEnabled: metadata.captainsEnabled === true,
      newcomerFunnelEnabled: metadata.newcomerFunnelEnabled === true,
      reactivationFunnelEnabled: metadata.reactivationFunnelEnabled === true,
      activationBoardsEnabled: metadata.activationBoardsEnabled === true,
      activationBoardCadence:
        metadata.activationBoardCadence === "daily" ||
        metadata.activationBoardCadence === "weekly"
          ? metadata.activationBoardCadence
          : "manual",
      captainAssignments,
      lastNewcomerPushAt:
        typeof metadata.lastNewcomerPushAt === "string" ? metadata.lastNewcomerPushAt : "",
      lastReactivationPushAt:
        typeof metadata.lastReactivationPushAt === "string"
          ? metadata.lastReactivationPushAt
          : "",
      lastActivationBoardAt:
        typeof metadata.lastActivationBoardAt === "string"
          ? metadata.lastActivationBoardAt
          : "",
    },
  };
}

export function buildCaptainSummary(captain: CommunityCaptainCard) {
  const labels = [humanizeCaptainRole(captain.role)];
  if (captain.walletVerified) labels.push("wallet");
  if (captain.openFlagCount > 0) labels.push(`${captain.openFlagCount} flag`);
  return labels.join(" • ");
}
