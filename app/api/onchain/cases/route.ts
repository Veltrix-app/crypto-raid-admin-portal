import { NextResponse } from "next/server";
import {
  assertInternalOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import { listInternalOnchainCases } from "@/lib/onchain/internal-onchain-cases";

export async function GET() {
  try {
    await assertInternalOnchainAccess();
    const cases = await listInternalOnchainCases();
    return NextResponse.json({ ok: true, cases });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to load on-chain cases.");
  }
}
