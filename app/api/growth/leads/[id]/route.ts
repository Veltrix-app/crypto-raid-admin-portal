import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalGrowthAccess,
  loadGrowthLeadDetail,
} from "@/lib/growth/growth-overview";
import { updateCommercialLead } from "@/lib/growth/growth-actions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await assertInternalGrowthAccess(request);
    const { id } = await context.params;
    const detail = await loadGrowthLeadDetail(id);

    return NextResponse.json(
      { ok: true, detail },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load lead detail.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : message === "Commercial lead not found."
            ? 404
            : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await assertInternalGrowthAccess(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          leadState?: string;
          ownerAuthUserId?: string | null;
          qualificationSummary?: string;
          intentSummary?: string;
        }
      | null;

    const lead = await updateCommercialLead({
      leadId: id,
      actorAuthUserId: authenticatedUser.user.id,
      leadState: body?.leadState,
      ownerAuthUserId: body?.ownerAuthUserId,
      qualificationSummary: body?.qualificationSummary,
      intentSummary: body?.intentSummary,
    });

    return NextResponse.json(
      { ok: true, lead },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead detail.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
