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

type ScopeMode = "project_only" | "selected_projects" | "selected_campaigns" | "all_public";
type DeliveryMode = "broadcast" | "priority_only";

function sanitizeScopeIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function sanitizePushSettings(rawConfig: Record<string, unknown>, provider: Provider) {
  const rawPushSettings =
    rawConfig.pushSettings && typeof rawConfig.pushSettings === "object"
      ? (rawConfig.pushSettings as Record<string, unknown>)
      : {};

  return {
    enabled: rawPushSettings.enabled !== false,
    scopeMode:
      rawPushSettings.scopeMode === "selected_projects"
        ? ("selected_projects" as ScopeMode)
        : rawPushSettings.scopeMode === "selected_campaigns"
          ? ("selected_campaigns" as ScopeMode)
          : rawPushSettings.scopeMode === "all_public"
            ? ("all_public" as ScopeMode)
            : ("project_only" as ScopeMode),
    deliveryMode:
      rawPushSettings.deliveryMode === "priority_only"
        ? ("priority_only" as DeliveryMode)
        : ("broadcast" as DeliveryMode),
    selectedProjectIds: sanitizeScopeIds(rawPushSettings.selectedProjectIds),
    selectedCampaignIds: sanitizeScopeIds(rawPushSettings.selectedCampaignIds),
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
    allowRewards: rawPushSettings.allowRewards === true,
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

    const { data: subscription, error: subscriptionError } = await supabase
      .from("community_subscriptions")
      .upsert(
        {
          integration_id: data.id,
          provider,
          project_id: projectId,
          enabled: pushSettings.enabled,
          scope_mode: pushSettings.scopeMode,
          delivery_mode: pushSettings.deliveryMode,
          target_channel_id:
            provider === "discord" ? pushSettings.targetChannelId || null : null,
          target_thread_id:
            provider === "discord" ? pushSettings.targetThreadId || null : null,
          target_chat_id:
            provider === "telegram" ? pushSettings.targetChatId || null : null,
          updated_at: now,
        },
        {
          onConflict: "integration_id",
        }
      )
      .select("id")
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { ok: false, error: subscriptionError?.message || "Failed to persist subscription." },
        { status: 500 }
      );
    }

    const { error: filtersError } = await supabase.from("community_subscription_filters").upsert(
      {
        subscription_id: subscription.id,
        featured_only: pushSettings.featuredOnly,
        live_only: pushSettings.liveOnly,
        min_xp: Number.isFinite(pushSettings.minXp) ? pushSettings.minXp : 0,
        allow_campaigns: pushSettings.allowCampaigns,
        allow_quests: pushSettings.allowQuests,
        allow_raids: pushSettings.allowRaids,
        allow_rewards: pushSettings.allowRewards,
        allow_announcements: pushSettings.allowAnnouncements,
        updated_at: now,
      },
      {
        onConflict: "subscription_id",
      }
    );

    if (filtersError) {
      return NextResponse.json({ ok: false, error: filtersError.message }, { status: 500 });
    }

    const scopeRows =
      pushSettings.scopeMode === "selected_projects"
        ? pushSettings.selectedProjectIds.map((scopeRefId) => ({
            subscription_id: subscription.id,
            scope_type: "project",
            scope_ref_id: scopeRefId,
            updated_at: now,
          }))
        : pushSettings.scopeMode === "selected_campaigns"
          ? pushSettings.selectedCampaignIds.map((scopeRefId) => ({
              subscription_id: subscription.id,
              scope_type: "campaign",
              scope_ref_id: scopeRefId,
              updated_at: now,
            }))
          : [];

    const { error: deleteScopesError } = await supabase
      .from("community_subscription_scopes")
      .delete()
      .eq("subscription_id", subscription.id);

    if (deleteScopesError) {
      return NextResponse.json({ ok: false, error: deleteScopesError.message }, { status: 500 });
    }

    if (scopeRows.length > 0) {
      const { error: scopeInsertError } = await supabase
        .from("community_subscription_scopes")
        .insert(scopeRows);

      if (scopeInsertError) {
        return NextResponse.json({ ok: false, error: scopeInsertError.message }, { status: 500 });
      }
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
