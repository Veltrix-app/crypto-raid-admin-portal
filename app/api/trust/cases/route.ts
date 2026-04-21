import { NextResponse } from "next/server";
import {
  assertInternalTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { listInternalTrustCases } from "@/lib/trust/internal-trust-cases";

export async function GET() {
  try {
    await assertInternalTrustAccess();
    const cases = await listInternalTrustCases();
    return NextResponse.json({ ok: true, cases });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load trust cases.");
  }
}
