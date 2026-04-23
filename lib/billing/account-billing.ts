import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import {
  calculateUsagePercent,
  isBillableAccountRole,
  resolveBillingUsagePressure,
  resolveNextPlanId,
  type BillingUsagePressure,
} from "@/lib/billing/billing-entitlements";
import type { AdminBillingPlan } from "@/types/entities/billing-plan";
import type {
  AdminCustomerAccountBillingProfile,
  AdminCustomerAccountEntitlements,
  AdminCustomerAccountInvoice,
  AdminCustomerAccountSubscription,
} from "@/types/entities/billing-subscription";
import type {
  DbBillingPlan,
  DbCustomerAccountBillingProfile,
  DbCustomerAccountEntitlement,
  DbCustomerAccountInvoice,
  DbCustomerAccountSubscription,
} from "@/types/database";

type BillingUsageKey =
  | "projects"
  | "campaigns"
  | "quests"
  | "raids"
  | "providers"
  | "seats";

type MinimalAccountRow = {
  id: string;
  name: string;
};

type MinimalMembershipRow = {
  role: string;
  status: string;
};

type MinimalProjectRow = {
  id: string;
};

type MinimalStatusRow = {
  status: string;
};

type MinimalIntegrationRow = {
  status: string;
  provider: string | null;
};

export type PortalBillingUsageItem = {
  key: BillingUsageKey;
  label: string;
  hint: string;
  current: number;
  limit: number;
  percent: number;
  pressure: BillingUsagePressure;
};

export type PortalCustomerBillingWorkspace = {
  accountId: string;
  accountName: string;
  currentPlan: AdminBillingPlan | null;
  nextPlan: AdminBillingPlan | null;
  plans: AdminBillingPlan[];
  billingProfile: AdminCustomerAccountBillingProfile | null;
  subscription: AdminCustomerAccountSubscription | null;
  entitlements: AdminCustomerAccountEntitlements | null;
  invoices: AdminCustomerAccountInvoice[];
  usage: PortalBillingUsageItem[];
  overallPressure: BillingUsagePressure;
  recommendedAction: string;
  pricingUrl: string;
  upgradeUrl: string | null;
  supportUrl: string;
};

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://veltrix-web.vercel.app").replace(
  /\/+$/,
  ""
);

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

function mapBillingProfile(
  row: DbCustomerAccountBillingProfile | null
): AdminCustomerAccountBillingProfile | null {
  if (!row) {
    return null;
  }

  return {
    customerAccountId: row.customer_account_id,
    billingEmail: row.billing_email,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeDefaultPaymentMethodId: row.stripe_default_payment_method_id ?? undefined,
    currency: "eur",
    countryCode: row.country_code ?? undefined,
    paymentMethodStatus: row.payment_method_status,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubscription(
  row: DbCustomerAccountSubscription | null
): AdminCustomerAccountSubscription | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    billingPlanId: row.billing_plan_id,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    status: row.status,
    isCurrent: row.is_current,
    startedAt: row.started_at,
    currentPeriodStart: row.current_period_start ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    trialStartedAt: row.trial_started_at ?? undefined,
    trialEndsAt: row.trial_ends_at ?? undefined,
    cancelAt: row.cancel_at ?? undefined,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    graceUntil: row.grace_until ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntitlements(
  row: DbCustomerAccountEntitlement | null
): AdminCustomerAccountEntitlements | null {
  if (!row) {
    return null;
  }

  return {
    customerAccountId: row.customer_account_id,
    billingPlanId: row.billing_plan_id,
    customerAccountSubscriptionId: row.customer_account_subscription_id ?? undefined,
    maxProjects: row.max_projects,
    maxActiveCampaigns: row.max_active_campaigns,
    maxLiveQuests: row.max_live_quests,
    maxLiveRaids: row.max_live_raids,
    maxProviders: row.max_providers,
    includedBillableSeats: row.included_billable_seats,
    currentProjects: row.current_projects,
    currentActiveCampaigns: row.current_active_campaigns,
    currentLiveQuests: row.current_live_quests,
    currentLiveRaids: row.current_live_raids,
    currentProviders: row.current_providers,
    currentBillableSeats: row.current_billable_seats,
    warningThresholdInfo: row.warning_threshold_info,
    warningThresholdUpgrade: row.warning_threshold_upgrade,
    blockThreshold: row.block_threshold,
    selfServeAllowed: row.self_serve_allowed,
    enterpriseManaged: row.enterprise_managed,
    graceUntil: row.grace_until ?? undefined,
    lastComputedAt: row.last_computed_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row: DbCustomerAccountInvoice): AdminCustomerAccountInvoice {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    customerAccountSubscriptionId: row.customer_account_subscription_id ?? undefined,
    stripeInvoiceId: row.stripe_invoice_id ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    status: row.status,
    collectionStatus: row.collection_status,
    currency: "eur",
    subtotalAmount: row.subtotal_amount,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    amountPaid: row.amount_paid,
    amountRemaining: row.amount_remaining,
    refundedAmount: row.refunded_amount,
    dueAt: row.due_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    hostedInvoiceUrl: row.hosted_invoice_url ?? undefined,
    invoicePdfUrl: row.invoice_pdf_url ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deriveUsageItem(params: {
  key: BillingUsageKey;
  label: string;
  hint: string;
  current: number;
  limit: number;
}) {
  const percent = calculateUsagePercent(params.current, params.limit);
  const pressure = resolveBillingUsagePressure(params.current, params.limit);

  return {
    key: params.key,
    label: params.label,
    hint: params.hint,
    current: params.current,
    limit: params.limit,
    percent,
    pressure,
  } satisfies PortalBillingUsageItem;
}

function pickOverallPressure(usage: PortalBillingUsageItem[]) {
  if (usage.some((item) => item.pressure === "blocked")) {
    return "blocked" as const;
  }

  if (usage.some((item) => item.pressure === "upgrade_recommended")) {
    return "upgrade_recommended" as const;
  }

  if (usage.some((item) => item.pressure === "watching")) {
    return "watching" as const;
  }

  return "comfortable" as const;
}

function deriveRecommendedAction(params: {
  overallPressure: BillingUsagePressure;
  nextPlan: AdminBillingPlan | null;
  billingProfile: AdminCustomerAccountBillingProfile | null;
  subscription: AdminCustomerAccountSubscription | null;
}) {
  if (
    params.billingProfile?.paymentMethodStatus === "missing" &&
    params.subscription &&
    params.subscription.billingPlanId !== "free"
  ) {
    return "Add a payment method before the next renewal window so the workspace does not slide into payment risk.";
  }

  if (params.overallPressure === "blocked" && params.nextPlan) {
    return `Capacity is already blocking new growth. Move this workspace to ${params.nextPlan.name} before the next builder action stalls.`;
  }

  if (params.overallPressure === "upgrade_recommended" && params.nextPlan) {
    return `This workspace is pushing hard into its current limits. ${params.nextPlan.name} is the clean next step.`;
  }

  if (params.subscription?.status === "trialing") {
    return "Use the trial window to validate the first live workflow and line up the next plan before usage pressure arrives.";
  }

  return "The current plan still fits the workspace posture. Keep watching usage pressure and invoice health as volume grows.";
}

export async function loadPortalCustomerBillingWorkspace(accountId: string) {
  const supabase = getAccountsServiceClient();

  const [
    accountResponse,
    billingProfileResponse,
    subscriptionResponse,
    entitlementResponse,
    invoiceResponse,
    billingPlansResponse,
    membershipResponse,
    projectsResponse,
  ] = await Promise.all([
    supabase.from("customer_accounts").select("id, name").eq("id", accountId).maybeSingle(),
    supabase
      .from("customer_account_billing_profiles")
      .select(
        "customer_account_id, billing_email, stripe_customer_id, stripe_default_payment_method_id, currency, country_code, payment_method_status, metadata, created_at, updated_at"
      )
      .eq("customer_account_id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_subscriptions")
      .select(
        "id, customer_account_id, billing_plan_id, stripe_customer_id, stripe_subscription_id, status, is_current, started_at, current_period_start, current_period_end, trial_started_at, trial_ends_at, cancel_at, cancel_at_period_end, canceled_at, ended_at, grace_until, metadata, created_at, updated_at"
      )
      .eq("customer_account_id", accountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_entitlements")
      .select(
        "customer_account_id, billing_plan_id, customer_account_subscription_id, max_projects, max_active_campaigns, max_live_quests, max_live_raids, max_providers, included_billable_seats, current_projects, current_active_campaigns, current_live_quests, current_live_raids, current_providers, current_billable_seats, warning_threshold_info, warning_threshold_upgrade, block_threshold, self_serve_allowed, enterprise_managed, grace_until, last_computed_at, metadata, created_at, updated_at"
      )
      .eq("customer_account_id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_invoices")
      .select(
        "id, customer_account_id, customer_account_subscription_id, stripe_invoice_id, stripe_payment_intent_id, invoice_number, status, collection_status, currency, subtotal_amount, tax_amount, total_amount, amount_paid, amount_remaining, refunded_amount, due_at, paid_at, hosted_invoice_url, invoice_pdf_url, metadata, created_at, updated_at"
      )
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("billing_plans")
      .select(
        "id, name, price_monthly, projects_limit, campaigns_limit, quests_limit, raids_limit, providers_limit, included_billable_seats, features, current, sort_order, trial_days, currency, billing_interval, is_public, is_self_serve, is_checkout_enabled, is_free_tier, is_enterprise, feature_flags, entitlement_metadata, stripe_product_id, stripe_monthly_price_id"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("customer_account_memberships")
      .select("role, status")
      .eq("customer_account_id", accountId)
      .eq("status", "active"),
    supabase.from("projects").select("id").eq("customer_account_id", accountId),
  ]);

  if (accountResponse.error || !accountResponse.data) {
    throw new Error(accountResponse.error?.message || "Billing workspace account was not found.");
  }

  if (billingProfileResponse.error) {
    throw new Error(billingProfileResponse.error.message || "Failed to load billing profile.");
  }

  if (subscriptionResponse.error) {
    throw new Error(subscriptionResponse.error.message || "Failed to load subscription.");
  }

  if (entitlementResponse.error) {
    throw new Error(entitlementResponse.error.message || "Failed to load entitlements.");
  }

  if (invoiceResponse.error) {
    throw new Error(invoiceResponse.error.message || "Failed to load invoices.");
  }

  if (billingPlansResponse.error) {
    throw new Error(billingPlansResponse.error.message || "Failed to load billing plans.");
  }

  if (membershipResponse.error) {
    throw new Error(membershipResponse.error.message || "Failed to load account members.");
  }

  if (projectsResponse.error) {
    throw new Error(projectsResponse.error.message || "Failed to load account projects.");
  }

  const account = accountResponse.data as MinimalAccountRow;
  const billingProfile = mapBillingProfile(
    (billingProfileResponse.data as DbCustomerAccountBillingProfile | null) ?? null
  );
  const subscription = mapSubscription(
    (subscriptionResponse.data as DbCustomerAccountSubscription | null) ?? null
  );
  const storedEntitlements = mapEntitlements(
    (entitlementResponse.data as DbCustomerAccountEntitlement | null) ?? null
  );
  const invoices = ((invoiceResponse.data ?? []) as DbCustomerAccountInvoice[]).map(mapInvoice);
  const plans = ((billingPlansResponse.data ?? []) as DbBillingPlan[]).map(mapBillingPlan);
  const memberships = (membershipResponse.data ?? []) as MinimalMembershipRow[];
  const projects = (projectsResponse.data ?? []) as MinimalProjectRow[];

  const projectIds = projects.map((project) => project.id);

  const [campaignsResponse, questsResponse, raidsResponse, integrationsResponse] =
    projectIds.length > 0
      ? await Promise.all([
          supabase.from("campaigns").select("status").in("project_id", projectIds),
          supabase.from("quests").select("status").in("project_id", projectIds),
          supabase.from("raids").select("status").in("project_id", projectIds),
          supabase
            .from("project_integrations")
            .select("status, provider")
            .in("project_id", projectIds)
            .eq("status", "connected"),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (campaignsResponse.error) {
    throw new Error(campaignsResponse.error.message || "Failed to load campaigns.");
  }

  if (questsResponse.error) {
    throw new Error(questsResponse.error.message || "Failed to load quests.");
  }

  if (raidsResponse.error) {
    throw new Error(raidsResponse.error.message || "Failed to load raids.");
  }

  if (integrationsResponse.error) {
    throw new Error(integrationsResponse.error.message || "Failed to load provider connections.");
  }

  const currentProjects = projects.length;
  const currentActiveCampaigns = ((campaignsResponse.data ?? []) as MinimalStatusRow[]).filter(
    (item) => item.status === "active"
  ).length;
  const currentLiveQuests = ((questsResponse.data ?? []) as MinimalStatusRow[]).filter(
    (item) => item.status === "active"
  ).length;
  const currentLiveRaids = ((raidsResponse.data ?? []) as MinimalStatusRow[]).filter(
    (item) => item.status === "active"
  ).length;
  const currentProviders = new Set(
    ((integrationsResponse.data ?? []) as MinimalIntegrationRow[])
      .filter((item) => item.status === "connected" && typeof item.provider === "string")
      .map((item) => item.provider)
  ).size;
  const currentBillableSeats = memberships.filter((membership) =>
    isBillableAccountRole(membership.role)
  ).length;

  const currentPlanId =
    subscription?.billingPlanId ??
    storedEntitlements?.billingPlanId ??
    (billingProfile?.stripeCustomerId ? "starter" : "free");
  const currentPlan = plans.find((plan) => plan.id === currentPlanId) ?? null;
  const nextPlan =
    currentPlan?.id ? plans.find((plan) => plan.id === resolveNextPlanId(currentPlan.id)) ?? null : null;

  const entitlements: AdminCustomerAccountEntitlements | null =
    currentPlan || storedEntitlements
      ? {
          customerAccountId: account.id,
          billingPlanId: currentPlan?.id ?? storedEntitlements?.billingPlanId ?? "free",
          customerAccountSubscriptionId:
            storedEntitlements?.customerAccountSubscriptionId ?? subscription?.id ?? undefined,
          maxProjects: storedEntitlements?.maxProjects ?? currentPlan?.projectsLimit ?? 1,
          maxActiveCampaigns:
            storedEntitlements?.maxActiveCampaigns ?? currentPlan?.campaignsLimit ?? 1,
          maxLiveQuests: storedEntitlements?.maxLiveQuests ?? currentPlan?.questsLimit ?? 10,
          maxLiveRaids: storedEntitlements?.maxLiveRaids ?? currentPlan?.raidsLimit ?? 1,
          maxProviders: storedEntitlements?.maxProviders ?? currentPlan?.providersLimit ?? 1,
          includedBillableSeats:
            storedEntitlements?.includedBillableSeats ?? currentPlan?.includedBillableSeats ?? 2,
          currentProjects,
          currentActiveCampaigns,
          currentLiveQuests,
          currentLiveRaids,
          currentProviders,
          currentBillableSeats,
          warningThresholdInfo: storedEntitlements?.warningThresholdInfo ?? 70,
          warningThresholdUpgrade: storedEntitlements?.warningThresholdUpgrade ?? 85,
          blockThreshold: storedEntitlements?.blockThreshold ?? 100,
          selfServeAllowed: storedEntitlements?.selfServeAllowed ?? currentPlan?.isSelfServe ?? true,
          enterpriseManaged:
            storedEntitlements?.enterpriseManaged ?? currentPlan?.isEnterprise ?? false,
          graceUntil:
            storedEntitlements?.graceUntil ??
            subscription?.graceUntil ??
            subscription?.currentPeriodEnd,
          lastComputedAt: new Date().toISOString(),
          metadata: storedEntitlements?.metadata ?? { source: "portal_billing_workspace" },
        }
      : null;

  const usage: PortalBillingUsageItem[] = entitlements
    ? [
        deriveUsageItem({
          key: "projects",
          label: "Projects",
          hint: "Workspace-level project inventory counted against the current plan.",
          current: currentProjects,
          limit: entitlements.maxProjects,
        }),
        deriveUsageItem({
          key: "campaigns",
          label: "Active campaigns",
          hint: "Only active campaigns count toward the live campaign ceiling.",
          current: currentActiveCampaigns,
          limit: entitlements.maxActiveCampaigns,
        }),
        deriveUsageItem({
          key: "quests",
          label: "Live quests",
          hint: "Published quest inventory that is currently operator-visible.",
          current: currentLiveQuests,
          limit: entitlements.maxLiveQuests,
        }),
        deriveUsageItem({
          key: "raids",
          label: "Live raids",
          hint: "Concurrent active raids are counted, scheduled drafts are not.",
          current: currentLiveRaids,
          limit: entitlements.maxLiveRaids,
        }),
        deriveUsageItem({
          key: "providers",
          label: "Connected providers",
          hint: "Connected provider types like Discord or Telegram count against provider posture.",
          current: currentProviders,
          limit: entitlements.maxProviders,
        }),
        deriveUsageItem({
          key: "seats",
          label: "Billable seats",
          hint: "Owner, admin and member roles count as billable workspace seats.",
          current: currentBillableSeats,
          limit: entitlements.includedBillableSeats,
        }),
      ]
    : [];

  const overallPressure = pickOverallPressure(usage);
  const pricingUrl = `${appUrl}/pricing?accountId=${account.id}&from=portal-billing`;
  const upgradeUrl = nextPlan
    ? nextPlan.isEnterprise
      ? `${appUrl}/support?intent=enterprise&accountId=${account.id}`
      : `${appUrl}/pricing?accountId=${account.id}&plan=${nextPlan.id}&from=portal-billing`
    : null;

  return {
    accountId: account.id,
    accountName: account.name,
    currentPlan,
    nextPlan,
    plans,
    billingProfile,
    subscription,
    entitlements,
    invoices,
    usage,
    overallPressure,
    recommendedAction: deriveRecommendedAction({
      overallPressure,
      nextPlan,
      billingProfile,
      subscription,
    }),
    pricingUrl,
    upgradeUrl,
    supportUrl: `${appUrl}/support?from=portal-billing`,
  } satisfies PortalCustomerBillingWorkspace;
}
