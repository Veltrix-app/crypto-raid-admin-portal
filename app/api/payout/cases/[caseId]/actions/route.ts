import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import {
  applyInternalPayoutCaseAction,
  type PayoutCaseAction,
  PAYOUT_CASE_ACTIONS,
} from "@/lib/payout/payout-actions";
import {
  loadInternalPayoutCaseDetail,
  listInternalPayoutCaseEvents,
} from "@/lib/payout/internal-payout-cases";
import { syncPayoutCaseSources } from "@/lib/payout/payout-case-sync";

function isPayoutCaseAction(value: string): value is PayoutCaseAction {
  return (PAYOUT_CASE_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const access = await assertInternalPayoutAccess();
    const { caseId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isPayoutCaseAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid payout action." }, { status: 400 });
    }

    const result = await applyInternalPayoutCaseAction({
      caseId,
      actorAuthUserId: access.authUserId,
      actorRole: access.adminRole,
      action: body.action,
      notes: body.notes ?? null,
    });

    await syncPayoutCaseSources(result.projectId);

    const [payoutCase, events] = await Promise.all([
      loadInternalPayoutCaseDetail(caseId),
      listInternalPayoutCaseEvents(caseId),
    ]);

    return NextResponse.json({
      ok: true,
      payoutCase,
      events,
      message: "Payout action applied.",
    });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to apply payout action.");
  }
}
