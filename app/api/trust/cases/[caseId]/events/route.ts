import { NextResponse } from "next/server";
import {
  assertInternalTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { listInternalTrustCaseEvents } from "@/lib/trust/internal-trust-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalTrustAccess();
    const { caseId } = await context.params;
    const events = await listInternalTrustCaseEvents(caseId);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load trust case timeline.");
  }
}
