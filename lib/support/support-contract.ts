import type {
  AdminServiceIncidentImpactScope,
  AdminServiceIncidentSeverity,
  AdminServiceIncidentState,
  AdminServiceStatusLevel,
  AdminSupportHandoffType,
  AdminSupportTicketPriority,
  AdminSupportTicketStatus,
  AdminSupportTicketType,
  AdminSupportWaitingState,
} from "@/types/entities/support";

export const SUPPORT_TICKET_TYPES: readonly AdminSupportTicketType[] = [
  "product_question",
  "technical_issue",
  "billing_issue",
  "account_access",
  "reward_or_claim_issue",
  "trust_or_abuse_report",
  "provider_or_integration_issue",
  "general_request",
] as const;

export const SUPPORT_TICKET_STATUSES: readonly AdminSupportTicketStatus[] = [
  "new",
  "triaging",
  "waiting_on_customer",
  "waiting_on_internal",
  "escalated",
  "resolved",
  "closed",
] as const;

export const SUPPORT_WAITING_STATES: readonly AdminSupportWaitingState[] = [
  "none",
  "customer",
  "internal",
  "provider",
] as const;

export const SUPPORT_PRIORITIES: readonly AdminSupportTicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;

export const SUPPORT_HANDOFF_TYPES: readonly AdminSupportHandoffType[] = [
  "billing",
  "trust",
  "payout",
  "onchain",
  "product_ops",
  "general_support",
] as const;

export const SERVICE_INCIDENT_STATES: readonly AdminServiceIncidentState[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const;

export const SERVICE_INCIDENT_SEVERITIES: readonly AdminServiceIncidentSeverity[] = [
  "minor",
  "major",
  "critical",
] as const;

export const SERVICE_INCIDENT_IMPACT_SCOPES: readonly AdminServiceIncidentImpactScope[] = [
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
] as const;

export const SERVICE_STATUS_LEVELS: readonly AdminServiceStatusLevel[] = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
] as const;

export const SUPPORT_COMPONENTS = [
  { key: "platform", label: "Platform" },
  { key: "auth", label: "Authentication" },
  { key: "portal", label: "Admin portal" },
  { key: "member_app", label: "Member app" },
  { key: "billing", label: "Billing" },
  { key: "community", label: "Community delivery" },
  { key: "verification", label: "Verification" },
  { key: "trust", label: "Trust operations" },
  { key: "payouts", label: "Payouts" },
  { key: "onchain", label: "On-chain" },
] as const;

export const SUPPORT_TICKET_TYPE_OPTIONS = [
  {
    value: "product_question" as const,
    label: "Product question",
    description: "How the product works, setup order, or which surface to use next.",
  },
  {
    value: "technical_issue" as const,
    label: "Technical issue",
    description: "Something is broken, unavailable, or behaving unexpectedly in the product.",
  },
  {
    value: "billing_issue" as const,
    label: "Billing issue",
    description: "Plans, invoices, failed charges, customer portal issues, or upgrade blockers.",
  },
  {
    value: "account_access" as const,
    label: "Account access",
    description: "Login, verification, invite access, or workspace/account ownership problems.",
  },
  {
    value: "reward_or_claim_issue" as const,
    label: "Reward or claim issue",
    description: "Claim delivery, reward inventory, payout blockers, or finalization confusion.",
  },
  {
    value: "trust_or_abuse_report" as const,
    label: "Trust or abuse report",
    description: "Suspicious behavior, fraud concerns, or bounded safety escalation requests.",
  },
  {
    value: "provider_or_integration_issue" as const,
    label: "Provider or integration issue",
    description: "Discord, Telegram, provider callbacks, verification integrations, or sync drift.",
  },
  {
    value: "general_request" as const,
    label: "General request",
    description: "Anything that does not fit the other lanes but still needs a clear support owner.",
  },
] as const;

export function humanizeSupportValue(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function deriveSupportPriority(ticketType: AdminSupportTicketType): AdminSupportTicketPriority {
  switch (ticketType) {
    case "billing_issue":
    case "account_access":
    case "provider_or_integration_issue":
      return "high";
    case "trust_or_abuse_report":
    case "reward_or_claim_issue":
      return "urgent";
    case "technical_issue":
      return "high";
    case "product_question":
    case "general_request":
    default:
      return "normal";
  }
}

export function defaultSupportWaitingState(
  status: AdminSupportTicketStatus
): AdminSupportWaitingState {
  switch (status) {
    case "waiting_on_customer":
      return "customer";
    case "waiting_on_internal":
    case "escalated":
      return "internal";
    default:
      return "none";
  }
}

export function supportImpactCopy(params: {
  componentLabel: string;
  impactScope: AdminServiceIncidentImpactScope;
  state: AdminServiceIncidentState;
}) {
  const stateLead =
    params.state === "investigating"
      ? "We are investigating"
      : params.state === "identified"
        ? "We identified a service issue affecting"
        : params.state === "monitoring"
          ? "We are monitoring recovery for"
          : `${params.componentLabel} has recovered`;

  const impactLead =
    params.impactScope === "major_outage"
      ? "major service disruption"
      : params.impactScope === "partial_outage"
        ? "partial service disruption"
        : params.impactScope === "maintenance"
          ? "planned maintenance"
          : "degraded service";

  if (params.state === "resolved") {
    return `${params.componentLabel} is operating normally again. We will keep the timeline available for reference.`;
  }

  return `${stateLead} ${params.componentLabel.toLowerCase()} with ${impactLead}.`;
}

export const SUPPORT_LANGUAGE_MODEL = {
  degradedService:
    "Some product surfaces may feel slower or less reliable than normal. We are actively investigating and will publish the next update as soon as we have a clearer recovery path.",
  providerFailure:
    "A linked provider is failing or timing out. The issue is currently contained to the affected integration rail, and we will update this status once retries or manual recovery are confirmed.",
  billingDisruption:
    "Billing or checkout actions may not complete normally right now. Existing workspace access remains available while we work on the recovery path.",
  accountAccess:
    "Sign-in, verification or workspace access may be delayed. We are keeping the issue bounded and will publish the next update once access stability is confirmed.",
  trustSensitive:
    "This report touches a trust-sensitive surface. We will review it carefully and keep public or customer-facing updates bounded to what is safe to share.",
} as const;
