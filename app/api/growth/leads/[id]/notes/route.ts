import { NextRequest, NextResponse } from "next/server";
import { addCommercialLeadNote } from "@/lib/growth/growth-actions";
import { assertInternalGrowthAccess } from "@/lib/growth/growth-overview";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await assertInternalGrowthAccess(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          noteType?: string;
          title?: string;
          body?: string;
        }
      | null;

    const note = await addCommercialLeadNote({
      leadId: id,
      actorAuthUserId: authenticatedUser.user.id,
      noteType: body?.noteType,
      title: body?.title ?? "",
      body: body?.body ?? "",
    });

    return NextResponse.json(
      { ok: true, note },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add lead note.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
