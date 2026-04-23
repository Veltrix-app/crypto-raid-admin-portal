import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import {
  getForwardedIpSummary,
  getUserAgentSummary,
  readAccessTokenSecurityState,
} from "@/lib/auth/session";
import type {
  DbAuthSession,
  DbUserSecurityPosture,
} from "@/types/database";
import type {
  AdminAuthenticatorAssuranceLevel,
  AdminSecuritySession,
  AdminUserSecurityPosture,
} from "@/types/entities/security";

function shapeUserSecurityPosture(row: DbUserSecurityPosture): AdminUserSecurityPosture {
  return {
    authUserId: row.auth_user_id,
    primaryCustomerAccountId: row.primary_customer_account_id ?? undefined,
    twoFactorEnabled: row.two_factor_enabled,
    verifiedFactorCount: row.verified_factor_count,
    currentAal: row.current_aal,
    currentAuthMethod: row.current_auth_method,
    ssoManaged: row.sso_managed,
    recoveryReviewState: row.recovery_review_state,
    riskPosture: row.risk_posture,
    enforcementState: row.enforcement_state,
    lastPasswordRecoveryAt: row.last_password_recovery_at ?? undefined,
    lastReauthenticationAt: row.last_reauthentication_at ?? undefined,
    lastSecurityReviewAt: row.last_security_review_at ?? undefined,
    lastSeenAt: row.last_seen_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeSession(row: DbAuthSession): AdminSecuritySession {
  return {
    id: row.id,
    sessionId: row.session_id,
    authUserId: row.auth_user_id,
    customerAccountId: row.customer_account_id ?? undefined,
    email: row.email ?? undefined,
    currentAal: row.current_aal,
    primaryAuthMethod: row.primary_auth_method,
    amrMethods: row.amr_methods ?? [],
    userAgent: row.user_agent ?? undefined,
    ipSummary: row.ip_summary ?? undefined,
    locationSummary: row.location_summary ?? undefined,
    status: row.status,
    riskLabel: row.risk_label,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at ?? undefined,
    revokedByAuthUserId: row.revoked_by_auth_user_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadUserSecurityPosture(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("user_security_posture")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return shapeUserSecurityPosture(data as DbUserSecurityPosture);
}

export async function loadSessionsForUser(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("auth_sessions")
    .select("*")
    .eq("auth_user_id", authUserId)
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbAuthSession[]).map(shapeSession);
}

export async function loadSessionsForAccount(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("auth_sessions")
    .select("*")
    .eq("customer_account_id", accountId)
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbAuthSession[]).map(shapeSession);
}

export async function syncPortalSecurityState(params: {
  accessToken: string;
  authUserId: string;
  email: string | null;
  accountId: string | null;
  headers: Headers;
  twoFactorEnabled: boolean;
  verifiedFactorCount: number;
  currentAal?: AdminAuthenticatorAssuranceLevel | null;
  authMethodHint?: "password" | "sso" | "unknown" | null;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const decoded = readAccessTokenSecurityState(params.accessToken);
  const sessionId = decoded.sessionId ?? `${params.authUserId}:${decoded.exp ?? "unknown"}`;
  const currentAal = params.currentAal ?? decoded.currentAal;
  const primaryAuthMethod =
    params.authMethodHint && params.authMethodHint !== "unknown"
      ? params.authMethodHint
      : decoded.primaryAuthMethod;

  const sessionPayload = {
    session_id: sessionId,
    auth_user_id: params.authUserId,
    customer_account_id: params.accountId,
    email: params.email,
    current_aal: currentAal,
    primary_auth_method: primaryAuthMethod,
    amr_methods: decoded.amrMethods,
    user_agent: getUserAgentSummary(params.headers),
    ip_summary: getForwardedIpSummary(params.headers),
    location_summary: null,
    status: "active" as const,
    risk_label: "normal" as const,
    last_seen_at: now,
    metadata: {
      syncedFrom: "portal_security",
    },
    updated_at: now,
  };

  const { data: sessionRow, error: sessionError } = await supabase
    .from("auth_sessions")
    .upsert(sessionPayload, { onConflict: "session_id" })
    .select("*")
    .single();

  if (sessionError || !sessionRow) {
    throw new Error(sessionError?.message || "Failed to sync auth session.");
  }

  await supabase.from("auth_session_events").insert({
    auth_session_id: sessionRow.id,
    event_type: "session_seen",
    actor_auth_user_id: params.authUserId,
    summary: "Portal session synced into security posture.",
    event_payload: {
      currentAal,
      primaryAuthMethod,
    },
  });

  const enforcementState =
    params.twoFactorEnabled && currentAal !== "aal2"
      ? ("two_factor_required" as const)
      : ("none" as const);

  const { error: postureError } = await supabase.from("user_security_posture").upsert(
    {
      auth_user_id: params.authUserId,
      primary_customer_account_id: params.accountId,
      two_factor_enabled: params.twoFactorEnabled,
      verified_factor_count: params.verifiedFactorCount,
      current_aal: currentAal,
      current_auth_method: primaryAuthMethod,
      sso_managed: primaryAuthMethod === "sso",
      recovery_review_state: "clear",
      risk_posture: "standard",
      enforcement_state: enforcementState,
      last_seen_at: now,
      metadata: {
        syncedFrom: "portal_security",
      },
      updated_at: now,
    },
    { onConflict: "auth_user_id" }
  );

  if (postureError) {
    throw new Error(postureError.message);
  }

  return {
    session: shapeSession(sessionRow as DbAuthSession),
    posture: await loadUserSecurityPosture(params.authUserId),
  };
}

export async function revokeSecuritySession(params: {
  authSessionId: string;
  actorAuthUserId: string;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("auth_sessions")
    .update({
      status: "revoked",
      revoked_at: now,
      revoked_by_auth_user_id: params.actorAuthUserId,
      updated_at: now,
    })
    .eq("id", params.authSessionId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Security session was not found.");
  }

  await supabase.from("auth_session_events").insert({
    auth_session_id: data.id,
    event_type: "revoked",
    actor_auth_user_id: params.actorAuthUserId,
    summary: "Session revoked from security workspace.",
    event_payload: {
      revokedAt: now,
    },
  });

  return shapeSession(data as DbAuthSession);
}
