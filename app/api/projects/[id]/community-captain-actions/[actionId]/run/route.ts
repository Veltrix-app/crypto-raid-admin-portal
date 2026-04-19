import { NextResponse } from "next/server";
import { createProjectCommunityAccessErrorResponse } from "@/lib/community/project-community-auth";
import { runProjectCommunityCaptainAction } from "@/lib/community/project-community-v5";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const { id, actionId } = await context.params;
    const payload = await runProjectCommunityCaptainAction({
      projectId: id?.trim() ?? "",
      actionId: actionId?.trim() ?? "",
    });

    return NextResponse.json({
      ok: true,
      ...payload,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to run community captain action."
    );
  }
}
