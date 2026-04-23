export type AdminBillingPlanKey = "free" | "starter" | "growth" | "enterprise";

export type AdminBillingSubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "grace"
  | "canceled"
  | "enterprise_managed";

export type AdminBillingPaymentMethodStatus =
  | "missing"
  | "ready"
  | "requires_attention";

export type AdminBillingCollectionStatus =
  | "clear"
  | "renewing_soon"
  | "payment_failed"
  | "action_required"
  | "refunded";

export type AdminBillingEventSource =
  | "stripe_webhook"
  | "portal_admin"
  | "system"
  | "customer";

export type AdminBillingEventType =
  | "profile_created"
  | "subscription_started"
  | "subscription_updated"
  | "subscription_canceled"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_payment_failed"
  | "trial_extended"
  | "grace_extended"
  | "plan_changed"
  | "enterprise_managed_set"
  | "billing_synced"
  | "business_note_added";

export type AdminBusinessNoteType =
  | "general"
  | "upgrade_candidate"
  | "churn_risk"
  | "follow_up"
  | "billing_exception";

export type AdminBusinessNoteStatus = "open" | "resolved" | "archived";

export type AdminCommercialHealthStatus =
  | "healthy"
  | "watching"
  | "upgrade_ready"
  | "payment_risk"
  | "churn_risk"
  | "blocked";

export type AdminActivationStatus =
  | "created"
  | "workspace_ready"
  | "first_project_created"
  | "launch_setup_started"
  | "live"
  | "stalled";

export type AdminCustomerAccountBillingProfile = {
  customerAccountId: string;
  billingEmail: string;
  stripeCustomerId?: string;
  stripeDefaultPaymentMethodId?: string;
  currency: "eur";
  countryCode?: string;
  paymentMethodStatus: AdminBillingPaymentMethodStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountSubscription = {
  id: string;
  customerAccountId: string;
  billingPlanId: AdminBillingPlanKey | string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: AdminBillingSubscriptionStatus;
  isCurrent: boolean;
  startedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  cancelAt?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
  endedAt?: string;
  graceUntil?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountInvoice = {
  id: string;
  customerAccountId: string;
  customerAccountSubscriptionId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  invoiceNumber?: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  collectionStatus: AdminBillingCollectionStatus;
  currency: "eur";
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  refundedAmount: number;
  dueAt?: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  invoicePdfUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountEntitlements = {
  customerAccountId: string;
  billingPlanId: AdminBillingPlanKey | string;
  customerAccountSubscriptionId?: string;
  maxProjects: number;
  maxActiveCampaigns: number;
  maxLiveQuests: number;
  maxLiveRaids: number;
  maxProviders: number;
  includedBillableSeats: number;
  currentProjects: number;
  currentActiveCampaigns: number;
  currentLiveQuests: number;
  currentLiveRaids: number;
  currentProviders: number;
  currentBillableSeats: number;
  warningThresholdInfo: number;
  warningThresholdUpgrade: number;
  blockThreshold: number;
  selfServeAllowed: boolean;
  enterpriseManaged: boolean;
  graceUntil?: string;
  lastComputedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountBillingEvent = {
  id: string;
  customerAccountId: string;
  customerAccountSubscriptionId?: string;
  customerAccountInvoiceId?: string;
  eventSource: AdminBillingEventSource;
  eventType: AdminBillingEventType;
  stripeEventId?: string;
  actorAuthUserId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type AdminCustomerAccountBusinessNote = {
  id: string;
  customerAccountId: string;
  authorAuthUserId?: string;
  ownerAuthUserId?: string;
  noteType: AdminBusinessNoteType;
  status: AdminBusinessNoteStatus;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
};
