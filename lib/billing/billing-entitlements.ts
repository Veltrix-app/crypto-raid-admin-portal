import type { AdminCustomerAccountRole } from "@/types/entities/account";
import type { AdminBillingPlan } from "@/types/entities/billing-plan";
import type { AdminCustomerAccountEntitlements } from "@/types/entities/billing-subscription";

export const BILLABLE_ACCOUNT_ROLES: AdminCustomerAccountRole[] = [
  "owner",
  "admin",
  "member",
];

export const BILLING_USAGE_THRESHOLDS = {
  info: 70,
  upgrade: 85,
  block: 100,
} as const;

export type BillingUsagePressure =
  | "comfortable"
  | "watching"
  | "upgrade_recommended"
  | "blocked";

export function isBillableAccountRole(role: string): role is AdminCustomerAccountRole {
  return BILLABLE_ACCOUNT_ROLES.includes(role as AdminCustomerAccountRole);
}

export function calculateUsagePercent(current: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / limit) * 100)));
}

export function resolveBillingUsagePressure(current: number, limit: number): BillingUsagePressure {
  const percent = calculateUsagePercent(current, limit);

  if (percent >= BILLING_USAGE_THRESHOLDS.block) {
    return "blocked";
  }

  if (percent >= BILLING_USAGE_THRESHOLDS.upgrade) {
    return "upgrade_recommended";
  }

  if (percent >= BILLING_USAGE_THRESHOLDS.info) {
    return "watching";
  }

  return "comfortable";
}

export function resolveNextPlanId(planId: string) {
  switch (planId) {
    case "free":
      return "starter";
    case "starter":
      return "growth";
    case "growth":
      return "enterprise";
    default:
      return null;
  }
}

export function buildEntitlementsFromPlan(
  plan: AdminBillingPlan,
  usage?: Partial<
    Pick<
      AdminCustomerAccountEntitlements,
      | "currentProjects"
      | "currentActiveCampaigns"
      | "currentLiveQuests"
      | "currentLiveRaids"
      | "currentProviders"
      | "currentBillableSeats"
    >
  >
): AdminCustomerAccountEntitlements {
  return {
    customerAccountId: "",
    billingPlanId: plan.id,
    maxProjects: plan.projectsLimit,
    maxActiveCampaigns: plan.campaignsLimit,
    maxLiveQuests: plan.questsLimit,
    maxLiveRaids: plan.raidsLimit,
    maxProviders: plan.providersLimit,
    includedBillableSeats: plan.includedBillableSeats,
    currentProjects: usage?.currentProjects ?? 0,
    currentActiveCampaigns: usage?.currentActiveCampaigns ?? 0,
    currentLiveQuests: usage?.currentLiveQuests ?? 0,
    currentLiveRaids: usage?.currentLiveRaids ?? 0,
    currentProviders: usage?.currentProviders ?? 0,
    currentBillableSeats: usage?.currentBillableSeats ?? 0,
    warningThresholdInfo: BILLING_USAGE_THRESHOLDS.info,
    warningThresholdUpgrade: BILLING_USAGE_THRESHOLDS.upgrade,
    blockThreshold: BILLING_USAGE_THRESHOLDS.block,
    selfServeAllowed: plan.isSelfServe,
    enterpriseManaged: plan.isEnterprise,
    metadata: {
      source: "plan-catalog",
    },
  };
}
