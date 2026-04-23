import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import {
  resolveSecurityAccountAccessByAuthUserId,
  updateAccountSecurityPolicy,
} from "@/lib/security/security-policies";
import { upsertAccountSsoConnection } from "@/lib/security/sso-connections";
import {
  loadCurrentPortalSecurityAccount,
  loadSecurityAccountDetail,
} from "@/lib/security/security-overview";
import type { AdminSecurityAccountPolicy } from "@/types/entities/security";

type PolicyPayload = Partial<
  Pick<
    AdminSecurityAccountPolicy,
    | "ssoRequired"
    | "twoFactorRequiredForAdmins"
    | "sessionReviewRequired"
    | "highRiskReauthRequired"
    | "securityContactEmail"
    | "notes"
  >
>;

type SsoPayload = {
  providerLabel: string;
  supabaseProviderId?: string | null;
  domains: string[];
  enabled: boolean;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePolicyPayload(value: unknown): PolicyPayload | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid policy payload.");
  }

  const raw = value as Record<string, unknown>;
  const policy: PolicyPayload = {};

  const booleanKeys = [
    "ssoRequired",
    "twoFactorRequiredForAdmins",
    "sessionReviewRequired",
    "highRiskReauthRequired",
  ] as const;

  for (const key of booleanKeys) {
    if (raw[key] == null) {
      continue;
    }

    if (typeof raw[key] !== "boolean") {
      throw new Error(`Invalid policy field: ${key}.`);
    }

    policy[key] = raw[key];
  }

  if (raw.securityContactEmail != null) {
    const email = asTrimmedString(raw.securityContactEmail);
    if (!email || !isValidEmail(email)) {
      throw new Error("Security contact email must be a valid email address.");
    }

    policy.securityContactEmail = email;
  }

  if (raw.notes != null) {
    const notes = asTrimmedString(raw.notes);
    if (notes.length > 1200) {
      throw new Error("Security notes are too long.");
    }

    policy.notes = notes;
  }

  return policy;
}

function parseSsoPayload(value: unknown): SsoPayload | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid SSO payload.");
  }

  const raw = value as Record<string, unknown>;
  const providerLabel = asTrimmedString(raw.providerLabel);
  if (providerLabel.length < 2 || providerLabel.length > 120) {
    throw new Error("SSO provider label must be between 2 and 120 characters.");
  }

  if (typeof raw.enabled !== "boolean") {
    throw new Error("SSO enabled flag is required.");
  }

  if (!Array.isArray(raw.domains)) {
    throw new Error("SSO domains must be an array.");
  }

  const domains = raw.domains
    .map((domain) => asTrimmedString(domain))
    .filter(Boolean);

  if (domains.length === 0 || domains.length > 10) {
    throw new Error("SSO must include between 1 and 10 domains.");
  }

  if (domains.some((domain) => domain.length < 3 || domain.length > 255)) {
    throw new Error("SSO domains must be between 3 and 255 characters.");
  }

  const supabaseProviderId =
    raw.supabaseProviderId == null ? null : asTrimmedString(raw.supabaseProviderId);

  if (supabaseProviderId && supabaseProviderId.length > 255) {
    throw new Error("SSO provider id is too long.");
  }

  return {
    providerLabel,
    supabaseProviderId,
    domains,
    enabled: raw.enabled,
  };
}

function parseBody(body: unknown) {
  if (typeof body !== "object" || body == null || Array.isArray(body)) {
    throw new Error("Invalid request payload.");
  }

  const raw = body as Record<string, unknown>;

  return {
    policy: parsePolicyPayload(raw.policy),
    sso: parseSsoPayload(raw.sso),
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const { id } = await context.params;
    const access = await resolveSecurityAccountAccessByAuthUserId({
      accountId: id,
      authUserId: authenticatedUser.user.id,
    });

    if (!access.isInternalAdmin && !["owner", "admin"].includes(access.membershipRole ?? "")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Security access denied.",
        },
        { status: 403 }
      );
    }

    const body = parseBody(await request.json());

    if (body.policy) {
      await updateAccountSecurityPolicy({
        accountId: id,
        actorAuthUserId: authenticatedUser.user.id,
        policy: body.policy,
      });
    }

    if (body.sso) {
      await upsertAccountSsoConnection({
        accountId: id,
        actorAuthUserId: authenticatedUser.user.id,
        providerLabel: body.sso.providerLabel,
        supabaseProviderId: body.sso.supabaseProviderId ?? null,
        domains: body.sso.domains,
        enabled: body.sso.enabled,
      });
    }

    if (access.isInternalAdmin) {
      const detail = await loadSecurityAccountDetail(id);
      return NextResponse.json({
        ok: true,
        detail,
      });
    }

    const current = await loadCurrentPortalSecurityAccount({
      authUserId: authenticatedUser.user.id,
    });

    return NextResponse.json({
      ok: true,
      detail: current,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update security policy.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Security access denied."
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
