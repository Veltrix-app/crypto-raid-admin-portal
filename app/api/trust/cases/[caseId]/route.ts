import { NextResponse } from "next/server";
import {
  assertInternalTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { loadInternalTrustCaseDetail } from "@/lib/trust/internal-trust-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalTrustAccess();
    const { caseId } = await context.params;
    const trustCase = await loadInternalTrustCaseDetail(caseId);

    if (!trustCase) {
      return NextResponse.json({ ok: false, error: "Trust case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, trustCase });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load trust case.");
  }
}
