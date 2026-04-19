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
export type CommunityAutomationStatus = "active" | "paused";
export type CommunityAutomationType =
  | "rank_sync"
  | "leaderboard_pulse"
  | "mission_digest"
  | "raid_reminder"
  | "newcomer_pulse"
  | "reactivation_pulse"
  | "activation_board";
export type CommunityPlaybookKey =
  | "launch_week"
  | "raid_week"
  | "comeback_week"
  | "campaign_push";
export type CommunityCaptainPermission =
  | "rank_sync"
  | "leaderboard_post"
  | "raid_alert"
  | "mission_digest"
  | "newcomer_wave"
  | "reactivation_wave"
  | "activation_board";
export type CommunityBotAction =
  | "command_sync"
  | "rank_sync"
  | "leaderboard_post"
  | "mission_post"
  | "raid_post"
  | "automation_run";

export type CommunityAutomationRecord = {
  id: string;
  projectId: string;
  automationType: CommunityAutomationType;
  status: CommunityAutomationStatus;
  cadence: CommunityAutomationCadence;
  providerScope: CommunityDeliveryTarget;
  targetProvider: CommunityDeliveryTarget;
  title: string;
  description: string;
  config: Record<string, unknown>;
  lastRunAt: string;
  nextRunAt: string;
  lastResult: string;
  lastResultSummary: string;
};

export type CommunityAutomationRunRecord = {
  id: string;
  automationId: string | null;
  automationType: CommunityAutomationType;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  triggerSource: "manual" | "schedule" | "playbook" | "captain";
  triggeredByAuthUserId: string;
  summary: string;
  createdAt: string;
  completedAt: string;
};

export type CommunityPlaybookConfig = {
  key: CommunityPlaybookKey;
  title: string;
  description: string;
  enabled: boolean;
  providerScope: CommunityDeliveryTarget;
  steps: CommunityAutomationType[];
  lastRunAt: string;
};

export type CommunityPlaybookRunRecord = {
  id: string;
  playbookKey: CommunityPlaybookKey;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  triggerSource: "manual" | "schedule" | "captain";
  triggeredByAuthUserId: string;
  summary: string;
  createdAt: string;
  completedAt: string;
};

export type CommunityCaptainActionRecord = {
  id: string;
  authUserId: string;
  captainRole: string;
  actionType: string;
  targetType: string;
  targetId: string;
  status: "success" | "failed" | "skipped";
  summary: string;
  createdAt: string;
};

export type CommunityCaptainQueueItemStatus =
  | "queued"
  | "in_progress"
  | "blocked"
  | "escalated"
  | "completed";

export type CommunityCaptainQueueItemPriority = "low" | "normal" | "high" | "urgent";

export type CommunityCaptainQueueBlockedReason = {
  code: string;
  label: string;
  summary: string;
};

export type CommunityCaptainQueueItem = {
  id: string;
  title: string;
  summary: string;
  status: CommunityCaptainQueueItemStatus;
  priority: CommunityCaptainQueueItemPriority;
  dueAt: string;
  blockedReason: CommunityCaptainQueueBlockedReason;
  source: "automation" | "playbook" | "owner" | "journey";
  actionLabel: string;
};

export type CommunityOwnerRecommendation = {
  key: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  route: string;
};

export type CommunityJourneyOutcomeKey = "onboarding" | "comeback" | "activation" | "retention";

export type CommunityJourneyOutcome = {
  key: CommunityJourneyOutcomeKey;
  label: string;
  startedCount: number;
  completedCount: number;
  completionRate: number;
  blockedCount: number;
  recentCompletedCount: number;
  lastUpdatedAt: string;
};

export type CommunityJourneyOutcomeRecord = Record<CommunityJourneyOutcomeKey, CommunityJourneyOutcome>;

export type CommunityHealthSignal = {
  key: string;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
  summary: string;
};

export const COMMUNITY_AUTOMATION_LABELS: Record<CommunityAutomationType, string> = {
  rank_sync: "Rank sync",
  leaderboard_pulse: "Leaderboard pulse",
  mission_digest: "Mission digest",
  raid_reminder: "Raid reminder",
  newcomer_pulse: "Newcomer pulse",
  reactivation_pulse: "Reactivation pulse",
  activation_board: "Activation board",
};

export const COMMUNITY_CAPTAIN_PERMISSION_LABELS: Record<CommunityCaptainPermission, string> = {
  rank_sync: "Run rank sync",
  leaderboard_post: "Post leaderboard",
  raid_alert: "Send raid alert",
  mission_digest: "Send mission digest",
  newcomer_wave: "Send newcomer wave",
  reactivation_wave: "Send comeback wave",
  activation_board: "Push activation board",
};

export const COMMUNITY_PLAYBOOK_DEFAULTS: CommunityPlaybookConfig[] = [
  {
    key: "launch_week",
    title: "Launch Week",
    description: "Open with campaign pressure, mission visibility and a leaderboard pulse.",
    enabled: false,
    providerScope: "both",
    steps: ["activation_board", "mission_digest", "leaderboard_pulse"],
    lastRunAt: "",
  },
  {
    key: "raid_week",
    title: "Raid Week",
    description: "Keep the community focused on active raid pressure and visible results.",
    enabled: false,
    providerScope: "both",
    steps: ["raid_reminder", "leaderboard_pulse"],
    lastRunAt: "",
  },
  {
    key: "comeback_week",
    title: "Comeback Week",
    description: "Bring dormant contributors back with a comeback wave and a fresh leaderboard nudge.",
    enabled: false,
    providerScope: "both",
    steps: ["reactivation_pulse", "mission_digest", "leaderboard_pulse"],
    lastRunAt: "",
  },
  {
    key: "campaign_push",
    title: "Campaign Push",
    description: "Focus one campaign with an activation board and mission visibility burst.",
    enabled: false,
    providerScope: "both",
    steps: ["activation_board", "mission_digest"],
    lastRunAt: "",
  },
];

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
  captainsEnabled: boolean;
  newcomerFunnelEnabled: boolean;
  reactivationFunnelEnabled: boolean;
  activationBoardsEnabled: boolean;
  activationBoardCadence: CommunityAutomationCadence;
  lastRankSyncAt: string;
  lastLeaderboardPostedAt: string;
  lastMissionDigestAt: string;
  lastRaidAlertAt: string;
  lastAutomationRunAt: string;
  lastNewcomerPushAt: string;
  lastReactivationPushAt: string;
  lastActivationBoardAt: string;
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
    captainsEnabled: false,
    newcomerFunnelEnabled: false,
    reactivationFunnelEnabled: false,
    activationBoardsEnabled: false,
    activationBoardCadence: "manual",
    lastRankSyncAt: "",
    lastLeaderboardPostedAt: "",
    lastMissionDigestAt: "",
    lastRaidAlertAt: "",
    lastAutomationRunAt: "",
    lastNewcomerPushAt: "",
    lastReactivationPushAt: "",
    lastActivationBoardAt: "",
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
      provider === "telegram" && typeof rawPushSettings.targetChatId === "string" && rawPushSettings.targetChatId.trim()
        ? rawPushSettings.targetChatId.trim()
        : provider === "telegram" && typeof config?.chatId === "string" && config.chatId.trim()
          ? config.chatId.trim()
          : provider === "telegram" && typeof config?.groupId === "string" && config.groupId.trim()
            ? config.groupId.trim()
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
