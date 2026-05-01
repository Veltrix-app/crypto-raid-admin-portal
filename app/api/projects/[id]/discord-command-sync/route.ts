import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityJobSecret =
  process.env.COMMUNITY_RETRY_JOB_SECRET ?? process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!communityBotUrl) {
    return NextResponse.json(
      { ok: false, error: "COMMUNITY_BOT_URL is missing for Discord command sync." },
      { status: 500 }
    );
  }

  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const access = await assertProjectCommunityAccess(projectId ?? "");

    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/jobs/sync-discord-commands`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityJobSecret ? { "x-community-job-secret": communityJobSecret } : {}),
        },
        body: JSON.stringify({
          projectId: access.projectId,
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
              : "Discord command sync failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Discord command sync failed.");
  }
}
