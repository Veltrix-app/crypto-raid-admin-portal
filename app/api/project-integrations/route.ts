import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";

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

function getTelegramFallbackTargetChatId(config: Record<string, unknown> | null | undefined) {
  const chatId = typeof config?.chatId === "string" ? config.chatId.trim() : "";
  const groupId = typeof config?.groupId === "string" ? config.groupId.trim() : "";
  return chatId || groupId || "";
}

type CommunitySubscriptionRow = {
  id: string;
  integration_id: string;
  enabled: boolean;
  scope_mode: ScopeMode;
  delivery_mode: DeliveryMode;
  target_channel_id: string | null;
  target_thread_id: string | null;
  target_chat_id: string | null;
};

type CommunitySubscriptionFilterRow = {
  subscription_id: string;
  featured_only: boolean;
  live_only: boolean;
  min_xp: number;
  allow_campaigns: boolean;
  allow_quests: boolean;
  allow_raids: boolean;
  allow_rewards: boolean;
  allow_announcements: boolean;
};

type CommunitySubscriptionScopeRow = {
  subscription_id: string;
  scope_type: "project" | "campaign";
  scope_ref_id: string;
};

async function loadNormalizedPushSettings(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  integrations: Array<{
    id: string;
    provider: Provider;
    config: Record<string, unknown> | null;
  }>
) {
  if (integrations.length === 0) {
    return new Map<string, Record<string, unknown>>();
  }

  const integrationIds = integrations.map((integration) => integration.id);
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("community_subscriptions")
    .select("id, integration_id, enabled, scope_mode, delivery_mode, target_channel_id, target_thread_id, target_chat_id")
    .in("integration_id", integrationIds);

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const subscriptionIds = ((subscriptions ?? []) as CommunitySubscriptionRow[]).map(
    (subscription) => subscription.id
  );

  const [{ data: filters, error: filtersError }, { data: scopes, error: scopesError }] =
    subscriptionIds.length > 0
      ? await Promise.all([
          supabase
            .from("community_subscription_filters")
            .select(
              "subscription_id, featured_only, live_only, min_xp, allow_campaigns, allow_quests, allow_raids, allow_rewards, allow_announcements"
            )
            .in("subscription_id", subscriptionIds),
          supabase
            .from("community_subscription_scopes")
            .select("subscription_id, scope_type, scope_ref_id")
            .in("subscription_id", subscriptionIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

  if (filtersError) {
    throw filtersError;
  }

  if (scopesError) {
    throw scopesError;
  }

  const subscriptionByIntegrationId = new Map<string, CommunitySubscriptionRow>(
    ((subscriptions ?? []) as CommunitySubscriptionRow[]).map((subscription) => [
      subscription.integration_id,
      subscription,
    ])
  );
  const filtersBySubscriptionId = new Map<string, CommunitySubscriptionFilterRow>(
    ((filters ?? []) as CommunitySubscriptionFilterRow[]).map((filter) => [
      filter.subscription_id,
      filter,
    ])
  );
  const scopesBySubscriptionId = new Map<string, CommunitySubscriptionScopeRow[]>();

  for (const scope of (scopes ?? []) as CommunitySubscriptionScopeRow[]) {
    const existing = scopesBySubscriptionId.get(scope.subscription_id) ?? [];
    existing.push(scope);
    scopesBySubscriptionId.set(scope.subscription_id, existing);
  }

  const normalizedByIntegrationId = new Map<string, Record<string, unknown>>();

  for (const integration of integrations) {
    const legacyPushSettings = sanitizePushSettings(integration.config ?? {}, integration.provider);
    const subscription = subscriptionByIntegrationId.get(integration.id);

    if (!subscription) {
      normalizedByIntegrationId.set(integration.id, legacyPushSettings);
      continue;
    }

    const filter = filtersBySubscriptionId.get(subscription.id);
    const subscriptionScopes = scopesBySubscriptionId.get(subscription.id) ?? [];

    normalizedByIntegrationId.set(integration.id, {
      enabled: subscription.enabled !== false,
      scopeMode: subscription.scope_mode ?? "project_only",
      deliveryMode: subscription.delivery_mode ?? "broadcast",
      selectedProjectIds: subscriptionScopes
        .filter((scope) => scope.scope_type === "project")
        .map((scope) => scope.scope_ref_id),
      selectedCampaignIds: subscriptionScopes
        .filter((scope) => scope.scope_type === "campaign")
        .map((scope) => scope.scope_ref_id),
      targetChannelId: subscription.target_channel_id ?? "",
      targetThreadId: subscription.target_thread_id ?? "",
      targetChatId: subscription.target_chat_id ?? "",
      allowCampaigns: filter?.allow_campaigns !== false,
      allowQuests: filter?.allow_quests !== false,
      allowRaids: filter?.allow_raids !== false,
      allowRewards: filter?.allow_rewards === true,
      allowAnnouncements: filter?.allow_announcements !== false,
      featuredOnly: filter?.featured_only === true,
      liveOnly: filter?.live_only === true,
      minXp: Number.isFinite(Number(filter?.min_xp ?? 0)) ? Number(filter?.min_xp ?? 0) : 0,
    });
  }

  return normalizedByIntegrationId;
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim() ?? "";

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    await assertProjectCommunityAccess(projectId);
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_integrations")
      .select("id, project_id, provider, status, config")
      .eq("project_id", projectId)
      .in("provider", ["discord", "telegram", "x"]);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const integrations = ((data ?? []) as Array<{
      id: string;
      project_id: string;
      provider: string;
      status: string;
      config: Record<string, unknown> | null;
    }>).filter((integration) =>
      integration.provider === "discord" ||
      integration.provider === "telegram" ||
      integration.provider === "x"
    );

    const pushSettingsByIntegrationId = await loadNormalizedPushSettings(
      supabase,
      integrations.filter(
        (integration): integration is {
          id: string;
          project_id: string;
          provider: Provider;
          status: string;
          config: Record<string, unknown> | null;
        } => integration.provider === "discord" || integration.provider === "telegram"
      )
    );

    return NextResponse.json({
      ok: true,
      integrations: integrations.map((integration) => ({
        id: integration.id,
        projectId: integration.project_id,
        provider: integration.provider,
        status: integration.status,
        config:
          integration.provider === "discord" || integration.provider === "telegram"
            ? {
                ...(integration.config ?? {}),
                pushSettings:
                  pushSettingsByIntegrationId.get(integration.id) ??
                  (() => {
                    const settings = sanitizePushSettings(
                      integration.config ?? {},
                      integration.provider
                    );
                    return integration.provider === "telegram" && !settings.targetChatId
                      ? {
                          ...settings,
                          targetChatId: getTelegramFallbackTargetChatId(integration.config),
                        }
                      : settings;
                  })(),
              }
            : integration.config ?? null,
      })),
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to load project integrations."
    );
  }
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

    await assertProjectCommunityAccess(projectId);
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
    const normalizedPushSettings =
      provider === "telegram" && !pushSettings.targetChatId
        ? {
            ...pushSettings,
            targetChatId: getTelegramFallbackTargetChatId(config),
          }
        : pushSettings;

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
          enabled: normalizedPushSettings.enabled,
          scope_mode: normalizedPushSettings.scopeMode,
          delivery_mode: normalizedPushSettings.deliveryMode,
          target_channel_id:
            provider === "discord" ? normalizedPushSettings.targetChannelId || null : null,
          target_thread_id:
            provider === "discord" ? normalizedPushSettings.targetThreadId || null : null,
          target_chat_id:
            provider === "telegram" ? normalizedPushSettings.targetChatId || null : null,
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
        featured_only: normalizedPushSettings.featuredOnly,
        live_only: normalizedPushSettings.liveOnly,
        min_xp: Number.isFinite(normalizedPushSettings.minXp) ? normalizedPushSettings.minXp : 0,
        allow_campaigns: normalizedPushSettings.allowCampaigns,
        allow_quests: normalizedPushSettings.allowQuests,
        allow_raids: normalizedPushSettings.allowRaids,
        allow_rewards: normalizedPushSettings.allowRewards,
        allow_announcements: normalizedPushSettings.allowAnnouncements,
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
      normalizedPushSettings.scopeMode === "selected_projects"
        ? normalizedPushSettings.selectedProjectIds.map((scopeRefId) => ({
            subscription_id: subscription.id,
            scope_type: "project",
            scope_ref_id: scopeRefId,
            updated_at: now,
          }))
        : normalizedPushSettings.scopeMode === "selected_campaigns"
          ? normalizedPushSettings.selectedCampaignIds.map((scopeRefId) => ({
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
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to save project integration."
    );
  }
}
