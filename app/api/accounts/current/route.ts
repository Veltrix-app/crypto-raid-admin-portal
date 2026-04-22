import { NextRequest, NextResponse } from "next/server";
import {
  loadCustomerAccountOverviewForUser,
} from "@/lib/accounts/account-bootstrap";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const overview = await loadCustomerAccountOverviewForUser({
      authUserId: authenticatedUser.user.id,
      normalizedEmail: authenticatedUser.normalizedEmail,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          authUserId: authenticatedUser.user.id,
          email: authenticatedUser.email,
          displayName: authenticatedUser.displayName,
        },
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
      error instanceof Error ? error.message : "Failed to load current customer account.";
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
