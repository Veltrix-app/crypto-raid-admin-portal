import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;
const webAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);

export type CommunityProvider = "discord" | "telegram";

type ProjectCommunityTarget = {
  integrationId: string;
  provider: CommunityProvider;
  targetChannelId?: string;
  targetThreadId?: string;
  targetChatId?: string;
};

type ProjectSummary = {
  id: string;
  name: string;
  slug: string | null;
  banner_url: string | null;
  logo: string | null;
  brand_accent: string | null;
};

type CampaignSummary = {
  id: string;
  title: string;
  short_description: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  featured: boolean | null;
  xp_budget: number | null;
  status: string;
  visibility: string;
};

type QuestSummary = {
  id: string;
  title: string;
  short_description: string | null;
  xp: number | null;
  status: string;
  campaign_id: string | null;
};

type RewardSummary = {
  id: string;
  title: string;
  description: string | null;
  cost: number | null;
  rarity: string | null;
  image_url: string | null;
  status: string | null;
  visible: boolean | null;
  campaign_id: string | null;
};

type RaidSummary = {
  id: string;
  title: string;
  short_description: string | null;
  reward_xp: number | null;
  banner: string | null;
  status: string;
  campaign_id: string | null;
};

export type ProjectCommunityState = {
  project: ProjectSummary;
  campaigns: CampaignSummary[];
  quests: QuestSummary[];
  rewards: RewardSummary[];
  raids: RaidSummary[];
};

export function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for project community ops.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getDefaultCommunityArtwork(kind: "campaign" | "quest" | "raid") {
  return `${webAppUrl}/community-push/defaults/${kind}.png`;
}

function getCommunityBotPushUrl(provider: CommunityProvider) {
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing for project community ops.");
  }

  return `${communityBotUrl.replace(/\/+$/, "")}/webhooks/${provider}/push`;
}

async function sendProviderPush(provider: CommunityProvider, payload: Record<string, unknown>) {
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

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Community provider push failed."
    );
  }

  return result;
}

export async function loadProjectCommunityTargets(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_integrations")
    .select("id, provider, status, config")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"])
    .in("status", ["connected", "needs_attention"]);

  if (error) {
    throw new Error(error.message || "Failed to load project community integrations.");
  }

  return ((data ?? []) as Array<{
    id: string;
    provider: CommunityProvider;
    config: Record<string, unknown> | null;
  }>)
    .map((integration): ProjectCommunityTarget | null => {
      const pushSettings =
        integration.config?.pushSettings && typeof integration.config.pushSettings === "object"
          ? (integration.config.pushSettings as Record<string, unknown>)
          : {};

      if (integration.provider === "discord") {
        const targetChannelId =
          typeof pushSettings.targetChannelId === "string"
            ? pushSettings.targetChannelId.trim()
            : "";
        const targetThreadId =
          typeof pushSettings.targetThreadId === "string"
            ? pushSettings.targetThreadId.trim()
            : "";

        return targetChannelId
          ? {
              integrationId: integration.id,
              provider: integration.provider,
              targetChannelId,
              targetThreadId,
            }
          : null;
      }

      const fallbackChatId =
        typeof integration.config?.chatId === "string" && integration.config.chatId.trim()
          ? integration.config.chatId.trim()
          : typeof integration.config?.groupId === "string"
            ? integration.config.groupId.trim()
            : "";
      const targetChatId =
        typeof pushSettings.targetChatId === "string" && pushSettings.targetChatId.trim()
          ? pushSettings.targetChatId.trim()
          : fallbackChatId;

      return targetChatId
        ? {
            integrationId: integration.id,
            provider: integration.provider,
            targetChatId,
          }
        : null;
    })
    .filter((target): target is ProjectCommunityTarget => Boolean(target));
}

export async function sendProjectCommunityMessage(params: {
  projectId: string;
  providers?: CommunityProvider[];
  title: string;
  body: string;
  eyebrow?: string;
  campaignTitle?: string | null;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  accentColor?: string | null;
  meta?: Array<{ label: string; value: string }>;
  url?: string | null;
  buttonLabel?: string | null;
  projectName: string;
}) {
  const targets = await loadProjectCommunityTargets(params.projectId);
  const allowedProviders = params.providers?.length ? new Set(params.providers) : null;
  const deliveries: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

  for (const target of targets) {
    if (allowedProviders && !allowedProviders.has(target.provider)) {
      skipped.push({
        provider: target.provider,
        integrationId: target.integrationId,
        reason: "Provider not selected for this action.",
      });
      continue;
    }

    const payload =
      target.provider === "discord"
        ? {
            targetChannelId: target.targetChannelId,
            targetThreadId: target.targetThreadId || undefined,
            title: params.title,
            body: params.body,
            eyebrow: params.eyebrow || undefined,
            projectName: params.projectName,
            campaignTitle: params.campaignTitle || undefined,
            imageUrl: params.imageUrl || undefined,
            accentColor: params.accentColor || undefined,
            meta: params.meta ?? [],
            url: params.url || undefined,
            buttonLabel: params.buttonLabel || undefined,
          }
        : {
            targetChatId: target.targetChatId,
            title: params.title,
            body: params.body,
            eyebrow: params.eyebrow || undefined,
            projectName: params.projectName,
            campaignTitle: params.campaignTitle || undefined,
            imageUrl: params.imageUrl || undefined,
            fallbackImageUrl:
              params.fallbackImageUrl && params.fallbackImageUrl !== params.imageUrl
                ? params.fallbackImageUrl
                : undefined,
            meta: params.meta ?? [],
            url: params.url || undefined,
            buttonLabel: params.buttonLabel || undefined,
          };

    const result = await sendProviderPush(target.provider, payload);
    deliveries.push({
      provider: target.provider,
      integrationId: target.integrationId,
      result,
    });
  }

  return {
    ok: true,
    deliveries,
    skipped,
  };
}

export async function loadProjectCommunityState(projectId: string): Promise<ProjectCommunityState> {
  const supabase = getServiceSupabaseClient();
  const [
    { data: project, error: projectError },
    { data: campaigns, error: campaignError },
    { data: quests, error: questError },
    { data: rewards, error: rewardError },
    { data: raids, error: raidError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug, banner_url, logo, brand_accent")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select(
        "id, title, short_description, banner_url, thumbnail_url, featured, xp_budget, status, visibility"
      )
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quests")
      .select("id, title, short_description, xp, status, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(8),
    supabase
      .from("rewards")
      .select("id, title, description, cost, rarity, image_url, status, visible, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("raids")
      .select("id, title, short_description, reward_xp, banner, status, campaign_id")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (projectError) {
    throw new Error(projectError.message || "Failed to load project community state.");
  }
  if (!project) {
    throw new Error("Project not found for community state.");
  }
  if (campaignError) {
    throw new Error(campaignError.message || "Failed to load project campaigns.");
  }
  if (questError) {
    throw new Error(questError.message || "Failed to load project quests.");
  }
  if (rewardError) {
    throw new Error(rewardError.message || "Failed to load project rewards.");
  }
  if (raidError) {
    throw new Error(raidError.message || "Failed to load project raids.");
  }

  return {
    project: project as ProjectSummary,
    campaigns: (campaigns ?? []) as CampaignSummary[],
    quests: (quests ?? []) as QuestSummary[],
    rewards: (rewards ?? []) as RewardSummary[],
    raids: (raids ?? []) as RaidSummary[],
  };
}

export function buildProjectAppUrl(project: { id: string; slug: string | null }) {
  return `${webAppUrl}/projects/${project.slug?.trim() || project.id}`;
}

export function buildCommunityEntityUrl(
  kind: "campaigns" | "quests" | "rewards" | "raids",
  id: string
) {
  return `${webAppUrl}/${kind}/${id}`;
}

export async function loadCommunitySettingsRows(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data: integrations, error: integrationError } = await supabase
    .from("project_integrations")
    .select("id, provider, project_id")
    .eq("project_id", projectId)
    .in("provider", ["discord", "telegram"]);

  if (integrationError) {
    throw new Error(integrationError.message || "Failed to load community integrations.");
  }

  const normalizedIntegrations = (integrations ?? []) as Array<{
    id: string;
    provider: CommunityProvider;
    project_id: string;
  }>;
  const integrationIds = normalizedIntegrations.map((integration) => integration.id);

  if (integrationIds.length === 0) {
    return {
      integrations: normalizedIntegrations,
      settingsByIntegrationId: new Map<string, Record<string, unknown>>(),
    };
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from("community_bot_settings")
    .select(
      "integration_id, provider, commands_enabled, rank_sync_enabled, rank_source, leaderboard_enabled, leaderboard_scope, leaderboard_period, leaderboard_target_channel_id, leaderboard_top_n, leaderboard_cadence, raid_ops_enabled, metadata, last_rank_sync_at, last_leaderboard_posted_at"
    )
    .in("integration_id", integrationIds);

  if (settingsError) {
    throw new Error(settingsError.message || "Failed to load community bot settings rows.");
  }

  return {
    integrations: normalizedIntegrations,
    settingsByIntegrationId: new Map(
      ((settingsRows ?? []) as Array<Record<string, unknown> & { integration_id: string }>).map(
        (row) => [row.integration_id, row]
      )
    ),
  };
}

export async function updateCommunityMetadata(params: {
  projectId: string;
  metadataPatch: Record<string, unknown>;
}) {
  const { integrations, settingsByIntegrationId } = await loadCommunitySettingsRows(params.projectId);
  const primaryIntegration =
    integrations.find((integration) => integration.provider === "discord") ?? integrations[0];

  if (!primaryIntegration) {
    return null;
  }

  const existingRow = settingsByIntegrationId.get(primaryIntegration.id);
  const metadata =
    existingRow?.metadata && typeof existingRow.metadata === "object"
      ? (existingRow.metadata as Record<string, unknown>)
      : {};

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("community_bot_settings").upsert(
    {
      integration_id: primaryIntegration.id,
      provider: primaryIntegration.provider,
      project_id: primaryIntegration.project_id,
      metadata: {
        ...metadata,
        ...params.metadataPatch,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "integration_id" }
  );

  if (error) {
    throw new Error(error.message || "Failed to update community metadata.");
  }

  return primaryIntegration.id;
}

export async function writeProjectCommunityAuditLog(input: {
  projectId: string;
  sourceTable: string;
  sourceId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    auth_user_id: null,
    project_id: input.projectId,
    source_table: input.sourceTable,
    source_id: input.sourceId,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to write community audit log.");
  }
}
