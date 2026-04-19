import { NextRequest, NextResponse } from "next/server";
import {
  type CommunityPlaybookConfig,
} from "@/components/community/community-config";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import {
  loadProjectCommunityExecution,
  saveProjectPlaybooks,
} from "@/lib/community/project-community-execution";
import { writeProjectCommunityAuditLog } from "@/lib/community/project-community-ops";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const payload = await loadProjectCommunityExecution(access.projectId);

    return NextResponse.json({
      ok: true,
      playbooks: payload.playbooks,
      playbookRuns: payload.playbookRuns,
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load community playbooks.",
      },
      { status: 500 }
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
    const body = (await request.json().catch(() => null)) as
      | {
          playbooks?: Array<Pick<CommunityPlaybookConfig, "key" | "enabled" | "providerScope">>;
        }
      | null;

    const playbooks = Array.isArray(body?.playbooks) ? body.playbooks : [];
    const payload = await saveProjectPlaybooks({
      projectId: access.projectId,
      playbooks,
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_bot_settings",
      sourceId: access.projectId,
      action: "community_playbooks_updated",
      summary: `Community playbooks updated (${playbooks.length} playbook${playbooks.length === 1 ? "" : "s"}).`,
      metadata: {
        updatedBy: access.authUserId,
        playbooks,
      },
    });

    return NextResponse.json({
      ok: true,
      playbooks: payload.playbooks,
      playbookRuns: payload.playbookRuns,
      message: "Community playbooks saved.",
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save community playbooks.",
      },
      { status: 500 }
    );
  }
}
