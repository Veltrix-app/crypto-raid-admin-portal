import { NextResponse } from "next/server";
import { createProjectCommunityAccessErrorResponse } from "@/lib/community/project-community-auth";
import { loadProjectCommunityRecommendations } from "@/lib/community/project-community-v5";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = await loadProjectCommunityRecommendations(id?.trim() ?? "");

    return NextResponse.json({
      ok: true,
      ...payload,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to load community recommendations."
    );
  }
}
