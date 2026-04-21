import { NextResponse } from "next/server";
import {
  assertInternalPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import { loadInternalPayoutCaseDetail } from "@/lib/payout/internal-payout-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalPayoutAccess();
    const { caseId } = await context.params;
    const payoutCase = await loadInternalPayoutCaseDetail(caseId);

    if (!payoutCase) {
      return NextResponse.json({ ok: false, error: "Payout case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, payoutCase });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load payout case.");
  }
}
