import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import {
  approveTweetToRaidCandidate,
  loadTweetToRaidAutopilotState,
  rejectTweetToRaidCandidate,
  runManualTweetToRaidIngest,
  runTweetToRaidSourcePoll,
  saveTweetToRaidSource,
} from "@/lib/community/tweet-to-raid-autopilot";
import { writeProjectCommunityAuditLog } from "@/lib/community/project-community-ops";

type AutopilotAction =
  | "save_source"
  | "poll_sources"
  | "manual_ingest"
  | "approve_candidate"
  | "reject_candidate";

function readBodyAction(value: unknown): AutopilotAction | null {
  if (
    value === "save_source" ||
    value === "poll_sources" ||
    value === "manual_ingest" ||
    value === "approve_candidate" ||
    value === "reject_candidate"
  ) {
    return value;
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const state = await loadTweetToRaidAutopilotState(access.projectId);

    return NextResponse.json({
      ok: true,
      ...state,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to load Tweet-to-Raid Autopilot."
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const action = readBodyAction(body?.action);

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Missing Tweet-to-Raid Autopilot action." },
        { status: 400 }
      );
    }

    if (action === "save_source") {
      const source = await saveTweetToRaidSource(access.projectId, body ?? {});
      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "x_raid_sources",
        sourceId: source.id,
        action: "tweet_to_raid_source_saved",
        summary: `Tweet-to-Raid source saved for @${source.x_username}.`,
        metadata: {
          mode: source.mode,
          status: source.status,
          authUserId: access.authUserId,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Tweet-to-Raid Autopilot source saved.",
        source,
        ...(await loadTweetToRaidAutopilotState(access.projectId)),
      });
    }

    if (action === "manual_ingest") {
      const result = await runManualTweetToRaidIngest(access.projectId, body ?? {});
      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "x_raid_ingest_events",
        sourceId: access.projectId,
        action: "tweet_to_raid_manual_ingest_requested",
        summary: "Manual Tweet-to-Raid ingest requested from the portal.",
        metadata: {
          result,
          authUserId: access.authUserId,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Tweet-to-Raid ingest job completed.",
        result,
        ...(await loadTweetToRaidAutopilotState(access.projectId)),
      });
    }

    if (action === "poll_sources") {
      const result = await runTweetToRaidSourcePoll(access.projectId, body ?? {});
      const pollNeedsAttention =
        result && typeof result === "object" && (result as { ok?: unknown }).ok === false;
      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "x_raid_sources",
        sourceId: typeof body?.sourceId === "string" ? body.sourceId : access.projectId,
        action: "tweet_to_raid_source_poll_requested",
        summary: "Tweet-to-Raid source poll requested from the portal.",
        metadata: {
          result,
          authUserId: access.authUserId,
        },
      });

      return NextResponse.json({
        ok: true,
        message: pollNeedsAttention
          ? "Tweet-to-Raid poll ran, but needs attention. Check source health."
          : "Tweet-to-Raid source poll completed.",
        result,
        ...(await loadTweetToRaidAutopilotState(access.projectId)),
      });
    }

    const candidateId =
      typeof body?.candidateId === "string" ? body.candidateId.trim() : "";
    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "Missing Tweet-to-Raid candidate id." },
        { status: 400 }
      );
    }

    if (action === "approve_candidate") {
      const result = await approveTweetToRaidCandidate({
        projectId: access.projectId,
        candidateId,
        authUserId: access.authUserId,
      });

      return NextResponse.json({
        ok: true,
        message: "Tweet-to-Raid candidate approved and published as a live raid.",
        result,
        ...(await loadTweetToRaidAutopilotState(access.projectId)),
      });
    }

    await rejectTweetToRaidCandidate({
      projectId: access.projectId,
      candidateId,
      authUserId: access.authUserId,
    });

    return NextResponse.json({
      ok: true,
      message: "Tweet-to-Raid candidate rejected.",
      ...(await loadTweetToRaidAutopilotState(access.projectId)),
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Tweet-to-Raid Autopilot action failed."
    );
  }
}
