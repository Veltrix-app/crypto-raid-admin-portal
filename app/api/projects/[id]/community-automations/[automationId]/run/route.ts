import { NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import { runProjectCommunityAutomation } from "@/lib/community/project-community-execution";
import { writeProjectCommunityAuditLog } from "@/lib/community/project-community-ops";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; automationId: string }> }
) {
  try {
    const { id, automationId } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const payload = await runProjectCommunityAutomation({
      projectId: access.projectId,
      automationId: automationId?.trim() ?? "",
      authUserId: access.authUserId,
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_automations",
      sourceId: automationId?.trim() ?? access.projectId,
      action: "community_automation_triggered",
      summary: "Triggered a Community OS automation run from the portal.",
      metadata: {
        updatedBy: access.authUserId,
        result: payload,
      },
    });

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
          error instanceof Error ? error.message : "Failed to run Community OS automation.",
      },
      { status: 500 }
    );
  }
}
