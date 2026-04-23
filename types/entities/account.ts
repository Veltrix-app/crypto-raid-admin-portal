import type {
  AdminActivationStatus,
  AdminBillingPaymentMethodStatus,
  AdminBillingPlanKey,
  AdminBillingSubscriptionStatus,
  AdminCommercialHealthStatus,
} from "./billing-subscription";

export type AdminCustomerAccountStatus =
  | "pending_verification"
  | "active"
  | "trial"
  | "suspended"
  | "closed";

export type AdminCustomerAccountSourceType =
  | "self_serve"
  | "invite"
  | "internal"
  | "legacy_backfill";

export type AdminCustomerAccountRole =
  | "owner"
  | "admin"
  | "member"
  | "viewer";

export type AdminCustomerAccountMembershipStatus =
  | "pending"
  | "active"
  | "suspended"
  | "revoked";

export type AdminCustomerAccountInviteStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type AdminCustomerAccountOnboardingStatus =
  | "in_progress"
  | "completed"
  | "skipped";

export type AdminCustomerAccountOnboardingStep =
  | "create_workspace"
  | "create_project"
  | "invite_team"
  | "open_launch_workspace"
  | "completed";

export type AdminCustomerAccountEventType =
  | "account_created"
  | "owner_bootstrapped"
  | "invite_sent"
  | "invite_accepted"
  | "membership_role_changed"
  | "first_project_created"
  | "launch_workspace_opened"
  | "onboarding_completed";

export type AdminCustomerAccount = {
  id: string;
  legacyProjectId?: string;
  name: string;
  status: AdminCustomerAccountStatus;
  contactEmail?: string;
  createdByAuthUserId?: string;
  primaryOwnerAuthUserId?: string;
  sourceType: AdminCustomerAccountSourceType;
  billingPlanId?: AdminBillingPlanKey | string;
  billingStatus?: AdminBillingSubscriptionStatus;
  currentSubscriptionId?: string;
  paymentMethodStatus?: AdminBillingPaymentMethodStatus;
  currentPeriodEnd?: string;
  graceUntil?: string;
  commercialHealthStatus?: AdminCommercialHealthStatus;
  activationStatus?: AdminActivationStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountMembership = {
  id: string;
  customerAccountId: string;
  authUserId: string;
  role: AdminCustomerAccountRole;
  status: AdminCustomerAccountMembershipStatus;
  invitedByAuthUserId?: string;
  joinedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountInvite = {
  id: string;
  customerAccountId: string;
  email: string;
  role: AdminCustomerAccountRole;
  status: AdminCustomerAccountInviteStatus;
  inviteToken: string;
  invitedByAuthUserId: string;
  acceptedByAuthUserId?: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountOnboarding = {
  customerAccountId: string;
  status: AdminCustomerAccountOnboardingStatus;
  currentStep: AdminCustomerAccountOnboardingStep;
  completedSteps: AdminCustomerAccountOnboardingStep[];
  firstProjectId?: string;
  firstInviteSentAt?: string;
  launchWorkspaceOpenedAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCustomerAccountEvent = {
  id: string;
  customerAccountId: string;
  eventType: AdminCustomerAccountEventType;
  actorAuthUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};
