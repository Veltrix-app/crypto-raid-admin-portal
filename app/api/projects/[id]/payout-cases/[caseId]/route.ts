import { NextResponse } from "next/server";
import {
  assertProjectPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import { loadProjectPayoutCaseDetail } from "@/lib/payout/project-payout-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectPayoutAccess(id);
    const payoutCase = await loadProjectPayoutCaseDetail(caseId, access);

    if (!payoutCase) {
      return NextResponse.json({ ok: false, error: "Payout case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, payoutCase });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load project payout case.");
  }
}
