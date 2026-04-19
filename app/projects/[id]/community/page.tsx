"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { CommunityActivityPanel } from "@/components/community/CommunityActivityPanel";
import { CommunityAutomationsPanel } from "@/components/community/CommunityAutomationsPanel";
import {
  buildDiscordRankRulesFromPreset,
  CommunityBotAction,
  CommunityPushSettings,
  createDefaultDiscordBotSettings,
  createDefaultPushSettings,
  DiscordCommunityBotSettings,
  DiscordRankRule,
  DiscordRankSource,
  DISCORD_RANK_PRESETS,
  readPushSettings,
} from "@/components/community/community-config";
import { CommunityCommandsPanel } from "@/components/community/CommunityCommandsPanel";
import { CommunityIntegrationsPanel } from "@/components/community/CommunityIntegrationsPanel";
import { CommunityLeaderboardsPanel } from "@/components/community/CommunityLeaderboardsPanel";
import { CommunityMembersPanel } from "@/components/community/CommunityMembersPanel";
import { CommunityMissionsPanel } from "@/components/community/CommunityMissionsPanel";
import { CommunityOverviewPanel } from "@/components/community/CommunityOverviewPanel";
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
  }

  if (authLoading || (!portalHydrated && (portalLoading || !project))) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading community control room"
          description="Veltrix is pulling this project's provider rails, bot settings, contributor readiness and recent operator activity into the Community OS view."
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
          campaignCount={relatedCampaigns.length}
          questCount={relatedQuests.length}
          raidCount={relatedRaids.length}
          rewardCount={relatedRewards.length}
          teamMemberCount={relatedTeamMembers.length}
          linkedContributorCount={communityMembers.summary.commandReady}
          walletVerifiedCount={communityMembers.summary.walletVerified}
          callbackFailures={operatorSignals.callbackFailures}
          onchainFailures={operatorSignals.onchainFailures}
          latestIssue={operatorSignals.latestIssue}
          lastRankSyncAt={discordBotSettings.lastRankSyncAt}
          lastLeaderboardPostedAt={discordBotSettings.lastLeaderboardPostedAt}
          lastMissionDigestAt={discordBotSettings.lastMissionDigestAt}
          lastRaidAlertAt={discordBotSettings.lastRaidAlertAt}
          lastAutomationRunAt={discordBotSettings.lastAutomationRunAt}
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
            latestIssue={operatorSignals.latestIssue}
            recentActivity={recentActivity}
            loadingActivity={loadingActivity}
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

        <CommunityAutomationsPanel
          settings={discordBotSettings}
          runningAutomationAction={runningAutomationAction}
          automationNotice={automationNotice}
          automationNoticeTone={automationNoticeTone}
          onRunAutomationAction={(mode) => void runAutomationAction(mode)}
        />
      </div>
    </AdminShell>
  );
}
