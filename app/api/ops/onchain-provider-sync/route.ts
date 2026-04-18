import { NextRequest, NextResponse } from "next/server";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityJobSecret =
  process.env.COMMUNITY_RETRY_JOB_SECRET ?? process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!communityBotUrl) {
    return NextResponse.json(
      { ok: false, error: "COMMUNITY_BOT_URL is missing for provider sync." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/jobs/sync-onchain-provider`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityJobSecret ? { "x-community-job-secret": communityJobSecret } : {}),
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
              : "On-chain provider sync failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "On-chain provider sync failed.",
      },
      { status: 500 }
    );
  }
}
