import { NextResponse } from "next/server";
import {
  assertProjectAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import {
  listProjectOperationIncidents,
  resolveProjectOperationIncident,
} from "@/lib/platform/core-ops";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim();
    const incidents = await listProjectOperationIncidents(id);

    return NextResponse.json({
      ok: true,
      incidents: status ? incidents.filter((incident) => incident.status === status) : incidents,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to load incidents.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const body = (await request.json().catch(() => null)) as
      | { incidentId?: string; status?: "watching" | "resolved" | "dismissed" }
      | null;

    const incidentId = typeof body?.incidentId === "string" ? body.incidentId.trim() : "";
    const status = body?.status;
    if (!incidentId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing incidentId or status." },
        { status: 400 }
      );
    }

    const incident = await resolveProjectOperationIncident({ incidentId, status });
    return NextResponse.json({ ok: true, incident });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to update incident.");
  }
}
