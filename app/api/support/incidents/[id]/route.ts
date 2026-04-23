import { NextRequest, NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import { loadServiceIncidentDetail, runIncidentAction } from "@/lib/support/incident-command";
import type {
  AdminServiceIncidentState,
  AdminServiceStatusLevel,
} from "@/types/entities/support";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await assertInternalSupportAccess();
    const { id } = await context.params;
    const incident = await loadServiceIncidentDetail(id);

    if (!incident) {
      return NextResponse.json({ ok: false, error: "Incident not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, incident }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load incident detail.",
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
          action?: "state_transition" | "public_update" | "internal_note";
          title?: string;
          message?: string;
          state?: AdminServiceIncidentState;
          componentStatus?: AdminServiceStatusLevel;
        }
      | null;

    if (!body?.action) {
      return NextResponse.json({ ok: false, error: "Choose an incident action." }, { status: 400 });
    }

    const incident = await runIncidentAction({
      incidentId: id,
      actorAuthUserId: access.authUserId,
      action: body.action,
      title: body.title,
      message: body.message ?? "",
      state: body.state,
      componentStatus: body.componentStatus,
    });

    return NextResponse.json({ ok: true, incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update incident.";
    const status =
      message.includes("need a message") || message === "Choose an incident action."
        ? 400
        : error instanceof Error && "status" in error
          ? Number(error.status) || 500
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
