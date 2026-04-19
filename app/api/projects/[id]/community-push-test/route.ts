import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;
const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veltrix-web.vercel.app";
const normalizedWebAppUrl = webAppUrl.replace(/\/+$/, "");

type Provider = "discord" | "telegram";

type PushSettingsPayload = {
  targetChannelId?: string;
  targetThreadId?: string;
  targetChatId?: string;
};

type DiscordIntegrationPayload = {
  guildId?: string;
  serverId?: string;
};

type TelegramIntegrationPayload = {
  chatId?: string;
  groupId?: string;
};

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for community push testing.");
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
    throw new Error("COMMUNITY_BOT_URL is missing for community push testing.");
  }

  return `${communityBotUrl.replace(/\/+$/, "")}/webhooks/${provider}/push`;
}

function toOptionalTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
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
        : "Community push test delivery failed."
    );
  }

  return data;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          provider?: Provider;
          pushSettings?: PushSettingsPayload | null;
          integrationConfig?:
            | DiscordIntegrationPayload
            | TelegramIntegrationPayload
            | null;
        }
      | null;

    const provider = body?.provider;
    if (provider !== "discord" && provider !== "telegram") {
      return NextResponse.json({ ok: false, error: "Invalid provider." }, { status: 400 });
    }

    if (!projectId?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    await assertProjectCommunityAccess(projectId);
    const supabase = getServiceSupabaseClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, brand_accent")
      .eq("id", projectId.trim())
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ ok: false, error: projectError.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    const pushSettings =
      body?.pushSettings && typeof body.pushSettings === "object" ? body.pushSettings : {};
    const integrationConfig =
      body?.integrationConfig && typeof body.integrationConfig === "object"
        ? body.integrationConfig
        : {};

    const imageUrl = `${normalizedWebAppUrl}/community-push/defaults/campaign.png`;
    const title = `${project.name} delivery rail online`;
    const payloadBase = {
      title,
      body:
        provider === "discord"
          ? "This is a live Discord test push from the Veltrix admin portal. If this landed, routing and the community bot are healthy."
          : "This is a live Telegram test push from the Veltrix admin portal. If this landed, routing, media fallback and the community bot are healthy.",
      eyebrow: provider === "discord" ? "DISCORD SYSTEM CHECK" : "TELEGRAM SYSTEM CHECK",
      projectName: project.name,
      campaignTitle: "Operator test",
      imageUrl,
      accentColor: toOptionalTrimmedString(project.brand_accent),
      meta: [
        { label: "Project", value: project.name },
        { label: "Provider", value: provider === "discord" ? "Discord" : "Telegram" },
        { label: "State", value: "Test delivery" },
      ],
    };

    if (provider === "discord") {
      const targetChannelId =
        typeof pushSettings.targetChannelId === "string"
          ? pushSettings.targetChannelId.trim()
          : "";
      const targetThreadId =
        typeof pushSettings.targetThreadId === "string"
          ? pushSettings.targetThreadId.trim()
          : "";

      if (!targetChannelId) {
        return NextResponse.json(
          { ok: false, error: "Add a Discord target channel ID before sending a test push." },
          { status: 400 }
        );
      }

      const result = await sendCommunityPush("discord", {
        ...payloadBase,
        targetChannelId,
        targetThreadId: targetThreadId || undefined,
      });

      return NextResponse.json({
        ok: true,
        provider: "discord",
        target: targetThreadId || targetChannelId,
        result,
      });
    }

    const targetChatIdFromPushSettings =
      typeof pushSettings.targetChatId === "string" ? pushSettings.targetChatId.trim() : "";
    const targetChatIdFromIntegration =
      "chatId" in integrationConfig && typeof integrationConfig.chatId === "string"
        ? integrationConfig.chatId.trim()
        : "";
    const targetGroupIdFromIntegration =
      "groupId" in integrationConfig && typeof integrationConfig.groupId === "string"
        ? integrationConfig.groupId.trim()
        : "";
    const targetChatId =
      targetChatIdFromPushSettings || targetChatIdFromIntegration || targetGroupIdFromIntegration;

    if (!targetChatId) {
      return NextResponse.json(
        { ok: false, error: "Add a Telegram chat ID before sending a test push." },
        { status: 400 }
      );
    }

    const result = await sendCommunityPush("telegram", {
      ...payloadBase,
      targetChatId,
      fallbackImageUrl: imageUrl,
    });

    return NextResponse.json({
      ok: true,
      provider: "telegram",
      target: targetChatId,
      result,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Community push test delivery failed."
    );
  }
}
