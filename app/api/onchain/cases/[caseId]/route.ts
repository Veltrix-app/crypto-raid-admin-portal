import { NextResponse } from "next/server";
import {
  assertInternalOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import { loadInternalOnchainCaseDetail } from "@/lib/onchain/internal-onchain-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    await assertInternalOnchainAccess();
    const { caseId } = await context.params;
    const onchainCase = await loadInternalOnchainCaseDetail(caseId);

    if (!onchainCase) {
      return NextResponse.json({ ok: false, error: "On-chain case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, onchainCase });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to load on-chain case.");
  }
}
