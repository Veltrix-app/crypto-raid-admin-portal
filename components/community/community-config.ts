"use client";

export type PushScopeMode =
  | "project_only"
  | "selected_projects"
  | "selected_campaigns"
  | "all_public";
export type PushDeliveryMode = "broadcast" | "priority_only";

export type CommunityPushSettings = {
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

export type DiscordRankSource = "project_xp" | "global_xp" | "trust" | "wallet_verified";
export type DiscordLeaderboardScope = "project" | "global";
export type DiscordLeaderboardPeriod = "weekly" | "monthly" | "all_time";
export type DiscordLeaderboardCadence = "manual" | "daily" | "weekly";
export type CommunityAutomationCadence = "manual" | "daily" | "weekly";
export type CommunityDeliveryTarget = "discord" | "telegram" | "both";
export type CommunityBotAction =
  | "command_sync"
  | "rank_sync"
  | "leaderboard_post"
  | "mission_post"
  | "raid_post"
  | "automation_run";

export type DiscordCommunityBotSettings = {
  commandsEnabled: boolean;
  telegramCommandsEnabled: boolean;
  rankSyncEnabled: boolean;
  rankSource: DiscordRankSource;
  leaderboardEnabled: boolean;
  leaderboardScope: DiscordLeaderboardScope;
  leaderboardPeriod: DiscordLeaderboardPeriod;
  leaderboardTargetChannelId: string;
  leaderboardTopN: string;
  leaderboardCadence: DiscordLeaderboardCadence;
  raidOpsEnabled: boolean;
  missionDigestEnabled: boolean;
  missionDigestCadence: CommunityAutomationCadence;
  missionDigestTarget: CommunityDeliveryTarget;
  raidAlertsEnabled: boolean;
  raidRemindersEnabled: boolean;
  raidResultsEnabled: boolean;
  raidCadence: CommunityAutomationCadence;
  lastRankSyncAt: string;
  lastLeaderboardPostedAt: string;
  lastMissionDigestAt: string;
  lastRaidAlertAt: string;
  lastAutomationRunAt: string;
};

export type DiscordRankRule = {
  id?: string;
  sourceType: DiscordRankSource;
  threshold: string;
  discordRoleId: string;
  label: string;
};

export type DiscordRankPreset = {
  id: string;
  title: string;
  description: string;
  preferredSource: DiscordRankSource;
  rules: Array<{
    sourceType: DiscordRankSource;
    threshold: string;
    label: string;
  }>;
};

export function createDefaultPushSettings(provider: "discord" | "telegram"): CommunityPushSettings {
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

export function createDefaultDiscordBotSettings(): DiscordCommunityBotSettings {
  return {
    commandsEnabled: true,
    telegramCommandsEnabled: false,
    rankSyncEnabled: false,
    rankSource: "project_xp",
    leaderboardEnabled: true,
    leaderboardScope: "project",
    leaderboardPeriod: "weekly",
    leaderboardTargetChannelId: "",
    leaderboardTopN: "10",
    leaderboardCadence: "manual",
    raidOpsEnabled: false,
    missionDigestEnabled: false,
    missionDigestCadence: "manual",
    missionDigestTarget: "both",
    raidAlertsEnabled: false,
    raidRemindersEnabled: false,
    raidResultsEnabled: false,
    raidCadence: "manual",
    lastRankSyncAt: "",
    lastLeaderboardPostedAt: "",
    lastMissionDigestAt: "",
    lastRaidAlertAt: "",
    lastAutomationRunAt: "",
  };
}

export function createEmptyDiscordRankRule(): DiscordRankRule {
  return {
    sourceType: "project_xp",
    threshold: "0",
    discordRoleId: "",
    label: "",
  };
}

export const DISCORD_RANK_PRESETS: DiscordRankPreset[] = [
  {
    id: "project-xp-ladder",
    title: "Project XP ladder",
    description: "Simple XP rail for communities that want visible progression fast.",
    preferredSource: "project_xp",
    rules: [
      { sourceType: "project_xp", threshold: "100", label: "Scout" },
      { sourceType: "project_xp", threshold: "500", label: "Vanguard" },
      { sourceType: "project_xp", threshold: "1500", label: "Elite Raider" },
    ],
  },
  {
    id: "trust-ladder",
    title: "Trust ladder",
    description: "Good for tighter communities that care about quality over raw volume.",
    preferredSource: "trust",
    rules: [
      { sourceType: "trust", threshold: "60", label: "Trusted" },
      { sourceType: "trust", threshold: "75", label: "Core Signal" },
      { sourceType: "trust", threshold: "90", label: "Sentinel" },
    ],
  },
  {
    id: "wallet-gate",
    title: "Wallet gate",
    description: "Adds a clean verified-wallet rank rail for gated communities.",
    preferredSource: "wallet_verified",
    rules: [{ sourceType: "wallet_verified", threshold: "1", label: "Verified Wallet" }],
  },
  {
    id: "hybrid-starter",
    title: "Hybrid starter",
    description: "A launch-ready mix of verified identity, activity and trust.",
    preferredSource: "project_xp",
    rules: [
      { sourceType: "wallet_verified", threshold: "1", label: "Verified Wallet" },
      { sourceType: "project_xp", threshold: "250", label: "Active Raider" },
      { sourceType: "trust", threshold: "70", label: "Trusted Core" },
    ],
  },
];

export function buildDiscordRankRulesFromPreset(preset: DiscordRankPreset) {
  return preset.rules.map((rule) => ({
    ...createEmptyDiscordRankRule(),
    sourceType: rule.sourceType,
    threshold: rule.threshold,
    label: rule.label,
  }));
}

export function formatDiscordRankSourceLabel(sourceType: DiscordRankSource) {
  if (sourceType === "global_xp") return "Global XP";
  if (sourceType === "trust") return "Trust";
  if (sourceType === "wallet_verified") return "Wallet";
  return "Project XP";
}

export function summarizeDiscordRankSources(rules: DiscordRankRule[]) {
  const uniqueSources = Array.from(new Set(rules.map((rule) => rule.sourceType)));
  return uniqueSources.length > 0
    ? uniqueSources.map((source) => formatDiscordRankSourceLabel(source)).join(", ")
    : "No live rails yet";
}

export function readPushSettings(
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

export function toggleScopeSelection(current: string[], nextId: string, checked: boolean) {
  if (checked) {
    return current.includes(nextId) ? current : [...current, nextId];
  }

  return current.filter((item) => item !== nextId);
}

export function getIntegrationTone(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "connected") return "success";
  if (status === "needs_attention" || status === "syncing") return "warning";
  if (status === "not_connected") return "danger";
  return "default";
}

export function describeIntegrationStatus(provider: string, status: string) {
  if (status === "connected") return `${provider} connected`;
  if (status === "needs_attention") return `${provider} needs attention`;
  if (status === "syncing") return `${provider} syncing`;
  return `${provider} not connected`;
}
