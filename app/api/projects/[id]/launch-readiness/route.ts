import { NextResponse } from "next/server";
import { createProjectCommunityAccessErrorResponse } from "@/lib/community/project-community-auth";
import { loadProjectLaunchWorkspaceSnapshot } from "@/lib/projects/project-launch-readiness";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = await loadProjectLaunchWorkspaceSnapshot(id?.trim() ?? "");

    return NextResponse.json({
      ok: true,
      ...payload,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to load project launch readiness."
    );
  }
}
