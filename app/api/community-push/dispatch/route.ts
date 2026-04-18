import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;
const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veltrix-web.vercel.app";

type Provider = "discord" | "telegram";
type ContentType = "campaign" | "quest" | "raid" | "reward";
type ScopeMode =
  | "project_only"
  | "selected_projects"
  | "selected_campaigns"
  | "all_public";
type DeliveryMode = "broadcast" | "priority_only";

type PushSettings = {
  enabled: boolean;
  scopeMode: ScopeMode;
  deliveryMode: DeliveryMode;
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
  minXp: number;
};

type SubscriptionScope = {
  scopeType: "project" | "campaign";
  scopeRefId: string;
};

type LoadedIntegration = {
  integrationProjectId: string;
  provider: Provider;
  settings: PushSettings;
};

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

type DispatchItem = {
  id: string;
  projectId: string;
  campaignId?: string | null;
  title: string;
  body: string;
  url: string;
  buttonLabel: string;
  eyebrow: string;
  projectName: string;
  campaignTitle?: string | null;
  imageUrl?: string | null;
  accentColor?: string | null;
  meta: Array<{ label: string; value: string }>;
  isFeatured: boolean;
  isLive: boolean;
  xpValue: number;
};

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for community push dispatch.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getCommunityBotPushUrl(provider: Provider) {
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing for community push dispatch.");
  }

  return `${communityBotUrl.replace(/\/+$/, "")}/webhooks/${provider}/push`;
}

function sanitizeScopeIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function readLegacyPushSettings(
  config: Record<string, unknown> | null | undefined,
  provider: Provider
): PushSettings {
  const telegramFallbackTargetChatId =
    provider === "telegram"
      ? typeof config?.chatId === "string" && config.chatId.trim()
        ? config.chatId.trim()
        : typeof config?.groupId === "string"
          ? config.groupId.trim()
          : ""
      : "";
  const raw =
    config?.pushSettings && typeof config.pushSettings === "object"
      ? (config.pushSettings as Record<string, unknown>)
      : {};

  return {
    enabled: raw.enabled !== false,
    scopeMode:
      raw.scopeMode === "selected_projects"
        ? "selected_projects"
        : raw.scopeMode === "selected_campaigns"
          ? "selected_campaigns"
          : raw.scopeMode === "all_public"
            ? "all_public"
            : "project_only",
    deliveryMode: raw.deliveryMode === "priority_only" ? "priority_only" : "broadcast",
    selectedProjectIds: sanitizeScopeIds(raw.selectedProjectIds),
    selectedCampaignIds: sanitizeScopeIds(raw.selectedCampaignIds),
    targetChannelId:
      provider === "discord" && typeof raw.targetChannelId === "string" ? raw.targetChannelId.trim() : "",
    targetThreadId:
      provider === "discord" && typeof raw.targetThreadId === "string" ? raw.targetThreadId.trim() : "",
    targetChatId:
      provider === "telegram" && typeof raw.targetChatId === "string"
        ? raw.targetChatId.trim() || telegramFallbackTargetChatId
        : telegramFallbackTargetChatId,
    allowCampaigns: raw.allowCampaigns !== false,
    allowQuests: raw.allowQuests !== false,
    allowRaids: raw.allowRaids !== false,
    allowRewards: raw.allowRewards === true,
    allowAnnouncements: raw.allowAnnouncements !== false,
    featuredOnly: raw.featuredOnly === true,
    liveOnly: raw.liveOnly === true,
    minXp:
      typeof raw.minXp === "number"
        ? raw.minXp
        : typeof raw.minXp === "string" && raw.minXp.trim()
          ? Number(raw.minXp)
          : 0,
  };
}

function shouldDispatchForContentType(contentType: ContentType, settings: PushSettings) {
  if (contentType === "campaign") return settings.allowCampaigns;
  if (contentType === "quest") return settings.allowQuests;
  if (contentType === "raid") return settings.allowRaids;
  if (contentType === "reward") return settings.allowRewards;
  return false;
}

function isTargetConfigured(provider: Provider, settings: PushSettings) {
  return provider === "discord"
    ? Boolean(settings.targetChannelId)
    : Boolean(settings.targetChatId);
}

function shouldDispatchToIntegration(params: {
  provider: Provider;
  contentType: ContentType;
  integrationProjectId: string;
  settings: PushSettings;
  item: DispatchItem;
}) {
  const { integrationProjectId, settings, item, contentType } = params;

  if (!settings.enabled) return false;
  if (!isTargetConfigured(params.provider, settings)) return false;
  if (!shouldDispatchForContentType(contentType, settings)) {
    return false;
  }
  if (settings.scopeMode === "project_only" && integrationProjectId !== item.projectId) return false;
  if (
    settings.scopeMode === "selected_projects" &&
    !settings.selectedProjectIds.includes(item.projectId)
  ) {
    return false;
  }
  if (
    settings.scopeMode === "selected_campaigns" &&
    (!item.campaignId || !settings.selectedCampaignIds.includes(item.campaignId))
  ) {
    return false;
  }
  if (settings.featuredOnly && !item.isFeatured) return false;
  if (settings.liveOnly && !item.isLive) return false;
  if (settings.minXp > 0 && item.xpValue < settings.minXp) return false;
  if (
    settings.deliveryMode === "priority_only" &&
    !item.isFeatured &&
    item.xpValue < 100 &&
    contentType !== "raid"
  ) {
    return false;
  }
  return true;
}

async function loadIntegrationDispatchSettings(supabase: any): Promise<LoadedIntegration[]> {
  const { data: integrations, error: integrationError } = await supabase
    .from("project_integrations")
    .select("id, project_id, provider, status, config")
    .in("provider", ["discord", "telegram"])
    // Push delivery can still be valid while verification-specific config
    // remains incomplete on the integration row.
    .in("status", ["connected", "needs_attention"]);

  if (integrationError) {
    throw integrationError;
  }

  const normalizedIntegrations = (integrations ?? []).filter(
    (integration: { provider: string }) =>
      integration.provider === "discord" || integration.provider === "telegram"
  ) as Array<{
    id: string;
    project_id: string;
    provider: Provider;
    config: Record<string, unknown> | null;
  }>;

  if (normalizedIntegrations.length === 0) {
    return [];
  }

  const integrationIds = normalizedIntegrations.map((integration) => integration.id);
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("community_subscriptions")
    .select("id, integration_id, enabled, scope_mode, delivery_mode, target_channel_id, target_thread_id, target_chat_id")
    .in("integration_id", integrationIds);

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const subscriptionIds = (subscriptions ?? []).map((subscription: { id: string }) => subscription.id);
  const [{ data: filters, error: filtersError }, { data: scopes, error: scopesError }] =
    subscriptionIds.length > 0
      ? await Promise.all([
          supabase
            .from("community_subscription_filters")
            .select("subscription_id, featured_only, live_only, min_xp, allow_campaigns, allow_quests, allow_raids, allow_rewards, allow_announcements")
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
  const scopesBySubscriptionId = new Map<string, SubscriptionScope[]>();

  for (const scope of scopes ?? []) {
    const existing = scopesBySubscriptionId.get(scope.subscription_id) ?? [];
    existing.push({
      scopeType: scope.scope_type,
      scopeRefId: scope.scope_ref_id,
    });
    scopesBySubscriptionId.set(scope.subscription_id, existing);
  }

  return normalizedIntegrations.map((integration) => {
    const subscription = subscriptionByIntegrationId.get(integration.id);
    if (!subscription) {
      return {
        integrationProjectId: integration.project_id,
        provider: integration.provider,
        settings: readLegacyPushSettings(integration.config, integration.provider),
      };
    }

    const filter = filtersBySubscriptionId.get(subscription.id);
    const subscriptionScopes = scopesBySubscriptionId.get(subscription.id) ?? [];

    return {
      integrationProjectId: integration.project_id,
      provider: integration.provider,
        settings: {
          enabled: subscription.enabled !== false,
          scopeMode: subscription.scope_mode ?? "project_only",
          deliveryMode: subscription.delivery_mode ?? "broadcast",
        selectedProjectIds: subscriptionScopes
          .filter((scope) => scope.scopeType === "project")
          .map((scope) => scope.scopeRefId),
        selectedCampaignIds: subscriptionScopes
          .filter((scope) => scope.scopeType === "campaign")
          .map((scope) => scope.scopeRefId),
        targetChannelId: subscription.target_channel_id ?? "",
        targetThreadId: subscription.target_thread_id ?? "",
          targetChatId: subscription.target_chat_id ?? "",
          ...(integration.provider === "telegram" &&
          !(subscription.target_chat_id ?? "").trim() &&
          (typeof integration.config?.chatId === "string" || typeof integration.config?.groupId === "string")
            ? {
                targetChatId:
                  (typeof integration.config?.chatId === "string" && integration.config.chatId.trim()) ||
                  (typeof integration.config?.groupId === "string" && integration.config.groupId.trim()) ||
                  "",
              }
            : {}),
          allowCampaigns: filter?.allow_campaigns !== false,
        allowQuests: filter?.allow_quests !== false,
        allowRaids: filter?.allow_raids !== false,
        allowRewards: filter?.allow_rewards === true,
        allowAnnouncements: filter?.allow_announcements !== false,
        featuredOnly: filter?.featured_only === true,
        liveOnly: filter?.live_only === true,
        minXp: Number(filter?.min_xp ?? 0),
      },
    };
  });
}

async function sendCommunityPush(provider: Provider, payload: Record<string, unknown>) {
  const response = await fetch(getCommunityBotPushUrl(provider), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(communityBotWebhookSecret
        ? { "x-community-bot-secret": communityBotWebhookSecret }
        : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Community push delivery failed."
    );
  }

  return data;
}

async function loadProjectContext(
  supabase: any,
  projectId: string,
  campaignId?: string | null
) {
  const [{ data: project }, { data: campaign }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, logo, banner_url, brand_accent")
      .eq("id", projectId)
      .maybeSingle(),
    campaignId
      ? supabase
          .from("campaigns")
          .select("id, title, thumbnail_url, banner_url")
          .eq("id", campaignId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    project: (project as
      | {
          id: string;
          name: string;
          logo: string | null;
          banner_url: string | null;
          brand_accent: string | null;
        }
      | null) ?? null,
    campaign: (campaign as
      | {
          id: string;
          title: string;
          thumbnail_url: string | null;
          banner_url: string | null;
        }
      | null) ?? null,
  };
}

async function loadDispatchItem(supabase: any, contentType: ContentType, contentId: string): Promise<DispatchItem | null> {
  if (contentType === "campaign") {
    const { data } = await supabase
      .from("campaigns")
      .select("id, project_id, title, short_description, featured, status, visibility, xp_budget, thumbnail_url, banner_url")
      .eq("id", contentId)
      .maybeSingle();

    const campaign = data as {
      id: string;
      project_id: string;
      title: string;
      short_description: string | null;
      featured: boolean | null;
      status: string;
      visibility: string;
      xp_budget: number | null;
      thumbnail_url: string | null;
      banner_url: string | null;
    } | null;

    if (!campaign) return null;

    const context = await loadProjectContext(supabase, campaign.project_id, campaign.id);
    const imageUrl =
      campaign.banner_url ||
      campaign.thumbnail_url ||
      context.project?.banner_url ||
      context.project?.logo ||
      null;
    const meta = [
      { label: "Track", value: context.project?.name || "Veltrix" },
      { label: "XP Pool", value: `+${campaign.xp_budget ?? 0} XP` },
      { label: "State", value: "Campaign live" },
    ];

    return {
      id: campaign.id,
      projectId: campaign.project_id,
      title: campaign.title,
      body: campaign.short_description || "A campaign just went live in Veltrix.",
      url: `${webAppUrl}/campaigns/${campaign.id}`,
      buttonLabel: "Open campaign",
      eyebrow: "CAMPAIGN LIVE",
      projectName: context.project?.name || "Veltrix",
      campaignTitle: campaign.title,
      imageUrl,
      accentColor: context.project?.brand_accent || null,
      meta,
      isFeatured: Boolean(campaign.featured),
      isLive: campaign.status === "active" && campaign.visibility === "public",
      xpValue: campaign.xp_budget ?? 0,
    };
  }

  if (contentType === "quest") {
    const { data } = await supabase
      .from("quests")
      .select("id, project_id, campaign_id, title, short_description, status, xp")
      .eq("id", contentId)
      .maybeSingle();

    const quest = data as {
      id: string;
      project_id: string;
      campaign_id: string | null;
      title: string;
      short_description: string | null;
      status: string;
      xp: number | null;
    } | null;

    if (!quest) return null;

    const context = await loadProjectContext(supabase, quest.project_id, quest.campaign_id);
    const imageUrl =
      context.campaign?.banner_url ||
      context.campaign?.thumbnail_url ||
      context.project?.banner_url ||
      context.project?.logo ||
      null;
    const meta = [
      { label: "Project", value: context.project?.name || "Veltrix" },
      ...(context.campaign?.title ? [{ label: "Campaign", value: context.campaign.title }] : []),
      { label: "XP", value: `+${quest.xp ?? 0} XP` },
    ];

    return {
      id: quest.id,
      projectId: quest.project_id,
      campaignId: quest.campaign_id,
      title: quest.title,
      body: quest.short_description || "A new mission is now live.",
      url: `${webAppUrl}/quests/${quest.id}`,
      buttonLabel: "Open mission",
      eyebrow: "MISSION LIVE",
      projectName: context.project?.name || "Veltrix",
      campaignTitle: context.campaign?.title || null,
      imageUrl,
      accentColor: context.project?.brand_accent || null,
      meta,
      isFeatured: false,
      isLive: quest.status === "active",
      xpValue: quest.xp ?? 0,
    };
  }

  if (contentType === "raid") {
    const { data } = await supabase
      .from("raids")
      .select("id, project_id, campaign_id, title, short_description, status, reward_xp")
      .eq("id", contentId)
      .maybeSingle();

    const raid = data as {
      id: string;
      project_id: string;
      campaign_id: string | null;
      title: string;
      short_description: string | null;
      status: string;
      reward_xp: number | null;
    } | null;

    if (!raid) return null;

    const context = await loadProjectContext(supabase, raid.project_id, raid.campaign_id);
    const { data: raidDetail } = await supabase
      .from("raids")
      .select("banner")
      .eq("id", raid.id)
      .maybeSingle();
    const imageUrl =
      (raidDetail as { banner: string | null } | null)?.banner ||
      context.campaign?.banner_url ||
      context.campaign?.thumbnail_url ||
      context.project?.banner_url ||
      context.project?.logo ||
      null;
    const meta = [
      { label: "Project", value: context.project?.name || "Veltrix" },
      ...(context.campaign?.title ? [{ label: "Campaign", value: context.campaign.title }] : []),
      { label: "Raid XP", value: `+${raid.reward_xp ?? 0} XP` },
    ];

    return {
      id: raid.id,
      projectId: raid.project_id,
      campaignId: raid.campaign_id,
      title: raid.title,
      body: raid.short_description || "A raid is now live and needs pressure.",
      url: `${webAppUrl}/raids/${raid.id}`,
      buttonLabel: "Open raid",
      eyebrow: "RAID ALERT",
      projectName: context.project?.name || "Veltrix",
      campaignTitle: context.campaign?.title || null,
      imageUrl,
      accentColor: context.project?.brand_accent || null,
      meta,
      isFeatured: false,
      isLive: raid.status === "active",
      xpValue: raid.reward_xp ?? 0,
    };
  }

  const { data } = await supabase
    .from("rewards")
    .select("id, project_id, campaign_id, title, description, status, visible, cost, rarity, image_url")
    .eq("id", contentId)
    .maybeSingle();

  const reward = data as {
    id: string;
    project_id: string;
    campaign_id: string | null;
    title: string;
    description: string | null;
    status: string | null;
    visible: boolean | null;
    cost: number | null;
    rarity: string | null;
    image_url: string | null;
  } | null;

  if (!reward) return null;

  const context = await loadProjectContext(supabase, reward.project_id, reward.campaign_id);
  const imageUrl =
    reward.image_url ||
    context.campaign?.banner_url ||
    context.campaign?.thumbnail_url ||
    context.project?.banner_url ||
    context.project?.logo ||
    null;
  const meta = [
    { label: "Project", value: context.project?.name || "Veltrix" },
    ...(context.campaign?.title ? [{ label: "Campaign", value: context.campaign.title }] : []),
    { label: "Cost", value: `${reward.cost ?? 0} XP` },
    { label: "Rarity", value: reward.rarity || "Standard" },
  ];

  return {
    id: reward.id,
    projectId: reward.project_id,
    campaignId: reward.campaign_id,
    title: reward.title,
    body: reward.description || `A ${reward.rarity ?? "new"} reward is now available.`,
    url: `${webAppUrl}/rewards/${reward.id}`,
    buttonLabel: "Open reward",
    eyebrow: "REWARD DROP",
    projectName: context.project?.name || "Veltrix",
    campaignTitle: context.campaign?.title || null,
    imageUrl,
    accentColor: context.project?.brand_accent || null,
    meta,
    isFeatured: reward.rarity === "legendary" || reward.rarity === "epic",
    isLive: reward.status === "active" && reward.visible === true,
    xpValue: reward.cost ?? 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { contentType?: ContentType; contentId?: string }
      | null;

    const contentType = body?.contentType;
    const contentId = typeof body?.contentId === "string" ? body.contentId.trim() : "";

    if (!contentType || !["campaign", "quest", "raid", "reward"].includes(contentType)) {
      return NextResponse.json({ ok: false, error: "Invalid contentType." }, { status: 400 });
    }

    if (!contentId) {
      return NextResponse.json({ ok: false, error: "Missing contentId." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const item = await loadDispatchItem(supabase, contentType, contentId);

    if (!item) {
      return NextResponse.json({ ok: false, error: "Content item not found." }, { status: 404 });
    }

    if (!item.isLive) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Content is not in a live/public state yet.",
      });
    }

    const integrations = await loadIntegrationDispatchSettings(supabase);

    const deliveries: Array<Record<string, unknown>> = [];
    const skipped: Array<Record<string, unknown>> = [];

    for (const integration of integrations) {
      const { provider, settings } = integration;
      if (
        !shouldDispatchToIntegration({
          provider,
          contentType,
          integrationProjectId: integration.integrationProjectId,
          settings,
          item,
        })
      ) {
        skipped.push({
          provider,
          integrationProjectId: integration.integrationProjectId,
        });
        continue;
      }

      const payload =
        provider === "discord"
          ? {
              targetChannelId: settings.targetChannelId,
              targetThreadId: settings.targetThreadId || undefined,
              title: item.title,
              body: item.body,
              eyebrow: item.eyebrow,
              projectName: item.projectName,
              campaignTitle: item.campaignTitle || undefined,
              imageUrl: item.imageUrl || undefined,
              accentColor: item.accentColor || undefined,
              meta: item.meta,
              url: item.url,
              buttonLabel: item.buttonLabel,
            }
          : {
              targetChatId: settings.targetChatId,
              title: item.title,
              body: item.body,
              eyebrow: item.eyebrow,
              projectName: item.projectName,
              campaignTitle: item.campaignTitle || undefined,
              imageUrl: item.imageUrl || undefined,
              meta: item.meta,
              url: item.url,
              buttonLabel: item.buttonLabel,
            };

      const result = await sendCommunityPush(provider, payload);
      deliveries.push({
        provider,
        integrationProjectId: integration.integrationProjectId,
        result,
      });
    }

    return NextResponse.json({
      ok: true,
      deliveries,
      skipped,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Community push dispatch failed.",
      },
      { status: 500 }
    );
  }
}
