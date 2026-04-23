import { derivePrimaryAuthMethodFromAmr } from "@/lib/security/security-contract";
import type { AdminAuthenticatorAssuranceLevel } from "@/types/entities/security";

type DecodedSessionPayload = {
  sessionId: string | null;
  currentAal: AdminAuthenticatorAssuranceLevel;
  amrMethods: string[];
  primaryAuthMethod: "password" | "sso" | "unknown";
  exp: number | null;
  iat: number | null;
};

function decodeBase64UrlSegment(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

export function decodeAccessTokenPayload(accessToken: string | null | undefined) {
  if (!accessToken) {
    return null;
  }

  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = decodeBase64UrlSegment(parts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeSessionAmrMethods(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim().toLowerCase();
      }

      if (
        entry &&
        typeof entry === "object" &&
        "method" in entry &&
        typeof (entry as { method?: unknown }).method === "string"
      ) {
        return ((entry as { method: string }).method ?? "").trim().toLowerCase();
      }

      return "";
    })
    .filter((entry) => entry.length > 0);
}

export function readAccessTokenSecurityState(
  accessToken: string | null | undefined
): DecodedSessionPayload {
  const payload = decodeAccessTokenPayload(accessToken);
  const currentAal =
    payload?.aal === "aal2" ? ("aal2" as const) : ("aal1" as const);
  const amrMethods = normalizeSessionAmrMethods(payload?.amr);

  return {
    sessionId: typeof payload?.session_id === "string" ? payload.session_id : null,
    currentAal,
    amrMethods,
    primaryAuthMethod: derivePrimaryAuthMethodFromAmr(amrMethods),
    exp: typeof payload?.exp === "number" ? payload.exp : null,
    iat: typeof payload?.iat === "number" ? payload.iat : null,
  };
}

export function getForwardedIpSummary(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const firstIp = forwardedFor
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);

  return firstIp ?? null;
}

export function getUserAgentSummary(headers: Headers) {
  const userAgent = headers.get("user-agent");
  return userAgent?.trim() || null;
}
