import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalSupportAccess,
  listSupportEscalations,
  summarizeSupportEscalations,
} from "@/lib/support/escalations";

export async function GET(request: NextRequest) {
  try {
    const access = await assertInternalSupportAccess();
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim() || null;
    const sourceSurface = request.nextUrl.searchParams.get("sourceSurface")?.trim() || null;
    const includeResolved = request.nextUrl.searchParams.get("includeResolved") === "true";

    const escalations = await listSupportEscalations({
      projectId,
      sourceSurface,
      includeResolved,
      viewerAuthUserId: access.authUserId,
    });

    return NextResponse.json({
      ok: true,
      viewerAuthUserId: access.authUserId,
      escalations,
      summary: summarizeSupportEscalations(escalations),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load support escalations.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}
