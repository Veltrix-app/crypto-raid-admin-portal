import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import {
  loadPortalCustomerBillingWorkspace,
  type PortalCustomerBillingWorkspace,
} from "@/lib/billing/account-billing";
import {
  calculateUsagePercent,
  isBillableAccountRole,
  resolveBillingUsagePressure,
} from "@/lib/billing/billing-entitlements";
import type { AdminBillingPlan } from "@/types/entities/billing-plan";
import type {
  AdminActivationStatus,
  AdminCommercialHealthStatus,
  AdminCustomerAccountBillingEvent,
  AdminCustomerAccountBusinessNote,
} from "@/types/entities/billing-subscription";
import {
  loadBusinessAccountEvents,
  loadBusinessAccountNotes,
} from "@/lib/billing/business-actions";
import type {
  DbBillingPlan,
  DbCustomerAccount,
  DbCustomerAccountBillingProfile,
  DbCustomerAccountEntitlement,
  DbCustomerAccountInvoice,
  DbCustomerAccountSubscription,
} from "@/types/database";

type MinimalOnboardingRow = {
  customer_account_id: string;
  status: "in_progress" | "completed" | "skipped";
  current_step:
    | "create_workspace"
    | "create_project"
    | "invite_team"
    | "open_launch_workspace"
    | "completed";
  first_project_id: string | null;
  updated_at: string | null;
};

type MinimalMembershipRow = {
  customer_account_id: string;
  role: string;
  status: string;
};

type MinimalProjectRow = {
  id: string;
  customer_account_id: string | null;
  status: string;
};

type MinimalProjectStatusRow = {
  project_id: string | null;
  status: string;
  provider?: string | null;
};

type MinimalBillingEventRow = {
  customer_account_id: string;
  event_type: string;
  created_at: string;
};

type BusinessAccountUsage = {
  projects: number;
  activeCampaigns: number;
  liveQuests: number;
  liveRaids: number;
  providers: number;
  billableSeats: number;
};

export type BusinessControlAccountSummary = {
  accountId: string;
  accountName: string;
  planId: string;
  planName: string;
  billingStatus: string;
  commercialHealth: AdminCommercialHealthStatus;
  activationStatus: AdminActivationStatus;
  collectionStatus: "clear" | "renewing_soon" | "payment_failed" | "action_required" | "refunded";
  paymentMethodStatus: string;
  currentMrrContribution: number;
  nextBillingAt: string | null;
  usagePressure: "comfortable" | "watching" | "upgrade_recommended" | "blocked";
  usage: BusinessAccountUsage;
  usagePercents: Record<"projects" | "campaigns" | "quests" | "raids" | "providers" | "seats", number>;
  limits: {
    projects: number;
    campaigns: number;
    quests: number;
    raids: number;
    providers: number;
    seats: number;
  };
  openInvoiceCount: number;
  amountRemaining: number;
};

export type BusinessControlOverview = {
  revenue: {
    mrr: number;
    arrRunRate: number;
    activePaidAccounts: number;
    trialingAccounts: number;
    freeAccounts: number;
    newConversions: number;
    upgrades: number;
    downgrades: number;
    churnedAccounts: number;
  };
  collections: {
    grossCollectedThisMonth: number;
    refundTotalThisMonth: number;
    netCollectedThisMonth: number;
    pastDueExposure: number;
    upcomingRenewals: number;
    failedPaymentCount: number;
  };
  growthPressure: {
    nearProjectLimit: number;
    nearCampaignLimit: number;
    nearQuestLimit: number;
    nearRaidLimit: number;
    nearSeatLimit: number;
    nearProviderLimit: number;
  };
  health: {
    accountsWithoutFirstProject: number;
    accountsWithoutFirstLiveCampaign: number;
    paidButUnderusedAccounts: number;
    graceStateAccounts: number;
    accountsBlockedByEntitlement: number;
    enterpriseReviewAccounts: number;
  };
  queues: {
    failedPayments: BusinessControlAccountSummary[];
    pastDueAndGrace: BusinessControlAccountSummary[];
    upgradeCandidates: BusinessControlAccountSummary[];
    activationBlockers: BusinessControlAccountSummary[];
    accountsNeedingReview: BusinessControlAccountSummary[];
  };
  planMix: Array<{
    planId: string;
    label: string;
    count: number;
  }>;
  accounts: BusinessControlAccountSummary[];
};

export type BusinessControlAccountDetail = {
  account: BusinessControlAccountSummary;
  workspace: PortalCustomerBillingWorkspace;
  billingEvents: AdminCustomerAccountBillingEvent[];
  businessNotes: AdminCustomerAccountBusinessNote[];
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function mapBillingPlan(row: DbBillingPlan): AdminBillingPlan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: row.price_monthly,
    projectsLimit: row.projects_limit,
    campaignsLimit: row.campaigns_limit,
    questsLimit: row.quests_limit,
    raidsLimit: row.raids_limit,
    providersLimit: row.providers_limit,
    includedBillableSeats: row.included_billable_seats,
    features: row.features,
    current: row.current,
    sortOrder: row.sort_order,
    trialDays: row.trial_days,
    currency: row.currency,
    billingInterval: row.billing_interval,
    isPublic: row.is_public,
    isSelfServe: row.is_self_serve,
    isCheckoutEnabled: row.is_checkout_enabled,
    isFreeTier: row.is_free_tier,
    isEnterprise: row.is_enterprise,
    featureFlags: row.feature_flags ?? {},
    entitlementMetadata: row.entitlement_metadata ?? {},
    stripeProductId: row.stripe_product_id ?? undefined,
    stripeMonthlyPriceId: row.stripe_monthly_price_id ?? undefined,
  };
}

function getProjectIdsForAccount(projects: MinimalProjectRow[], accountId: string) {
  return projects
    .filter((project) => project.customer_account_id === accountId)
    .map((project) => project.id);
}

function countActiveByProjectIds(rows: MinimalProjectStatusRow[], projectIds: string[]) {
  const projectIdSet = new Set(projectIds);
  return rows.filter((row) => row.project_id && projectIdSet.has(row.project_id) && row.status === "active")
    .length;
}

function countConnectedProviders(rows: MinimalProjectStatusRow[], projectIds: string[]) {
  const projectIdSet = new Set(projectIds);
  return new Set(
    rows
      .filter(
        (row) =>
          row.project_id &&
          projectIdSet.has(row.project_id) &&
          row.status === "connected" &&
          typeof row.provider === "string"
      )
      .map((row) => row.provider)
  ).size;
}

function deriveActivationStatus(params: {
  account: DbCustomerAccount;
  onboarding: MinimalOnboardingRow | null;
  projectIds: string[];
}) {
  const updatedAt = params.onboarding?.updated_at ?? params.account.updated_at ?? params.account.created_at;
  const stale =
    updatedAt && Date.now() - new Date(updatedAt).getTime() > 14 * MS_IN_DAY && params.projectIds.length === 0;

  if (stale) {
    return "stalled" as const;
  }

  if (params.onboarding?.status === "completed") {
    return "live" as const;
  }

  if (params.projectIds.length > 0 && params.onboarding?.current_step === "open_launch_workspace") {
    return "launch_setup_started" as const;
  }

  if (params.projectIds.length > 0) {
    return "first_project_created" as const;
  }

  if (params.onboarding?.current_step === "create_project") {
    return "workspace_ready" as const;
  }

  return "created" as const;
}

function deriveCollectionStatus(params: {
  invoices: DbCustomerAccountInvoice[];
  subscription: DbCustomerAccountSubscription | null;
}) {
  const hasFailedPayment = params.invoices.some(
    (invoice) => invoice.collection_status === "payment_failed"
  );
  if (hasFailedPayment) {
    return "payment_failed" as const;
  }

  if (params.subscription?.status === "past_due" || params.subscription?.status === "grace") {
    return "action_required" as const;
  }

  const nextBillingAt =
    params.subscription?.current_period_end ?? params.subscription?.trial_ends_at ?? null;
  if (nextBillingAt) {
    const timeUntilRenewal = new Date(nextBillingAt).getTime() - Date.now();
    if (timeUntilRenewal >= 0 && timeUntilRenewal <= 14 * MS_IN_DAY) {
      return "renewing_soon" as const;
    }
  }

  return "clear" as const;
}

function pickUsagePressure(pressures: Array<ReturnType<typeof resolveBillingUsagePressure>>) {
  if (pressures.includes("blocked")) {
    return "blocked" as const;
  }

  if (pressures.includes("upgrade_recommended")) {
    return "upgrade_recommended" as const;
  }

  if (pressures.includes("watching")) {
    return "watching" as const;
  }

  return "comfortable" as const;
}

function deriveCommercialHealth(params: {
  collectionStatus: ReturnType<typeof deriveCollectionStatus>;
  usagePressure: ReturnType<typeof pickUsagePressure>;
  activationStatus: AdminActivationStatus;
  billingProfile: DbCustomerAccountBillingProfile | null;
  subscription: DbCustomerAccountSubscription | null;
}) {
  if (
    params.collectionStatus === "payment_failed" ||
    params.subscription?.status === "past_due" ||
    (params.subscription &&
      params.subscription.billing_plan_id !== "free" &&
      params.billingProfile?.payment_method_status === "missing")
  ) {
    return "payment_risk" as const;
  }

  if (params.usagePressure === "blocked") {
    return "blocked" as const;
  }

  if (params.usagePressure === "upgrade_recommended") {
    return "upgrade_ready" as const;
  }

  if (params.activationStatus === "stalled") {
    return "churn_risk" as const;
  }

  if (params.usagePressure === "watching" || params.subscription?.status === "trialing") {
    return "watching" as const;
  }

  return "healthy" as const;
}

export async function loadBusinessControlOverview() {
  const supabase = getAccountsServiceClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * MS_IN_DAY).toISOString();

  const [
    accountsResponse,
    subscriptionsResponse,
    entitlementsResponse,
    billingProfilesResponse,
    onboardingResponse,
    invoicesResponse,
    plansResponse,
    membershipsResponse,
    projectsResponse,
    campaignsResponse,
    questsResponse,
    raidsResponse,
    integrationsResponse,
    billingEventsResponse,
  ] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("id, legacy_project_id, name, status, contact_email, created_at, updated_at"),
    supabase
      .from("customer_account_subscriptions")
      .select(
        "id, customer_account_id, billing_plan_id, stripe_customer_id, stripe_subscription_id, status, is_current, started_at, current_period_start, current_period_end, trial_started_at, trial_ends_at, cancel_at, cancel_at_period_end, canceled_at, ended_at, grace_until, metadata, created_at, updated_at"
      )
      .eq("is_current", true),
    supabase
      .from("customer_account_entitlements")
      .select(
        "customer_account_id, billing_plan_id, customer_account_subscription_id, max_projects, max_active_campaigns, max_live_quests, max_live_raids, max_providers, included_billable_seats, current_projects, current_active_campaigns, current_live_quests, current_live_raids, current_providers, current_billable_seats, warning_threshold_info, warning_threshold_upgrade, block_threshold, self_serve_allowed, enterprise_managed, grace_until, last_computed_at, metadata, created_at, updated_at"
      ),
    supabase
      .from("customer_account_billing_profiles")
      .select(
        "customer_account_id, billing_email, stripe_customer_id, stripe_default_payment_method_id, currency, country_code, payment_method_status, metadata, created_at, updated_at"
      ),
    supabase
      .from("customer_account_onboarding")
      .select("customer_account_id, status, current_step, first_project_id, updated_at"),
    supabase
      .from("customer_account_invoices")
      .select(
        "id, customer_account_id, customer_account_subscription_id, stripe_invoice_id, stripe_payment_intent_id, invoice_number, status, collection_status, currency, subtotal_amount, tax_amount, total_amount, amount_paid, amount_remaining, refunded_amount, due_at, paid_at, hosted_invoice_url, invoice_pdf_url, metadata, created_at, updated_at"
      ),
    supabase
      .from("billing_plans")
      .select(
        "id, name, price_monthly, projects_limit, campaigns_limit, quests_limit, raids_limit, providers_limit, included_billable_seats, features, current, sort_order, trial_days, currency, billing_interval, is_public, is_self_serve, is_checkout_enabled, is_free_tier, is_enterprise, feature_flags, entitlement_metadata, stripe_product_id, stripe_monthly_price_id"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("customer_account_memberships")
      .select("customer_account_id, role, status")
      .eq("status", "active"),
    supabase.from("projects").select("id, customer_account_id, status"),
    supabase.from("campaigns").select("project_id, status"),
    supabase.from("quests").select("project_id, status"),
    supabase.from("raids").select("project_id, status"),
    supabase.from("project_integrations").select("project_id, status, provider"),
    supabase
      .from("customer_account_billing_events")
      .select("customer_account_id, event_type, created_at")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const responses = [
    accountsResponse,
    subscriptionsResponse,
    entitlementsResponse,
    billingProfilesResponse,
    onboardingResponse,
    invoicesResponse,
    plansResponse,
    membershipsResponse,
    projectsResponse,
    campaignsResponse,
    questsResponse,
    raidsResponse,
    integrationsResponse,
    billingEventsResponse,
  ];

  const firstError = responses.find((response) => response.error);
  if (firstError?.error) {
    throw new Error(firstError.error.message || "Failed to load business control overview.");
  }

  const plans = ((plansResponse.data ?? []) as DbBillingPlan[]).map(mapBillingPlan);
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const subscriptionsByAccountId = new Map(
    ((subscriptionsResponse.data ?? []) as DbCustomerAccountSubscription[]).map((row) => [
      row.customer_account_id,
      row,
    ])
  );
  const entitlementsByAccountId = new Map(
    ((entitlementsResponse.data ?? []) as DbCustomerAccountEntitlement[]).map((row) => [
      row.customer_account_id,
      row,
    ])
  );
  const billingProfilesByAccountId = new Map(
    ((billingProfilesResponse.data ?? []) as DbCustomerAccountBillingProfile[]).map((row) => [
      row.customer_account_id,
      row,
    ])
  );
  const onboardingByAccountId = new Map(
    ((onboardingResponse.data ?? []) as MinimalOnboardingRow[]).map((row) => [
      row.customer_account_id,
      row,
    ])
  );
  const membershipsByAccountId = new Map<string, MinimalMembershipRow[]>();
  for (const membership of (membershipsResponse.data ?? []) as MinimalMembershipRow[]) {
    const current = membershipsByAccountId.get(membership.customer_account_id) ?? [];
    current.push(membership);
    membershipsByAccountId.set(membership.customer_account_id, current);
  }

  const invoicesByAccountId = new Map<string, DbCustomerAccountInvoice[]>();
  for (const invoice of (invoicesResponse.data ?? []) as DbCustomerAccountInvoice[]) {
    const current = invoicesByAccountId.get(invoice.customer_account_id) ?? [];
    current.push(invoice);
    invoicesByAccountId.set(invoice.customer_account_id, current);
  }

  const eventsByAccountId = new Map<string, MinimalBillingEventRow[]>();
  for (const event of (billingEventsResponse.data ?? []) as MinimalBillingEventRow[]) {
    const current = eventsByAccountId.get(event.customer_account_id) ?? [];
    current.push(event);
    eventsByAccountId.set(event.customer_account_id, current);
  }

  const projects = (projectsResponse.data ?? []) as MinimalProjectRow[];
  const campaigns = (campaignsResponse.data ?? []) as MinimalProjectStatusRow[];
  const quests = (questsResponse.data ?? []) as MinimalProjectStatusRow[];
  const raids = (raidsResponse.data ?? []) as MinimalProjectStatusRow[];
  const integrations = (integrationsResponse.data ?? []) as MinimalProjectStatusRow[];

  const accounts = ((accountsResponse.data ?? []) as DbCustomerAccount[]).map((account) => {
    const subscription = subscriptionsByAccountId.get(account.id) ?? null;
    const entitlements = entitlementsByAccountId.get(account.id) ?? null;
    const billingProfile = billingProfilesByAccountId.get(account.id) ?? null;
    const onboarding = onboardingByAccountId.get(account.id) ?? null;
    const accountInvoices = invoicesByAccountId.get(account.id) ?? [];
    const accountEvents = eventsByAccountId.get(account.id) ?? [];
    const accountPlanId = subscription?.billing_plan_id ?? entitlements?.billing_plan_id ?? "free";
    const plan = planById.get(accountPlanId) ?? planById.get("free");
    const projectIds = getProjectIdsForAccount(projects, account.id);
    const usage: BusinessAccountUsage = {
      projects: projectIds.length,
      activeCampaigns: countActiveByProjectIds(campaigns, projectIds),
      liveQuests: countActiveByProjectIds(quests, projectIds),
      liveRaids: countActiveByProjectIds(raids, projectIds),
      providers: countConnectedProviders(integrations, projectIds),
      billableSeats: (membershipsByAccountId.get(account.id) ?? []).filter((membership) =>
        isBillableAccountRole(membership.role)
      ).length,
    };

    const limits = {
      projects: entitlements?.max_projects ?? plan?.projectsLimit ?? 1,
      campaigns: entitlements?.max_active_campaigns ?? plan?.campaignsLimit ?? 1,
      quests: entitlements?.max_live_quests ?? plan?.questsLimit ?? 10,
      raids: entitlements?.max_live_raids ?? plan?.raidsLimit ?? 1,
      providers: entitlements?.max_providers ?? plan?.providersLimit ?? 1,
      seats: entitlements?.included_billable_seats ?? plan?.includedBillableSeats ?? 2,
    };

    const usagePercents = {
      projects: calculateUsagePercent(usage.projects, limits.projects),
      campaigns: calculateUsagePercent(usage.activeCampaigns, limits.campaigns),
      quests: calculateUsagePercent(usage.liveQuests, limits.quests),
      raids: calculateUsagePercent(usage.liveRaids, limits.raids),
      providers: calculateUsagePercent(usage.providers, limits.providers),
      seats: calculateUsagePercent(usage.billableSeats, limits.seats),
    };

    const usagePressure = pickUsagePressure([
      resolveBillingUsagePressure(usage.projects, limits.projects),
      resolveBillingUsagePressure(usage.activeCampaigns, limits.campaigns),
      resolveBillingUsagePressure(usage.liveQuests, limits.quests),
      resolveBillingUsagePressure(usage.liveRaids, limits.raids),
      resolveBillingUsagePressure(usage.providers, limits.providers),
      resolveBillingUsagePressure(usage.billableSeats, limits.seats),
    ]);

    const activationStatus = deriveActivationStatus({
      account,
      onboarding,
      projectIds,
    });
    const collectionStatus = deriveCollectionStatus({
      invoices: accountInvoices,
      subscription,
    });
    const commercialHealth = deriveCommercialHealth({
      collectionStatus,
      usagePressure,
      activationStatus,
      billingProfile,
      subscription,
    });

    const openInvoices = accountInvoices.filter(
      (invoice) => invoice.status === "open" || invoice.status === "uncollectible"
    );
    const currentMrrContribution =
      plan && !plan.isFreeTier && subscription && ["active", "past_due", "grace", "enterprise_managed"].includes(subscription.status)
        ? plan.priceMonthly
        : 0;

    return {
      accountId: account.id,
      accountName: account.name,
      planId: plan?.id ?? "free",
      planName: plan?.name ?? "Free",
      billingStatus: subscription?.status ?? "free",
      commercialHealth,
      activationStatus,
      collectionStatus,
      paymentMethodStatus: billingProfile?.payment_method_status ?? "missing",
      currentMrrContribution,
      nextBillingAt:
        subscription?.current_period_end ??
        subscription?.trial_ends_at ??
        entitlements?.grace_until ??
        null,
      usagePressure,
      usage,
      usagePercents,
      limits,
      openInvoiceCount: openInvoices.length,
      amountRemaining: openInvoices.reduce((sum, invoice) => sum + invoice.amount_remaining, 0),
    } satisfies BusinessControlAccountSummary;
  });

  const now = Date.now();
  const currentMonthPaidInvoices = ((invoicesResponse.data ?? []) as DbCustomerAccountInvoice[]).filter(
    (invoice) => invoice.paid_at && new Date(invoice.paid_at).getTime() >= startOfMonth.getTime()
  );

  const grossCollectedThisMonth = currentMonthPaidInvoices.reduce(
    (sum, invoice) => sum + invoice.amount_paid,
    0
  );
  const refundTotalThisMonth = currentMonthPaidInvoices.reduce(
    (sum, invoice) => sum + invoice.refunded_amount,
    0
  );

  const planMix = plans.map((plan) => ({
    planId: plan.id,
    label: plan.name,
    count: accounts.filter((account) => account.planId === plan.id).length,
  }));

  const activePaidAccounts = accounts.filter(
    (account) =>
      account.planId !== "free" &&
      ["active", "past_due", "grace", "enterprise_managed"].includes(account.billingStatus)
  ).length;
  const trialingAccounts = accounts.filter((account) => account.billingStatus === "trialing").length;
  const freeAccounts = accounts.filter((account) => account.planId === "free").length;

  return {
    revenue: {
      mrr: accounts.reduce((sum, account) => sum + account.currentMrrContribution, 0),
      arrRunRate: accounts.reduce((sum, account) => sum + account.currentMrrContribution, 0) * 12,
      activePaidAccounts,
      trialingAccounts,
      freeAccounts,
      newConversions: accounts.filter(
        (account) =>
          account.planId !== "free" &&
          account.billingStatus !== "trialing" &&
          account.nextBillingAt &&
          now - new Date(account.nextBillingAt).getTime() <= 30 * MS_IN_DAY
      ).length,
      upgrades: Array.from(eventsByAccountId.values()).flat().filter((event) => event.event_type === "plan_changed").length,
      downgrades: 0,
      churnedAccounts: Array.from(eventsByAccountId.values())
        .flat()
        .filter((event) => event.event_type === "subscription_canceled").length,
    },
    collections: {
      grossCollectedThisMonth,
      refundTotalThisMonth,
      netCollectedThisMonth: grossCollectedThisMonth - refundTotalThisMonth,
      pastDueExposure: accounts.reduce((sum, account) => sum + account.amountRemaining, 0),
      upcomingRenewals: accounts.filter((account) => {
        if (!account.nextBillingAt) {
          return false;
        }

        const nextBillingTime = new Date(account.nextBillingAt).getTime();
        return nextBillingTime >= now && nextBillingTime <= now + 14 * MS_IN_DAY;
      }).length,
      failedPaymentCount: ((invoicesResponse.data ?? []) as DbCustomerAccountInvoice[]).filter(
        (invoice) => invoice.collection_status === "payment_failed"
      ).length,
    },
    growthPressure: {
      nearProjectLimit: accounts.filter((account) => account.usagePercents.projects >= 70).length,
      nearCampaignLimit: accounts.filter((account) => account.usagePercents.campaigns >= 70).length,
      nearQuestLimit: accounts.filter((account) => account.usagePercents.quests >= 70).length,
      nearRaidLimit: accounts.filter((account) => account.usagePercents.raids >= 70).length,
      nearSeatLimit: accounts.filter((account) => account.usagePercents.seats >= 70).length,
      nearProviderLimit: accounts.filter((account) => account.usagePercents.providers >= 70).length,
    },
    health: {
      accountsWithoutFirstProject: accounts.filter((account) => account.usage.projects === 0).length,
      accountsWithoutFirstLiveCampaign: accounts.filter(
        (account) => account.usage.projects > 0 && account.usage.activeCampaigns === 0
      ).length,
      paidButUnderusedAccounts: accounts.filter(
        (account) =>
          account.planId !== "free" &&
          ["active", "past_due", "grace", "enterprise_managed"].includes(account.billingStatus) &&
          account.usage.activeCampaigns === 0 &&
          account.usage.liveQuests === 0 &&
          account.usage.liveRaids === 0
      ).length,
      graceStateAccounts: accounts.filter((account) => account.billingStatus === "grace").length,
      accountsBlockedByEntitlement: accounts.filter((account) => account.usagePressure === "blocked").length,
      enterpriseReviewAccounts: accounts.filter((account) => account.planId === "enterprise").length,
    },
    queues: {
      failedPayments: accounts.filter((account) => account.collectionStatus === "payment_failed"),
      pastDueAndGrace: accounts.filter((account) =>
        ["past_due", "grace"].includes(account.billingStatus)
      ),
      upgradeCandidates: accounts.filter((account) =>
        ["upgrade_ready", "blocked"].includes(account.commercialHealth)
      ),
      activationBlockers: accounts.filter((account) =>
        ["created", "workspace_ready", "stalled"].includes(account.activationStatus)
      ),
      accountsNeedingReview: accounts.filter((account) =>
        ["payment_risk", "churn_risk", "blocked"].includes(account.commercialHealth)
      ),
    },
    planMix,
    accounts: accounts.sort((a, b) => {
      const priorityRank = (value: AdminCommercialHealthStatus) => {
        switch (value) {
          case "blocked":
            return 0;
          case "payment_risk":
            return 1;
          case "upgrade_ready":
            return 2;
          case "churn_risk":
            return 3;
          case "watching":
            return 4;
          default:
            return 5;
        }
      };

      return priorityRank(a.commercialHealth) - priorityRank(b.commercialHealth);
    }),
  } satisfies BusinessControlOverview;
}

export async function loadBusinessControlAccountDetail(accountId: string) {
  const [overview, workspace, billingEvents, businessNotes] = await Promise.all([
    loadBusinessControlOverview(),
    loadPortalCustomerBillingWorkspace(accountId),
    loadBusinessAccountEvents(accountId),
    loadBusinessAccountNotes(accountId),
  ]);

  const account = overview.accounts.find((entry) => entry.accountId === accountId);
  if (!account) {
    throw new Error("Business account detail was not found.");
  }

  return {
    account,
    workspace,
    billingEvents,
    businessNotes,
  } satisfies BusinessControlAccountDetail;
}
