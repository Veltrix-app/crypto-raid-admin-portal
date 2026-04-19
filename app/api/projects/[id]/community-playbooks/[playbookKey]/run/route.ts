import { NextResponse } from "next/server";
import { type CommunityPlaybookKey } from "@/components/community/community-config";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import { runProjectCommunityPlaybook } from "@/lib/community/project-community-execution";
import { writeProjectCommunityAuditLog } from "@/lib/community/project-community-ops";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; playbookKey: string }> }
) {
  try {
    const { id, playbookKey } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const normalizedPlaybookKey = (playbookKey?.trim() ?? "") as CommunityPlaybookKey;
    const payload = await runProjectCommunityPlaybook({
      projectId: access.projectId,
      playbookKey: normalizedPlaybookKey,
      authUserId: access.authUserId,
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_playbook_runs",
      sourceId: normalizedPlaybookKey,
      action: "community_playbook_triggered",
      summary: `Triggered Community OS playbook ${normalizedPlaybookKey}.`,
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
        error: error instanceof Error ? error.message : "Failed to run community playbook.",
      },
      { status: 500 }
    );
  }
}
