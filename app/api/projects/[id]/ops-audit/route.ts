import { NextResponse } from "next/server";
import {
  assertProjectAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import { listProjectOperationAudits } from "@/lib/platform/core-ops";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const audits = await listProjectOperationAudits(id);
    return NextResponse.json({ ok: true, audits });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to load audit history.");
  }
}
