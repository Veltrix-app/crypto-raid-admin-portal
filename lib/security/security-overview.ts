import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { loadSubprocessors, loadComplianceControls } from "@/lib/security/compliance-posture";
import {
  derivePortalSecurityRequirements,
  deriveWeakSecurityPosture,
} from "@/lib/security/security-contract";
import { loadDataRequestsForAccount, loadDataRequestsForUser } from "@/lib/security/data-requests";
import {
  loadAccountSecurityPolicy,
  resolvePrimarySecurityAccountForUser,
} from "@/lib/security/security-policies";
import { loadSessionsForAccount, loadSessionsForUser, loadUserSecurityPosture } from "@/lib/security/session-review";
import { loadAccountSsoConnections } from "@/lib/security/sso-connections";
import type {
  DbAuthSession,
  DbCustomerAccount,
  DbCustomerAccountSecurityEvent,
  DbCustomerAccountSubscription,
  DbDataAccessRequest,
  DbSecurityIncident,
  DbUserSecurityPosture,
} from "@/types/database";
import type {
  AdminSecurityAccountDetail,
  AdminSecurityAccountSummary,
  AdminSecurityIncident,
  AdminSecurityOverview,
  AdminSecurityPolicyEvent,
  PortalSecurityCurrentAccount,
} from "@/types/entities/security";

function shapeIncident(row: DbSecurityIncident): AdminSecurityIncident {
  return {
    id: row.id,
    incidentRef: row.incident_ref,
    customerAccountId: row.customer_account_id ?? undefined,
    title: row.title,
    severity: row.severity,
    state: row.state,
    scopeSummary: row.scope_summary,
    publicSummary: row.public_summary,
    internalSummary: row.internal_summary,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    declaredByAuthUserId: row.declared_by_auth_user_id ?? undefined,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at ?? undefined,
    postmortemDueAt: row.postmortem_due_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapePolicyEvent(row: DbCustomerAccountSecurityEvent): AdminSecurityPolicyEvent {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    eventType: row.event_type as AdminSecurityPolicyEvent["eventType"],
    actorAuthUserId: row.actor_auth_user_id ?? undefined,
    summary: row.summary,
    eventPayload: row.event_payload ?? undefined,
    createdAt: row.created_at,
  };
}

async function loadSecurityMemberships(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("customer_account_memberships")
    .select("auth_user_id, role, status")
    .eq("customer_account_id", accountId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const authUserIds = Array.from(
    new Set(
      (memberships ?? [])
        .map((membership) => membership.auth_user_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const { data: postures, error: posturesError } = authUserIds.length
    ? await supabase
        .from("user_security_posture")
        .select("*")
        .in("auth_user_id", authUserIds)
    : { data: [], error: null };

  if (posturesError) {
    throw new Error(posturesError.message);
  }

  const postureByAuthUserId = new Map(
    ((postures ?? []) as DbUserSecurityPosture[]).map((posture) => [posture.auth_user_id, posture])
  );

  const emailEntries = await Promise.all(
    authUserIds.map(async (authUserId) => {
      try {
        const response = await supabase.auth.admin.getUserById(authUserId);
        return [authUserId, response.data.user?.email ?? "Unknown user"] as const;
      } catch {
        return [authUserId, "Unknown user"] as const;
      }
    })
  );

  const emailByAuthUserId = new Map(emailEntries);

  return (memberships ?? []).map((membership) => ({
    authUserId: membership.auth_user_id,
    email: emailByAuthUserId.get(membership.auth_user_id) ?? "Unknown user",
    role: membership.role,
    status: membership.status,
    security: postureByAuthUserId.get(membership.auth_user_id)
      ? {
          authUserId: postureByAuthUserId.get(membership.auth_user_id)!.auth_user_id,
          primaryCustomerAccountId:
            postureByAuthUserId.get(membership.auth_user_id)!.primary_customer_account_id ?? undefined,
          twoFactorEnabled: postureByAuthUserId.get(membership.auth_user_id)!.two_factor_enabled,
          verifiedFactorCount: postureByAuthUserId.get(membership.auth_user_id)!.verified_factor_count,
          currentAal: postureByAuthUserId.get(membership.auth_user_id)!.current_aal,
          currentAuthMethod: postureByAuthUserId.get(membership.auth_user_id)!.current_auth_method,
          ssoManaged: postureByAuthUserId.get(membership.auth_user_id)!.sso_managed,
          recoveryReviewState: postureByAuthUserId.get(membership.auth_user_id)!.recovery_review_state,
          riskPosture: postureByAuthUserId.get(membership.auth_user_id)!.risk_posture,
          enforcementState: postureByAuthUserId.get(membership.auth_user_id)!.enforcement_state,
          lastPasswordRecoveryAt:
            postureByAuthUserId.get(membership.auth_user_id)!.last_password_recovery_at ?? undefined,
          lastReauthenticationAt:
            postureByAuthUserId.get(membership.auth_user_id)!.last_reauthentication_at ?? undefined,
          lastSecurityReviewAt:
            postureByAuthUserId.get(membership.auth_user_id)!.last_security_review_at ?? undefined,
          lastSeenAt: postureByAuthUserId.get(membership.auth_user_id)!.last_seen_at ?? undefined,
          metadata: postureByAuthUserId.get(membership.auth_user_id)!.metadata ?? undefined,
          createdAt: postureByAuthUserId.get(membership.auth_user_id)!.created_at,
          updatedAt: postureByAuthUserId.get(membership.auth_user_id)!.updated_at,
        }
      : null,
  }));
}

function deriveAccountSummary(params: {
  account: DbCustomerAccount;
  subscription: DbCustomerAccountSubscription | null;
  policy: Awaited<ReturnType<typeof loadAccountSecurityPolicy>>;
  memberships: Awaited<ReturnType<typeof loadSecurityMemberships>>;
  sessions: Awaited<ReturnType<typeof loadSessionsForAccount>>;
  requests: Awaited<ReturnType<typeof loadDataRequestsForAccount>>;
  incidents: AdminSecurityIncident[];
  ssoConnectionCount: number;
}): AdminSecurityAccountSummary {
  const ownersWithoutTwoFactor = params.memberships.filter(
    (membership) => membership.role === "owner" && !membership.security?.twoFactorEnabled
  ).length;
  const adminsWithoutTwoFactor = params.memberships.filter(
    (membership) => membership.role === "admin" && !membership.security?.twoFactorEnabled
  ).length;
  const activeSessionCount = params.sessions.filter((session) => session.status === "active").length;
  const openDataRequestCount = params.requests.filter((request) =>
    ["submitted", "in_review", "awaiting_verification", "approved"].includes(request.status)
  ).length;
  const activeSecurityIncidentCount = params.incidents.filter(
    (incident) => incident.state !== "resolved"
  ).length;

  return {
    customerAccountId: params.account.id,
    accountName: params.account.name,
    policyStatus: params.policy?.policyStatus ?? "standard",
    billingPlanId: params.subscription?.billing_plan_id ?? undefined,
    billingStatus: params.subscription?.status ?? undefined,
    ssoRequired: params.policy?.ssoRequired ?? false,
    twoFactorRequiredForAdmins: params.policy?.twoFactorRequiredForAdmins ?? false,
    teamMemberCount: params.memberships.length,
    ownersWithoutTwoFactor,
    adminsWithoutTwoFactor,
    activeSessionCount,
    openDataRequestCount,
    activeSecurityIncidentCount,
    weakPosture: deriveWeakSecurityPosture({
      policy: params.policy,
      ownersWithoutTwoFactor,
      adminsWithoutTwoFactor,
      activeSessionCount,
      ssoConnectionCount: params.ssoConnectionCount,
    }),
    policyLastReviewedAt: params.policy?.lastReviewedAt,
  };
}

export async function loadSecurityOverview(): Promise<AdminSecurityOverview> {
  const supabase = getAccountsServiceClient();
  const [
    { data: accounts, error: accountsError },
    { data: subscriptions, error: subscriptionsError },
    { data: policies, error: policiesError },
    { data: memberships, error: membershipsError },
    { data: postures, error: posturesError },
    { data: sessions, error: sessionsError },
    { data: requests, error: requestsError },
    { data: incidents, error: incidentsError },
    { data: ssoConnections, error: ssoConnectionsError },
  ] = await Promise.all([
    supabase.from("customer_accounts").select("id, name, created_at, updated_at"),
    supabase
      .from("customer_account_subscriptions")
      .select("customer_account_id, billing_plan_id, status")
      .eq("is_current", true),
    supabase.from("customer_account_security_policies").select("*"),
    supabase
      .from("customer_account_memberships")
      .select("customer_account_id, auth_user_id, role, status")
      .eq("status", "active"),
    supabase.from("user_security_posture").select("*"),
    supabase.from("auth_sessions").select("*"),
    supabase.from("data_access_requests").select("*"),
    supabase.from("security_incidents").select("*"),
    supabase.from("customer_account_sso_connections").select("*"),
  ]);

  if (accountsError) throw new Error(accountsError.message);
  if (subscriptionsError) throw new Error(subscriptionsError.message);
  if (policiesError) throw new Error(policiesError.message);
  if (membershipsError) throw new Error(membershipsError.message);
  if (posturesError) throw new Error(posturesError.message);
  if (sessionsError) throw new Error(sessionsError.message);
  if (requestsError) throw new Error(requestsError.message);
  if (incidentsError) throw new Error(incidentsError.message);
  if (ssoConnectionsError) throw new Error(ssoConnectionsError.message);

  const controls = await loadComplianceControls();
  const subprocessors = await loadSubprocessors();

  const subscriptionByAccountId = new Map(
    ((subscriptions ?? []) as DbCustomerAccountSubscription[]).map((subscription) => [
      subscription.customer_account_id,
      subscription,
    ])
  );
  const policyByAccountId = new Map(
    ((policies ?? []) as any[]).map((policy) => [policy.customer_account_id, {
      customerAccountId: policy.customer_account_id,
      policyStatus: policy.policy_status,
      ssoRequired: policy.sso_required,
      twoFactorRequiredForAdmins: policy.two_factor_required_for_admins,
      allowedAuthMethods: policy.allowed_auth_methods,
      sessionReviewRequired: policy.session_review_required,
      highRiskReauthRequired: policy.high_risk_reauth_required,
      securityContactEmail: policy.security_contact_email,
      notes: policy.notes,
      reviewedByAuthUserId: policy.reviewed_by_auth_user_id ?? undefined,
      lastReviewedAt: policy.last_reviewed_at ?? undefined,
      metadata: policy.metadata ?? undefined,
      createdAt: policy.created_at,
      updatedAt: policy.updated_at,
    }])
  );
  const postureByAuthUserId = new Map(
    ((postures ?? []) as DbUserSecurityPosture[]).map((posture) => [posture.auth_user_id, posture])
  );
  const accountMemberships = new Map<string, Array<{ auth_user_id: string; role: string; status: string }>>();
  for (const membership of memberships ?? []) {
    const list = accountMemberships.get(membership.customer_account_id) ?? [];
    list.push({
      auth_user_id: membership.auth_user_id,
      role: membership.role,
      status: membership.status,
    });
    accountMemberships.set(membership.customer_account_id, list);
  }
  const accountSessions = new Map<string, DbAuthSession[]>();
  for (const session of (sessions ?? []) as any[]) {
    const key = session.customer_account_id ?? "__none__";
    const list = accountSessions.get(key) ?? [];
    list.push(session);
    accountSessions.set(key, list);
  }
  const accountRequests = new Map<string, DbDataAccessRequest[]>();
  for (const request of (requests ?? []) as any[]) {
    const key = request.customer_account_id ?? "__none__";
    const list = accountRequests.get(key) ?? [];
    list.push(request);
    accountRequests.set(key, list);
  }
  const accountIncidents = new Map<string, AdminSecurityIncident[]>();
  for (const incident of (incidents ?? []) as DbSecurityIncident[]) {
    const key = incident.customer_account_id ?? "__none__";
    const list = accountIncidents.get(key) ?? [];
    list.push(shapeIncident(incident));
    accountIncidents.set(key, list);
  }
  const ssoConnectionCountByAccountId = new Map<string, number>();
  for (const connection of ssoConnections ?? []) {
    ssoConnectionCountByAccountId.set(
      connection.customer_account_id,
      (ssoConnectionCountByAccountId.get(connection.customer_account_id) ?? 0) + 1
    );
  }

  const summaries = ((accounts ?? []) as DbCustomerAccount[]).map((account) => {
    const membershipsForAccount = accountMemberships.get(account.id) ?? [];
    const ownersWithoutTwoFactor = membershipsForAccount.filter(
      (membership) =>
        membership.role === "owner" &&
        !postureByAuthUserId.get(membership.auth_user_id)?.two_factor_enabled
    ).length;
    const adminsWithoutTwoFactor = membershipsForAccount.filter(
      (membership) =>
        membership.role === "admin" &&
        !postureByAuthUserId.get(membership.auth_user_id)?.two_factor_enabled
    ).length;
    const activeSessionCount = ((accountSessions.get(account.id) ?? []) as any[]).filter(
      (session) => session.status === "active"
    ).length;
    const openDataRequestCount = ((accountRequests.get(account.id) ?? []) as any[]).filter((request) =>
      ["submitted", "in_review", "awaiting_verification", "approved"].includes(request.status)
    ).length;
    const activeSecurityIncidentCount = (accountIncidents.get(account.id) ?? []).filter(
      (incident) => incident.state !== "resolved"
    ).length;
    const policy = policyByAccountId.get(account.id) ?? null;

    return {
      customerAccountId: account.id,
      accountName: account.name,
      policyStatus: policy?.policyStatus ?? "standard",
      billingPlanId: subscriptionByAccountId.get(account.id)?.billing_plan_id ?? undefined,
      billingStatus: subscriptionByAccountId.get(account.id)?.status ?? undefined,
      ssoRequired: policy?.ssoRequired ?? false,
      twoFactorRequiredForAdmins: policy?.twoFactorRequiredForAdmins ?? false,
      teamMemberCount: membershipsForAccount.length,
      ownersWithoutTwoFactor,
      adminsWithoutTwoFactor,
      activeSessionCount,
      openDataRequestCount,
      activeSecurityIncidentCount,
      weakPosture: deriveWeakSecurityPosture({
        policy,
        ownersWithoutTwoFactor,
        adminsWithoutTwoFactor,
        activeSessionCount,
        ssoConnectionCount: ssoConnectionCountByAccountId.get(account.id) ?? 0,
      }),
      policyLastReviewedAt: policy?.lastReviewedAt,
    } satisfies AdminSecurityAccountSummary;
  });

  const weakPosture = summaries.filter((summary) => summary.weakPosture);
  const dataRequestsQueue = ((requests ?? []) as any[])
    .filter((request) =>
      ["submitted", "in_review", "awaiting_verification", "approved"].includes(request.status)
    )
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .map((request) => ({
      id: request.id,
      customerAccountId: request.customer_account_id ?? undefined,
      authUserId: request.auth_user_id ?? undefined,
      requestType: request.request_type,
      status: request.status,
      verificationState: request.verification_state,
      requesterEmail: request.requester_email,
      summary: request.summary,
      reviewNotes: request.review_notes,
      reviewedByAuthUserId: request.reviewed_by_auth_user_id ?? undefined,
      approvedByAuthUserId: request.approved_by_auth_user_id ?? undefined,
      completedByAuthUserId: request.completed_by_auth_user_id ?? undefined,
      requestedAt: request.requested_at,
      reviewedAt: request.reviewed_at ?? undefined,
      completedAt: request.completed_at ?? undefined,
      metadata: request.metadata ?? undefined,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    }));
  const incidentsQueue = ((incidents ?? []) as DbSecurityIncident[])
    .filter((incident) => incident.state !== "resolved")
    .map(shapeIncident)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const complianceAttention = controls.filter(
    (control) => control.reviewState !== "reviewed" || control.controlState === "needs_work"
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      accounts: summaries.length,
      enterpriseHardenedAccounts: summaries.filter(
        (summary) => summary.policyStatus === "enterprise_hardened"
      ).length,
      accountsRequiringSso: summaries.filter((summary) => summary.ssoRequired).length,
      accountsRequiringTwoFactor: summaries.filter(
        (summary) => summary.twoFactorRequiredForAdmins
      ).length,
      weakPostureAccounts: weakPosture.length,
      activeSessions: ((sessions ?? []) as any[]).filter((session) => session.status === "active").length,
      openDataRequests: dataRequestsQueue.length,
      activeSecurityIncidents: incidentsQueue.length,
      complianceControlsNeedingAttention: complianceAttention.length,
    },
    queues: {
      weakPosture,
      dataRequests: dataRequestsQueue,
      securityIncidents: incidentsQueue,
      complianceAttention,
    },
    accounts: summaries.sort((left, right) =>
      Number(right.weakPosture) - Number(left.weakPosture) || left.accountName.localeCompare(right.accountName)
    ),
    controls,
    subprocessors,
  };
}

export async function loadSecurityAccountDetail(accountId: string): Promise<AdminSecurityAccountDetail> {
  const supabase = getAccountsServiceClient();
  const [
    { data: account, error: accountError },
    { data: subscription, error: subscriptionError },
    { data: policyEvents, error: policyEventsError },
    { data: incidents, error: incidentsError },
  ] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("id, name, created_at, updated_at")
      .eq("id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_subscriptions")
      .select("customer_account_id, billing_plan_id, status")
      .eq("customer_account_id", accountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_security_events")
      .select("*")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: false }),
    supabase
      .from("security_incidents")
      .select("*")
      .eq("customer_account_id", accountId)
      .order("updated_at", { ascending: false }),
  ]);

  if (accountError) throw new Error(accountError.message);
  if (subscriptionError) throw new Error(subscriptionError.message);
  if (policyEventsError) throw new Error(policyEventsError.message);
  if (incidentsError) throw new Error(incidentsError.message);

  if (!account) {
    throw new Error("Security account detail was not found.");
  }

  const [policy, memberships, sessions, requests, ssoConnections] = await Promise.all([
    loadAccountSecurityPolicy(accountId),
    loadSecurityMemberships(accountId),
    loadSessionsForAccount(accountId),
    loadDataRequestsForAccount(accountId),
    loadAccountSsoConnections(accountId),
  ]);

  const summary = deriveAccountSummary({
    account: account as DbCustomerAccount,
    subscription: (subscription as DbCustomerAccountSubscription | null) ?? null,
    policy,
    memberships,
    sessions,
    requests,
    incidents: ((incidents ?? []) as DbSecurityIncident[]).map(shapeIncident),
    ssoConnectionCount: ssoConnections.length,
  });

  return {
    account: summary,
    policy,
    members: memberships,
    sessions,
    requests,
    policyEvents: ((policyEvents ?? []) as DbCustomerAccountSecurityEvent[]).map(shapePolicyEvent),
    incidents: ((incidents ?? []) as DbSecurityIncident[]).map(shapeIncident),
    ssoConnections,
  };
}

export async function loadCurrentPortalSecurityAccount(params: {
  authUserId: string;
}) : Promise<PortalSecurityCurrentAccount> {
  const accountContext = await resolvePrimarySecurityAccountForUser(params.authUserId);
  const accountId = accountContext?.accountId ?? null;
  const [policy, userPosture, sessions, requests, ssoConnections, account] = await Promise.all([
    accountId ? loadAccountSecurityPolicy(accountId) : Promise.resolve(null),
    loadUserSecurityPosture(params.authUserId),
    loadSessionsForUser(params.authUserId),
    loadDataRequestsForUser(params.authUserId, accountId),
    accountId ? loadAccountSsoConnections(accountId) : Promise.resolve([]),
    accountId
      ? getAccountsServiceClient()
          .from("customer_accounts")
          .select("id, name")
          .eq("id", accountId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (account && "error" in account && account.error) {
    throw new Error(account.error.message);
  }

  const requirements = derivePortalSecurityRequirements({
    membershipRole: accountContext?.membershipRole,
    policy,
    userPosture,
  });

  return {
    customerAccountId: accountId ?? undefined,
    accountName:
      account && "data" in account && account.data?.name ? account.data.name : undefined,
    membershipRole: accountContext?.membershipRole ?? undefined,
    policy,
    userPosture,
    sessions,
    requests,
    ssoConnections,
    requiresTwoFactor: requirements.requiresTwoFactor,
    requiresSso: requirements.requiresSso,
  };
}
