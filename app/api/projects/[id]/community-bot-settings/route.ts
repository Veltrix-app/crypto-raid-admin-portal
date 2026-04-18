import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RankSource = "project_xp" | "global_xp" | "trust" | "wallet_verified";
type LeaderboardScope = "project" | "global";
type LeaderboardPeriod = "weekly" | "monthly" | "all_time";
type LeaderboardCadence = "manual" | "daily" | "weekly";

type RankRuleInput = {
  sourceType?: RankSource;
  threshold?: number | string;
  discordRoleId?: string;
  label?: string;
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
    rankSyncEnabled: false,
    rankSource: "project_xp" as RankSource,
    leaderboardEnabled: true,
    leaderboardScope: "project" as LeaderboardScope,
    leaderboardPeriod: "weekly" as LeaderboardPeriod,
    leaderboardTargetChannelId: "",
    leaderboardTopN: 10,
    leaderboardCadence: "manual" as LeaderboardCadence,
    raidOpsEnabled: false,
    lastRankSyncAt: "",
    lastLeaderboardPostedAt: "",
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
    const { data: integration, error: integrationError } = await supabase
      .from("project_integrations")
      .select("id, project_id, provider, config")
      .eq("project_id", projectId.trim())
      .eq("provider", "discord")
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ ok: false, error: integrationError.message }, { status: 500 });
    }

    if (!integration) {
      return NextResponse.json({
        ok: true,
        integrationId: null,
        settings: getDefaultSettings(),
        rankRules: [],
      });
    }

    const [{ data: settingsRow, error: settingsError }, { data: rankRules, error: rankRulesError }] =
      await Promise.all([
        supabase
          .from("community_bot_settings")
          .select(
            "integration_id, commands_enabled, rank_sync_enabled, rank_source, leaderboard_enabled, leaderboard_scope, leaderboard_period, leaderboard_target_channel_id, leaderboard_top_n, leaderboard_cadence, raid_ops_enabled, last_rank_sync_at, last_leaderboard_posted_at"
          )
          .eq("integration_id", integration.id)
          .maybeSingle(),
        supabase
          .from("community_rank_rules")
          .select("id, source_type, threshold, discord_role_id, label")
          .eq("integration_id", integration.id)
          .order("threshold", { ascending: true }),
      ]);

    if (settingsError) {
      return NextResponse.json({ ok: false, error: settingsError.message }, { status: 500 });
    }

    if (rankRulesError) {
      return NextResponse.json({ ok: false, error: rankRulesError.message }, { status: 500 });
    }

    const defaults = getDefaultSettings();

    return NextResponse.json({
      ok: true,
      integrationId: integration.id,
      settings: settingsRow
        ? {
            commandsEnabled: settingsRow.commands_enabled !== false,
            rankSyncEnabled: settingsRow.rank_sync_enabled === true,
            rankSource: sanitizeRankSource(settingsRow.rank_source),
            leaderboardEnabled: settingsRow.leaderboard_enabled !== false,
            leaderboardScope: sanitizeLeaderboardScope(settingsRow.leaderboard_scope),
            leaderboardPeriod: sanitizeLeaderboardPeriod(settingsRow.leaderboard_period),
            leaderboardTargetChannelId: settingsRow.leaderboard_target_channel_id ?? "",
            leaderboardTopN:
              Number.isFinite(Number(settingsRow.leaderboard_top_n)) &&
              Number(settingsRow.leaderboard_top_n) > 0
                ? Number(settingsRow.leaderboard_top_n)
                : defaults.leaderboardTopN,
            leaderboardCadence: sanitizeLeaderboardCadence(settingsRow.leaderboard_cadence),
            raidOpsEnabled: settingsRow.raid_ops_enabled === true,
            lastRankSyncAt:
              typeof settingsRow.last_rank_sync_at === "string"
                ? settingsRow.last_rank_sync_at
                : "",
            lastLeaderboardPostedAt:
              typeof settingsRow.last_leaderboard_posted_at === "string"
                ? settingsRow.last_leaderboard_posted_at
                : "",
          }
        : defaults,
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
    const { data: integration, error: integrationError } = await supabase
      .from("project_integrations")
      .select("id, project_id")
      .eq("project_id", projectId.trim())
      .eq("provider", "discord")
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ ok: false, error: integrationError.message }, { status: 500 });
    }

    if (!integration) {
      return NextResponse.json(
        {
          ok: false,
          error: "Save the Discord integration first before configuring bot settings.",
        },
        { status: 400 }
      );
    }

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

    const { error: settingsSaveError } = await supabase.from("community_bot_settings").upsert(
      {
        integration_id: integration.id,
        provider: "discord",
        project_id: integration.project_id,
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
      .eq("integration_id", integration.id);

    if (deleteRulesError) {
      return NextResponse.json({ ok: false, error: deleteRulesError.message }, { status: 500 });
    }

    if (sanitizedRules.length > 0) {
      const { error: insertRulesError } = await supabase.from("community_rank_rules").insert(
        sanitizedRules.map((rule) => ({
          integration_id: integration.id,
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

    return NextResponse.json({
      ok: true,
      message: "Discord bot settings saved.",
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
