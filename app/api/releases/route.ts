import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { createDraftRelease } from "@/lib/release/release-actions";
import { loadReleaseOverview } from "@/lib/release/release-overview";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);

    const overview = await loadReleaseOverview();

    return NextResponse.json(
      {
        ok: true,
        overview,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load release overview.";
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

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);

    const body = await request.json().catch(() => ({}));
    const detail = await createDraftRelease(authenticatedUser.user.id, body ?? {});

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
      error instanceof Error ? error.message : "Failed to create draft release.";
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

