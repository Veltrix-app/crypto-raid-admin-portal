import { NextResponse } from "next/server";
import {
  assertInternalPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import { listInternalPayoutCaseEvents } from "@/lib/payout/internal-payout-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalPayoutAccess();
    const { caseId } = await context.params;
    const events = await listInternalPayoutCaseEvents(caseId);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load payout case timeline.");
  }
}
