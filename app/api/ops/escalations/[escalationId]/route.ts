import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalSupportAccess,
  getSupportEscalationById,
  updateSupportEscalation,
  type SupportEscalationStatus,
  type SupportEscalationWaitingOn,
} from "@/lib/support/escalations";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ escalationId: string }> }
) {
  try {
    const access = await assertInternalSupportAccess();
    const { escalationId } = await context.params;
    const escalation = await getSupportEscalationById(escalationId, access.authUserId);

    if (!escalation) {
      return NextResponse.json({ ok: false, error: "Support escalation not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, escalation });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load support escalation.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ escalationId: string }> }
) {
  try {
    const access = await assertInternalSupportAccess();
    const { escalationId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: SupportEscalationStatus;
      waitingOn?: SupportEscalationWaitingOn;
      nextActionSummary?: string | null;
      resolutionNotes?: string | null;
    };

    const escalation = await updateSupportEscalation(escalationId, access.authUserId, {
      status: body.status,
      waitingOn: body.waitingOn,
      nextActionSummary: body.nextActionSummary,
      resolutionNotes: body.resolutionNotes,
    });

    if (!escalation) {
      return NextResponse.json({ ok: false, error: "Support escalation not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, escalation });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update support escalation.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}
