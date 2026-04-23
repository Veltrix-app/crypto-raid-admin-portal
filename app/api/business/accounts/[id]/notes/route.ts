import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import {
  createBusinessNote,
  loadBusinessAccountNotes,
} from "@/lib/billing/business-actions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;

    const notes = await loadBusinessAccountNotes(id);

    return NextResponse.json(
      {
        ok: true,
        notes,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load business notes.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          noteType?: "general" | "upgrade_candidate" | "churn_risk" | "follow_up" | "billing_exception";
          title?: string;
          body?: string;
          ownerAuthUserId?: string | null;
        }
      | null;

    const note = await createBusinessNote({
      customerAccountId: id,
      authorAuthUserId: authenticatedUser.user.id,
      noteType: body?.noteType ?? "general",
      title: body?.title ?? "",
      body: body?.body ?? "",
      ownerAuthUserId: body?.ownerAuthUserId ?? null,
    });

    return NextResponse.json({
      ok: true,
      note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create business note.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : message === "A business note needs both a title and a body."
            ? 400
            : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
