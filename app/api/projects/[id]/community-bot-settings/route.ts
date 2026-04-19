import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RankSource = "project_xp" | "global_xp" | "trust" | "wallet_verified";
type LeaderboardScope = "project" | "global";
type LeaderboardPeriod = "weekly" | "monthly" | "all_time";
type LeaderboardCadence = "manual" | "daily" | "weekly";
type CommunityAutomationCadence = "manual" | "daily" | "weekly";
type CommunityDeliveryTarget = "discord" | "telegram" | "both";

type RankRuleInput = {
  sourceType?: RankSource;
  threshold?: number | string;
  discordRoleId?: string;
  label?: string;
};

type CommunitySettingsMetadata = {
  missionDigestEnabled?: boolean;
  missionDigestCadence?: CommunityAutomationCadence;
  missionDigestTarget?: CommunityDeliveryTarget;
  raidAlertsEnabled?: boolean;
  raidRemindersEnabled?: boolean;
  raidResultsEnabled?: boolean;
  raidCadence?: CommunityAutomationCadence;
  captainsEnabled?: boolean;
  captainAssignments?: Array<{
    authUserId?: string;
    role?: string;
    label?: string;
  }>;
  newcomerFunnelEnabled?: boolean;
  reactivationFunnelEnabled?: boolean;
  activationBoardsEnabled?: boolean;
  activationBoardCadence?: CommunityAutomationCadence;
  lastMissionDigestAt?: string;
  lastRaidAlertAt?: string;
  lastAutomationRunAt?: string;
  lastNewcomerPushAt?: string;
  lastReactivationPushAt?: string;
  lastActivationBoardAt?: string;
};

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for community bot settings.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getDefaultSettings() {
  return {
    commandsEnabled: true,
    telegramCommandsEnabled: false,
    rankSyncEnabled: false,
    rankSource: "project_xp" as RankSource,
    leaderboardEnabled: true,
    leaderboardScope: "project" as LeaderboardScope,
    leaderboardPeriod: "weekly" as LeaderboardPeriod,
    leaderboardTargetChannelId: "",
    leaderboardTopN: 10,
    leaderboardCadence: "manual" as LeaderboardCadence,
    raidOpsEnabled: false,
    missionDigestEnabled: false,
    missionDigestCadence: "manual" as CommunityAutomationCadence,
    missionDigestTarget: "both" as CommunityDeliveryTarget,
    raidAlertsEnabled: false,
    raidRemindersEnabled: false,
    raidResultsEnabled: false,
    raidCadence: "manual" as CommunityAutomationCadence,
    captainsEnabled: false,
    newcomerFunnelEnabled: false,
    reactivationFunnelEnabled: false,
    activationBoardsEnabled: false,
    activationBoardCadence: "manual" as CommunityAutomationCadence,
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

function sanitizeRankSource(value: unknown): RankSource {
  return value === "global_xp" || value === "trust" || value === "wallet_verified"
    ? value
    : "project_xp";
}

function sanitizeLeaderboardScope(value: unknown): LeaderboardScope {
  return value === "global" ? "global" : "project";
}

function sanitizeLeaderboardPeriod(value: unknown): LeaderboardPeriod {
  return value === "monthly" || value === "all_time" ? value : "weekly";
}

function sanitizeLeaderboardCadence(value: unknown): LeaderboardCadence {
  return value === "daily" || value === "weekly" ? value : "manual";
}

function sanitizeAutomationCadence(value: unknown): CommunityAutomationCadence {
  return value === "daily" || value === "weekly" ? value : "manual";
}

function sanitizeDeliveryTarget(value: unknown): CommunityDeliveryTarget {
  return value === "discord" || value === "telegram" ? value : "both";
}

function sanitizeRankRules(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as Array<{
      sourceType: RankSource;
      threshold: number;
      discordRoleId: string;
      label: string;
    }>;
  }

  return input
    .map((rule) => {
      const candidate = rule && typeof rule === "object" ? (rule as RankRuleInput) : {};
      const threshold =
        typeof candidate.threshold === "number"
          ? candidate.threshold
          : typeof candidate.threshold === "string" && candidate.threshold.trim()
            ? Number(candidate.threshold)
            : 0;

      return {
        sourceType: sanitizeRankSource(candidate.sourceType),
        threshold: Number.isFinite(threshold) ? threshold : 0,
        discordRoleId:
          typeof candidate.discordRoleId === "string" ? candidate.discordRoleId.trim() : "",
        label: typeof candidate.label === "string" ? candidate.label.trim() : "",
      };
    })
    .filter((rule) => rule.discordRoleId.length > 0 && rule.label.length > 0);
}

function readMetadata(
  row:
    | {
        metadata?: CommunitySettingsMetadata | null;
      }
    | null
    | undefined
) {
  const metadata =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as CommunitySettingsMetadata)
      : {};

  return {
    missionDigestEnabled: metadata.missionDigestEnabled === true,
    missionDigestCadence: sanitizeAutomationCadence(metadata.missionDigestCadence),
    missionDigestTarget: sanitizeDeliveryTarget(metadata.missionDigestTarget),
    raidAlertsEnabled: metadata.raidAlertsEnabled === true,
    raidRemindersEnabled: metadata.raidRemindersEnabled === true,
    raidResultsEnabled: metadata.raidResultsEnabled === true,
    raidCadence: sanitizeAutomationCadence(metadata.raidCadence),
    captainsEnabled: metadata.captainsEnabled === true,
    newcomerFunnelEnabled: metadata.newcomerFunnelEnabled === true,
    reactivationFunnelEnabled: metadata.reactivationFunnelEnabled === true,
    activationBoardsEnabled: metadata.activationBoardsEnabled === true,
    activationBoardCadence: sanitizeAutomationCadence(metadata.activationBoardCadence),
    lastMissionDigestAt:
      typeof metadata.lastMissionDigestAt === "string" ? metadata.lastMissionDigestAt : "",
    lastRaidAlertAt: typeof metadata.lastRaidAlertAt === "string" ? metadata.lastRaidAlertAt : "",
    lastAutomationRunAt:
      typeof metadata.lastAutomationRunAt === "string" ? metadata.lastAutomationRunAt : "",
    lastNewcomerPushAt:
      typeof metadata.lastNewcomerPushAt === "string" ? metadata.lastNewcomerPushAt : "",
    lastReactivationPushAt:
      typeof metadata.lastReactivationPushAt === "string" ? metadata.lastReactivationPushAt : "",
    lastActivationBoardAt:
      typeof metadata.lastActivationBoardAt === "string" ? metadata.lastActivationBoardAt : "",
  };
}

function pickPrimaryIntegration(
  integrations: Array<{ id: string; provider: "discord" | "telegram"; project_id: string }>
) {
  return integrations.find((integration) => integration.provider === "discord") ?? integrations[0] ?? null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    if (!projectId?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { data: integrations, error: integrationError } = await supabase
      .from("project_integrations")
      .select("id, project_id, provider, config")
      .eq("project_id", projectId.trim())
      .in("provider", ["discord", "telegram"]);

    if (integrationError) {
      return NextResponse.json({ ok: false, error: integrationError.message }, { status: 500 });
    }

    const normalizedIntegrations = ((integrations ?? []) as Array<{
      id: string;
      project_id: string;
      provider: "discord" | "telegram";
      config: Record<string, unknown> | null;
    }>).filter((integration) => integration.provider === "discord" || integration.provider === "telegram");

    if (normalizedIntegrations.length === 0) {
      return NextResponse.json({
        ok: true,
        integrationId: null,
        settings: getDefaultSettings(),
        rankRules: [],
      });
    }

    const discordIntegration =
      normalizedIntegrations.find((integration) => integration.provider === "discord") ?? null;
    const telegramIntegration =
      normalizedIntegrations.find((integration) => integration.provider === "telegram") ?? null;
    const primaryIntegration = pickPrimaryIntegration(
      normalizedIntegrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        project_id: integration.project_id,
      }))
    );
    const integrationIds = normalizedIntegrations.map((integration) => integration.id);

    const [
      { data: settingsRows, error: settingsError },
      { data: rankRules, error: rankRulesError },
    ] = await Promise.all([
      supabase
        .from("community_bot_settings")
        .select(
          "integration_id, provider, commands_enabled, rank_sync_enabled, rank_source, leaderboard_enabled, leaderboard_scope, leaderboard_period, leaderboard_target_channel_id, leaderboard_top_n, leaderboard_cadence, raid_ops_enabled, metadata, last_rank_sync_at, last_leaderboard_posted_at"
        )
        .in("integration_id", integrationIds),
      discordIntegration
        ? supabase
            .from("community_rank_rules")
            .select("id, source_type, threshold, discord_role_id, label")
            .eq("integration_id", discordIntegration.id)
            .order("threshold", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (settingsError) {
      return NextResponse.json({ ok: false, error: settingsError.message }, { status: 500 });
    }
    if (rankRulesError) {
      return NextResponse.json({ ok: false, error: rankRulesError.message }, { status: 500 });
    }

    const settingsByIntegrationId = new Map(
      ((settingsRows ?? []) as Array<Record<string, unknown> & { integration_id: string }>).map(
        (row) => [row.integration_id, row]
      )
    );
    const defaults = getDefaultSettings();
    const discordSettingsRow = discordIntegration ? settingsByIntegrationId.get(discordIntegration.id) : null;
    const telegramSettingsRow = telegramIntegration ? settingsByIntegrationId.get(telegramIntegration.id) : null;
    const primarySettingsRow = primaryIntegration ? settingsByIntegrationId.get(primaryIntegration.id) : null;
    const metadata = readMetadata(primarySettingsRow as { metadata?: CommunitySettingsMetadata | null } | null);

    return NextResponse.json({
      ok: true,
      integrationId: primaryIntegration?.id ?? null,
      settings: {
        commandsEnabled:
          discordSettingsRow && discordSettingsRow.commands_enabled !== false
            ? true
            : discordIntegration
              ? discordSettingsRow?.commands_enabled !== false
              : defaults.commandsEnabled,
        telegramCommandsEnabled:
          telegramSettingsRow?.commands_enabled === true ? true : defaults.telegramCommandsEnabled,
        rankSyncEnabled: discordSettingsRow?.rank_sync_enabled === true,
        rankSource: sanitizeRankSource(discordSettingsRow?.rank_source),
        leaderboardEnabled:
          discordSettingsRow && discordSettingsRow.leaderboard_enabled !== false
            ? true
            : defaults.leaderboardEnabled,
        leaderboardScope: sanitizeLeaderboardScope(discordSettingsRow?.leaderboard_scope),
        leaderboardPeriod: sanitizeLeaderboardPeriod(discordSettingsRow?.leaderboard_period),
        leaderboardTargetChannelId:
          typeof discordSettingsRow?.leaderboard_target_channel_id === "string"
            ? discordSettingsRow.leaderboard_target_channel_id
            : "",
        leaderboardTopN:
          Number.isFinite(Number(discordSettingsRow?.leaderboard_top_n)) &&
          Number(discordSettingsRow?.leaderboard_top_n) > 0
            ? Number(discordSettingsRow?.leaderboard_top_n)
            : defaults.leaderboardTopN,
        leaderboardCadence: sanitizeLeaderboardCadence(discordSettingsRow?.leaderboard_cadence),
        raidOpsEnabled: discordSettingsRow?.raid_ops_enabled === true,
        lastRankSyncAt:
          typeof discordSettingsRow?.last_rank_sync_at === "string"
            ? discordSettingsRow.last_rank_sync_at
            : "",
        lastLeaderboardPostedAt:
          typeof discordSettingsRow?.last_leaderboard_posted_at === "string"
            ? discordSettingsRow.last_leaderboard_posted_at
            : "",
        ...metadata,
      },
      rankRules: (rankRules ?? []).map((rule) => ({
        id: rule.id,
        sourceType: sanitizeRankSource(rule.source_type),
        threshold: Number(rule.threshold ?? 0),
        discordRoleId: rule.discord_role_id,
        label: rule.label,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load community bot settings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          settings?: Record<string, unknown>;
          rankRules?: RankRuleInput[];
        }
      | null;

    if (!projectId?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { data: integrations, error: integrationError } = await supabase
      .from("project_integrations")
      .select("id, project_id, provider")
      .eq("project_id", projectId.trim())
      .in("provider", ["discord", "telegram"]);

    if (integrationError) {
      return NextResponse.json({ ok: false, error: integrationError.message }, { status: 500 });
    }

    const normalizedIntegrations = ((integrations ?? []) as Array<{
      id: string;
      project_id: string;
      provider: "discord" | "telegram";
    }>).filter((integration) => integration.provider === "discord" || integration.provider === "telegram");

    if (normalizedIntegrations.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Save a Discord or Telegram integration first before configuring community settings.",
        },
        { status: 400 }
      );
    }

    const discordIntegration =
      normalizedIntegrations.find((integration) => integration.provider === "discord") ?? null;
    const telegramIntegration =
      normalizedIntegrations.find((integration) => integration.provider === "telegram") ?? null;
    const primaryIntegration = pickPrimaryIntegration(normalizedIntegrations);
    const rawSettings =
      body?.settings && typeof body.settings === "object" ? body.settings : {};

    const leaderboardTopN =
      typeof rawSettings.leaderboardTopN === "number"
        ? rawSettings.leaderboardTopN
        : typeof rawSettings.leaderboardTopN === "string" && rawSettings.leaderboardTopN.trim()
          ? Number(rawSettings.leaderboardTopN)
          : 10;
    const sanitizedTopN =
      Number.isFinite(leaderboardTopN) && leaderboardTopN > 0
        ? Math.min(20, Math.floor(leaderboardTopN))
        : 10;
    const sanitizedRules = sanitizeRankRules(body?.rankRules);
    const existingSettingsRows =
      primaryIntegration || telegramIntegration
        ? await supabase
            .from("community_bot_settings")
            .select("integration_id, metadata")
            .in(
              "integration_id",
              [discordIntegration?.id, telegramIntegration?.id].filter(
                (value): value is string => Boolean(value)
              )
            )
        : { data: [], error: null };

    if (existingSettingsRows.error) {
      return NextResponse.json(
        { ok: false, error: existingSettingsRows.error.message },
        { status: 500 }
      );
    }

    const metadataByIntegrationId = new Map(
      ((existingSettingsRows.data ?? []) as Array<{ integration_id: string; metadata: CommunitySettingsMetadata | null }>).map(
        (row) => [row.integration_id, row.metadata ?? {}]
      )
    );

    if (discordIntegration) {
      const currentMetadata =
        metadataByIntegrationId.get(discordIntegration.id) && typeof metadataByIntegrationId.get(discordIntegration.id) === "object"
          ? (metadataByIntegrationId.get(discordIntegration.id) as CommunitySettingsMetadata)
          : {};

      const { error: settingsSaveError } = await supabase.from("community_bot_settings").upsert(
        {
          integration_id: discordIntegration.id,
          provider: "discord",
          project_id: discordIntegration.project_id,
          commands_enabled: rawSettings.commandsEnabled !== false,
          rank_sync_enabled: rawSettings.rankSyncEnabled === true,
          rank_source: sanitizeRankSource(rawSettings.rankSource),
          leaderboard_enabled: rawSettings.leaderboardEnabled !== false,
          leaderboard_scope: sanitizeLeaderboardScope(rawSettings.leaderboardScope),
          leaderboard_period: sanitizeLeaderboardPeriod(rawSettings.leaderboardPeriod),
          leaderboard_target_channel_id:
            typeof rawSettings.leaderboardTargetChannelId === "string"
              ? rawSettings.leaderboardTargetChannelId.trim()
              : null,
          leaderboard_top_n: sanitizedTopN,
          leaderboard_cadence: sanitizeLeaderboardCadence(rawSettings.leaderboardCadence),
          raid_ops_enabled: rawSettings.raidOpsEnabled === true,
          metadata: {
            ...currentMetadata,
            missionDigestEnabled: rawSettings.missionDigestEnabled === true,
            missionDigestCadence: sanitizeAutomationCadence(rawSettings.missionDigestCadence),
            missionDigestTarget: sanitizeDeliveryTarget(rawSettings.missionDigestTarget),
            raidAlertsEnabled: rawSettings.raidAlertsEnabled === true,
            raidRemindersEnabled: rawSettings.raidRemindersEnabled === true,
            raidResultsEnabled: rawSettings.raidResultsEnabled === true,
            raidCadence: sanitizeAutomationCadence(rawSettings.raidCadence),
            captainsEnabled: rawSettings.captainsEnabled === true,
            newcomerFunnelEnabled: rawSettings.newcomerFunnelEnabled === true,
            reactivationFunnelEnabled: rawSettings.reactivationFunnelEnabled === true,
            activationBoardsEnabled: rawSettings.activationBoardsEnabled === true,
            activationBoardCadence: sanitizeAutomationCadence(
              rawSettings.activationBoardCadence
            ),
            captainAssignments: Array.isArray(currentMetadata.captainAssignments)
              ? currentMetadata.captainAssignments
              : [],
            lastMissionDigestAt:
              typeof currentMetadata.lastMissionDigestAt === "string"
                ? currentMetadata.lastMissionDigestAt
                : "",
            lastRaidAlertAt:
              typeof currentMetadata.lastRaidAlertAt === "string"
                ? currentMetadata.lastRaidAlertAt
                : "",
            lastAutomationRunAt:
              typeof currentMetadata.lastAutomationRunAt === "string"
                ? currentMetadata.lastAutomationRunAt
                : "",
            lastNewcomerPushAt:
              typeof currentMetadata.lastNewcomerPushAt === "string"
                ? currentMetadata.lastNewcomerPushAt
                : "",
            lastReactivationPushAt:
              typeof currentMetadata.lastReactivationPushAt === "string"
                ? currentMetadata.lastReactivationPushAt
                : "",
            lastActivationBoardAt:
              typeof currentMetadata.lastActivationBoardAt === "string"
                ? currentMetadata.lastActivationBoardAt
                : "",
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "integration_id" }
      );

      if (settingsSaveError) {
        return NextResponse.json({ ok: false, error: settingsSaveError.message }, { status: 500 });
      }

      const { error: deleteRulesError } = await supabase
        .from("community_rank_rules")
        .delete()
        .eq("integration_id", discordIntegration.id);

      if (deleteRulesError) {
        return NextResponse.json({ ok: false, error: deleteRulesError.message }, { status: 500 });
      }

      if (sanitizedRules.length > 0) {
        const { error: insertRulesError } = await supabase.from("community_rank_rules").insert(
          sanitizedRules.map((rule) => ({
            integration_id: discordIntegration.id,
            source_type: rule.sourceType,
            threshold: rule.threshold,
            discord_role_id: rule.discordRoleId,
            label: rule.label,
          }))
        );

        if (insertRulesError) {
          return NextResponse.json({ ok: false, error: insertRulesError.message }, { status: 500 });
        }
      }
    }

    if (telegramIntegration) {
      const currentMetadata =
        metadataByIntegrationId.get(telegramIntegration.id) && typeof metadataByIntegrationId.get(telegramIntegration.id) === "object"
          ? (metadataByIntegrationId.get(telegramIntegration.id) as CommunitySettingsMetadata)
          : {};

      const { error: telegramSaveError } = await supabase.from("community_bot_settings").upsert(
        {
          integration_id: telegramIntegration.id,
          provider: "telegram",
          project_id: telegramIntegration.project_id,
          commands_enabled: rawSettings.telegramCommandsEnabled === true,
          metadata: currentMetadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "integration_id" }
      );

      if (telegramSaveError) {
        return NextResponse.json({ ok: false, error: telegramSaveError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Community bot settings saved.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save community bot settings.",
      },
      { status: 500 }
    );
  }
}
