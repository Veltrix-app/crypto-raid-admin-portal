import { NextResponse } from "next/server";
import {
  assertProjectOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import { loadProjectOnchainCaseDetail } from "@/lib/onchain/project-onchain-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectOnchainAccess(id);
    const onchainCase = await loadProjectOnchainCaseDetail(caseId, access);

    if (!onchainCase) {
      return NextResponse.json({ ok: false, error: "On-chain case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, onchainCase });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to load project on-chain case.");
  }
}
