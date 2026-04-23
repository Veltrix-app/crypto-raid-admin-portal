export type BillingUsageKey =
  | "projects"
  | "campaigns"
  | "quests"
  | "raids"
  | "providers"
  | "seats";

export type BillingGrowthAction =
  | "create_project"
  | "publish_campaign"
  | "activate_quest"
  | "activate_raid"
  | "connect_provider"
  | "invite_billable_seat";

export type BillingLimitBlock = {
  code: "billing_limit_reached";
  accountId: string;
  accountName: string;
  usageKey: BillingUsageKey;
  growthAction: BillingGrowthAction;
  currentPlanId: string;
  currentPlanName: string;
  nextPlanId: string | null;
  nextPlanName: string | null;
  current: number;
  projectedCurrent: number;
  limit: number;
  percent: number;
  message: string;
  pricingUrl: string;
  supportUrl: string;
  upgradeUrl: string | null;
  payAndContinueUrl: string | null;
  returnTo: string | null;
};

export class BillingLimitError extends Error {
  readonly block: BillingLimitBlock;

  constructor(block: BillingLimitBlock) {
    super(block.message);
    this.name = "BillingLimitError";
    this.block = block;
  }
}

export function isBillingLimitError(error: unknown): error is BillingLimitError {
  return error instanceof BillingLimitError;
}

export function isBillingLimitBlockPayload(
  payload: unknown
): payload is { ok?: false; error?: string; block: BillingLimitBlock } {
  if (!payload || typeof payload !== "object" || !("block" in payload)) {
    return false;
  }

  const block = (payload as { block?: BillingLimitBlock }).block;
  return Boolean(block && block.code === "billing_limit_reached");
}

export function buildBillingActionHrefs(params: {
  accountId: string;
  pricingUrl: string;
  supportUrl: string;
  nextPlanId: string | null;
  isEnterpriseNextPlan: boolean;
  usageKey: BillingUsageKey;
  growthAction: BillingGrowthAction;
  returnTo?: string | null;
}) {
  const targetUrl = new URL(
    params.isEnterpriseNextPlan ? params.supportUrl : params.pricingUrl
  );

  if (!params.isEnterpriseNextPlan && params.nextPlanId) {
    targetUrl.searchParams.set("plan", params.nextPlanId);
  }

  targetUrl.searchParams.set("accountId", params.accountId);
  targetUrl.searchParams.set("intent", "pay_and_continue");
  targetUrl.searchParams.set("metric", params.usageKey);
  targetUrl.searchParams.set("action", params.growthAction);

  if (params.returnTo) {
    targetUrl.searchParams.set("returnTo", params.returnTo);
  }

  return {
    upgradeUrl: targetUrl.toString(),
    payAndContinueUrl: targetUrl.toString(),
  };
}

export async function readBillingAwareJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (isBillingLimitBlockPayload(payload)) {
    throw new BillingLimitError(payload.block);
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallbackMessage
    );
  }

  return payload as T;
}
