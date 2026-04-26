import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import {
  buildQuestSubmissionDecisionProxyUrl,
  getQuestSubmissionDecisionWebAppBaseUrl,
  normalizeQuestSubmissionDecisionStatus,
} from "@/lib/quests/submission-decisions";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: submissionId } = await context.params;
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: "Missing submission id." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        decision?: unknown;
        reviewNotes?: unknown;
      }
    | null;
  const decision = normalizeQuestSubmissionDecisionStatus(body?.decision);
  if (!decision) {
    return NextResponse.json(
      { ok: false, error: "Decision must be approved or rejected." },
      { status: 400 }
    );
  }

  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const upstreamResponse = await fetch(
      buildQuestSubmissionDecisionProxyUrl({
        baseUrl: getQuestSubmissionDecisionWebAppBaseUrl(),
        submissionId,
      }),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authenticatedUser.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          reviewNotes: typeof body?.reviewNotes === "string" ? body.reviewNotes : "",
        }),
        cache: "no-store",
      }
    );
    const upstreamPayload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok || !upstreamPayload?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            upstreamPayload?.error ??
            `Quest decision route failed with ${upstreamResponse.status}.`,
        },
        { status: upstreamResponse.status || 502 }
      );
    }

    return NextResponse.json(
      {
        ...upstreamPayload,
        proxiedBy: "admin_portal",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Quest submission decision failed.";
    const status = message === "Missing bearer token." || message === "Invalid session." ? 401 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
