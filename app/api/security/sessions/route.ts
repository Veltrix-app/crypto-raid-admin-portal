import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import { loadSessionsForUser } from "@/lib/security/session-review";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const sessions = await loadSessionsForUser(authenticatedUser.user.id);

    return NextResponse.json(
      {
        ok: true,
        sessions,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load security sessions.";
    const status = message === "Missing bearer token." || message === "Invalid session." ? 401 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
