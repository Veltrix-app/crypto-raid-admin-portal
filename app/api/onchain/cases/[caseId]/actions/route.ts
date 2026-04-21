import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import {
  loadInternalOnchainCaseDetail,
  listInternalOnchainCaseEvents,
} from "@/lib/onchain/internal-onchain-cases";
import {
  applyInternalOnchainCaseAction,
  type OnchainCaseAction,
  ONCHAIN_CASE_ACTIONS,
} from "@/lib/onchain/onchain-actions";

function isOnchainCaseAction(value: string): value is OnchainCaseAction {
  return (ONCHAIN_CASE_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const access = await assertInternalOnchainAccess();
    const { caseId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isOnchainCaseAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid on-chain action." }, { status: 400 });
    }

    await applyInternalOnchainCaseAction({
      caseId,
      actorAuthUserId: access.authUserId,
      actorRole: access.adminRole,
      action: body.action,
      notes: body.notes ?? null,
    });

    const [onchainCase, events] = await Promise.all([
      loadInternalOnchainCaseDetail(caseId),
      listInternalOnchainCaseEvents(caseId),
    ]);

    return NextResponse.json({
      ok: true,
      onchainCase,
      events,
      message: "On-chain action applied.",
    });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to apply on-chain action.");
  }
}
