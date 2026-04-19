"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { CommunityActivityPanel } from "@/components/community/CommunityActivityPanel";
import { CommunityActivationBoardsPanel } from "@/components/community/CommunityActivationBoardsPanel";
import { CommunityAutomationCenterPanel } from "@/components/community/CommunityAutomationCenterPanel";
import { CommunityAutomationsPanel } from "@/components/community/CommunityAutomationsPanel";
import { CommunityCaptainOpsPanel } from "@/components/community/CommunityCaptainOpsPanel";
import { CommunityCaptainsPanel } from "@/components/community/CommunityCaptainsPanel";
import {
  buildDiscordRankRulesFromPreset,
  CommunityBotAction,
  type CommunityAutomationRecord,
  type CommunityAutomationRunRecord,
  type CommunityCaptainActionRecord,
  type CommunityCaptainPermission,
  CommunityPushSettings,
  type CommunityPlaybookConfig,
  type CommunityPlaybookKey,
  type CommunityPlaybookRunRecord,
  createDefaultDiscordBotSettings,
  createDefaultPushSettings,
  DiscordCommunityBotSettings,
  DiscordRankRule,
  DiscordRankSource,
  DISCORD_RANK_PRESETS,
  readPushSettings,
} from "@/components/community/community-config";
import { CommunityCohortsPanel } from "@/components/community/CommunityCohortsPanel";
import { CommunityCommandsPanel } from "@/components/community/CommunityCommandsPanel";
import { CommunityAnalyticsPanel } from "@/components/community/CommunityAnalyticsPanel";
import { CommunityFunnelsPanel } from "@/components/community/CommunityFunnelsPanel";
import { CommunityIntegrationsPanel } from "@/components/community/CommunityIntegrationsPanel";
import { CommunityLeaderboardsPanel } from "@/components/community/CommunityLeaderboardsPanel";
import { CommunityMembersPanel } from "@/components/community/CommunityMembersPanel";
import { CommunityMissionsPanel } from "@/components/community/CommunityMissionsPanel";
import { CommunityOverviewPanel } from "@/components/community/CommunityOverviewPanel";
import { CommunityPlaybooksPanel } from "@/components/community/CommunityPlaybooksPanel";
import { CommunityRaidOpsPanel } from "@/components/community/CommunityRaidOpsPanel";
import { CommunityRanksPanel } from "@/components/community/CommunityRanksPanel";
import { OpsHero, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { LoadingState, NotFoundState } from "@/components/layout/state/StatePrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { DbAuditLog } from "@/types/database";

type DiscordIntegrationConfig = {
  guildId: string;
  serverId: string;
};

type TelegramIntegrationConfig = {
  chatId: string;
  groupId: string;
};

type CommunityContributor = {
  authUserId: string;
  username: string;
  xp: number;
  level: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
  linkedProviders: string[];
  walletVerified: boolean;
  commandReady: boolean;
  fullStackReady: boolean;
};

type CommunityMembersPayload = {
  summary: {
    totalContributors: number;
    discordLinked: number;
    telegramLinked: number;
    xLinked: number;
    walletVerified: number;
    commandReady: number;
    fullStackReady: number;
  };
  topContributors: CommunityContributor[];
  readinessWatch: CommunityContributor[];
};

type CaptainAssignment = {
  authUserId: string;
  role: "community_captain" | "raid_lead" | "growth_lead";
  label: string;
};

type CaptainCard = CaptainAssignment & {
  username: string;
  xp: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  openFlagCount: number;
  readinessSummary: string;
};

type CaptainCandidate = {
  authUserId: string;
  username: string;
  source: "team" | "contributors";
  roleHint: string;
  xp: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  openFlagCount: number;
};

type CohortContributor = {
  authUserId: string;
  username: string;
  xp: number;
  level: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  readinessGaps: string[];
  recentFlagReasons: string[];
  daysSinceActive: number | null;
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

type CommunityGrowthPayload = {
  captains: {
    enabled: boolean;
    assignments: CaptainCard[];
    candidates: CaptainCandidate[];
  };
  cohorts: {
    summary: {
      totalContributors: number;
      newcomers: number;
      warmingUp: number;
      core: number;
      watchlist: number;
      reactivation: number;
      commandReady: number;
      fullStackReady: number;
      openFlags: number;
    };
    newcomers: CohortContributor[];
    warmingUp: CohortContributor[];
    core: CohortContributor[];
    watchlist: CohortContributor[];
    reactivation: CohortContributor[];
  };
  analytics: {
    contributorCount: number;
    commandReadyRate: number;
    walletVerifiedRate: number;
    fullStackReadyRate: number;
    recentActiveRate: number;
    averageTrust: number;
    watchlistCount: number;
    openFlagCount: number;
    captainCount: number;
    activeCampaignCount: number;
    activationReadyCount: number;
    recentXp: number;
  };
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
    captainAssignments: CaptainAssignment[];
    lastNewcomerPushAt: string;
    lastReactivationPushAt: string;
    lastActivationBoardAt: string;
  };
};

const emptyMembersPayload: CommunityMembersPayload = {
  summary: {
    totalContributors: 0,
    discordLinked: 0,
    telegramLinked: 0,
    xLinked: 0,
    walletVerified: 0,
    commandReady: 0,
    fullStackReady: 0,
  },
  topContributors: [],
  readinessWatch: [],
};

const emptyGrowthPayload: CommunityGrowthPayload = {
  captains: {
    enabled: false,
    assignments: [],
    candidates: [],
  },
  cohorts: {
    summary: {
      totalContributors: 0,
      newcomers: 0,
      warmingUp: 0,
      core: 0,
      watchlist: 0,
      reactivation: 0,
      commandReady: 0,
      fullStackReady: 0,
      openFlags: 0,
    },
    newcomers: [],
    warmingUp: [],
    core: [],
    watchlist: [],
    reactivation: [],
  },
  analytics: {
    contributorCount: 0,
    commandReadyRate: 0,
    walletVerifiedRate: 0,
    fullStackReadyRate: 0,
    recentActiveRate: 0,
    averageTrust: 0,
    watchlistCount: 0,
    openFlagCount: 0,
    captainCount: 0,
    activeCampaignCount: 0,
    activationReadyCount: 0,
    recentXp: 0,
  },
  trust: {
    averageTrust: 0,
    openFlagCount: 0,
    watchlistCount: 0,
    latestIssue: "No trust incidents are active for this project.",
  },
  activationBoards: [],
  settings: {
    captainsEnabled: false,
    newcomerFunnelEnabled: false,
    reactivationFunnelEnabled: false,
    activationBoardsEnabled: false,
    activationBoardCadence: "manual",
    captainAssignments: [],
    lastNewcomerPushAt: "",
    lastReactivationPushAt: "",
    lastActivationBoardAt: "",
  },
};

export default function ProjectCommunityManagementPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const authRole = useAdminAuthStore((s) => s.role);
  const authLoading = useAdminAuthStore((s) => s.loading);

  const portalHydrated = useAdminPortalStore((s) => s.hydrated);
  const portalLoading = useAdminPortalStore((s) => s.loading);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const raids = useAdminPortalStore((s) => s.raids);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);

  const [discordIntegrationStatus, setDiscordIntegrationStatus] = useState<string>("unknown");
  const [telegramIntegrationStatus, setTelegramIntegrationStatus] = useState<string>("unknown");
  const [xIntegrationStatus, setXIntegrationStatus] = useState<string>("unknown");
  const [discordIntegrationConfig, setDiscordIntegrationConfig] = useState<DiscordIntegrationConfig>({
    guildId: "",
    serverId: "",
  });
  const [telegramIntegrationConfig, setTelegramIntegrationConfig] = useState<TelegramIntegrationConfig>({
    chatId: "",
    groupId: "",
  });
  const [discordPushSettings, setDiscordPushSettings] = useState<CommunityPushSettings>(
    createDefaultPushSettings("discord")
  );
  const [telegramPushSettings, setTelegramPushSettings] = useState<CommunityPushSettings>(
    createDefaultPushSettings("telegram")
  );
  const [savingIntegration, setSavingIntegration] = useState<"discord" | "telegram" | null>(null);
  const [integrationNotice, setIntegrationNotice] = useState("");
  const [testingIntegration, setTestingIntegration] = useState<"discord" | "telegram" | null>(null);
  const [integrationTestNotice, setIntegrationTestNotice] = useState("");
  const [integrationTestTone, setIntegrationTestTone] = useState<"success" | "error">(
    "success"
  );

  const [discordBotSettings, setDiscordBotSettings] =
    useState<DiscordCommunityBotSettings>(createDefaultDiscordBotSettings());
  const [discordRankRules, setDiscordRankRules] = useState<DiscordRankRule[]>([]);
  const [savingDiscordBotSettings, setSavingDiscordBotSettings] = useState(false);
  const [runningDiscordBotAction, setRunningDiscordBotAction] =
    useState<Extract<CommunityBotAction, "command_sync" | "rank_sync" | "leaderboard_post"> | null>(null);
  const [discordBotNotice, setDiscordBotNotice] = useState("");
  const [discordBotNoticeTone, setDiscordBotNoticeTone] = useState<"success" | "error">(
    "success"
  );

  const [operatorSignals, setOperatorSignals] = useState({
    callbackFailures: 0,
    onchainFailures: 0,
    latestIssue: "No active operator incidents logged.",
  });
  const [recentActivity, setRecentActivity] = useState<DbAuditLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [communityMembers, setCommunityMembers] =
    useState<CommunityMembersPayload>(emptyMembersPayload);
  const [loadingCommunityMembers, setLoadingCommunityMembers] = useState(false);
  const [communityGrowth, setCommunityGrowth] = useState<CommunityGrowthPayload>(emptyGrowthPayload);
  const [loadingCommunityGrowth, setLoadingCommunityGrowth] = useState(false);
  const [captainAssignments, setCaptainAssignments] = useState<CaptainAssignment[]>([]);
  const [savingCaptains, setSavingCaptains] = useState(false);
  const [captainNotice, setCaptainNotice] = useState("");
  const [captainNoticeTone, setCaptainNoticeTone] = useState<"success" | "error">("success");

  const [runningMissionAction, setRunningMissionAction] = useState<
    "digest" | "campaign" | "quest" | "reward" | null
  >(null);
  const [missionNotice, setMissionNotice] = useState("");
  const [missionNoticeTone, setMissionNoticeTone] = useState<"success" | "error">(
    "success"
  );

  const [runningRaidAction, setRunningRaidAction] = useState<
    "live" | "reminder" | "result" | null
  >(null);
  const [raidNotice, setRaidNotice] = useState("");
  const [raidNoticeTone, setRaidNoticeTone] = useState<"success" | "error">("success");

  const [runningAutomationAction, setRunningAutomationAction] = useState<
    "all" | "missions" | "raids" | null
  >(null);
  const [automationNotice, setAutomationNotice] = useState("");
  const [automationNoticeTone, setAutomationNoticeTone] = useState<"success" | "error">(
    "success"
  );
  const [runningFunnelAction, setRunningFunnelAction] = useState<
    "newcomer" | "reactivation" | null
  >(null);
  const [funnelNotice, setFunnelNotice] = useState("");
  const [funnelNoticeTone, setFunnelNoticeTone] = useState<"success" | "error">("success");
  const [runningActivationBoardCampaignId, setRunningActivationBoardCampaignId] =
    useState<string | null>(null);
  const [activationNotice, setActivationNotice] = useState("");
  const [activationNoticeTone, setActivationNoticeTone] = useState<"success" | "error">(
    "success"
  );
  const [communityAutomations, setCommunityAutomations] = useState<CommunityAutomationRecord[]>([]);
  const [communityAutomationRuns, setCommunityAutomationRuns] = useState<
    CommunityAutomationRunRecord[]
  >([]);
  const [communityPlaybooks, setCommunityPlaybooks] = useState<CommunityPlaybookConfig[]>([]);
  const [communityPlaybookRuns, setCommunityPlaybookRuns] = useState<
    CommunityPlaybookRunRecord[]
  >([]);
  const [captainPermissions, setCaptainPermissions] = useState<
    Record<string, CommunityCaptainPermission[]>
  >({});
  const [captainActions, setCaptainActions] = useState<CommunityCaptainActionRecord[]>([]);
  const [loadingCommunityExecution, setLoadingCommunityExecution] = useState(false);
  const [savingCommunityAutomations, setSavingCommunityAutomations] = useState(false);
  const [runningCommunityAutomationId, setRunningCommunityAutomationId] = useState<string | null>(
    null
  );
  const [communityAutomationNotice, setCommunityAutomationNotice] = useState("");
  const [communityAutomationNoticeTone, setCommunityAutomationNoticeTone] = useState<
    "success" | "error"
  >("success");
  const [savingCaptainPermissions, setSavingCaptainPermissions] = useState(false);
  const [captainPermissionsNotice, setCaptainPermissionsNotice] = useState("");
  const [captainPermissionsNoticeTone, setCaptainPermissionsNoticeTone] = useState<
    "success" | "error"
  >("success");
  const [savingPlaybooks, setSavingPlaybooks] = useState(false);
  const [runningPlaybookKey, setRunningPlaybookKey] = useState<string | null>(null);
  const [playbookNotice, setPlaybookNotice] = useState("");
  const [playbookNoticeTone, setPlaybookNoticeTone] = useState<"success" | "error">(
    "success"
  );

  const project = useMemo(() => getProjectById(params.id), [getProjectById, params.id]);
  const hasProjectMembership = memberships.some((item) => item.projectId === project?.id);
  const hasProjectAccess = authRole === "super_admin" || hasProjectMembership;

  useEffect(() => {
    if (!project || !hasProjectMembership) return;
    if (activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, hasProjectMembership, project, setActiveProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectIntegrations() {
      if (!project?.id || !hasProjectAccess) return;

      setIntegrationNotice("");
      const response = await fetch(
        `/api/project-integrations?projectId=${encodeURIComponent(project.id)}`,
        { cache: "no-store" }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        if (!cancelled) {
          setIntegrationNotice(payload?.error || "Could not load project integrations.");
        }
        return;
      }

      const integrations = Array.isArray(payload.integrations) ? payload.integrations : [];
      const discordData = integrations.find(
        (integration: { provider?: string }) => integration.provider === "discord"
      ) as { status?: string; config?: Record<string, unknown> } | undefined;
      const telegramData = integrations.find(
        (integration: { provider?: string }) => integration.provider === "telegram"
      ) as { status?: string; config?: Record<string, unknown> } | undefined;
      const xData = integrations.find(
        (integration: { provider?: string }) => integration.provider === "x"
      ) as { status?: string } | undefined;

      if (cancelled) return;
      setDiscordIntegrationStatus(discordData?.status ?? "not_connected");
      setTelegramIntegrationStatus(telegramData?.status ?? "not_connected");
      setXIntegrationStatus(xData?.status ?? "not_connected");
      setDiscordIntegrationConfig({
        guildId:
          discordData?.config && typeof discordData.config === "object"
            ? String((discordData.config as Record<string, unknown>).guildId ?? "")
            : "",
        serverId:
          discordData?.config && typeof discordData.config === "object"
            ? String((discordData.config as Record<string, unknown>).serverId ?? "")
            : "",
      });
      setDiscordPushSettings(
        readPushSettings(
          discordData?.config && typeof discordData.config === "object"
            ? (discordData.config as Record<string, unknown>)
            : null,
          "discord"
        )
      );
      setTelegramIntegrationConfig({
        chatId:
          telegramData?.config && typeof telegramData.config === "object"
            ? String((telegramData.config as Record<string, unknown>).chatId ?? "")
            : "",
        groupId:
          telegramData?.config && typeof telegramData.config === "object"
            ? String((telegramData.config as Record<string, unknown>).groupId ?? "")
            : "",
      });
      setTelegramPushSettings(
        readPushSettings(
          telegramData?.config && typeof telegramData.config === "object"
            ? (telegramData.config as Record<string, unknown>)
            : null,
          "telegram"
        )
      );
    }

    void loadProjectIntegrations();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadDiscordBotSettings() {
      if (!project?.id || !hasProjectAccess) return;

      const response = await fetch(`/api/projects/${project.id}/community-bot-settings`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (cancelled) return;

      if (!response.ok || !payload?.ok) {
        setDiscordBotNoticeTone("error");
        setDiscordBotNotice(payload?.error || "Could not load community bot settings.");
        return;
      }

      setDiscordBotNotice("");
      setDiscordBotSettings({
        commandsEnabled: payload.settings?.commandsEnabled !== false,
        telegramCommandsEnabled: payload.settings?.telegramCommandsEnabled === true,
        rankSyncEnabled: payload.settings?.rankSyncEnabled === true,
        rankSource:
          payload.settings?.rankSource === "global_xp" ||
          payload.settings?.rankSource === "trust" ||
          payload.settings?.rankSource === "wallet_verified"
            ? payload.settings.rankSource
            : "project_xp",
        leaderboardEnabled: payload.settings?.leaderboardEnabled !== false,
        leaderboardScope: payload.settings?.leaderboardScope === "global" ? "global" : "project",
        leaderboardPeriod:
          payload.settings?.leaderboardPeriod === "monthly" ||
          payload.settings?.leaderboardPeriod === "all_time"
            ? payload.settings.leaderboardPeriod
            : "weekly",
        leaderboardTargetChannelId:
          typeof payload.settings?.leaderboardTargetChannelId === "string"
            ? payload.settings.leaderboardTargetChannelId
            : "",
        leaderboardTopN:
          payload.settings && Number.isFinite(Number(payload.settings.leaderboardTopN))
            ? String(payload.settings.leaderboardTopN)
            : "10",
        leaderboardCadence:
          payload.settings?.leaderboardCadence === "daily" ||
          payload.settings?.leaderboardCadence === "weekly"
            ? payload.settings.leaderboardCadence
            : "manual",
        raidOpsEnabled: payload.settings?.raidOpsEnabled === true,
        missionDigestEnabled: payload.settings?.missionDigestEnabled === true,
        missionDigestCadence:
          payload.settings?.missionDigestCadence === "daily" ||
          payload.settings?.missionDigestCadence === "weekly"
            ? payload.settings.missionDigestCadence
            : "manual",
        missionDigestTarget:
          payload.settings?.missionDigestTarget === "discord" ||
          payload.settings?.missionDigestTarget === "telegram"
            ? payload.settings.missionDigestTarget
            : "both",
        raidAlertsEnabled: payload.settings?.raidAlertsEnabled === true,
        raidRemindersEnabled: payload.settings?.raidRemindersEnabled === true,
        raidResultsEnabled: payload.settings?.raidResultsEnabled === true,
        raidCadence:
          payload.settings?.raidCadence === "daily" ||
          payload.settings?.raidCadence === "weekly"
            ? payload.settings.raidCadence
            : "manual",
        captainsEnabled: payload.settings?.captainsEnabled === true,
        newcomerFunnelEnabled: payload.settings?.newcomerFunnelEnabled === true,
        reactivationFunnelEnabled: payload.settings?.reactivationFunnelEnabled === true,
        activationBoardsEnabled: payload.settings?.activationBoardsEnabled === true,
        activationBoardCadence:
          payload.settings?.activationBoardCadence === "daily" ||
          payload.settings?.activationBoardCadence === "weekly"
            ? payload.settings.activationBoardCadence
            : "manual",
        lastRankSyncAt:
          typeof payload.settings?.lastRankSyncAt === "string"
            ? payload.settings.lastRankSyncAt
            : "",
        lastLeaderboardPostedAt:
          typeof payload.settings?.lastLeaderboardPostedAt === "string"
            ? payload.settings.lastLeaderboardPostedAt
            : "",
        lastMissionDigestAt:
          typeof payload.settings?.lastMissionDigestAt === "string"
            ? payload.settings.lastMissionDigestAt
            : "",
        lastRaidAlertAt:
          typeof payload.settings?.lastRaidAlertAt === "string"
            ? payload.settings.lastRaidAlertAt
            : "",
        lastAutomationRunAt:
          typeof payload.settings?.lastAutomationRunAt === "string"
            ? payload.settings.lastAutomationRunAt
            : "",
        lastNewcomerPushAt:
          typeof payload.settings?.lastNewcomerPushAt === "string"
            ? payload.settings.lastNewcomerPushAt
            : "",
        lastReactivationPushAt:
          typeof payload.settings?.lastReactivationPushAt === "string"
            ? payload.settings.lastReactivationPushAt
            : "",
        lastActivationBoardAt:
          typeof payload.settings?.lastActivationBoardAt === "string"
            ? payload.settings.lastActivationBoardAt
            : "",
      });
      setDiscordRankRules(
        Array.isArray(payload.rankRules)
          ? payload.rankRules.map((rule: Record<string, unknown>) => ({
              id: typeof rule.id === "string" ? rule.id : undefined,
              sourceType:
                rule.sourceType === "global_xp" ||
                rule.sourceType === "trust" ||
                rule.sourceType === "wallet_verified"
                  ? (rule.sourceType as DiscordRankSource)
                  : "project_xp",
              threshold:
                typeof rule.threshold === "number"
                  ? String(rule.threshold)
                  : typeof rule.threshold === "string"
                    ? rule.threshold
                    : "0",
              discordRoleId:
                typeof rule.discordRoleId === "string" ? rule.discordRoleId : "",
              label: typeof rule.label === "string" ? rule.label : "",
            }))
          : []
      );
    }

    void loadDiscordBotSettings();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadOperatorSignalsAndActivity() {
      if (!project?.id || !hasProjectAccess) return;

      const supabase = createClient();
      const relatedProjectQuestIds = quests
        .filter((quest) => quest.projectId === project.id)
        .map((quest) => quest.id);

      setLoadingActivity(true);

      const callbackQuery =
        relatedProjectQuestIds.length > 0
          ? supabase
              .from("admin_audit_logs")
              .select("summary", { count: "exact" })
              .eq("action", "verification_callback_failed")
              .in("source_id", relatedProjectQuestIds)
              .order("created_at", { ascending: false })
              .limit(1)
          : Promise.resolve({ data: [], count: 0, error: null });

      const onchainQuery = supabase
        .from("admin_audit_logs")
        .select("summary", { count: "exact" })
        .in("action", ["onchain_ingress_rejected", "onchain_ingress_failed"])
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const activityQuery = supabase
        .from("admin_audit_logs")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(16);

      const [callbackResult, onchainResult, activityResult] = await Promise.all([
        callbackQuery,
        onchainQuery,
        activityQuery,
      ]);

      if (cancelled) return;

      const latestIssue =
        (callbackResult.data?.[0] as { summary?: string } | undefined)?.summary ??
        (onchainResult.data?.[0] as { summary?: string } | undefined)?.summary ??
        "No active operator incidents logged.";

      setOperatorSignals({
        callbackFailures: callbackResult.count ?? 0,
        onchainFailures: onchainResult.count ?? 0,
        latestIssue,
      });
      setRecentActivity(((activityResult.data ?? []) as DbAuditLog[]) ?? []);
      setLoadingActivity(false);
    }

    void loadOperatorSignalsAndActivity();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id, quests]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      if (!project?.id || !hasProjectAccess) return;

      setLoadingCommunityMembers(true);
      const response = await fetch(`/api/projects/${project.id}/community-members`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (cancelled) return;

      if (!response.ok || !payload?.ok) {
        setCommunityMembers(emptyMembersPayload);
        setLoadingCommunityMembers(false);
        return;
      }

      setCommunityMembers({
        summary: payload.summary ?? emptyMembersPayload.summary,
        topContributors: Array.isArray(payload.topContributors) ? payload.topContributors : [],
        readinessWatch: Array.isArray(payload.readinessWatch) ? payload.readinessWatch : [],
      });
      setLoadingCommunityMembers(false);
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadGrowth() {
      if (!project?.id || !hasProjectAccess) return;

      setLoadingCommunityGrowth(true);
      const response = await fetch(`/api/projects/${project.id}/community-growth`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (cancelled) return;

      if (!response.ok || !payload?.ok) {
        setCommunityGrowth(emptyGrowthPayload);
        setCaptainAssignments([]);
        setLoadingCommunityGrowth(false);
        return;
      }

      setCommunityGrowth({
        captains: payload.captains ?? emptyGrowthPayload.captains,
        cohorts: payload.cohorts ?? emptyGrowthPayload.cohorts,
        analytics: payload.analytics ?? emptyGrowthPayload.analytics,
        trust: payload.trust ?? emptyGrowthPayload.trust,
        activationBoards: Array.isArray(payload.activationBoards)
          ? payload.activationBoards
          : [],
        settings: payload.settings ?? emptyGrowthPayload.settings,
      });
      setCaptainAssignments(
        Array.isArray(payload.settings?.captainAssignments)
          ? payload.settings.captainAssignments
          : []
      );
      setDiscordBotSettings((current) => ({
        ...current,
        captainsEnabled: payload.settings?.captainsEnabled === true,
        newcomerFunnelEnabled: payload.settings?.newcomerFunnelEnabled === true,
        reactivationFunnelEnabled: payload.settings?.reactivationFunnelEnabled === true,
        activationBoardsEnabled: payload.settings?.activationBoardsEnabled === true,
        activationBoardCadence:
          payload.settings?.activationBoardCadence === "daily" ||
          payload.settings?.activationBoardCadence === "weekly"
            ? payload.settings.activationBoardCadence
            : current.activationBoardCadence,
        lastNewcomerPushAt:
          typeof payload.settings?.lastNewcomerPushAt === "string"
            ? payload.settings.lastNewcomerPushAt
            : current.lastNewcomerPushAt,
        lastReactivationPushAt:
          typeof payload.settings?.lastReactivationPushAt === "string"
            ? payload.settings.lastReactivationPushAt
            : current.lastReactivationPushAt,
        lastActivationBoardAt:
          typeof payload.settings?.lastActivationBoardAt === "string"
            ? payload.settings.lastActivationBoardAt
            : current.lastActivationBoardAt,
      }));
      setLoadingCommunityGrowth(false);
    }

    void loadGrowth();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunityExecution() {
      if (!project?.id || !hasProjectAccess) return;

      setLoadingCommunityExecution(true);
      const response = await fetch(`/api/projects/${project.id}/community-automations`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (cancelled) return;

      if (!response.ok || !payload?.ok) {
        setCommunityAutomations([]);
        setCommunityAutomationRuns([]);
        setCommunityPlaybooks([]);
        setCommunityPlaybookRuns([]);
        setCaptainPermissions({});
        setCaptainActions([]);
        setLoadingCommunityExecution(false);
        return;
      }

      setCommunityAutomations(Array.isArray(payload.automations) ? payload.automations : []);
      setCommunityAutomationRuns(
        Array.isArray(payload.automationRuns) ? payload.automationRuns : []
      );
      setCommunityPlaybooks(Array.isArray(payload.playbooks) ? payload.playbooks : []);
      setCommunityPlaybookRuns(Array.isArray(payload.playbookRuns) ? payload.playbookRuns : []);
      setCaptainPermissions(
        payload.captainPermissions && typeof payload.captainPermissions === "object"
          ? payload.captainPermissions
          : {}
      );
      setCaptainActions(Array.isArray(payload.captainActions) ? payload.captainActions : []);
      setLoadingCommunityExecution(false);
    }

    void loadCommunityExecution();
    return () => {
      cancelled = true;
    };
  }, [hasProjectAccess, project?.id]);

  const relatedCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.projectId === project?.id),
    [campaigns, project?.id]
  );
  const relatedQuests = useMemo(
    () => quests.filter((quest) => quest.projectId === project?.id),
    [project?.id, quests]
  );
  const relatedRaids = useMemo(
    () => raids.filter((raid) => raid.projectId === project?.id),
    [project?.id, raids]
  );
  const relatedRewards = useMemo(
    () => rewards.filter((reward) => reward.projectId === project?.id),
    [project?.id, rewards]
  );
  const relatedTeamMembers = useMemo(
    () => teamMembers.filter((member) => member.projectId === project?.id),
    [project?.id, teamMembers]
  );
  const projectNameById = useMemo(
    () => new Map(projects.map((item) => [item.id, item.name])),
    [projects]
  );
  const activeAutomationCount = useMemo(
    () => communityAutomations.filter((automation) => automation.status === "active").length,
    [communityAutomations]
  );
  const dueAutomationCount = useMemo(
    () =>
      communityAutomations.filter(
        (automation) =>
          automation.status === "active" &&
          automation.nextRunAt &&
          new Date(automation.nextRunAt).getTime() <= Date.now()
      ).length,
    [communityAutomations]
  );
  const recentAutomationFailureCount = useMemo(
    () => communityAutomationRuns.filter((run) => run.status === "failed").length,
    [communityAutomationRuns]
  );
  const enabledPlaybookCount = useMemo(
    () => communityPlaybooks.filter((playbook) => playbook.enabled).length,
    [communityPlaybooks]
  );

  async function refreshCommunityGrowth() {
    if (!project?.id) return;

    const response = await fetch(`/api/projects/${project.id}/community-growth`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      return;
    }

    setCommunityGrowth({
      captains: payload.captains ?? emptyGrowthPayload.captains,
      cohorts: payload.cohorts ?? emptyGrowthPayload.cohorts,
      analytics: payload.analytics ?? emptyGrowthPayload.analytics,
      trust: payload.trust ?? emptyGrowthPayload.trust,
      activationBoards: Array.isArray(payload.activationBoards) ? payload.activationBoards : [],
      settings: payload.settings ?? emptyGrowthPayload.settings,
    });
    setCaptainAssignments(
      Array.isArray(payload.settings?.captainAssignments)
        ? payload.settings.captainAssignments
        : []
    );
  }

  async function refreshCommunityExecution() {
    if (!project?.id) return;

    const response = await fetch(`/api/projects/${project.id}/community-automations`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      return;
    }

    setCommunityAutomations(Array.isArray(payload.automations) ? payload.automations : []);
    setCommunityAutomationRuns(
      Array.isArray(payload.automationRuns) ? payload.automationRuns : []
    );
    setCommunityPlaybooks(Array.isArray(payload.playbooks) ? payload.playbooks : []);
    setCommunityPlaybookRuns(Array.isArray(payload.playbookRuns) ? payload.playbookRuns : []);
    setCaptainPermissions(
      payload.captainPermissions && typeof payload.captainPermissions === "object"
        ? payload.captainPermissions
        : {}
    );
    setCaptainActions(Array.isArray(payload.captainActions) ? payload.captainActions : []);
  }

  async function refreshRecentActivity() {
    if (!project?.id) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(16);

    setRecentActivity(((data ?? []) as DbAuditLog[]) ?? []);
  }

  async function saveProjectIntegration(provider: "discord" | "telegram") {
    if (!project?.id) return;

    const pushSettings = provider === "discord" ? discordPushSettings : telegramPushSettings;
    const config =
      provider === "discord"
        ? {
            guildId: discordIntegrationConfig.guildId.trim(),
            serverId: discordIntegrationConfig.serverId.trim(),
            pushSettings: {
              ...pushSettings,
              targetChannelId: pushSettings.targetChannelId.trim(),
              targetThreadId: pushSettings.targetThreadId.trim(),
              minXp: pushSettings.minXp.trim(),
            },
          }
        : {
            chatId: telegramIntegrationConfig.chatId.trim(),
            groupId: telegramIntegrationConfig.groupId.trim(),
            pushSettings: {
              ...pushSettings,
              targetChatId: pushSettings.targetChatId.trim(),
              minXp: pushSettings.minXp.trim(),
            },
          };

    const hasPrimaryIdentifier =
      provider === "discord"
        ? Boolean(config.guildId || config.serverId)
        : Boolean(config.chatId || config.groupId);

    setSavingIntegration(provider);
    setIntegrationNotice("");

    const response = await fetch("/api/project-integrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: project.id,
        provider,
        config,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingIntegration(null);

    if (!response.ok || !payload?.ok) {
      setIntegrationNotice(payload?.error || `Failed to save ${provider} integration.`);
      return;
    }

    if (provider === "discord") {
      setDiscordIntegrationStatus(hasPrimaryIdentifier ? "connected" : "needs_attention");
    } else {
      setTelegramIntegrationStatus(hasPrimaryIdentifier ? "connected" : "needs_attention");
    }

    setIntegrationNotice(
      payload?.message ||
        (provider === "discord"
          ? `Discord integration and push settings saved for ${project.name}.`
          : `Telegram integration and push settings saved for ${project.name}.`)
    );
  }

  async function saveDiscordBotConfig() {
    if (!project?.id) return;

    setSavingDiscordBotSettings(true);
    setDiscordBotNotice("");
    setDiscordBotNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-bot-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settings: {
          ...discordBotSettings,
          leaderboardTopN: discordBotSettings.leaderboardTopN.trim(),
          leaderboardTargetChannelId: discordBotSettings.leaderboardTargetChannelId.trim(),
        },
        rankRules: discordRankRules.map((rule) => ({
          ...rule,
          threshold: rule.threshold.trim(),
          discordRoleId: rule.discordRoleId.trim(),
          label: rule.label.trim(),
        })),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingDiscordBotSettings(false);

    if (!response.ok || !payload?.ok) {
      setDiscordBotNoticeTone("error");
      setDiscordBotNotice(payload?.error || "Could not save community bot settings.");
      return;
    }

    setDiscordBotNoticeTone("success");
    setDiscordBotNotice(payload?.message || `Community bot settings saved for ${project.name}.`);
    await refreshCommunityGrowth();
  }

  function loadDiscordRankPreset(presetId: string) {
    const preset = DISCORD_RANK_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setDiscordRankRules(buildDiscordRankRulesFromPreset(preset));
    setDiscordBotSettings((current) => ({
      ...current,
      rankSource: preset.preferredSource,
    }));
    setDiscordBotNoticeTone("success");
    setDiscordBotNotice(
      `Loaded ${preset.title}. Paste the Discord role IDs, then save community bot settings.`
    );
  }

  async function runDiscordBotAction(action: Extract<CommunityBotAction, "command_sync" | "rank_sync" | "leaderboard_post">) {
    if (!project?.id) return;

    setRunningDiscordBotAction(action);
    setDiscordBotNotice("");
    setDiscordBotNoticeTone("success");

    const response = await fetch(
      action === "command_sync"
        ? `/api/projects/${project.id}/discord-command-sync`
        : action === "rank_sync"
          ? `/api/projects/${project.id}/discord-rank-sync`
          : `/api/projects/${project.id}/discord-leaderboard-post`,
      {
        method: "POST",
      }
    );

    const payload = await response.json().catch(() => null);
    setRunningDiscordBotAction(null);

    if (!response.ok || !payload?.ok) {
      setDiscordBotNoticeTone("error");
      setDiscordBotNotice(
        payload?.error ||
          (action === "command_sync"
            ? "Discord command sync failed."
            : action === "rank_sync"
              ? "Discord rank sync failed."
              : "Discord leaderboard post failed.")
      );
      return;
    }

    const skippedSummary =
      Array.isArray(payload?.skippedIntegrations) && payload.skippedIntegrations.length > 0
        ? ` Skipped ${payload.skippedIntegrations.length}: ${payload.skippedIntegrations
            .slice(0, 2)
            .map((item: { reason?: string }) => item.reason || "Unknown reason")
            .join(" | ")}`
        : "";

    setDiscordBotNoticeTone("success");
    setDiscordBotNotice(
      action === "command_sync"
        ? `Discord command sync processed ${payload.guildsProcessed ?? 0} guilds and enabled commands in ${payload.guildsEnabled ?? 0}.${skippedSummary}`
        : action === "rank_sync"
          ? `Discord rank sync checked ${payload.membersEvaluated ?? 0} members, added ${payload.rolesAdded ?? 0} roles and removed ${payload.rolesRemoved ?? 0}.${skippedSummary}`
          : `Discord leaderboard posted to ${payload.postsDelivered ?? 0} community rail${payload.postsDelivered === 1 ? "" : "s"}.`
    );

    if (action === "rank_sync") {
      setDiscordBotSettings((current) => ({
        ...current,
        lastRankSyncAt: new Date().toISOString(),
      }));
    }

    if (action === "leaderboard_post") {
      setDiscordBotSettings((current) => ({
        ...current,
        lastLeaderboardPostedAt: new Date().toISOString(),
      }));
    }
  }

  async function sendIntegrationTestPush(provider: "discord" | "telegram") {
    if (!project?.id) return;

    setTestingIntegration(provider);
    setIntegrationTestNotice("");
    setIntegrationTestTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-push-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        integrationConfig:
          provider === "discord" ? discordIntegrationConfig : telegramIntegrationConfig,
        pushSettings: provider === "discord" ? discordPushSettings : telegramPushSettings,
      }),
    });

    const payload = await response.json().catch(() => null);
    setTestingIntegration(null);

    if (!response.ok || !payload?.ok) {
      setIntegrationTestTone("error");
      setIntegrationTestNotice(
        payload?.error ||
          (provider === "discord"
            ? "Discord test push failed."
            : "Telegram test push failed.")
      );
      return;
    }

    const target =
      typeof payload.target === "string" && payload.target.trim()
        ? payload.target.trim()
        : provider === "discord"
          ? "the configured Discord rail"
          : "the configured Telegram rail";
    const messageId =
      payload?.result && typeof payload.result === "object" && "messageId" in payload.result
        ? String(payload.result.messageId)
        : "";

    setIntegrationTestTone("success");
    setIntegrationTestNotice(
      provider === "discord"
        ? `Discord test push delivered to ${target}${messageId ? ` (message ${messageId})` : ""}.`
        : `Telegram test push delivered to ${target}${messageId ? ` (message ${messageId})` : ""}.`
    );
  }

  function getMissionProviders() {
    if (discordBotSettings.missionDigestTarget === "discord") {
      return ["discord"] as Array<"discord" | "telegram">;
    }
    if (discordBotSettings.missionDigestTarget === "telegram") {
      return ["telegram"] as Array<"discord" | "telegram">;
    }
    return undefined;
  }

  async function runMissionAction(
    mode: "digest" | "campaign" | "quest" | "reward",
    contentId?: string
  ) {
    if (!project?.id) return;

    setRunningMissionAction(mode);
    setMissionNotice("");
    setMissionNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-mission-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        contentId,
        providers: getMissionProviders(),
      }),
    });

    const payload = await response.json().catch(() => null);
    setRunningMissionAction(null);

    if (!response.ok || !payload?.ok) {
      setMissionNoticeTone("error");
      setMissionNotice(payload?.error || "Mission community action failed.");
      return;
    }

    const deliveries = Array.isArray(payload?.deliveries) ? payload.deliveries.length : 0;
    setMissionNoticeTone("success");
    setMissionNotice(
      mode === "digest"
        ? `Mission digest delivered to ${deliveries} provider rail${deliveries === 1 ? "" : "s"}.`
        : `Mission rail posted through ${deliveries} provider target${deliveries === 1 ? "" : "s"}.`
    );

    if (mode === "digest") {
      setDiscordBotSettings((current) => ({
        ...current,
        lastMissionDigestAt: new Date().toISOString(),
        lastAutomationRunAt: new Date().toISOString(),
      }));
    }
    await refreshRecentActivity();
  }

  async function runRaidAction(raidId: string, mode: "live" | "reminder" | "result") {
    if (!project?.id) return;

    setRunningRaidAction(mode);
    setRaidNotice("");
    setRaidNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-raid-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raidId,
        mode,
      }),
    });

    const payload = await response.json().catch(() => null);
    setRunningRaidAction(null);

    if (!response.ok || !payload?.ok) {
      setRaidNoticeTone("error");
      setRaidNotice(payload?.error || "Raid community action failed.");
      return;
    }

    const deliveries = Array.isArray(payload?.deliveries) ? payload.deliveries.length : 0;
    setRaidNoticeTone("success");
    setRaidNotice(
      `Raid ${mode} pushed through ${deliveries} provider target${deliveries === 1 ? "" : "s"}.`
    );
    setDiscordBotSettings((current) => ({
      ...current,
      lastRaidAlertAt: new Date().toISOString(),
      lastAutomationRunAt: new Date().toISOString(),
    }));
    await refreshRecentActivity();
  }

  async function runAutomationAction(mode: "all" | "missions" | "raids") {
    if (!project?.id) return;

    setRunningAutomationAction(mode);
    setAutomationNotice("");
    setAutomationNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-automation-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode, providers: getMissionProviders() }),
    });

    const payload = await response.json().catch(() => null);
    setRunningAutomationAction(null);

    if (!response.ok || !payload?.ok) {
      setAutomationNoticeTone("error");
      setAutomationNotice(payload?.error || "Automation run failed.");
      return;
    }

    const results = Array.isArray(payload?.results) ? payload.results.length : 0;
    setAutomationNoticeTone("success");
    setAutomationNotice(
      `Automation run completed with ${results} community action${results === 1 ? "" : "s"}.`
    );
    setDiscordBotSettings((current) => ({
      ...current,
      lastAutomationRunAt: new Date().toISOString(),
      ...(mode === "all" || mode === "missions"
        ? { lastMissionDigestAt: new Date().toISOString() }
        : {}),
      ...(mode === "all" || mode === "raids"
        ? { lastRaidAlertAt: new Date().toISOString() }
        : {}),
    }));
    await refreshRecentActivity();
  }

  async function saveCaptains() {
    if (!project?.id) return;

    setSavingCaptains(true);
    setCaptainNotice("");
    setCaptainNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-captains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignments: captainAssignments.map((assignment) => ({
          ...assignment,
          authUserId: assignment.authUserId.trim(),
          label: assignment.label.trim(),
        })),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingCaptains(false);

    if (!response.ok || !payload?.ok) {
      setCaptainNoticeTone("error");
      setCaptainNotice(payload?.error || "Could not save captain roster.");
      return;
    }

    setCaptainNoticeTone("success");
    setCaptainNotice(payload?.message || "Community captains saved.");
    await refreshCommunityGrowth();
    await refreshRecentActivity();
  }

  async function runFunnelAction(mode: "newcomer" | "reactivation") {
    if (!project?.id) return;

    setRunningFunnelAction(mode);
    setFunnelNotice("");
    setFunnelNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-funnel-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ funnel: mode, providers: getMissionProviders() }),
    });

    const payload = await response.json().catch(() => null);
    setRunningFunnelAction(null);

    if (!response.ok || !payload?.ok) {
      setFunnelNoticeTone("error");
      setFunnelNotice(payload?.error || "Community funnel push failed.");
      return;
    }

    const deliveries = Array.isArray(payload?.deliveries) ? payload.deliveries.length : 0;
    setFunnelNoticeTone("success");
    setFunnelNotice(
      mode === "newcomer"
        ? `Starter lane pushed through ${deliveries} provider target${deliveries === 1 ? "" : "s"}.`
        : `Comeback lane pushed through ${deliveries} provider target${deliveries === 1 ? "" : "s"}.`
    );
    setDiscordBotSettings((current) => ({
      ...current,
      ...(mode === "newcomer" ? { lastNewcomerPushAt: new Date().toISOString() } : {}),
      ...(mode === "reactivation"
        ? { lastReactivationPushAt: new Date().toISOString() }
        : {}),
    }));
    await refreshCommunityGrowth();
    await refreshRecentActivity();
  }

  async function runActivationBoard(campaignId: string) {
    if (!project?.id) return;

    setRunningActivationBoardCampaignId(campaignId);
    setActivationNotice("");
    setActivationNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-activation-board`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ campaignId, providers: getMissionProviders() }),
    });

    const payload = await response.json().catch(() => null);
    setRunningActivationBoardCampaignId(null);

    if (!response.ok || !payload?.ok) {
      setActivationNoticeTone("error");
      setActivationNotice(payload?.error || "Activation board push failed.");
      return;
    }

    const deliveries = Array.isArray(payload?.deliveries) ? payload.deliveries.length : 0;
    setActivationNoticeTone("success");
    setActivationNotice(
      `Activation board pushed through ${deliveries} provider target${deliveries === 1 ? "" : "s"}.`
    );
    setDiscordBotSettings((current) => ({
      ...current,
      lastActivationBoardAt: new Date().toISOString(),
    }));
    await refreshCommunityGrowth();
    await refreshRecentActivity();
  }

  function updateCommunityAutomation(
    automationId: string,
    patch: Partial<
      Pick<
        CommunityAutomationRecord,
        "status" | "cadence" | "providerScope" | "targetProvider"
      >
    >
  ) {
    setCommunityAutomations((current) =>
      current.map((automation) =>
        automation.id === automationId ? { ...automation, ...patch } : automation
      )
    );
  }

  async function saveCommunityAutomations() {
    if (!project?.id) return;

    setSavingCommunityAutomations(true);
    setCommunityAutomationNotice("");
    setCommunityAutomationNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-automations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        automations: communityAutomations.map((automation) => ({
          ...automation,
          title: automation.title.trim(),
          description: automation.description.trim(),
        })),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingCommunityAutomations(false);

    if (!response.ok || !payload?.ok) {
      setCommunityAutomationNoticeTone("error");
      setCommunityAutomationNotice(payload?.error || "Could not save community automations.");
      return;
    }

    setCommunityAutomationNoticeTone("success");
    setCommunityAutomationNotice(
      payload?.message || "Community automation center updated."
    );
    setCommunityAutomations(Array.isArray(payload.automations) ? payload.automations : []);
    setCommunityAutomationRuns(
      Array.isArray(payload.automationRuns) ? payload.automationRuns : []
    );
    await refreshRecentActivity();
  }

  async function runCommunityAutomation(automationId: string) {
    if (!project?.id) return;

    setRunningCommunityAutomationId(automationId);
    setCommunityAutomationNotice("");
    setCommunityAutomationNoticeTone("success");

    const response = await fetch(
      `/api/projects/${project.id}/community-automations/${automationId}/run`,
      {
        method: "POST",
      }
    );

    const payload = await response.json().catch(() => null);
    setRunningCommunityAutomationId(null);

    if (!response.ok || !payload?.ok) {
      setCommunityAutomationNoticeTone("error");
      setCommunityAutomationNotice(payload?.error || "Community automation run failed.");
      return;
    }

    setCommunityAutomationNoticeTone("success");
    setCommunityAutomationNotice(
      payload?.summary || "Community automation run completed."
    );
    await refreshCommunityExecution();
    await refreshRecentActivity();
  }

  function toggleCaptainPermission(
    authUserId: string,
    permission: CommunityCaptainPermission,
    enabled: boolean
  ) {
    setCaptainPermissions((current) => {
      const currentPermissions = current[authUserId] ?? [];
      const nextPermissions = enabled
        ? Array.from(new Set([...currentPermissions, permission]))
        : currentPermissions.filter((value) => value !== permission);

      return {
        ...current,
        [authUserId]: nextPermissions,
      };
    });
  }

  async function saveCaptainPermissions() {
    if (!project?.id) return;

    setSavingCaptainPermissions(true);
    setCaptainPermissionsNotice("");
    setCaptainPermissionsNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-captain-permissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        captainPermissions,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingCaptainPermissions(false);

    if (!response.ok || !payload?.ok) {
      setCaptainPermissionsNoticeTone("error");
      setCaptainPermissionsNotice(payload?.error || "Could not save captain permissions.");
      return;
    }

    setCaptainPermissionsNoticeTone("success");
    setCaptainPermissionsNotice(payload?.message || "Captain permissions saved.");
    setCaptainPermissions(
      payload.captainPermissions && typeof payload.captainPermissions === "object"
        ? payload.captainPermissions
        : {}
    );
    setCaptainActions(Array.isArray(payload.captainActions) ? payload.captainActions : []);
    await refreshRecentActivity();
  }

  function updateCommunityPlaybook(
    playbookKey: CommunityPlaybookKey,
    patch: Partial<Pick<CommunityPlaybookConfig, "enabled" | "providerScope">>
  ) {
    setCommunityPlaybooks((current) =>
      current.map((playbook) =>
        playbook.key === playbookKey ? { ...playbook, ...patch } : playbook
      )
    );
  }

  async function saveCommunityPlaybooks() {
    if (!project?.id) return;

    setSavingPlaybooks(true);
    setPlaybookNotice("");
    setPlaybookNoticeTone("success");

    const response = await fetch(`/api/projects/${project.id}/community-playbooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playbooks: communityPlaybooks.map((playbook) => ({
          key: playbook.key,
          enabled: playbook.enabled,
          providerScope: playbook.providerScope,
        })),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingPlaybooks(false);

    if (!response.ok || !payload?.ok) {
      setPlaybookNoticeTone("error");
      setPlaybookNotice(payload?.error || "Could not save community playbooks.");
      return;
    }

    setPlaybookNoticeTone("success");
    setPlaybookNotice(payload?.message || "Community playbooks saved.");
    setCommunityPlaybooks(Array.isArray(payload.playbooks) ? payload.playbooks : []);
    setCommunityPlaybookRuns(Array.isArray(payload.playbookRuns) ? payload.playbookRuns : []);
    await refreshRecentActivity();
  }

  async function runCommunityPlaybook(playbookKey: CommunityPlaybookKey) {
    if (!project?.id) return;

    setRunningPlaybookKey(playbookKey);
    setPlaybookNotice("");
    setPlaybookNoticeTone("success");

    const response = await fetch(
      `/api/projects/${project.id}/community-playbooks/${playbookKey}/run`,
      {
        method: "POST",
      }
    );

    const payload = await response.json().catch(() => null);
    setRunningPlaybookKey(null);

    if (!response.ok || !payload?.ok) {
      setPlaybookNoticeTone("error");
      setPlaybookNotice(payload?.error || "Community playbook run failed.");
      return;
    }

    setPlaybookNoticeTone("success");
    setPlaybookNotice(payload?.summary || "Community playbook completed.");
    await refreshCommunityExecution();
    await refreshRecentActivity();
  }

  if (
    authLoading ||
    loadingCommunityGrowth ||
    loadingCommunityExecution ||
    (!portalHydrated && (portalLoading || !project))
  ) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading community control room"
          description="Veltrix is pulling this project's provider rails, bot settings, contributor readiness, captain lanes, trust posture and recent operator activity into the Community OS view."
        />
      </AdminShell>
    );
  }

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project community not found"
          description="This community control room could not be resolved from the current workspace state."
        />
      </AdminShell>
    );
  }

  if (!hasProjectAccess) {
    return (
      <AdminShell>
        <NotFoundState
          title="Community access is project-scoped"
          description="Only team members from this project can view or manage this community rail."
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Community OS"
          title={`${project.name} community management`}
          description="Run this project's Discord, Telegram and X community rails from one private surface. Community health, commands, members, missions, raids and automation pulses are all scoped to this project only."
          aside={
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sub">Project scope</p>
              <div className="flex flex-wrap gap-2">
                <OpsStatusPill tone="success">{project.chain}</OpsStatusPill>
                <OpsStatusPill tone="default">
                  {project.isPublic ? "Public surface" : "Private surface"}
                </OpsStatusPill>
                <OpsStatusPill tone={discordBotSettings.commandsEnabled ? "success" : "warning"}>
                  {discordBotSettings.commandsEnabled ? "Discord commands live" : "Discord commands parked"}
                </OpsStatusPill>
                <OpsStatusPill tone={discordBotSettings.telegramCommandsEnabled ? "success" : "default"}>
                  {discordBotSettings.telegramCommandsEnabled ? "Telegram commands live" : "Telegram commands parked"}
                </OpsStatusPill>
              </div>
            </div>
          }
        />

        <CommunityOverviewPanel
          projectId={project.id}
          projectName={project.name}
          discordIntegrationStatus={discordIntegrationStatus}
          telegramIntegrationStatus={telegramIntegrationStatus}
          xIntegrationStatus={xIntegrationStatus}
          telegramCommandsEnabled={discordBotSettings.telegramCommandsEnabled}
          captainsEnabled={discordBotSettings.captainsEnabled}
          activationBoardsEnabled={discordBotSettings.activationBoardsEnabled}
          campaignCount={relatedCampaigns.length}
          questCount={relatedQuests.length}
          raidCount={relatedRaids.length}
          rewardCount={relatedRewards.length}
          teamMemberCount={relatedTeamMembers.length}
          linkedContributorCount={communityMembers.summary.commandReady}
          walletVerifiedCount={communityMembers.summary.walletVerified}
          captainCount={communityGrowth.captains.assignments.length}
          newcomerCount={communityGrowth.cohorts.summary.newcomers}
          reactivationCount={communityGrowth.cohorts.summary.reactivation}
          watchlistCount={communityGrowth.cohorts.summary.watchlist}
          callbackFailures={operatorSignals.callbackFailures}
          onchainFailures={operatorSignals.onchainFailures}
          latestIssue={
            communityGrowth.trust.openFlagCount > 0 || communityGrowth.trust.watchlistCount > 0
              ? communityGrowth.trust.latestIssue
              : operatorSignals.latestIssue
          }
          automationRailCount={communityAutomations.length}
          activeAutomationCount={activeAutomationCount}
          dueAutomationCount={dueAutomationCount}
          enabledPlaybookCount={enabledPlaybookCount}
          recentAutomationFailureCount={recentAutomationFailureCount}
          lastRankSyncAt={discordBotSettings.lastRankSyncAt}
          lastLeaderboardPostedAt={discordBotSettings.lastLeaderboardPostedAt}
          lastMissionDigestAt={discordBotSettings.lastMissionDigestAt}
          lastRaidAlertAt={discordBotSettings.lastRaidAlertAt}
          lastAutomationRunAt={discordBotSettings.lastAutomationRunAt}
          lastNewcomerPushAt={discordBotSettings.lastNewcomerPushAt}
          lastReactivationPushAt={discordBotSettings.lastReactivationPushAt}
          lastActivationBoardAt={discordBotSettings.lastActivationBoardAt}
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <CommunityCommandsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            savingDiscordBotSettings={savingDiscordBotSettings}
            runningDiscordBotAction={runningDiscordBotAction}
            onSaveDiscordBotConfig={() => void saveDiscordBotConfig()}
            onRunCommandSync={() => void runDiscordBotAction("command_sync")}
          />
          <CommunityActivityPanel
            callbackFailures={operatorSignals.callbackFailures}
            onchainFailures={operatorSignals.onchainFailures}
            watchlistCount={communityGrowth.cohorts.summary.watchlist}
            openFlagCount={communityGrowth.trust.openFlagCount}
            latestIssue={
              communityGrowth.trust.openFlagCount > 0 ||
              communityGrowth.trust.watchlistCount > 0
                ? communityGrowth.trust.latestIssue
                : operatorSignals.latestIssue
            }
            recentActivity={recentActivity}
            loadingActivity={loadingActivity}
            automationRunCount={communityAutomationRuns.length}
            playbookRunCount={communityPlaybookRuns.length}
            captainActionCount={captainActions.length}
            recentAutomationFailureCount={recentAutomationFailureCount}
          />
        </div>

        <CommunityMembersPanel
          loading={loadingCommunityMembers}
          summary={communityMembers.summary}
          topContributors={communityMembers.topContributors}
          readinessWatch={communityMembers.readinessWatch}
        />

        <CommunityIntegrationsPanel
          projectName={project.name}
          xIntegrationStatus={xIntegrationStatus}
          discordIntegrationStatus={discordIntegrationStatus}
          telegramIntegrationStatus={telegramIntegrationStatus}
          discordIntegrationConfig={discordIntegrationConfig}
          setDiscordIntegrationConfig={setDiscordIntegrationConfig}
          telegramIntegrationConfig={telegramIntegrationConfig}
          setTelegramIntegrationConfig={setTelegramIntegrationConfig}
          discordPushSettings={discordPushSettings}
          setDiscordPushSettings={setDiscordPushSettings}
          telegramPushSettings={telegramPushSettings}
          setTelegramPushSettings={setTelegramPushSettings}
          selectableProjects={[]}
          campaigns={relatedCampaigns.map((campaign) => ({
            id: campaign.id,
            title: campaign.title,
            projectId: campaign.projectId,
          }))}
          projectNameById={projectNameById}
          savingIntegration={savingIntegration}
          testingIntegration={testingIntegration}
          integrationNotice={integrationNotice}
          integrationTestNotice={integrationTestNotice}
          integrationTestTone={integrationTestTone}
          onSaveIntegration={(provider) => void saveProjectIntegration(provider)}
          onSendTestPush={(provider) => void sendIntegrationTestPush(provider)}
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <CommunityRanksPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            rankRules={discordRankRules}
            setRankRules={setDiscordRankRules}
            savingDiscordBotSettings={savingDiscordBotSettings}
            runningDiscordBotAction={runningDiscordBotAction}
            discordBotNotice={discordBotNotice}
            discordBotNoticeTone={discordBotNoticeTone}
            onSaveDiscordBotConfig={() => void saveDiscordBotConfig()}
            onLoadPreset={loadDiscordRankPreset}
            onRunRankSync={() => void runDiscordBotAction("rank_sync")}
          />

          <CommunityLeaderboardsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            savingDiscordBotSettings={savingDiscordBotSettings}
            runningDiscordBotAction={runningDiscordBotAction}
            onSaveDiscordBotConfig={() => void saveDiscordBotConfig()}
            onRunLeaderboardPost={() => void runDiscordBotAction("leaderboard_post")}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <CommunityMissionsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            campaigns={relatedCampaigns.map((campaign) => ({
              id: campaign.id,
              title: campaign.title,
              featured: campaign.featured,
              xpBudget: campaign.xpBudget,
            }))}
            quests={relatedQuests.map((quest) => ({
              id: quest.id,
              title: quest.title,
              xp: quest.xp,
            }))}
            rewards={relatedRewards.map((reward) => ({
              id: reward.id,
              title: reward.title,
              cost: reward.cost,
              rarity: reward.rarity,
            }))}
            savingDiscordBotSettings={savingDiscordBotSettings}
            runningMissionAction={runningMissionAction}
            missionNotice={missionNotice}
            missionNoticeTone={missionNoticeTone}
            onSaveDiscordBotConfig={() => void saveDiscordBotConfig()}
            onRunMissionAction={(mode, contentId) => void runMissionAction(mode, contentId)}
          />

          <CommunityRaidOpsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            raids={relatedRaids.map((raid) => ({
              id: raid.id,
              title: raid.title,
              rewardXp: raid.rewardXp,
            }))}
            savingDiscordBotSettings={savingDiscordBotSettings}
            runningRaidAction={runningRaidAction}
            raidNotice={raidNotice}
            raidNoticeTone={raidNoticeTone}
            onSaveDiscordBotConfig={() => void saveDiscordBotConfig()}
            onRunRaidAction={(raidId, mode) => void runRaidAction(raidId, mode)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <CommunityAutomationCenterPanel
            automations={communityAutomations}
            automationRuns={communityAutomationRuns}
            saving={savingCommunityAutomations}
            runningAutomationId={runningCommunityAutomationId}
            notice={communityAutomationNotice}
            noticeTone={communityAutomationNoticeTone}
            onUpdateAutomation={updateCommunityAutomation}
            onSave={() => void saveCommunityAutomations()}
            onRunAutomation={(automationId) => void runCommunityAutomation(automationId)}
          />

          <CommunityPlaybooksPanel
            playbooks={communityPlaybooks}
            playbookRuns={communityPlaybookRuns}
            saving={savingPlaybooks}
            runningPlaybookKey={runningPlaybookKey}
            notice={playbookNotice}
            noticeTone={playbookNoticeTone}
            onUpdatePlaybook={updateCommunityPlaybook}
            onSave={() => void saveCommunityPlaybooks()}
            onRunPlaybook={(playbookKey) => void runCommunityPlaybook(playbookKey)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <CommunityAutomationsPanel
            settings={discordBotSettings}
            runningAutomationAction={runningAutomationAction}
            automationNotice={automationNotice}
            automationNoticeTone={automationNoticeTone}
            onRunAutomationAction={(mode) => void runAutomationAction(mode)}
          />

          <CommunityAnalyticsPanel analytics={communityGrowth.analytics} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <CommunityCaptainsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            assignments={captainAssignments}
            setAssignments={setCaptainAssignments}
            roster={communityGrowth.captains.assignments}
            candidates={communityGrowth.captains.candidates}
            savingSettings={savingDiscordBotSettings}
            savingCaptains={savingCaptains}
            captainNotice={captainNotice}
            captainNoticeTone={captainNoticeTone}
            onSaveSettings={() => void saveDiscordBotConfig()}
            onSaveCaptains={() => void saveCaptains()}
          />

          <CommunityCaptainOpsPanel
            roster={communityGrowth.captains.assignments}
            captainPermissions={captainPermissions}
            captainActions={captainActions}
            saving={savingCaptainPermissions}
            notice={captainPermissionsNotice}
            noticeTone={captainPermissionsNoticeTone}
            onTogglePermission={toggleCaptainPermission}
            onSave={() => void saveCaptainPermissions()}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <CommunityCohortsPanel
            settings={discordBotSettings}
            setSettings={setDiscordBotSettings}
            summary={communityGrowth.cohorts.summary}
            newcomers={communityGrowth.cohorts.newcomers}
            reactivation={communityGrowth.cohorts.reactivation}
            watchlist={communityGrowth.cohorts.watchlist}
            trust={communityGrowth.trust}
            savingSettings={savingDiscordBotSettings}
            runningFunnelAction={runningFunnelAction}
            funnelNotice={funnelNotice}
            funnelNoticeTone={funnelNoticeTone}
            onSaveSettings={() => void saveDiscordBotConfig()}
            onRunFunnelAction={(mode) => void runFunnelAction(mode)}
          />

          <CommunityFunnelsPanel
            newcomerCount={communityGrowth.cohorts.summary.newcomers}
            reactivationCount={communityGrowth.cohorts.summary.reactivation}
            watchlistCount={communityGrowth.cohorts.summary.watchlist}
            automations={communityAutomations}
            runningAutomationId={runningCommunityAutomationId}
            onRunAutomation={(automationId) => void runCommunityAutomation(automationId)}
          />
        </div>

        <CommunityActivationBoardsPanel
          settings={discordBotSettings}
          setSettings={setDiscordBotSettings}
          boards={communityGrowth.activationBoards}
          savingSettings={savingDiscordBotSettings}
          runningActivationBoardCampaignId={runningActivationBoardCampaignId}
          activationNotice={activationNotice}
          activationNoticeTone={activationNoticeTone}
          onSaveSettings={() => void saveDiscordBotConfig()}
          onRunActivationBoard={(campaignId) => void runActivationBoard(campaignId)}
        />
      </div>
    </AdminShell>
  );
}
