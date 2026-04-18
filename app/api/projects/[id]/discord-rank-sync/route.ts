import { NextRequest, NextResponse } from "next/server";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityJobSecret =
  process.env.COMMUNITY_RETRY_JOB_SECRET ?? process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!communityBotUrl) {
    return NextResponse.json(
      { ok: false, error: "COMMUNITY_BOT_URL is missing for Discord rank sync." },
      { status: 500 }
    );
  }

  try {
    const { id } = await context.params;
    const projectId = id?.trim();

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/jobs/sync-discord-ranks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityJobSecret ? { "x-community-job-secret": communityJobSecret } : {}),
        },
        body: JSON.stringify({
          projectId,
        }),
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
              : "Discord rank sync failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Discord rank sync failed.",
      },
      { status: 500 }
    );
  }
}
