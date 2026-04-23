import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { updateReleaseCheck } from "@/lib/release/release-actions";

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

    if (typeof body?.checkId !== "string" || typeof body?.result !== "string") {
      throw new Error("checkId and result are required.");
    }

    const detail = await updateReleaseCheck({
      releaseId: id,
      checkId: body.checkId,
      result: body.result,
      summary: body.summary,
      nextAction: body.nextAction,
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
    const message = error instanceof Error ? error.message : "Failed to update release check.";
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

