import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { updateReleaseRun } from "@/lib/release/release-actions";
import { loadReleaseDetail } from "@/lib/release/release-overview";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;

    const detail = await loadReleaseDetail(id);

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
    const message = error instanceof Error ? error.message : "Failed to load release detail.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const detail = await updateReleaseRun(id, authenticatedUser.user.id, body ?? {});

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
    const message = error instanceof Error ? error.message : "Failed to update release.";
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

