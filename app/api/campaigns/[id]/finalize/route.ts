import { NextRequest, NextResponse } from "next/server";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!communityBotUrl) {
    return NextResponse.json(
      { ok: false, error: "COMMUNITY_BOT_URL is missing for reward finalization." },
      { status: 500 }
    );
  }

  try {
    const { id: campaignId } = await context.params;
    const body = await request.json().catch(() => ({}));

    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/aesp/rewards/${campaignId}/finalize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityBotWebhookSecret
            ? { "x-community-bot-secret": communityBotWebhookSecret }
            : {}),
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            payload && typeof payload === "object" && "error" in payload
              ? payload.error
              : "Reward finalization failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Reward finalization failed.",
      },
      { status: 500 }
    );
  }
}
