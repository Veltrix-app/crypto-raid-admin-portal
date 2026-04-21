import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { loadInternalTrustCaseDetail, listInternalTrustCaseEvents } from "@/lib/trust/internal-trust-cases";
import {
  applyInternalTrustCaseAction,
  type TrustCaseAction,
  TRUST_CASE_ACTIONS,
} from "@/lib/trust/trust-actions";

function isTrustCaseAction(value: string): value is TrustCaseAction {
  return (TRUST_CASE_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const access = await assertInternalTrustAccess();
    const { caseId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isTrustCaseAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid trust action." }, { status: 400 });
    }

    await applyInternalTrustCaseAction({
      caseId,
      actorAuthUserId: access.authUserId,
      actorRole: access.adminRole,
      action: body.action,
      notes: body.notes ?? null,
    });

    const [trustCase, events] = await Promise.all([
      loadInternalTrustCaseDetail(caseId),
      listInternalTrustCaseEvents(caseId),
    ]);

    return NextResponse.json({
      ok: true,
      trustCase,
      events,
      message: "Trust action applied.",
    });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to apply trust action.");
  }
}
