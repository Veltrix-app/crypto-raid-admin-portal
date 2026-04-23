import { NextRequest, NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import { createServiceIncident, listServiceIncidents } from "@/lib/support/incident-command";
import type {
  AdminServiceIncidentImpactScope,
  AdminServiceIncidentSeverity,
} from "@/types/entities/support";

export async function GET(request: NextRequest) {
  try {
    await assertInternalSupportAccess();
    const includeResolved = request.nextUrl.searchParams.get("includeResolved") === "true";
    const incidents = await listServiceIncidents({ includeResolved });

    return NextResponse.json(
      {
        ok: true,
        incidents,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load incidents.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await assertInternalSupportAccess();
    const body = (await request.json().catch(() => null)) as
      | {
          title?: string;
          componentKey?: string;
          severity?: AdminServiceIncidentSeverity;
          impactScope?: AdminServiceIncidentImpactScope;
          publicSummary?: string;
          internalSummary?: string;
        }
      | null;

    const incident = await createServiceIncident({
      actorAuthUserId: access.authUserId,
      title: body?.title ?? "",
      componentKey: body?.componentKey ?? "platform",
      severity: body?.severity ?? "major",
      impactScope: body?.impactScope ?? "degraded",
      publicSummary: body?.publicSummary ?? "",
      internalSummary: body?.internalSummary ?? "",
      publicVisible: true,
    });

    return NextResponse.json({ ok: true, incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create incident.";
    const status =
      message === "Incidents need a title, public summary and internal summary."
        ? 400
        : error instanceof Error && "status" in error
          ? Number(error.status) || 500
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
