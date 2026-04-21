import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectOnchainAccess,
  createOnchainAccessErrorResponse,
  hasOnchainActionPermission,
  OnchainAccessError,
} from "@/lib/onchain/project-onchain-auth";

const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityJobSecret =
  process.env.COMMUNITY_RETRY_JOB_SECRET ?? process.env.COMMUNITY_BOT_WEBHOOK_SECRET;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!communityBotUrl) {
      throw new Error("COMMUNITY_BOT_URL is missing for project on-chain sync.");
    }

    const { id } = await context.params;
    const projectId = id?.trim();
    const access = await assertProjectOnchainAccess(projectId ?? "");

    if (!projectId) {
      throw new OnchainAccessError(400, "Missing project id.");
    }

    if (!hasOnchainActionPermission(access, "rescan_project_assets")) {
      throw new OnchainAccessError(
        403,
        "You do not have permission to run project-safe on-chain sync."
      );
    }

    const body = await request.json().catch(() => ({}));
    const response = await fetch(
      `${communityBotUrl.replace(/\/+$/, "")}/jobs/sync-onchain-provider`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityJobSecret ? { "x-community-job-secret": communityJobSecret } : {}),
        },
        body: JSON.stringify({
          ...(body ?? {}),
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
              : "Project on-chain sync failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Project on-chain sync failed.");
  }
}
