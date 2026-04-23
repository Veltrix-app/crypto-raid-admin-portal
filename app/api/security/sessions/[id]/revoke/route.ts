import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { resolveSecurityAccountAccessByAuthUserId } from "@/lib/security/security-policies";
import { revokeSecuritySession } from "@/lib/security/session-review";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const { id } = await context.params;
    const supabase = getAccountsServiceClient();
    const { data: session, error: sessionError } = await supabase
      .from("auth_sessions")
      .select("id, auth_user_id, customer_account_id")
      .eq("id", id)
      .maybeSingle();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (!session?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Security session was not found.",
        },
        { status: 404 }
      );
    }

    const isOwnSession = session.auth_user_id === authenticatedUser.user.id;
    let allowed = isOwnSession;

    if (!allowed && session.customer_account_id) {
      const access = await resolveSecurityAccountAccessByAuthUserId({
        accountId: session.customer_account_id,
        authUserId: authenticatedUser.user.id,
      });

      allowed =
        access.isInternalAdmin || ["owner", "admin"].includes(access.membershipRole ?? "");
    }

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Security access denied.",
        },
        { status: 403 }
      );
    }

    await revokeSecuritySession({
      authSessionId: id,
      actorAuthUserId: authenticatedUser.user.id,
    });

    return NextResponse.json({
      ok: true,
      sessionId: id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke security session.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Security access denied."
          ? 403
          : message === "Security session was not found."
            ? 404
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
