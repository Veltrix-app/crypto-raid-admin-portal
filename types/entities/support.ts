export type AdminSupportTicketType =
  | "product_question"
  | "technical_issue"
  | "billing_issue"
  | "account_access"
  | "reward_or_claim_issue"
  | "trust_or_abuse_report"
  | "provider_or_integration_issue"
  | "general_request";

export type AdminSupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type AdminSupportTicketStatus =
  | "new"
  | "triaging"
  | "waiting_on_customer"
  | "waiting_on_internal"
  | "escalated"
  | "resolved"
  | "closed";

export type AdminSupportWaitingState =
  | "none"
  | "customer"
  | "internal"
  | "provider";

export type AdminSupportEscalationState =
  | "none"
  | "watching"
  | "escalated"
  | "handoff_open";

export type AdminSupportEventVisibility = "internal" | "customer" | "both";

export type AdminSupportEventType =
  | "ticket_created"
  | "status_changed"
  | "claimed"
  | "internal_note"
  | "customer_update"
  | "handoff_created"
  | "incident_linked"
  | "resolved"
  | "closed"
  | "reopened";

export type AdminSupportHandoffType =
  | "billing"
  | "trust"
  | "payout"
  | "onchain"
  | "product_ops"
  | "general_support";

export type AdminSupportHandoffStatus = "open" | "accepted" | "resolved" | "canceled";

export type AdminServiceIncidentSeverity = "minor" | "major" | "critical";

export type AdminServiceIncidentImpactScope =
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type AdminServiceIncidentState =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export type AdminServiceStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type AdminServiceIncidentUpdateType =
  | "state_change"
  | "public_update"
  | "internal_note";

export type AdminSupportTicketSummary = {
  id: string;
  ticketRef: string;
  ticketType: AdminSupportTicketType;
  priority: AdminSupportTicketPriority;
  status: AdminSupportTicketStatus;
  waitingState: AdminSupportWaitingState;
  escalationState: AdminSupportEscalationState;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  customerAccountId?: string;
  customerAccountName?: string;
  projectId?: string;
  projectName?: string;
  assignedAdminAuthUserId?: string;
  latestCustomerUpdateAt?: string;
  latestInternalUpdateAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportTicketEvent = {
  id: string;
  supportTicketId: string;
  eventType: AdminSupportEventType;
  visibilityScope: AdminSupportEventVisibility;
  actorAuthUserId?: string;
  title?: string;
  body: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type AdminSupportTicketHandoff = {
  id: string;
  supportTicketId: string;
  handoffType: AdminSupportHandoffType;
  status: AdminSupportHandoffStatus;
  customerAccountId?: string;
  targetProjectId?: string;
  targetRecordId?: string;
  targetRoute?: string;
  summary: string;
  ownerAuthUserId?: string;
  createdByAuthUserId?: string;
  acceptedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export type AdminSupportTicketDetail = AdminSupportTicketSummary & {
  message: string;
  authUserId?: string;
  linkedIncidentId?: string;
  events: AdminSupportTicketEvent[];
  handoffs: AdminSupportTicketHandoff[];
};

export type AdminServiceIncidentSummary = {
  id: string;
  incidentRef: string;
  title: string;
  componentKey: string;
  componentLabel: string;
  severity: AdminServiceIncidentSeverity;
  impactScope: AdminServiceIncidentImpactScope;
  state: AdminServiceIncidentState;
  publicSummary: string;
  internalSummary: string;
  publicVisible: boolean;
  declaredByAuthUserId?: string;
  ownerAuthUserId?: string;
  openedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminServiceIncidentUpdate = {
  id: string;
  serviceIncidentId: string;
  updateType: AdminServiceIncidentUpdateType;
  visibilityScope: "internal" | "public" | "both";
  incidentState?: AdminServiceIncidentState;
  componentStatus?: AdminServiceStatusLevel;
  title?: string;
  message: string;
  actorAuthUserId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type AdminServiceIncidentDetail = AdminServiceIncidentSummary & {
  updates: AdminServiceIncidentUpdate[];
};

export type AdminServiceStatusSnapshot = {
  id: string;
  componentKey: string;
  componentLabel: string;
  status: AdminServiceStatusLevel;
  summary: string;
  publicMessage: string;
  serviceIncidentId?: string;
  snapshotSource: "system" | "incident_command" | "manual";
  isPublic: boolean;
  createdByAuthUserId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export type AdminSupportOverview = {
  generatedAt: string;
  counts: {
    totalOpen: number;
    new: number;
    triaging: number;
    waitingOnCustomer: number;
    waitingOnInternal: number;
    escalated: number;
    resolvedToday: number;
    activeIncidents: number;
  };
  queue: AdminSupportTicketSummary[];
  activeIncidents: AdminServiceIncidentSummary[];
};
