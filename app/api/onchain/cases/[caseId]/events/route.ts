import { NextResponse } from "next/server";
import {
  assertInternalOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import { listInternalOnchainCaseEvents } from "@/lib/onchain/internal-onchain-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalOnchainAccess();
    const { caseId } = await context.params;
    const events = await listInternalOnchainCaseEvents(caseId);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to load on-chain case timeline.");
  }
}
