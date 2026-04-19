import { NextResponse } from "next/server";
import { assertProjectCommunityAccess, ProjectCommunityAccessError } from "@/lib/community/project-community-auth";
import { loadProjectCommunityGrowth } from "@/lib/community/project-community-insights";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();

    await assertProjectCommunityAccess(projectId ?? "");
    const payload = await loadProjectCommunityGrowth(projectId ?? "");

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
          error instanceof Error ? error.message : "Failed to load community growth insights.",
      },
      { status: 500 }
    );
  }
}
