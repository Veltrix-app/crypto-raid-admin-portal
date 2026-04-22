import { NextRequest, NextResponse } from "next/server";
import { bootstrapCustomerAccountForUser } from "@/lib/accounts/account-bootstrap";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const body = await request.json().catch(() => null);
    const requestedName =
      typeof body?.accountName === "string" && body.accountName.trim().length > 0
        ? body.accountName.trim()
        : null;

    const result = await bootstrapCustomerAccountForUser({
      authUserId: authenticatedUser.user.id,
      normalizedEmail: authenticatedUser.normalizedEmail,
      displayName: authenticatedUser.displayName,
      requestedName,
      emailConfirmed: Boolean(
        authenticatedUser.user.email_confirmed_at ?? authenticatedUser.user.confirmed_at
      ),
    });

    return NextResponse.json(
      {
        ok: true,
        created: result.created,
        account: result.account,
        overview: result.overview,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bootstrap customer account.";
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
