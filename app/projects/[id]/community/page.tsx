"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { CommunityActivityPanel } from "@/components/community/CommunityActivityPanel";
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
import { CommunityOverviewPanel } from "@/components/community/CommunityOverviewPanel";
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
  const [integrationNotice, setIntegrationNotice] = useState<string>("");
  const [testingIntegration, setTestingIntegration] = useState<"discord" | "telegram" | null>(null);
  const [integrationTestNotice, setIntegrationTestNotice] = useState<string>("");
  const [integrationTestTone, setIntegrationTestTone] = useState<"success" | "error">(
    "success"
  );

  const [discordBotSettings, setDiscordBotSettings] =
    useState<DiscordCommunityBotSettings>(createDefaultDiscordBotSettings());
  const [discordRankRules, setDiscordRankRules] = useState<DiscordRankRule[]>([]);
  const [savingDiscordBotSettings, setSavingDiscordBotSettings] = useState(false);
  const [runningDiscordBotAction, setRunningDiscordBotAction] =
    useState<CommunityBotAction | null>(null);
  const [discordBotNotice, setDiscordBotNotice] = useState("");
  const [discordBotNoticeTone, setDiscordBotNoticeTone] = useState<"success" | "error">(
    "success"
  );

  const [operatorSignals, setOperatorSignals] = useState<{
    callbackFailures: number;
    onchainFailures: number;
    latestIssue: string;
  }>({
    callbackFailures: 0,
    onchainFailures: 0,
    latestIssue: "No active operator incidents logged.",
  });
  const [recentActivity, setRecentActivity] = useState<DbAuditLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

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
        setDiscordBotNotice(payload?.error || "Could not load Discord bot settings.");
        return;
      }

      setDiscordBotNotice("");
      setDiscordBotSettings({
        commandsEnabled: payload.settings?.commandsEnabled !== false,
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
        lastRankSyncAt:
          typeof payload.settings?.lastRankSyncAt === "string"
            ? payload.settings.lastRankSyncAt
            : "",
        lastLeaderboardPostedAt:
          typeof payload.settings?.lastLeaderboardPostedAt === "string"
            ? payload.settings.lastLeaderboardPostedAt
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
        .limit(12);

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

  const relatedCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.projectId === project?.id),
    [campaigns, project?.id]
  );
  const relatedQuests = useMemo(
    () => quests.filter((quest) => quest.projectId === project?.id),
    [project?.id, quests]
  );
  const relatedRewards = useMemo(
    () => rewards.filter((reward) => reward.projectId === project?.id),
    [project?.id, rewards]
  );
  const relatedTeamMembers = useMemo(
    () => teamMembers.filter((member) => member.projectId === project?.id),
    [project?.id, teamMembers]
  );
  const selectableProjects = useMemo(
    () => projects.filter((item) => item.id !== project?.id),
    [project?.id, projects]
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
      setDiscordBotNotice(payload?.error || "Could not save Discord bot settings.");
      return;
    }

    setDiscordBotNoticeTone("success");
    setDiscordBotNotice(payload?.message || `Discord bot settings saved for ${project.name}.`);
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
      `Loaded ${preset.title}. Paste the Discord role IDs, then save bot settings.`
    );
  }

  async function runDiscordBotAction(action: CommunityBotAction) {
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

  if (authLoading || (!portalHydrated && (portalLoading || !project))) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading community control room"
          description="Veltrix is pulling this project's provider rails, bot settings and recent operator activity into the Community OS view."
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
          description="Run this project's Discord, Telegram and X community rails from one private surface. Community settings, rank ladders, leaderboards and activity are all scoped to this project only."
          aside={
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sub">Project scope</p>
              <div className="flex flex-wrap gap-2">
                <OpsStatusPill tone="success">{project.chain}</OpsStatusPill>
                <OpsStatusPill tone="default">{project.isPublic ? "Public surface" : "Private surface"}</OpsStatusPill>
                <OpsStatusPill tone={discordBotSettings.commandsEnabled ? "success" : "warning"}>
                  {discordBotSettings.commandsEnabled ? "Commands live" : "Commands parked"}
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
          campaignCount={relatedCampaigns.length}
          questCount={relatedQuests.length}
          rewardCount={relatedRewards.length}
          teamMemberCount={relatedTeamMembers.length}
          callbackFailures={operatorSignals.callbackFailures}
          onchainFailures={operatorSignals.onchainFailures}
          latestIssue={operatorSignals.latestIssue}
          lastRankSyncAt={discordBotSettings.lastRankSyncAt}
          lastLeaderboardPostedAt={discordBotSettings.lastLeaderboardPostedAt}
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
      </div>
    </AdminShell>
  );
}
