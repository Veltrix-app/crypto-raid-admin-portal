"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
import {
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type PushScopeMode =
  | "project_only"
  | "selected_projects"
  | "selected_campaigns"
  | "all_public";
type PushDeliveryMode = "broadcast" | "priority_only";

type CommunityPushSettings = {
  enabled: boolean;
  scopeMode: PushScopeMode;
  deliveryMode: PushDeliveryMode;
  selectedProjectIds: string[];
  selectedCampaignIds: string[];
  targetChannelId: string;
  targetThreadId: string;
  targetChatId: string;
  allowCampaigns: boolean;
  allowQuests: boolean;
  allowRaids: boolean;
  allowRewards: boolean;
  allowAnnouncements: boolean;
  featuredOnly: boolean;
  liveOnly: boolean;
  minXp: string;
};

type OnchainProjectWallet = {
  id: string;
  chain: string;
  wallet_address: string;
  label: string;
  wallet_type: string;
  is_active: boolean;
};

type OnchainProjectAsset = {
  id: string;
  chain: string;
  contract_address: string;
  asset_type: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

type OnchainWalletForm = {
  chain: string;
  walletAddress: string;
  label: string;
  walletType: string;
  isActive: boolean;
};

type OnchainAssetForm = {
  editingAssetId: string | null;
  chain: string;
  contractAddress: string;
  assetType: string;
  symbol: string;
  decimals: string;
  isActive: boolean;
  startBlock: string;
  marketMakerAddressesText: string;
  stakingContractAddressesText: string;
  lpContractAddressesText: string;
  allowedFunctionsText: string;
  trackContractCalls: boolean;
  enableHoldTracking: boolean;
  holdThresholdHours: string;
  metadataJson: string;
};

function createDefaultPushSettings(provider: "discord" | "telegram"): CommunityPushSettings {
  return {
    enabled: true,
    scopeMode: "project_only",
    deliveryMode: "broadcast",
    selectedProjectIds: [],
    selectedCampaignIds: [],
    targetChannelId: "",
    targetThreadId: "",
    targetChatId: "",
    allowCampaigns: true,
    allowQuests: true,
    allowRaids: true,
    allowRewards: false,
    allowAnnouncements: true,
    featuredOnly: false,
    liveOnly: false,
    minXp: "",
  };
}

function readPushSettings(
  config: Record<string, unknown> | null | undefined,
  provider: "discord" | "telegram"
): CommunityPushSettings {
  const defaults = createDefaultPushSettings(provider);
  const rawPushSettings =
    config?.pushSettings && typeof config.pushSettings === "object"
      ? (config.pushSettings as Record<string, unknown>)
      : {};

  return {
    enabled: rawPushSettings.enabled !== false,
    scopeMode:
      rawPushSettings.scopeMode === "selected_projects"
        ? "selected_projects"
        : rawPushSettings.scopeMode === "selected_campaigns"
          ? "selected_campaigns"
          : rawPushSettings.scopeMode === "all_public"
            ? "all_public"
            : "project_only",
    deliveryMode: rawPushSettings.deliveryMode === "priority_only" ? "priority_only" : "broadcast",
    selectedProjectIds: Array.isArray(rawPushSettings.selectedProjectIds)
      ? rawPushSettings.selectedProjectIds
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [],
    selectedCampaignIds: Array.isArray(rawPushSettings.selectedCampaignIds)
      ? rawPushSettings.selectedCampaignIds
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [],
    targetChannelId:
      provider === "discord" && typeof rawPushSettings.targetChannelId === "string"
        ? rawPushSettings.targetChannelId
        : defaults.targetChannelId,
    targetThreadId:
      provider === "discord" && typeof rawPushSettings.targetThreadId === "string"
        ? rawPushSettings.targetThreadId
        : defaults.targetThreadId,
    targetChatId:
      provider === "telegram" && typeof rawPushSettings.targetChatId === "string"
        ? rawPushSettings.targetChatId
        : defaults.targetChatId,
    allowCampaigns: rawPushSettings.allowCampaigns !== false,
    allowQuests: rawPushSettings.allowQuests !== false,
    allowRaids: rawPushSettings.allowRaids !== false,
    allowRewards: rawPushSettings.allowRewards === true,
    allowAnnouncements: rawPushSettings.allowAnnouncements !== false,
    featuredOnly: rawPushSettings.featuredOnly === true,
    liveOnly: rawPushSettings.liveOnly === true,
    minXp:
      typeof rawPushSettings.minXp === "number"
        ? String(rawPushSettings.minXp)
        : typeof rawPushSettings.minXp === "string"
          ? rawPushSettings.minXp
          : defaults.minXp,
  };
}

function toggleScopeSelection(current: string[], nextId: string, checked: boolean) {
  if (checked) {
    return current.includes(nextId) ? current : [...current, nextId];
  }

  return current.filter((item) => item !== nextId);
}

function stringifyOnchainMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "";
  }

  return JSON.stringify(metadata, null, 2);
}

function splitMultilineInput(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinMultilineInput(values: unknown) {
  return Array.isArray(values)
    ? values
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join("\n")
    : "";
}

function parseAdditionalMetadata(value: string) {
  if (value.trim().length === 0) {
    return {} as Record<string, unknown>;
  }

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Advanced metadata must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function createDefaultAssetForm(): OnchainAssetForm {
  return {
    editingAssetId: null,
    chain: "evm",
    contractAddress: "",
    assetType: "token",
    symbol: "",
    decimals: "18",
    isActive: true,
    startBlock: "",
    marketMakerAddressesText: "",
    stakingContractAddressesText: "",
    lpContractAddressesText: "",
    allowedFunctionsText: "",
    trackContractCalls: false,
    enableHoldTracking: true,
    holdThresholdHours: "24",
    metadataJson: "",
  };
}

function createAssetFormFromAsset(asset: OnchainProjectAsset): OnchainAssetForm {
  const metadata =
    asset.metadata && typeof asset.metadata === "object"
      ? (asset.metadata as Record<string, unknown>)
      : {};
  const {
    syncState: _syncState,
    startBlock: _startBlock,
    marketMakerAddresses: _marketMakerAddresses,
    stakingContractAddresses: _stakingContractAddresses,
    lpContractAddresses: _lpContractAddresses,
    allowedFunctions: _allowedFunctions,
    trackContractCalls: _trackContractCalls,
    enableHoldTracking: _enableHoldTracking,
    holdThresholdHours: _holdThresholdHours,
    ...advancedMetadata
  } = metadata;

  return {
    editingAssetId: asset.id,
    chain: asset.chain,
    contractAddress: asset.contract_address,
    assetType: asset.asset_type,
    symbol: asset.symbol,
    decimals: String(asset.decimals),
    isActive: asset.is_active,
    startBlock:
      typeof metadata.startBlock === "number"
        ? String(metadata.startBlock)
        : typeof metadata.startBlock === "string"
          ? metadata.startBlock
          : "",
    marketMakerAddressesText: joinMultilineInput(metadata.marketMakerAddresses),
    stakingContractAddressesText: joinMultilineInput(metadata.stakingContractAddresses),
    lpContractAddressesText: joinMultilineInput(metadata.lpContractAddresses),
    allowedFunctionsText: joinMultilineInput(metadata.allowedFunctions),
    trackContractCalls: metadata.trackContractCalls === true,
    enableHoldTracking: metadata.enableHoldTracking !== false,
    holdThresholdHours:
      typeof metadata.holdThresholdHours === "number"
        ? String(metadata.holdThresholdHours)
        : typeof metadata.holdThresholdHours === "string"
          ? metadata.holdThresholdHours
          : "24",
    metadataJson:
      Object.keys(advancedMetadata).length > 0 ? stringifyOnchainMetadata(advancedMetadata) : "",
  };
}

function readAssetSyncState(asset: OnchainProjectAsset) {
  const metadata =
    asset.metadata && typeof asset.metadata === "object"
      ? (asset.metadata as Record<string, unknown>)
      : {};
  const syncState =
    metadata.syncState && typeof metadata.syncState === "object"
      ? (metadata.syncState as Record<string, unknown>)
      : {};

  return {
    lastSyncedBlock:
      typeof syncState.lastSyncedBlock === "number"
        ? String(syncState.lastSyncedBlock)
        : typeof syncState.lastSyncedBlock === "string"
          ? syncState.lastSyncedBlock
          : "-",
    lastSyncedAt:
      typeof syncState.lastSyncedAt === "string" ? syncState.lastSyncedAt : "",
    lastSyncStatus:
      typeof syncState.lastSyncStatus === "string" ? syncState.lastSyncStatus : "idle",
    lastSyncGenerated:
      typeof syncState.lastSyncGenerated === "number"
        ? String(syncState.lastSyncGenerated)
        : typeof syncState.lastSyncGenerated === "string"
          ? syncState.lastSyncGenerated
          : "0",
    lastSyncError:
      typeof syncState.lastSyncError === "string" ? syncState.lastSyncError : "",
  };
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const deleteProject = useAdminPortalStore((s) => s.deleteProject);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [discordIntegrationStatus, setDiscordIntegrationStatus] = useState<string>("unknown");
  const [telegramIntegrationStatus, setTelegramIntegrationStatus] = useState<string>("unknown");
  const [xIntegrationStatus, setXIntegrationStatus] = useState<string>("unknown");
  const [discordIntegrationConfig, setDiscordIntegrationConfig] = useState<{
    guildId: string;
    serverId: string;
  }>({ guildId: "", serverId: "" });
  const [telegramIntegrationConfig, setTelegramIntegrationConfig] = useState<{
    chatId: string;
    groupId: string;
  }>({ chatId: "", groupId: "" });
  const [discordPushSettings, setDiscordPushSettings] = useState<CommunityPushSettings>(
    createDefaultPushSettings("discord")
  );
  const [telegramPushSettings, setTelegramPushSettings] = useState<CommunityPushSettings>(
    createDefaultPushSettings("telegram")
  );
  const [savingIntegration, setSavingIntegration] = useState<"discord" | "telegram" | null>(null);
  const [integrationNotice, setIntegrationNotice] = useState<string>("");
  const [testingIntegration, setTestingIntegration] = useState<"discord" | "telegram" | null>(
    null
  );
  const [integrationTestNotice, setIntegrationTestNotice] = useState<string>("");
  const [integrationTestTone, setIntegrationTestTone] = useState<"success" | "error">(
    "success"
  );
  const [projectWallets, setProjectWallets] = useState<OnchainProjectWallet[]>([]);
  const [projectAssets, setProjectAssets] = useState<OnchainProjectAsset[]>([]);
  const [walletForm, setWalletForm] = useState<OnchainWalletForm>({
    chain: "evm",
    walletAddress: "",
    label: "",
    walletType: "treasury",
    isActive: true,
  });
  const [assetForm, setAssetForm] = useState<OnchainAssetForm>(createDefaultAssetForm());
  const [loadingOnchainConfig, setLoadingOnchainConfig] = useState(false);
  const [savingOnchainConfig, setSavingOnchainConfig] = useState<"wallet" | "asset" | null>(null);
  const [syncingProviderFeed, setSyncingProviderFeed] = useState(false);
  const [onchainNotice, setOnchainNotice] = useState("");
  const [operatorSignals, setOperatorSignals] = useState<{
    callbackFailures: number;
    onchainFailures: number;
    latestIssue: string;
  }>({
    callbackFailures: 0,
    onchainFailures: 0,
    latestIssue: "No active operator incidents logged.",
  });

  const project = useMemo(
    () => getProjectById(params.id),
    [getProjectById, params.id]
  );

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectIntegrations() {
      if (!project?.id) return;

      const response = await fetch(
        `/api/project-integrations?projectId=${encodeURIComponent(project.id)}`,
        { cache: "no-store" }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        if (cancelled) return;
        setIntegrationNotice(payload?.error || "Could not load project integrations.");
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

    loadProjectIntegrations();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadOperatorSignals() {
      if (!project?.id) return;

      const supabase = createClient();
      const relatedProjectQuestIds = quests
        .filter((quest) => quest.projectId === project.id)
        .map((quest) => quest.id);

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

      const [callbackResult, onchainResult] = await Promise.all([callbackQuery, onchainQuery]);

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
    }

    void loadOperatorSignals();

    return () => {
      cancelled = true;
    };
  }, [project?.id, quests]);

  useEffect(() => {
    let cancelled = false;

    async function loadOnchainConfig() {
      if (!project?.id) return;

      setLoadingOnchainConfig(true);

      try {
        const [walletResponse, assetResponse] = await Promise.all([
          fetch(`/api/projects/${project.id}/wallets`, {
            cache: "no-store",
          }),
          fetch(`/api/projects/${project.id}/assets`, {
            cache: "no-store",
          }),
        ]);

        const [walletPayload, assetPayload] = await Promise.all([
          walletResponse.json().catch(() => null),
          assetResponse.json().catch(() => null),
        ]);

        if (cancelled) return;

        if (!walletResponse.ok || !walletPayload?.ok) {
          throw new Error(walletPayload?.error || "Could not load project wallets.");
        }

        if (!assetResponse.ok || !assetPayload?.ok) {
          throw new Error(assetPayload?.error || "Could not load project assets.");
        }

        setProjectWallets(Array.isArray(walletPayload.wallets) ? walletPayload.wallets : []);
        setProjectAssets(Array.isArray(assetPayload.assets) ? assetPayload.assets : []);
      } catch (error) {
        if (cancelled) return;
        setOnchainNotice(
          error instanceof Error ? error.message : "Could not load on-chain configuration."
        );
      } finally {
        if (!cancelled) {
          setLoadingOnchainConfig(false);
        }
      }
    }

    void loadOnchainConfig();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This project could not be resolved from the current admin portal store state. It may have been removed, be outside your workspace scope, or not have loaded yet."
        />
      </AdminShell>
    );
  }

  const relatedCampaigns = campaigns.filter((c) => c.projectId === project.id);
  const projectNameById = useMemo(
    () => new Map(projects.map((item) => [item.id, item.name])),
    [projects]
  );
  const selectableProjects = useMemo(
    () => projects.filter((item) => item.id !== project.id),
    [project.id, projects]
  );
  const relatedQuests = quests.filter((quest) => quest.projectId === project.id);
  const relatedRewards = rewards.filter((reward) => reward.projectId === project.id);
  const relatedTeamMembers = teamMembers.filter((member) => member.projectId === project.id);
  const connectedLinks = [
    project.website,
    project.xUrl,
    project.telegramUrl,
    project.discordUrl,
    project.docsUrl,
    project.waitlistUrl,
  ].filter(Boolean).length;
  const templateContextCount = [
    project.docsUrl,
    project.waitlistUrl,
    project.launchPostUrl,
    project.tokenContractAddress,
    project.nftContractAddress,
    project.primaryWallet,
    project.brandAccent,
    project.brandMood,
  ].filter(Boolean).length;
  const publicProfileReadiness = [
    {
      label: "Brand identity",
      value: project.logo && project.name ? "Logo and name are set" : "Missing logo or project name",
      complete: Boolean(project.logo && project.name),
    },
    {
      label: "Public copy",
      value: project.description ? "Short profile is ready" : "Add a short public description",
      complete: Boolean(project.description),
    },
    {
      label: "Long narrative",
      value: project.longDescription ? "Long-form profile added" : "Add a richer public narrative",
      complete: Boolean(project.longDescription),
    },
    {
      label: "Social surface",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "No channels connected yet",
      complete: connectedLinks > 0,
    },
    {
      label: "Template context",
      value:
        templateContextCount > 0
          ? `${templateContextCount} advanced project inputs are ready`
          : "Add docs, waitlist, launch or contract context",
      complete: templateContextCount > 0,
    },
    {
      label: "Visibility state",
      value: project.isPublic ? "Workspace can be surfaced publicly" : "Workspace is private",
      complete: true,
    },
  ];
  const completedPublicReadiness = publicProfileReadiness.filter((item) => item.complete).length;
  const launchpadSteps = [
    {
      title: "Review workspace settings",
      description: project.website || project.contactEmail
        ? "Brand, links and contact details are already attached to this project."
        : "Complete the project profile so campaigns and public pages look credible from day one.",
      href: "#edit-project",
      cta: project.website || project.contactEmail ? "Refine profile" : "Complete profile",
      status: project.website || project.contactEmail ? "ready" : "next",
    },
    {
      title: "Create your first campaign",
      description: relatedCampaigns.length > 0
        ? `${relatedCampaigns.length} campaign workspace${relatedCampaigns.length > 1 ? "s are" : " is"} already available.`
        : "Spin up the first campaign so this workspace can start collecting quests, raids and participants.",
      href: "/campaigns/new",
      cta: relatedCampaigns.length > 0 ? "Open campaign builder" : "Create campaign",
      status: relatedCampaigns.length > 0 ? "ready" : "next",
    },
    {
      title: "Add engagement mechanics",
      description: relatedQuests.length > 0 || relatedRewards.length > 0
        ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} and ${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} are configured.`
        : "Define quests and rewards next so contributors know what to do and what they earn.",
      href: relatedQuests.length > 0 ? "/quests" : "/quests/new",
      cta: relatedQuests.length > 0 ? "Review quests" : "Create first quest",
      status: relatedQuests.length > 0 || relatedRewards.length > 0 ? "ready" : "next",
    },
    {
      title: "Invite your team",
      description: relatedTeamMembers.length > 1
        ? `${relatedTeamMembers.length} teammates are already attached to this workspace.`
        : "Add reviewers and collaborators so moderation and campaign operations don't bottleneck on one person.",
      href: "/settings/team",
      cta: relatedTeamMembers.length > 1 ? "Manage team" : "Invite team",
      status: relatedTeamMembers.length > 1 ? "ready" : "next",
    },
  ] as const;
  const completedLaunchpadSteps = launchpadSteps.filter((step) => step.status === "ready").length;
  const showLaunchpad =
    project.onboardingStatus !== "approved" ||
    relatedCampaigns.length === 0 ||
    relatedQuests.length === 0 ||
    relatedTeamMembers.length <= 1;

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

  async function saveProjectWallet() {
    if (!project?.id) return;

    setSavingOnchainConfig("wallet");
    setOnchainNotice("");

    const response = await fetch(`/api/projects/${project.id}/wallets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: walletForm.chain.trim().toLowerCase() || "evm",
        walletAddress: walletForm.walletAddress,
        label: walletForm.label,
        walletType: walletForm.walletType,
        isActive: walletForm.isActive,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingOnchainConfig(null);

    if (!response.ok || !payload?.ok || !payload.wallet) {
      setOnchainNotice(payload?.error || "Could not save project wallet.");
      return;
    }

    setProjectWallets((current) => {
      const next = current.filter((item) => item.id !== payload.wallet.id);
      return [payload.wallet, ...next];
    });
    setWalletForm({
      chain: walletForm.chain.trim().toLowerCase() || "evm",
      walletAddress: "",
      label: "",
      walletType: walletForm.walletType,
      isActive: true,
    });
    setOnchainNotice(`Saved ${payload.wallet.label} wallet for ${project.name}.`);
  }

  async function deleteProjectWallet(walletId: string) {
    if (!project?.id) return;

    setSavingOnchainConfig("wallet");
    setOnchainNotice("");

    const response = await fetch(
      `/api/projects/${project.id}/wallets?walletId=${encodeURIComponent(walletId)}`,
      {
        method: "DELETE",
      }
    );
    const payload = await response.json().catch(() => null);
    setSavingOnchainConfig(null);

    if (!response.ok || !payload?.ok) {
      setOnchainNotice(payload?.error || "Could not delete project wallet.");
      return;
    }

    setProjectWallets((current) => current.filter((item) => item.id !== walletId));
    setOnchainNotice(`Removed wallet from ${project.name}.`);
  }

  async function saveProjectAsset() {
    if (!project?.id) return;

    setSavingOnchainConfig("asset");
    setOnchainNotice("");

    let additionalMetadata: Record<string, unknown> = {};
    try {
      additionalMetadata = parseAdditionalMetadata(assetForm.metadataJson);
    } catch (error) {
      setSavingOnchainConfig(null);
      setOnchainNotice(error instanceof Error ? error.message : "Asset metadata JSON is invalid.");
      return;
    }

    const normalizedStartBlock = assetForm.startBlock.trim();
    if (normalizedStartBlock.length > 0 && !/^\d+$/.test(normalizedStartBlock)) {
      setSavingOnchainConfig(null);
      setOnchainNotice("Start block must be a whole number.");
      return;
    }

    const normalizedHoldThreshold = assetForm.holdThresholdHours.trim();
    if (normalizedHoldThreshold.length > 0 && !/^\d+$/.test(normalizedHoldThreshold)) {
      setSavingOnchainConfig(null);
      setOnchainNotice("Hold threshold hours must be a whole number.");
      return;
    }

    const currentAsset =
      projectAssets.find(
        (asset) =>
          asset.id === assetForm.editingAssetId ||
          (asset.contract_address.toLowerCase() === assetForm.contractAddress.trim().toLowerCase() &&
            asset.chain === (assetForm.chain.trim().toLowerCase() || "evm"))
      ) ?? null;
    const currentMetadata =
      currentAsset?.metadata && typeof currentAsset.metadata === "object"
        ? (currentAsset.metadata as Record<string, unknown>)
        : {};
    const preservedSyncState =
      currentMetadata.syncState && typeof currentMetadata.syncState === "object"
        ? { syncState: currentMetadata.syncState }
        : {};
    const structuredMetadata: Record<string, unknown> = {
      ...(assetForm.startBlock.trim().length > 0
        ? { startBlock: Number.parseInt(normalizedStartBlock, 10) }
        : {}),
      ...(splitMultilineInput(assetForm.marketMakerAddressesText).length > 0
        ? { marketMakerAddresses: splitMultilineInput(assetForm.marketMakerAddressesText) }
        : {}),
      ...(splitMultilineInput(assetForm.stakingContractAddressesText).length > 0
        ? { stakingContractAddresses: splitMultilineInput(assetForm.stakingContractAddressesText) }
        : {}),
      ...(splitMultilineInput(assetForm.lpContractAddressesText).length > 0
        ? { lpContractAddresses: splitMultilineInput(assetForm.lpContractAddressesText) }
        : {}),
      ...(splitMultilineInput(assetForm.allowedFunctionsText).length > 0
        ? { allowedFunctions: splitMultilineInput(assetForm.allowedFunctionsText) }
        : {}),
      ...(assetForm.trackContractCalls ? { trackContractCalls: true } : {}),
      ...(assetForm.enableHoldTracking ? {} : { enableHoldTracking: false }),
      ...(assetForm.holdThresholdHours.trim().length > 0
        ? { holdThresholdHours: Number.parseInt(normalizedHoldThreshold, 10) }
        : {}),
    };
    const parsedMetadata = {
      ...structuredMetadata,
      ...additionalMetadata,
      ...preservedSyncState,
    };

    const response = await fetch(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: assetForm.chain.trim().toLowerCase() || "evm",
        contractAddress: assetForm.contractAddress,
        assetType: assetForm.assetType,
        symbol: assetForm.symbol,
        decimals: Number.parseInt(assetForm.decimals, 10),
        isActive: assetForm.isActive,
        metadata: parsedMetadata,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSavingOnchainConfig(null);

    if (!response.ok || !payload?.ok || !payload.asset) {
      setOnchainNotice(payload?.error || "Could not save project asset.");
      return;
    }

    setProjectAssets((current) => {
      const next = current.filter((item) => item.id !== payload.asset.id);
      return [payload.asset, ...next];
    });
    setAssetForm(createDefaultAssetForm());
    setOnchainNotice(`Saved ${payload.asset.symbol} asset for ${project.name}.`);
  }

  async function deleteProjectAsset(assetId: string) {
    if (!project?.id) return;

    setSavingOnchainConfig("asset");
    setOnchainNotice("");

    const response = await fetch(
      `/api/projects/${project.id}/assets?assetId=${encodeURIComponent(assetId)}`,
      {
        method: "DELETE",
      }
    );
    const payload = await response.json().catch(() => null);
    setSavingOnchainConfig(null);

    if (!response.ok || !payload?.ok) {
      setOnchainNotice(payload?.error || "Could not delete project asset.");
      return;
    }

    setProjectAssets((current) => current.filter((item) => item.id !== assetId));
    setOnchainNotice(`Removed asset from ${project.name}.`);
  }

  function loadAssetIntoEditor(asset: OnchainProjectAsset) {
    setAssetForm(createAssetFormFromAsset(asset));
    setOnchainNotice(`Loaded ${asset.symbol} into the Base sync editor.`);
  }

  async function runProjectOnchainSync() {
    if (!project?.id) return;

    setSyncingProviderFeed(true);
    setOnchainNotice("");

    const response = await fetch(`/api/projects/${project.id}/onchain-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 50,
        maxBlocks: 1500,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSyncingProviderFeed(false);

    if (!response.ok || !payload?.ok) {
      setOnchainNotice(payload?.error || "Could not run provider sync.");
      return;
    }

    setOnchainNotice(
      `Provider sync scanned ${payload.syncedAssets ?? 0} assets and generated ${payload.generatedEvents ?? 0} normalized events for ${project.name}.`
    );

    const [walletResponse, assetResponse] = await Promise.all([
      fetch(`/api/projects/${project.id}/wallets`, { cache: "no-store" }),
      fetch(`/api/projects/${project.id}/assets`, { cache: "no-store" }),
    ]);
    const [walletPayload, assetPayload] = await Promise.all([
      walletResponse.json().catch(() => null),
      assetResponse.json().catch(() => null),
    ]);

    if (walletResponse.ok && walletPayload?.ok && Array.isArray(walletPayload.wallets)) {
      setProjectWallets(walletPayload.wallets);
    }

    if (assetResponse.ok && assetPayload?.ok && Array.isArray(assetPayload.assets)) {
      setProjectAssets(assetPayload.assets);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Project Detail"
          title={`${project.logo} ${project.name}`}
          description={project.longDescription || project.description}
          badges={
            <>
              <DetailBadge>{project.chain}</DetailBadge>
              {project.category ? <DetailBadge>{project.category}</DetailBadge> : null}
              <DetailBadge tone={project.status === "active" ? "primary" : "default"}>
                {project.status}
              </DetailBadge>
              <DetailBadge tone={project.onboardingStatus === "approved" ? "primary" : "warning"}>
                {project.onboardingStatus}
              </DetailBadge>
              {project.isFeatured ? <DetailBadge tone="warning">Featured</DetailBadge> : null}
              <DetailBadge>{project.isPublic ? "Public" : "Private"}</DetailBadge>
            </>
          }
          actions={
            <button
              onClick={async () => {
                await deleteProject(project.id);
                router.push("/projects");
              }}
              className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
            >
              Delete Project
            </button>
          }
          metrics={
            <>
              <DetailMetricCard label="Chain" value={project.chain} hint="Primary ecosystem for this workspace." />
              <DetailMetricCard label="Members" value={project.members.toLocaleString()} hint="Community size currently visible on the public surface." />
              <DetailMetricCard label="Campaigns" value={relatedCampaigns.length} hint="Active campaign spaces inside this workspace." />
              <DetailMetricCard label="Onboarding" value={project.onboardingStatus} hint="Current approval posture for this workspace." />
              <DetailMetricCard label="Template Context" value={templateContextCount} hint="Advanced autofill fields currently attached." />
            </>
          }
        />

        {showLaunchpad ? (
          <DetailSurface
            eyebrow="Workspace Launchpad"
            title={`Give ${project.name} a strong first setup`}
            description="This checklist keeps a newly approved project moving from onboarding into a campaign-ready workspace."
            aside={<DetailMetricCard label="Progress" value={`${completedLaunchpadSteps}/4`} />}
          >
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {launchpadSteps.map((step) => (
                <Link
                  key={step.title}
                  href={step.href}
                  className="rounded-2xl border border-line bg-card2 p-5 transition hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                            step.status === "ready"
                              ? "bg-primary/15 text-primary"
                              : "bg-white/5 text-text"
                          }`}
                        >
                          {step.status === "ready" ? "Ready" : "Next"}
                        </span>
                        <p className="font-bold text-text">{step.title}</p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
                    </div>

                    <span className="text-sm font-semibold text-primary">{step.cta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </DetailSurface>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <DetailSurface
            title="Edit Project"
            description="Update how this project appears in the app and portal without leaving the workspace detail view."
          >
            <div className="mt-6">
              <ProjectForm
                initialValues={{
                  name: project.name,
                  slug: project.slug,

                  chain: project.chain,
                  category: project.category || "",

                  status: project.status,
                  onboardingStatus: project.onboardingStatus,

                  description: project.description,
                  longDescription: project.longDescription || "",

                  members: project.members,
                  campaigns: project.campaigns,

                  logo: project.logo,
                  bannerUrl: project.bannerUrl || "",

                  website: project.website || "",
                  xUrl: project.xUrl || "",
                  telegramUrl: project.telegramUrl || "",
                  discordUrl: project.discordUrl || "",
                  docsUrl: project.docsUrl || "",
                  waitlistUrl: project.waitlistUrl || "",
                  launchPostUrl: project.launchPostUrl || "",
                  tokenContractAddress: project.tokenContractAddress || "",
                  nftContractAddress: project.nftContractAddress || "",
                  primaryWallet: project.primaryWallet || "",
                  brandAccent: project.brandAccent || "",
                  brandMood: project.brandMood || "",

                  contactEmail: project.contactEmail || "",

                  isFeatured: project.isFeatured ?? false,
                  isPublic: project.isPublic ?? true,
                }}
                submitLabel="Update Project"
                onSubmit={async (values) => {
                  await updateProject(project.id, values);
                }}
              />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSurface
              eyebrow="Public Profile"
              title="Brand and community-facing preview"
              description="This is how the workspace reads when someone lands on it from discovery or a campaign entry point."
              aside={<DetailMetricCard label="Readiness" value={`${completedPublicReadiness}/${publicProfileReadiness.length}`} />}
            >
              <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card2">
                <div className="h-36 bg-gradient-to-br from-primary/20 via-card to-card2">
                  {project.bannerUrl ? (
                    <img
                      src={project.bannerUrl}
                      alt={`${project.name} banner`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-3xl">
                      {project.logo || "🚀"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xl font-extrabold text-text">{project.name}</p>
                        <DetailBadge>{project.chain}</DetailBadge>
                        {project.category ? <DetailBadge>{project.category}</DetailBadge> : null}
                        <DetailBadge>{project.isPublic ? "Public" : "Private"}</DetailBadge>
                      </div>

                      <p className="mt-2 text-sm text-sub">/{project.slug || "project-slug"}</p>
                      <p className="mt-4 text-sm leading-6 text-sub">
                        {project.description || "Add a short public description so this project feels credible from the first visit."}
                      </p>
                    </div>
                  </div>

                  {project.longDescription ? (
                    <div className="mt-5 rounded-2xl border border-line bg-card px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Long Form Narrative
                      </p>
                      <p className="mt-3 text-sm leading-6 text-sub">{project.longDescription}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <DetailMetaRow label="Website" value={project.website || "Not connected"} />
                    <DetailMetaRow label="X URL" value={project.xUrl || "Not connected"} />
                    <DetailMetaRow label="Telegram URL" value={project.telegramUrl || "Not connected"} />
                    <DetailMetaRow label="Discord URL" value={project.discordUrl || "Not connected"} />
                    <DetailMetaRow label="Docs URL" value={project.docsUrl || "Not connected"} />
                    <DetailMetaRow label="Waitlist URL" value={project.waitlistUrl || "Not connected"} />
                    <DetailMetaRow label="Launch Post URL" value={project.launchPostUrl || "Not connected"} />
                    <DetailMetaRow label="Primary Wallet" value={project.primaryWallet || "Not set"} />
                  </div>
                </div>
              </div>
            </DetailSurface>

            <DetailSidebarSurface title="Project Assets">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Slug" value={project.slug || "-"} />
                <DetailMetaRow label="Website" value={project.website || "-"} />
                <DetailMetaRow label="X URL" value={project.xUrl || "-"} />
                <DetailMetaRow label="Telegram URL" value={project.telegramUrl || "-"} />
                <DetailMetaRow label="Discord URL" value={project.discordUrl || "-"} />
                <DetailMetaRow label="Docs URL" value={project.docsUrl || "-"} />
                <DetailMetaRow label="Waitlist URL" value={project.waitlistUrl || "-"} />
                <DetailMetaRow label="Launch Post URL" value={project.launchPostUrl || "-"} />
                <DetailMetaRow label="Contact Email" value={project.contactEmail || "-"} />
                <DetailMetaRow
                  label="Featured"
                  value={project.isFeatured ? "Yes" : "No"}
                />
                <DetailMetaRow
                  label="Public"
                  value={project.isPublic ? "Yes" : "No"}
                />
              </div>

              {project.bannerUrl ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-text">Banner Preview</p>
                  <div className="overflow-hidden rounded-2xl border border-line bg-card2">
                    <img
                      src={project.bannerUrl}
                      alt={`${project.name} banner`}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Template Context">
              <div className="mt-4 space-y-4">
                <DetailMetaRow
                  label="Token Contract"
                  value={project.tokenContractAddress || "-"}
                />
                <DetailMetaRow
                  label="NFT Contract"
                  value={project.nftContractAddress || "-"}
                />
                <DetailMetaRow
                  label="Primary Wallet"
                  value={project.primaryWallet || "-"}
                />
                <DetailMetaRow
                  label="Brand Accent"
                  value={project.brandAccent || "-"}
                />
                <DetailMetaRow
                  label="Brand Mood"
                  value={project.brandMood || "-"}
                />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="On-chain Configuration">
              <div className="mt-4 space-y-4">
                <p className="text-sm text-sub">
                  Register treasury wallets and live contracts here so AESP ingestion only scores
                  real activity for <span className="font-semibold text-text">{project.name}</span>.
                </p>
                <DetailMetaRow
                  label="Registered wallets"
                  value={loadingOnchainConfig ? "Loading..." : String(projectWallets.length)}
                />
                <DetailMetaRow
                  label="Registered assets"
                  value={loadingOnchainConfig ? "Loading..." : String(projectAssets.length)}
                />
                <button
                  onClick={() => void runProjectOnchainSync()}
                  disabled={syncingProviderFeed}
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-sub transition hover:border-primary/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {syncingProviderFeed ? "Running provider sync..." : "Run provider sync for this project"}
                </button>

                <div className="rounded-[24px] border border-line bg-card2 p-4">
                  <p className="text-sm font-bold text-text">Project wallets</p>
                  <p className="mt-2 text-sm text-sub">
                    Add treasury, operations, rewards or LP wallets that belong to this project.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={walletForm.label}
                        onChange={(event) =>
                          setWalletForm((current) => ({ ...current, label: event.target.value }))
                        }
                        placeholder="Wallet label"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <select
                        value={walletForm.walletType}
                        onChange={(event) =>
                          setWalletForm((current) => ({
                            ...current,
                            walletType: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      >
                        <option value="treasury">Treasury</option>
                        <option value="operations">Operations</option>
                        <option value="rewards">Rewards</option>
                        <option value="lp">Liquidity / LP</option>
                      </select>
                    </div>
                    <input
                      value={walletForm.walletAddress}
                      onChange={(event) =>
                        setWalletForm((current) => ({
                          ...current,
                          walletAddress: event.target.value,
                        }))
                      }
                      placeholder="0x... wallet address"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        value={walletForm.chain}
                        onChange={(event) =>
                          setWalletForm((current) => ({ ...current, chain: event.target.value }))
                        }
                        placeholder="Chain (evm)"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                        <span>Active</span>
                        <input
                          type="checkbox"
                          checked={walletForm.isActive}
                          onChange={(event) =>
                            setWalletForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => void saveProjectWallet()}
                      disabled={savingOnchainConfig === "wallet"}
                      className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingOnchainConfig === "wallet" ? "Saving wallet..." : "Save project wallet"}
                    </button>
                    <div className="grid gap-3">
                      {projectWallets.length > 0 ? (
                        projectWallets.map((wallet) => (
                          <div
                            key={wallet.id}
                            className="rounded-2xl border border-line bg-card px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-text">{wallet.label}</p>
                                <p className="mt-1 break-all text-sm text-sub">
                                  {wallet.wallet_address}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-primary">
                                  {wallet.wallet_type} • {wallet.chain} •{" "}
                                  {wallet.is_active ? "active" : "inactive"}
                                </p>
                              </div>
                              <button
                                onClick={() => void deleteProjectWallet(wallet.id)}
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-rose-300 transition hover:bg-rose-500/15"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-4 text-sm text-sub">
                          No project wallets registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-line bg-card2 p-4">
                  <p className="text-sm font-bold text-text">Tracked assets</p>
                  <p className="mt-2 text-sm text-sub">
                    Register the token, NFT or LP contracts that on-chain scoring should accept.
                    Use the Base sync fields below to make buy, stake, LP and contract-call
                    classification deterministic without hand-editing raw JSON.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={assetForm.symbol}
                        onChange={(event) =>
                          setAssetForm((current) => ({ ...current, symbol: event.target.value }))
                        }
                        placeholder="Asset symbol"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <select
                        value={assetForm.assetType}
                        onChange={(event) =>
                          setAssetForm((current) => ({
                            ...current,
                            assetType: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      >
                        <option value="token">Token</option>
                        <option value="nft">NFT</option>
                        <option value="lp">LP token</option>
                        <option value="staking_pool">Staking pool</option>
                      </select>
                    </div>
                    <input
                      value={assetForm.contractAddress}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          contractAddress: event.target.value,
                        }))
                      }
                      placeholder="0x... contract address"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <input
                        value={assetForm.chain}
                        onChange={(event) =>
                          setAssetForm((current) => ({ ...current, chain: event.target.value }))
                        }
                        placeholder="Chain (evm)"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <input
                        value={assetForm.decimals}
                        onChange={(event) =>
                          setAssetForm((current) => ({
                            ...current,
                            decimals: event.target.value,
                          }))
                        }
                        placeholder="Decimals"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                        <span>Active</span>
                        <input
                          type="checkbox"
                          checked={assetForm.isActive}
                          onChange={(event) =>
                            setAssetForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={assetForm.startBlock}
                        onChange={(event) =>
                          setAssetForm((current) => ({
                            ...current,
                            startBlock: event.target.value,
                          }))
                        }
                        placeholder="Start block on Base"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                      <input
                        value={assetForm.holdThresholdHours}
                        onChange={(event) =>
                          setAssetForm((current) => ({
                            ...current,
                            holdThresholdHours: event.target.value,
                          }))
                        }
                        placeholder="Hold threshold hours"
                        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                        <span>Track contract calls</span>
                        <input
                          type="checkbox"
                          checked={assetForm.trackContractCalls}
                          onChange={(event) =>
                            setAssetForm((current) => ({
                              ...current,
                              trackContractCalls: event.target.checked,
                            }))
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                        <span>Enable hold tracking</span>
                        <input
                          type="checkbox"
                          checked={assetForm.enableHoldTracking}
                          onChange={(event) =>
                            setAssetForm((current) => ({
                              ...current,
                              enableHoldTracking: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <textarea
                      value={assetForm.marketMakerAddressesText}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          marketMakerAddressesText: event.target.value,
                        }))
                      }
                      placeholder={"Market maker addresses (one per line)\n0x..."}
                      className="min-h-[110px] w-full rounded-2xl border border-line bg-card px-4 py-3 font-mono text-xs text-text outline-none transition focus:border-primary/50"
                    />
                    <textarea
                      value={assetForm.stakingContractAddressesText}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          stakingContractAddressesText: event.target.value,
                        }))
                      }
                      placeholder={"Staking contract addresses (one per line)\n0x..."}
                      className="min-h-[110px] w-full rounded-2xl border border-line bg-card px-4 py-3 font-mono text-xs text-text outline-none transition focus:border-primary/50"
                    />
                    <textarea
                      value={assetForm.lpContractAddressesText}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          lpContractAddressesText: event.target.value,
                        }))
                      }
                      placeholder={"LP contract addresses (one per line)\n0x..."}
                      className="min-h-[110px] w-full rounded-2xl border border-line bg-card px-4 py-3 font-mono text-xs text-text outline-none transition focus:border-primary/50"
                    />
                    <textarea
                      value={assetForm.allowedFunctionsText}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          allowedFunctionsText: event.target.value,
                        }))
                      }
                      placeholder={"Allowed function selectors (one per line)\n0xa694fc3a"}
                      className="min-h-[110px] w-full rounded-2xl border border-line bg-card px-4 py-3 font-mono text-xs text-text outline-none transition focus:border-primary/50"
                    />
                    <textarea
                      value={assetForm.metadataJson}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          metadataJson: event.target.value,
                        }))
                      }
                      placeholder={`{\n  "netUsdDeltaHint": 1200,\n  "notes": "Optional advanced overrides only"\n}`}
                      className="min-h-[180px] w-full rounded-2xl border border-line bg-card px-4 py-3 font-mono text-xs text-text outline-none transition focus:border-primary/50"
                    />
                    <p className="text-xs text-sub">
                      Advanced metadata merges on top of the Base sync fields above. Existing
                      `syncState` stays preserved when you update an asset.
                    </p>
                    <button
                      onClick={() => void saveProjectAsset()}
                      disabled={savingOnchainConfig === "asset"}
                      className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingOnchainConfig === "asset"
                        ? "Saving asset..."
                        : assetForm.editingAssetId
                          ? "Update tracked asset"
                          : "Save tracked asset"}
                    </button>
                    {assetForm.editingAssetId ? (
                      <button
                        onClick={() => {
                          setAssetForm(createDefaultAssetForm());
                          setOnchainNotice("Cleared the Base sync editor.");
                        }}
                        className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-sub transition hover:border-primary/40 hover:text-text"
                      >
                        Clear editor
                      </button>
                    ) : null}
                    <div className="grid gap-3">
                      {projectAssets.length > 0 ? (
                        projectAssets.map((asset) => (
                          <div key={asset.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-text">{asset.symbol}</p>
                                <p className="mt-1 break-all text-sm text-sub">
                                  {asset.contract_address}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-primary">
                                  {asset.asset_type} • {asset.chain} • {asset.decimals} decimals •{" "}
                                  {asset.is_active ? "active" : "inactive"}
                                </p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <div className="rounded-2xl border border-line bg-card2 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                                      Sync status
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-text">
                                      {readAssetSyncState(asset).lastSyncStatus}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-line bg-card2 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                                      Last synced block
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-text">
                                      {readAssetSyncState(asset).lastSyncedBlock}
                                    </p>
                                  </div>
                                </div>
                                {readAssetSyncState(asset).lastSyncedAt ? (
                                  <p className="mt-3 text-xs text-sub">
                                    Last sync: {new Date(readAssetSyncState(asset).lastSyncedAt).toLocaleString()}
                                  </p>
                                ) : null}
                                {readAssetSyncState(asset).lastSyncError ? (
                                  <p className="mt-2 text-xs text-rose-300">
                                    {readAssetSyncState(asset).lastSyncError}
                                  </p>
                                ) : null}
                                {asset.metadata && Object.keys(asset.metadata).length > 0 ? (
                                  <pre className="mt-3 whitespace-pre-wrap break-all rounded-2xl border border-line bg-card2 p-3 text-[11px] text-sub">
                                    {JSON.stringify(asset.metadata, null, 2)}
                                  </pre>
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => loadAssetIntoEditor(asset)}
                                  className="rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-sub transition hover:border-primary/40 hover:text-text"
                                >
                                  Edit sync rules
                                </button>
                                <button
                                  onClick={() => void deleteProjectAsset(asset.id)}
                                  className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-rose-300 transition hover:bg-rose-500/15"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-4 text-sm text-sub">
                          No on-chain assets registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {onchainNotice ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {onchainNotice}
                  </div>
                ) : null}
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Integration Readiness">
              <div className="mt-4 space-y-4">
                <DetailMetaRow
                  label="X follow verification"
                  value={
                    xIntegrationStatus === "connected"
                      ? "X integration connected"
                      : xIntegrationStatus === "needs_attention"
                      ? "X integration needs attention"
                      : "X integration not connected"
                  }
                />
                <DetailMetaRow
                  label="Discord quest verification"
                  value={
                    discordIntegrationStatus === "connected"
                      ? "Discord integration connected"
                      : discordIntegrationStatus === "needs_attention"
                      ? "Discord integration needs attention"
                      : "Discord integration not connected"
                  }
                />
                <DetailMetaRow
                  label="Telegram quest verification"
                  value={
                    telegramIntegrationStatus === "connected"
                      ? "Telegram integration connected"
                      : telegramIntegrationStatus === "needs_attention"
                      ? "Telegram integration needs attention"
                      : "Telegram integration not connected"
                  }
                />
                <DetailMetaRow
                  label="X profile"
                  value={project.xUrl || "No X URL on project yet"}
                />
                <DetailMetaRow
                  label="Discord invite"
                  value={project.discordUrl || "No Discord URL on project yet"}
                />
                <DetailMetaRow
                  label="Telegram group"
                  value={project.telegramUrl || "No Telegram URL on project yet"}
                />
                <div className="rounded-[24px] border border-line bg-card2 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-text">Discord integration config</p>
                      <p className="mt-2 text-sm text-sub">
                        Save the Discord guild id that the community bot should verify against for <span className="font-semibold text-text">{project.name}</span>.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                      {discordIntegrationStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={discordIntegrationConfig.guildId}
                      onChange={(event) =>
                        setDiscordIntegrationConfig((current) => ({
                          ...current,
                          guildId: event.target.value,
                        }))
                      }
                      placeholder="Discord guild ID"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <input
                      value={discordIntegrationConfig.serverId}
                      onChange={(event) =>
                        setDiscordIntegrationConfig((current) => ({
                          ...current,
                          serverId: event.target.value,
                        }))
                      }
                      placeholder="Optional legacy server ID"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <div className="rounded-2xl border border-line bg-card p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Community Push Settings
                      </p>
                      <div className="mt-4 grid gap-3">
                        <label className="space-y-2 text-sm text-sub">
                          <span className="font-semibold text-text">Push scope</span>
                          <select
                            value={discordPushSettings.scopeMode}
                            onChange={(event) =>
                              setDiscordPushSettings((current) => ({
                                ...current,
                                scopeMode: event.target.value as PushScopeMode,
                              }))
                            }
                            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                          >
                            <option value="project_only">Only this project</option>
                            <option value="selected_projects">Selected projects</option>
                            <option value="selected_campaigns">Selected campaigns</option>
                            <option value="all_public">Everything public</option>
                          </select>
                        </label>
                        {discordPushSettings.scopeMode === "selected_projects" ? (
                          <div className="space-y-2 rounded-2xl border border-line bg-card p-4">
                            <p className="text-sm font-semibold text-text">Allowed projects</p>
                            <div className="grid gap-2">
                              {selectableProjects.length > 0 ? (
                                selectableProjects.map((candidate) => (
                                  <label
                                    key={candidate.id}
                                    className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text"
                                  >
                                    <span>{candidate.name}</span>
                                    <input
                                      type="checkbox"
                                      checked={discordPushSettings.selectedProjectIds.includes(candidate.id)}
                                      onChange={(event) =>
                                        setDiscordPushSettings((current) => ({
                                          ...current,
                                          selectedProjectIds: toggleScopeSelection(
                                            current.selectedProjectIds,
                                            candidate.id,
                                            event.target.checked
                                          ),
                                        }))
                                      }
                                    />
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-sub">
                                  No other projects are available in this workspace yet.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                        {discordPushSettings.scopeMode === "selected_campaigns" ? (
                          <div className="space-y-2 rounded-2xl border border-line bg-card p-4">
                            <p className="text-sm font-semibold text-text">Allowed campaigns</p>
                            <div className="grid gap-2">
                              {campaigns.length > 0 ? (
                                campaigns.map((candidate) => (
                                  <label
                                    key={candidate.id}
                                    className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text"
                                  >
                                    <span>
                                      {candidate.title}
                                      <span className="ml-2 text-sub">
                                        {projectNameById.get(candidate.projectId) || "Unknown project"}
                                      </span>
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={discordPushSettings.selectedCampaignIds.includes(candidate.id)}
                                      onChange={(event) =>
                                        setDiscordPushSettings((current) => ({
                                          ...current,
                                          selectedCampaignIds: toggleScopeSelection(
                                            current.selectedCampaignIds,
                                            candidate.id,
                                            event.target.checked
                                          ),
                                        }))
                                      }
                                    />
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-sub">
                                  No campaigns are available yet.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <label className="space-y-2 text-sm text-sub">
                          <span className="font-semibold text-text">Delivery mode</span>
                          <select
                            value={discordPushSettings.deliveryMode}
                            onChange={(event) =>
                              setDiscordPushSettings((current) => ({
                                ...current,
                                deliveryMode: event.target.value as PushDeliveryMode,
                              }))
                            }
                            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                          >
                            <option value="broadcast">Broadcast everything that matches</option>
                            <option value="priority_only">High-priority only</option>
                          </select>
                        </label>
                        <input
                          value={discordPushSettings.targetChannelId}
                          onChange={(event) =>
                            setDiscordPushSettings((current) => ({
                              ...current,
                              targetChannelId: event.target.value,
                            }))
                          }
                          placeholder="Target Discord channel ID"
                          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                        <input
                          value={discordPushSettings.targetThreadId}
                          onChange={(event) =>
                            setDiscordPushSettings((current) => ({
                              ...current,
                              targetThreadId: event.target.value,
                            }))
                          }
                          placeholder="Optional Discord thread ID"
                          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            ["allowCampaigns", "Campaigns"],
                            ["allowQuests", "Quests"],
                            ["allowRaids", "Raids"],
                            ["allowRewards", "Rewards"],
                            ["allowAnnouncements", "Announcements"],
                          ].map(([key, label]) => (
                            <label
                              key={key}
                              className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text"
                            >
                              <span>{label}</span>
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  discordPushSettings[key as keyof CommunityPushSettings]
                                )}
                                onChange={(event) =>
                                  setDiscordPushSettings((current) => ({
                                    ...current,
                                    [key]: event.target.checked,
                                  }))
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                            <span>Featured only</span>
                            <input
                              type="checkbox"
                              checked={discordPushSettings.featuredOnly}
                              onChange={(event) =>
                                setDiscordPushSettings((current) => ({
                                  ...current,
                                  featuredOnly: event.target.checked,
                                }))
                              }
                            />
                          </label>
                          <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                            <span>Live only</span>
                            <input
                              type="checkbox"
                              checked={discordPushSettings.liveOnly}
                              onChange={(event) =>
                                setDiscordPushSettings((current) => ({
                                  ...current,
                                  liveOnly: event.target.checked,
                                }))
                              }
                            />
                          </label>
                        </div>
                        <input
                          value={discordPushSettings.minXp}
                          onChange={(event) =>
                            setDiscordPushSettings((current) => ({
                              ...current,
                              minXp: event.target.value,
                            }))
                          }
                          placeholder="Minimum XP threshold (optional)"
                          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => void saveProjectIntegration("discord")}
                        disabled={savingIntegration === "discord"}
                        className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingIntegration === "discord"
                          ? "Saving Discord config..."
                          : "Save Discord integration"}
                      </button>
                      <button
                        onClick={() => void sendIntegrationTestPush("discord")}
                        disabled={testingIntegration === "discord"}
                        className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {testingIntegration === "discord"
                          ? "Sending Discord test..."
                          : "Send Discord test push"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-line bg-card2 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-text">Telegram integration config</p>
                      <p className="mt-2 text-sm text-sub">
                        Save the Telegram chat id that the community bot should verify against for <span className="font-semibold text-text">{project.name}</span>.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                      {telegramIntegrationStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={telegramIntegrationConfig.chatId}
                      onChange={(event) =>
                        setTelegramIntegrationConfig((current) => ({
                          ...current,
                          chatId: event.target.value,
                        }))
                      }
                      placeholder="Telegram chat ID"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <input
                      value={telegramIntegrationConfig.groupId}
                      onChange={(event) =>
                        setTelegramIntegrationConfig((current) => ({
                          ...current,
                          groupId: event.target.value,
                        }))
                      }
                      placeholder="Optional legacy group ID"
                      className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                    />
                    <div className="rounded-2xl border border-line bg-card p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Community Push Settings
                      </p>
                      <div className="mt-4 grid gap-3">
                        <label className="space-y-2 text-sm text-sub">
                          <span className="font-semibold text-text">Push scope</span>
                          <select
                            value={telegramPushSettings.scopeMode}
                            onChange={(event) =>
                              setTelegramPushSettings((current) => ({
                                ...current,
                                scopeMode: event.target.value as PushScopeMode,
                              }))
                            }
                            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                          >
                            <option value="project_only">Only this project</option>
                            <option value="selected_projects">Selected projects</option>
                            <option value="selected_campaigns">Selected campaigns</option>
                            <option value="all_public">Everything public</option>
                          </select>
                        </label>
                        {telegramPushSettings.scopeMode === "selected_projects" ? (
                          <div className="space-y-2 rounded-2xl border border-line bg-card p-4">
                            <p className="text-sm font-semibold text-text">Allowed projects</p>
                            <div className="grid gap-2">
                              {selectableProjects.length > 0 ? (
                                selectableProjects.map((candidate) => (
                                  <label
                                    key={candidate.id}
                                    className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text"
                                  >
                                    <span>{candidate.name}</span>
                                    <input
                                      type="checkbox"
                                      checked={telegramPushSettings.selectedProjectIds.includes(candidate.id)}
                                      onChange={(event) =>
                                        setTelegramPushSettings((current) => ({
                                          ...current,
                                          selectedProjectIds: toggleScopeSelection(
                                            current.selectedProjectIds,
                                            candidate.id,
                                            event.target.checked
                                          ),
                                        }))
                                      }
                                    />
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-sub">
                                  No other projects are available in this workspace yet.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                        {telegramPushSettings.scopeMode === "selected_campaigns" ? (
                          <div className="space-y-2 rounded-2xl border border-line bg-card p-4">
                            <p className="text-sm font-semibold text-text">Allowed campaigns</p>
                            <div className="grid gap-2">
                              {campaigns.length > 0 ? (
                                campaigns.map((candidate) => (
                                  <label
                                    key={candidate.id}
                                    className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text"
                                  >
                                    <span>
                                      {candidate.title}
                                      <span className="ml-2 text-sub">
                                        {projectNameById.get(candidate.projectId) || "Unknown project"}
                                      </span>
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={telegramPushSettings.selectedCampaignIds.includes(candidate.id)}
                                      onChange={(event) =>
                                        setTelegramPushSettings((current) => ({
                                          ...current,
                                          selectedCampaignIds: toggleScopeSelection(
                                            current.selectedCampaignIds,
                                            candidate.id,
                                            event.target.checked
                                          ),
                                        }))
                                      }
                                    />
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-sub">
                                  No campaigns are available yet.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <label className="space-y-2 text-sm text-sub">
                          <span className="font-semibold text-text">Delivery mode</span>
                          <select
                            value={telegramPushSettings.deliveryMode}
                            onChange={(event) =>
                              setTelegramPushSettings((current) => ({
                                ...current,
                                deliveryMode: event.target.value as PushDeliveryMode,
                              }))
                            }
                            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                          >
                            <option value="broadcast">Broadcast everything that matches</option>
                            <option value="priority_only">High-priority only</option>
                          </select>
                        </label>
                        <input
                          value={telegramPushSettings.targetChatId}
                          onChange={(event) =>
                            setTelegramPushSettings((current) => ({
                              ...current,
                              targetChatId: event.target.value,
                            }))
                          }
                          placeholder="Target Telegram chat ID for pushes"
                          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            ["allowCampaigns", "Campaigns"],
                            ["allowQuests", "Quests"],
                            ["allowRaids", "Raids"],
                            ["allowRewards", "Rewards"],
                            ["allowAnnouncements", "Announcements"],
                          ].map(([key, label]) => (
                            <label
                              key={key}
                              className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text"
                            >
                              <span>{label}</span>
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  telegramPushSettings[key as keyof CommunityPushSettings]
                                )}
                                onChange={(event) =>
                                  setTelegramPushSettings((current) => ({
                                    ...current,
                                    [key]: event.target.checked,
                                  }))
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                            <span>Featured only</span>
                            <input
                              type="checkbox"
                              checked={telegramPushSettings.featuredOnly}
                              onChange={(event) =>
                                setTelegramPushSettings((current) => ({
                                  ...current,
                                  featuredOnly: event.target.checked,
                                }))
                              }
                            />
                          </label>
                          <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                            <span>Live only</span>
                            <input
                              type="checkbox"
                              checked={telegramPushSettings.liveOnly}
                              onChange={(event) =>
                                setTelegramPushSettings((current) => ({
                                  ...current,
                                  liveOnly: event.target.checked,
                                }))
                              }
                            />
                          </label>
                        </div>
                        <input
                          value={telegramPushSettings.minXp}
                          onChange={(event) =>
                            setTelegramPushSettings((current) => ({
                              ...current,
                              minXp: event.target.value,
                            }))
                          }
                          placeholder="Minimum XP threshold (optional)"
                          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => void saveProjectIntegration("telegram")}
                        disabled={savingIntegration === "telegram"}
                        className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingIntegration === "telegram"
                          ? "Saving Telegram config..."
                          : "Save Telegram integration"}
                      </button>
                      <button
                        onClick={() => void sendIntegrationTestPush("telegram")}
                        disabled={testingIntegration === "telegram"}
                        className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {testingIntegration === "telegram"
                          ? "Sending Telegram test..."
                          : "Send Telegram test push"}
                      </button>
                    </div>
                  </div>
                </div>
                {integrationNotice ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {integrationNotice}
                  </div>
                ) : null}
                {integrationTestNotice ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      integrationTestTone === "error"
                        ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
                        : "border border-primary/20 bg-primary/10 text-primary"
                    }`}
                  >
                    {integrationTestNotice}
                  </div>
                ) : null}
                <DetailMetaRow
                  label="What this unlocks"
                  value={[
                    xIntegrationStatus === "connected"
                      ? "X follow quests can route into integration verification."
                      : "Connect the X integration to move follow quests beyond placeholder automation.",
                    discordIntegrationStatus === "connected"
                      ? "Discord join quests can route into integration verification."
                      : "Connect the Discord integration to move Discord join quests beyond placeholder automation.",
                    telegramIntegrationStatus === "connected"
                      ? "Telegram join quests can route into integration verification."
                      : "Connect the Telegram integration to move Telegram join quests beyond placeholder automation.",
                  ].join(" ")}
                />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Public Profile Readiness">
              <div className="mt-4 space-y-3">
                {publicProfileReadiness.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-text">{item.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          item.complete ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {item.complete ? "Ready" : "Needs work"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-sub">{item.value}</p>
                  </div>
                ))}
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Operator Signals">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Callback failures" value={operatorSignals.callbackFailures} />
                <DetailMetaRow label="On-chain failures" value={operatorSignals.onchainFailures} />
                <DetailMetaRow label="Latest incident" value={operatorSignals.latestIssue} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Related Campaigns">
              <div className="mt-4 grid gap-3">
                {relatedCampaigns.length > 0 ? (
                  relatedCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="rounded-2xl border border-line bg-card2 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-text">
                            {campaign.title}
                          </p>
                          <p className="mt-1 text-sm text-sub">
                            {campaign.status} • {campaign.participants} participants
                          </p>
                        </div>

                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          className="rounded-xl border border-line px-3 py-2 font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-line bg-card2 p-5">
                    <p className="text-sm font-semibold text-text">
                      No campaigns linked yet.
                    </p>
                    <p className="mt-2 text-sm text-sub">
                      Start with a campaign so this workspace has a home for quests, raids and rewards.
                    </p>
                    <button
                      onClick={() => router.push("/campaigns/new")}
                      className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-black"
                    >
                      Create first campaign
                    </button>
                  </div>
                )}
              </div>
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

