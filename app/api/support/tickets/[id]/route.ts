import { NextRequest, NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import {
  addSupportCustomerUpdate,
  addSupportInternalNote,
  changeSupportTicketStatus,
  claimSupportTicket,
  createSupportTicketHandoff,
  loadSupportTicketDetail,
} from "@/lib/support/support-queue";
import type {
  AdminSupportHandoffType,
  AdminSupportTicketStatus,
  AdminSupportWaitingState,
} from "@/types/entities/support";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await assertInternalSupportAccess();
    const { id } = await context.params;
    const ticket = await loadSupportTicketDetail(id);

    if (!ticket) {
      return NextResponse.json({ ok: false, error: "Support ticket not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ticket }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load support ticket.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const access = await assertInternalSupportAccess();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          action?:
            | "claim"
            | "change_status"
            | "internal_note"
            | "customer_update"
            | "handoff";
          status?: AdminSupportTicketStatus;
          waitingState?: AdminSupportWaitingState;
          note?: string;
          handoffType?: AdminSupportHandoffType;
          summary?: string;
          customerAccountId?: string | null;
          targetProjectId?: string | null;
          targetRecordId?: string | null;
        }
      | null;

    let ticket = null;

    switch (body?.action) {
      case "claim":
        ticket = await claimSupportTicket(id, access.authUserId);
        break;
      case "change_status":
        if (!body.status) {
          return NextResponse.json({ ok: false, error: "Choose a support status." }, { status: 400 });
        }
        ticket = await changeSupportTicketStatus({
          ticketId: id,
          actorAuthUserId: access.authUserId,
          status: body.status,
          waitingState: body.waitingState,
        });
        break;
      case "internal_note":
        ticket = await addSupportInternalNote({
          ticketId: id,
          actorAuthUserId: access.authUserId,
          body: body.note ?? "",
        });
        break;
      case "customer_update":
        ticket = await addSupportCustomerUpdate({
          ticketId: id,
          actorAuthUserId: access.authUserId,
          body: body.note ?? "",
        });
        break;
      case "handoff":
        if (!body.handoffType) {
          return NextResponse.json({ ok: false, error: "Choose a handoff target." }, { status: 400 });
        }
        ticket = await createSupportTicketHandoff({
          ticketId: id,
          actorAuthUserId: access.authUserId,
          handoffType: body.handoffType,
          summary: body.summary ?? "",
          customerAccountId: body.customerAccountId ?? null,
          targetProjectId: body.targetProjectId ?? null,
          targetRecordId: body.targetRecordId ?? null,
        });
        break;
      default:
        return NextResponse.json({ ok: false, error: "Unknown support ticket action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update support ticket.";
    const status =
      message.includes("cannot be empty") || message.includes("Choose ")
        ? 400
        : error instanceof Error && "status" in error
          ? Number(error.status) || 500
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
