"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  AdminSecurityAccountDetail,
  AdminSecurityOverview,
  PortalSecurityCurrentAccount,
} from "@/types/entities/security";

function getSupabaseClient() {
  return createClient();
}

async function getSupabaseAccessToken() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function loadClientSecuritySignal() {
  const supabase = getSupabaseClient();
  const [{ data: factors }, { data: assurance }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const verifiedFactorCount = Array.isArray((factors as any)?.totp)
    ? ((factors as any).totp as Array<unknown>).length
    : 0;
  const currentAal = assurance?.currentLevel ?? "aal1";
  const currentAuthenticationMethods = Array.isArray(assurance?.currentAuthenticationMethods)
    ? assurance.currentAuthenticationMethods
    : [];

  const authMethodHint = currentAuthenticationMethods.some((entry) => {
    if (typeof entry === "string") {
      return ["sso", "saml", "oidc"].includes(entry.toLowerCase());
    }

    if (
      entry &&
      typeof entry === "object" &&
      "method" in entry &&
      typeof (entry as { method?: unknown }).method === "string"
    ) {
      return ["sso", "saml", "oidc"].includes((entry as { method: string }).method.toLowerCase());
    }

    return false;
  })
    ? "sso"
    : "password";

  return {
    twoFactorEnabled: verifiedFactorCount > 0,
    verifiedFactorCount,
    currentAal,
    authMethodHint,
  };
}

async function readJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallback
    );
  }

  return payload as T;
}

function buildSecurityHeaders(accessToken: string, signal: Awaited<ReturnType<typeof loadClientSecuritySignal>>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "x-security-two-factor-enabled": String(signal.twoFactorEnabled),
    "x-security-verified-factor-count": String(signal.verifiedFactorCount),
    "x-security-current-aal": signal.currentAal,
    "x-security-auth-method": signal.authMethodHint,
  };
}

export async function fetchCurrentPortalSecurityAccount() {
  const [accessToken, signal] = await Promise.all([
    getSupabaseAccessToken(),
    loadClientSecuritySignal(),
  ]);

  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch("/api/security/account/current", {
    method: "GET",
    headers: buildSecurityHeaders(accessToken, signal),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    current: PortalSecurityCurrentAccount;
  }>(response, "Failed to load current security posture.");

  return payload.current;
}

export async function fetchSecurityOverview() {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch("/api/security/overview", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    overview: AdminSecurityOverview;
  }>(response, "Failed to load security overview.");

  return payload.overview;
}

export async function fetchSecurityAccountDetail(accountId: string) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/security/accounts/${accountId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    detail: AdminSecurityAccountDetail;
  }>(response, "Failed to load security account detail.");

  return payload.detail;
}

export async function createPortalDataRequest(input: {
  accountId: string;
  requestType: "export" | "delete";
  summary: string;
}) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/security/accounts/${input.accountId}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      requestType: input.requestType,
      summary: input.summary,
    }),
  });

  const payload = await readJsonResponse<{
    ok: true;
    request: PortalSecurityCurrentAccount["requests"][number];
  }>(response, "Failed to create data request.");

  return payload.request;
}

export async function updatePortalSecurityPolicy(input: {
  accountId: string;
  policy?: {
    ssoRequired?: boolean;
    twoFactorRequiredForAdmins?: boolean;
    sessionReviewRequired?: boolean;
    highRiskReauthRequired?: boolean;
    securityContactEmail?: string;
    notes?: string;
  };
  sso?: {
    providerLabel: string;
    supabaseProviderId?: string | null;
    domains: string[];
    enabled: boolean;
  };
}) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/security/accounts/${input.accountId}/policies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  return readJsonResponse<{
    ok: true;
    detail: AdminSecurityAccountDetail | PortalSecurityCurrentAccount;
  }>(response, "Failed to update security policy.");
}

export async function revokePortalSecuritySession(sessionId: string) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/security/sessions/${sessionId}/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return readJsonResponse<{
    ok: true;
    sessionId: string;
  }>(response, "Failed to revoke security session.");
}

export async function updatePortalDataRequest(input: {
  accountId: string;
  requestId: string;
  action: "review" | "request_verification" | "approve" | "reject" | "complete";
  reviewNotes?: string;
}) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/security/accounts/${input.accountId}/requests`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{
    ok: true;
    request: PortalSecurityCurrentAccount["requests"][number];
  }>(response, "Failed to update data request.");

  return payload.request;
}
