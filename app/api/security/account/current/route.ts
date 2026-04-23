import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import { resolvePrimarySecurityAccountForUser } from "@/lib/security/security-policies";
import { syncPortalSecurityState } from "@/lib/security/session-review";
import { loadCurrentPortalSecurityAccount } from "@/lib/security/security-overview";

function parseBoolHeader(value: string | null) {
  return value === "true";
}

function parseIntHeader(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const accountContext = await resolvePrimarySecurityAccountForUser(authenticatedUser.user.id);

    await syncPortalSecurityState({
      accessToken: authenticatedUser.accessToken,
      authUserId: authenticatedUser.user.id,
      email: authenticatedUser.email,
      accountId: accountContext?.accountId ?? null,
      headers: request.headers,
      twoFactorEnabled: parseBoolHeader(request.headers.get("x-security-two-factor-enabled")),
      verifiedFactorCount: parseIntHeader(request.headers.get("x-security-verified-factor-count")),
      currentAal:
        request.headers.get("x-security-current-aal") === "aal2" ? "aal2" : "aal1",
      authMethodHint:
        request.headers.get("x-security-auth-method") === "sso" ? "sso" : "password",
    });

    const current = await loadCurrentPortalSecurityAccount({
      authUserId: authenticatedUser.user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        current,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load current security posture.";
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
