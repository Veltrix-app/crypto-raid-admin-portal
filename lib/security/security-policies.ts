import { createClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type {
  DbCustomerAccountSecurityPolicy,
} from "@/types/database";
import type {
  AdminSecurityAccountPolicy,
} from "@/types/entities/security";

function shapeSecurityPolicy(row: DbCustomerAccountSecurityPolicy): AdminSecurityAccountPolicy {
  return {
    customerAccountId: row.customer_account_id,
    policyStatus: row.policy_status,
    ssoRequired: row.sso_required,
    twoFactorRequiredForAdmins: row.two_factor_required_for_admins,
    allowedAuthMethods: row.allowed_auth_methods,
    sessionReviewRequired: row.session_review_required,
    highRiskReauthRequired: row.high_risk_reauth_required,
    securityContactEmail: row.security_contact_email,
    notes: row.notes,
    reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function resolvePrimarySecurityAccountForUser(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id, role, status")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data
    ? {
        accountId: data.customer_account_id,
        membershipRole: data.role,
      }
    : null;
}

export async function loadAccountSecurityPolicy(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_security_policies")
    .select("*")
    .eq("customer_account_id", accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return shapeSecurityPolicy(data as DbCustomerAccountSecurityPolicy);
}

export async function assertInternalSecurityAccess() {
  const serverSupabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    const error = new Error("You must be signed in to access security data.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }

  const supabase = getAccountsServiceClient();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("auth_user_id, role, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (!adminUser?.auth_user_id || adminUser.role !== "super_admin") {
    const error = new Error("Security access denied.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return {
    authUserId: user.id,
  };
}

export async function assertSecurityAccountAccess(accountId: string) {
  const serverSupabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    const error = new Error("You must be signed in to access security settings.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }

  const supabase = getAccountsServiceClient();
  const [{ data: adminUser, error: adminError }, { data: membership, error: membershipError }] =
    await Promise.all([
      supabase
        .from("admin_users")
        .select("auth_user_id, role, status")
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("customer_account_memberships")
        .select("customer_account_id, role, status")
        .eq("customer_account_id", accountId)
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const isInternalAdmin = Boolean(adminUser?.auth_user_id && adminUser.role === "super_admin");
  const hasMembership = Boolean(membership?.customer_account_id);

  if (!isInternalAdmin && !hasMembership) {
    const error = new Error("Security access denied.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return {
    authUserId: user.id,
    isInternalAdmin,
    membershipRole: membership?.role ?? null,
  };
}

export async function resolveSecurityAccountAccessByAuthUserId(params: {
  accountId: string;
  authUserId: string;
}) {
  const supabase = getAccountsServiceClient();
  const [{ data: adminUser, error: adminError }, { data: membership, error: membershipError }] =
    await Promise.all([
      supabase
        .from("admin_users")
        .select("auth_user_id, role, status")
        .eq("auth_user_id", params.authUserId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("customer_account_memberships")
        .select("customer_account_id, role, status")
        .eq("customer_account_id", params.accountId)
        .eq("auth_user_id", params.authUserId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const isInternalAdmin = Boolean(adminUser?.auth_user_id && adminUser.role === "super_admin");
  const membershipRole = membership?.role ?? null;

  if (!isInternalAdmin && !membership?.customer_account_id) {
    const error = new Error("Security access denied.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return {
    isInternalAdmin,
    membershipRole,
  };
}

export async function updateAccountSecurityPolicy(params: {
  accountId: string;
  actorAuthUserId: string;
  policy: Partial<
    Pick<
      AdminSecurityAccountPolicy,
      | "policyStatus"
      | "ssoRequired"
      | "twoFactorRequiredForAdmins"
      | "allowedAuthMethods"
      | "sessionReviewRequired"
      | "highRiskReauthRequired"
      | "securityContactEmail"
      | "notes"
    >
  >;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const existing = await loadAccountSecurityPolicy(params.accountId);

  const nextPolicy = {
    customer_account_id: params.accountId,
    policy_status: params.policy.policyStatus ?? existing?.policyStatus ?? "standard",
    sso_required: params.policy.ssoRequired ?? existing?.ssoRequired ?? false,
    two_factor_required_for_admins:
      params.policy.twoFactorRequiredForAdmins ??
      existing?.twoFactorRequiredForAdmins ??
      false,
    allowed_auth_methods:
      params.policy.allowedAuthMethods ??
      existing?.allowedAuthMethods ??
      (["password", "sso"] as const),
    session_review_required:
      params.policy.sessionReviewRequired ?? existing?.sessionReviewRequired ?? false,
    high_risk_reauth_required:
      params.policy.highRiskReauthRequired ?? existing?.highRiskReauthRequired ?? false,
    security_contact_email:
      params.policy.securityContactEmail ?? existing?.securityContactEmail ?? "",
    notes: params.policy.notes ?? existing?.notes ?? "",
    reviewed_by_auth_user_id: params.actorAuthUserId,
    last_reviewed_at: now,
    updated_at: now,
  };

  const { data, error } = existing
    ? await supabase
        .from("customer_account_security_policies")
        .update(nextPolicy)
        .eq("customer_account_id", params.accountId)
        .select("*")
        .single()
    : await supabase
        .from("customer_account_security_policies")
        .insert({
          ...nextPolicy,
          metadata: {
            createdFrom: "portal_security",
          },
        })
        .select("*")
        .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update security policy.");
  }

  await supabase.from("customer_account_security_events").insert({
    customer_account_id: params.accountId,
    event_type: existing ? "policy_updated" : "policy_created",
    actor_auth_user_id: params.actorAuthUserId,
    summary: existing
      ? "Customer account security policy updated."
      : "Customer account security policy created.",
    event_payload: {
      policyStatus: nextPolicy.policy_status,
      ssoRequired: nextPolicy.sso_required,
      twoFactorRequiredForAdmins: nextPolicy.two_factor_required_for_admins,
    },
  });

  return shapeSecurityPolicy(data as DbCustomerAccountSecurityPolicy);
}
