import { NextResponse } from "next/server";
import {
  assertProjectTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { loadProjectTrustCaseDetail } from "@/lib/trust/project-trust-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectTrustAccess(id);
    const trustCase = await loadProjectTrustCaseDetail(caseId, access);

    if (!trustCase) {
      return NextResponse.json({ ok: false, error: "Trust case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, trustCase });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load project trust case.");
  }
}
