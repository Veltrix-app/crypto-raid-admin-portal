import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;
const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veltrix-web.vercel.app";

type Provider = "discord" | "telegram";
type ContentType = "campaign" | "quest" | "raid" | "reward";
type ScopeMode = "project_only" | "all_public";
type DeliveryMode = "broadcast" | "priority_only";

type PushSettings = {
  enabled: boolean;
  scopeMode: ScopeMode;
  deliveryMode: DeliveryMode;
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

type DispatchItem = {
  id: string;
  projectId: string;
  campaignId?: string | null;
  title: string;
  body: string;
  url: string;
  buttonLabel: string;
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

function readPushSettings(config: Record<string, unknown> | null | undefined, provider: Provider): PushSettings {
  const raw =
    config?.pushSettings && typeof config.pushSettings === "object"
      ? (config.pushSettings as Record<string, unknown>)
      : {};

  return {
    enabled: raw.enabled !== false,
    scopeMode: raw.scopeMode === "all_public" ? "all_public" : "project_only",
    deliveryMode: raw.deliveryMode === "priority_only" ? "priority_only" : "broadcast",
    targetChannelId:
      provider === "discord" && typeof raw.targetChannelId === "string" ? raw.targetChannelId.trim() : "",
    targetThreadId:
      provider === "discord" && typeof raw.targetThreadId === "string" ? raw.targetThreadId.trim() : "",
    targetChatId:
      provider === "telegram" && typeof raw.targetChatId === "string" ? raw.targetChatId.trim() : "",
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
  if (settings.featuredOnly && !item.isFeatured) return false;
  if (settings.liveOnly && !item.isLive) return false;
  if (settings.minXp > 0 && item.xpValue < settings.minXp) return false;
  return true;
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

async function loadDispatchItem(supabase: any, contentType: ContentType, contentId: string): Promise<DispatchItem | null> {
  if (contentType === "campaign") {
    const { data } = await supabase
      .from("campaigns")
      .select("id, project_id, title, short_description, featured, status, visibility, xp_budget")
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
    } | null;

    if (!campaign) return null;

    return {
      id: campaign.id,
      projectId: campaign.project_id,
      title: campaign.title,
      body: campaign.short_description || "A campaign just went live in Veltrix.",
      url: `${webAppUrl}/campaigns/${campaign.id}`,
      buttonLabel: "Open campaign",
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

    return {
      id: quest.id,
      projectId: quest.project_id,
      campaignId: quest.campaign_id,
      title: quest.title,
      body: quest.short_description || "A new mission is now live.",
      url: `${webAppUrl}/quests/${quest.id}`,
      buttonLabel: "Open mission",
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

    return {
      id: raid.id,
      projectId: raid.project_id,
      campaignId: raid.campaign_id,
      title: raid.title,
      body: raid.short_description || "A raid is now live and needs pressure.",
      url: `${webAppUrl}/raids/${raid.id}`,
      buttonLabel: "Open raid",
      isFeatured: false,
      isLive: raid.status === "active",
      xpValue: raid.reward_xp ?? 0,
    };
  }

  const { data } = await supabase
    .from("rewards")
    .select("id, project_id, campaign_id, title, description, status, visible, cost, rarity")
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
  } | null;

  if (!reward) return null;

  return {
    id: reward.id,
    projectId: reward.project_id,
    campaignId: reward.campaign_id,
    title: reward.title,
    body: reward.description || `A ${reward.rarity ?? "new"} reward is now available.`,
    url: `${webAppUrl}/rewards/${reward.id}`,
    buttonLabel: "Open reward",
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

    const { data: integrations, error } = await supabase
      .from("project_integrations")
      .select("project_id, provider, status, config")
      .in("provider", ["discord", "telegram"])
      .eq("status", "connected");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const deliveries: Array<Record<string, unknown>> = [];
    const skipped: Array<Record<string, unknown>> = [];

    for (const integration of integrations ?? []) {
      const provider = integration.provider as Provider;
      const settings = readPushSettings(
        integration.config && typeof integration.config === "object"
          ? (integration.config as Record<string, unknown>)
          : null,
        provider
      );

      if (
        !shouldDispatchToIntegration({
          provider,
          contentType,
          integrationProjectId: integration.project_id,
          settings,
          item,
        })
      ) {
        skipped.push({
          provider,
          integrationProjectId: integration.project_id,
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
              url: item.url,
              buttonLabel: item.buttonLabel,
            }
          : {
              targetChatId: settings.targetChatId,
              title: item.title,
              body: item.body,
              url: item.url,
              buttonLabel: item.buttonLabel,
            };

      const result = await sendCommunityPush(provider, payload);
      deliveries.push({
        provider,
        integrationProjectId: integration.project_id,
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
