import { NextResponse } from "next/server";
import {
  assertInternalPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import { listInternalPayoutCases } from "@/lib/payout/internal-payout-cases";

export async function GET() {
  try {
    await assertInternalPayoutAccess();
    const cases = await listInternalPayoutCases();
    return NextResponse.json({ ok: true, cases });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load payout cases.");
  }
}
