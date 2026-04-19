import { NextRequest, NextResponse } from "next/server";
import {
  type CommunityAutomationRecord,
} from "@/components/community/community-config";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import {
  loadProjectCommunityExecution,
  saveProjectCommunityAutomations,
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
      ...payload,
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load Community OS automations.",
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
      | { automations?: CommunityAutomationRecord[] }
      | null;

    const automations = Array.isArray(body?.automations) ? body.automations : [];
    const payload = await saveProjectCommunityAutomations({
      projectId: access.projectId,
      authUserId: access.authUserId,
      automations,
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_automations",
      sourceId: access.projectId,
      action: "community_automations_updated",
      summary: `Community automations updated (${automations.length} automation definition${automations.length === 1 ? "" : "s"}).`,
      metadata: {
        updatedBy: access.authUserId,
        automationCount: automations.length,
      },
    });

    return NextResponse.json({
      ok: true,
      ...payload,
      message: "Community automations saved.",
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save Community OS automations.",
      },
      { status: 500 }
    );
  }
}
