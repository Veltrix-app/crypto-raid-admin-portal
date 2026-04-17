import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for project integrations.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

type Provider = "discord" | "telegram";

type ScopeMode = "project_only" | "all_public";
type DeliveryMode = "broadcast" | "priority_only";

function sanitizePushSettings(rawConfig: Record<string, unknown>, provider: Provider) {
  const rawPushSettings =
    rawConfig.pushSettings && typeof rawConfig.pushSettings === "object"
      ? (rawConfig.pushSettings as Record<string, unknown>)
      : {};

  return {
    enabled: rawPushSettings.enabled !== false,
    scopeMode:
      rawPushSettings.scopeMode === "all_public" ? ("all_public" as ScopeMode) : ("project_only" as ScopeMode),
    deliveryMode:
      rawPushSettings.deliveryMode === "priority_only"
        ? ("priority_only" as DeliveryMode)
        : ("broadcast" as DeliveryMode),
    targetChannelId:
      provider === "discord" && typeof rawPushSettings.targetChannelId === "string"
        ? rawPushSettings.targetChannelId.trim()
        : "",
    targetThreadId:
      provider === "discord" && typeof rawPushSettings.targetThreadId === "string"
        ? rawPushSettings.targetThreadId.trim()
        : "",
    targetChatId:
      provider === "telegram" && typeof rawPushSettings.targetChatId === "string"
        ? rawPushSettings.targetChatId.trim()
        : "",
    allowCampaigns: rawPushSettings.allowCampaigns !== false,
    allowQuests: rawPushSettings.allowQuests !== false,
    allowRaids: rawPushSettings.allowRaids !== false,
    allowRewards: rawPushSettings.allowRewards !== false,
    allowAnnouncements: rawPushSettings.allowAnnouncements !== false,
    featuredOnly: rawPushSettings.featuredOnly === true,
    liveOnly: rawPushSettings.liveOnly === true,
    minXp:
      typeof rawPushSettings.minXp === "number"
        ? rawPushSettings.minXp
        : typeof rawPushSettings.minXp === "string" && rawPushSettings.minXp.trim()
          ? Number(rawPushSettings.minXp)
          : 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          projectId?: string;
          provider?: Provider;
          config?: Record<string, unknown>;
        }
      | null;

    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const provider = body?.provider;
    const rawConfig =
      body?.config && typeof body.config === "object" ? body.config : {};

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    if (provider !== "discord" && provider !== "telegram") {
      return NextResponse.json({ ok: false, error: "Invalid provider." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const pushSettings = sanitizePushSettings(rawConfig, provider);
    const config =
      provider === "discord"
        ? {
            guildId:
              typeof rawConfig.guildId === "string" ? rawConfig.guildId.trim() : "",
            serverId:
              typeof rawConfig.serverId === "string" ? rawConfig.serverId.trim() : "",
            pushSettings,
          }
        : {
            chatId:
              typeof rawConfig.chatId === "string" ? rawConfig.chatId.trim() : "",
            groupId:
              typeof rawConfig.groupId === "string" ? rawConfig.groupId.trim() : "",
            pushSettings,
          };

    const hasPrimaryIdentifier =
      provider === "discord"
        ? Boolean(config.guildId || config.serverId)
        : Boolean(config.chatId || config.groupId);

    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from("project_integrations")
      .upsert(
        {
          project_id: projectId,
          provider,
          status: hasPrimaryIdentifier ? "connected" : "needs_attention",
          config,
          updated_at: now,
        },
        {
          onConflict: "project_id,provider",
        }
      )
      .select("id, provider, status, config")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      integration: data,
      message:
        provider === "discord"
          ? "Discord integration saved. Verification and community push settings are now attached to this project."
          : "Telegram integration saved. Verification and community push settings are now attached to this project.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save project integration.",
      },
      { status: 500 }
    );
  }
}
