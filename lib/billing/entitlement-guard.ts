import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { loadPortalCustomerBillingWorkspace } from "@/lib/billing/account-billing";
import {
  BillingLimitError,
  buildBillingActionHrefs,
  type BillingGrowthAction,
  type BillingLimitBlock,
  type BillingUsageKey,
} from "@/lib/billing/entitlement-blocks";
import { calculateUsagePercent } from "@/lib/billing/billing-entitlements";

const portalUrl = (
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://crypto-raid-admin-portal.vercel.app"
).replace(/\/+$/, "");

function normalizeReturnTo(returnTo?: string | null) {
  const value = returnTo?.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${portalUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatUsageLabel(usageKey: BillingUsageKey) {
  switch (usageKey) {
    case "projects":
      return "project";
    case "campaigns":
      return "active campaign";
    case "quests":
      return "live quest";
    case "raids":
      return "live raid";
    case "providers":
      return "connected provider";
    case "seats":
      return "billable seat";
    default:
      return "capacity item";
  }
}

function formatActionLabel(growthAction: BillingGrowthAction) {
  switch (growthAction) {
    case "create_project":
      return "creating another project";
    case "publish_campaign":
      return "pushing another campaign live";
    case "activate_quest":
      return "making another quest live";
    case "activate_raid":
      return "starting another live raid";
    case "connect_provider":
      return "connecting another provider";
    case "invite_billable_seat":
      return "adding another billable teammate";
    default:
      return "continuing this action";
  }
}

function buildBillingLimitMessage(params: {
  usageKey: BillingUsageKey;
  growthAction: BillingGrowthAction;
  limit: number;
  nextPlanName: string | null;
}) {
  const usageLabel = formatUsageLabel(params.usageKey);
  const actionLabel = formatActionLabel(params.growthAction);
  const upgradeLabel = params.nextPlanName
    ? `Upgrade to ${params.nextPlanName} to keep going.`
    : "Upgrade the workspace to keep going.";

  return `This workspace is already at its ${params.limit} ${usageLabel}${
    params.limit === 1 ? "" : "s"
  } limit. Finish billing before ${actionLabel}. ${upgradeLabel}`;
}

function createBillingLimitBlock(params: {
  accountId: string;
  accountName: string;
  currentPlanId: string;
  currentPlanName: string;
  nextPlanId: string | null;
  nextPlanName: string | null;
  isEnterpriseNextPlan: boolean;
  usageKey: BillingUsageKey;
  growthAction: BillingGrowthAction;
  current: number;
  projectedCurrent: number;
  limit: number;
  pricingUrl: string;
  supportUrl: string;
  returnTo?: string | null;
}) {
  const normalizedReturnTo = normalizeReturnTo(params.returnTo);
  const { upgradeUrl, payAndContinueUrl } = buildBillingActionHrefs({
    accountId: params.accountId,
    pricingUrl: params.pricingUrl,
    supportUrl: params.supportUrl,
    nextPlanId: params.nextPlanId,
    isEnterpriseNextPlan: params.isEnterpriseNextPlan,
    usageKey: params.usageKey,
    growthAction: params.growthAction,
    returnTo: normalizedReturnTo,
  });

  return {
    code: "billing_limit_reached",
    accountId: params.accountId,
    accountName: params.accountName,
    usageKey: params.usageKey,
    growthAction: params.growthAction,
    currentPlanId: params.currentPlanId,
    currentPlanName: params.currentPlanName,
    nextPlanId: params.nextPlanId,
    nextPlanName: params.nextPlanName,
    current: params.current,
    projectedCurrent: params.projectedCurrent,
    limit: params.limit,
    percent: calculateUsagePercent(params.projectedCurrent, params.limit),
    message: buildBillingLimitMessage({
      usageKey: params.usageKey,
      growthAction: params.growthAction,
      limit: params.limit,
      nextPlanName: params.nextPlanName,
    }),
    pricingUrl: params.pricingUrl,
    supportUrl: params.supportUrl,
    upgradeUrl,
    payAndContinueUrl,
    returnTo: normalizedReturnTo,
  } satisfies BillingLimitBlock;
}

export async function requireAccountGrowthCapacity(params: {
  accountId: string;
  usageKey: BillingUsageKey;
  growthAction: BillingGrowthAction;
  increment?: number;
  returnTo?: string | null;
}) {
  const workspace = await loadPortalCustomerBillingWorkspace(params.accountId);
  const usageItem = workspace.usage.find((item) => item.key === params.usageKey);
  const increment = Math.max(1, params.increment ?? 1);

  if (!usageItem) {
    return workspace;
  }

  const projectedCurrent = usageItem.current + increment;
  if (projectedCurrent <= usageItem.limit) {
    return workspace;
  }

  throw new BillingLimitError(
    createBillingLimitBlock({
      accountId: workspace.accountId,
      accountName: workspace.accountName,
      currentPlanId: workspace.currentPlan?.id ?? "free",
      currentPlanName: workspace.currentPlan?.name ?? "Free",
      nextPlanId: workspace.nextPlan?.id ?? null,
      nextPlanName: workspace.nextPlan?.name ?? null,
      isEnterpriseNextPlan: workspace.nextPlan?.isEnterprise ?? false,
      usageKey: params.usageKey,
      growthAction: params.growthAction,
      current: usageItem.current,
      projectedCurrent,
      limit: usageItem.limit,
      pricingUrl: workspace.pricingUrl,
      supportUrl: workspace.supportUrl,
      returnTo: params.returnTo,
    })
  );
}

export async function requireProjectGrowthCapacity(params: {
  projectId: string;
  usageKey: Exclude<BillingUsageKey, "projects" | "seats">;
  growthAction: Exclude<BillingGrowthAction, "create_project" | "invite_billable_seat">;
  increment?: number;
  returnTo?: string | null;
}) {
  const supabase = getAccountsServiceClient();
  const projectResponse = await supabase
    .from("projects")
    .select("customer_account_id")
    .eq("id", params.projectId)
    .maybeSingle();

  if (projectResponse.error) {
    throw new Error(projectResponse.error.message || "Could not resolve project workspace.");
  }

  const accountId =
    projectResponse.data && typeof projectResponse.data.customer_account_id === "string"
      ? projectResponse.data.customer_account_id
      : null;

  if (!accountId) {
    return null;
  }

  return requireAccountGrowthCapacity({
    accountId,
    usageKey: params.usageKey,
    growthAction: params.growthAction,
    increment: params.increment,
    returnTo: params.returnTo,
  });
}
