import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { updateEnvironmentAudit } from "@/lib/release/release-actions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (typeof body?.auditId !== "string") {
      throw new Error("auditId is required.");
    }

    const detail = await updateEnvironmentAudit({
      releaseId: id,
      auditId: body.auditId,
      status: body.status,
      summary: body.summary,
      missingKeys: body.missingKeys,
      mismatchNotes: body.mismatchNotes,
      authUserId: authenticatedUser.user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        detail,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update environment audit.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}

