export type AdminCommercialLeadState =
  | "new"
  | "qualified"
  | "watching"
  | "engaged"
  | "evaluation"
  | "converted"
  | "cooling_off"
  | "lost";

export type AdminCommercialLeadSource =
  | "manual"
  | "pricing"
  | "start"
  | "homepage"
  | "trust"
  | "docs"
  | "demo_request"
  | "enterprise_intake"
  | "support"
  | "billing"
  | "success"
  | "analytics"
  | "converted_account";

export type AdminCommercialLeadEventType =
  | "lead_created"
  | "signal_captured"
  | "qualified"
  | "state_changed"
  | "note_added"
  | "task_added"
  | "task_resolved"
  | "request_linked"
  | "account_linked"
  | "converted"
  | "cooling_off"
  | "lost";

export type AdminCommercialLeadNoteType =
  | "general"
  | "qualification"
  | "buyer_concern"
  | "enterprise_requirement"
  | "follow_up";

export type AdminCommercialLeadNoteStatus = "open" | "resolved" | "archived";

export type AdminCommercialFollowUpTaskType =
  | "follow_up"
  | "qualification"
  | "demo_follow_up"
  | "enterprise_review"
  | "expansion_follow_up";

export type AdminCommercialFollowUpTaskStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "canceled";

export type AdminCommercialFollowUpTaskDueState =
  | "upcoming"
  | "due_now"
  | "overdue"
  | "resolved";

export type AdminCommercialRequestStatus = "new" | "qualified" | "converted" | "closed";

export type AdminCommercialLead = {
  id: string;
  leadState: AdminCommercialLeadState;
  source: AdminCommercialLeadSource;
  contactName: string;
  contactEmail: string;
  companyName: string;
  companyDomain: string | null;
  ownerAuthUserId: string | null;
  linkedCustomerAccountId: string | null;
  qualificationSummary: string;
  intentSummary: string;
  lastSignalAt: string | null;
  lastContactAt: string | null;
  convertedAt: string | null;
  lostAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommercialLeadEvent = {
  id: string;
  commercialLeadId: string;
  eventType: AdminCommercialLeadEventType;
  actorAuthUserId: string | null;
  summary: string;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminCommercialLeadNote = {
  id: string;
  commercialLeadId: string;
  authorAuthUserId: string | null;
  ownerAuthUserId: string | null;
  noteType: AdminCommercialLeadNoteType;
  status: AdminCommercialLeadNoteStatus;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type AdminCommercialFollowUpTask = {
  id: string;
  commercialLeadId: string;
  ownerAuthUserId: string | null;
  taskType: AdminCommercialFollowUpTaskType;
  status: AdminCommercialFollowUpTaskStatus;
  dueState: AdminCommercialFollowUpTaskDueState;
  title: string;
  summary: string;
  dueAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDemoRequest = {
  id: string;
  commercialLeadId: string | null;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  companyDomain: string | null;
  teamSize: string;
  useCase: string;
  urgency: string;
  requestSource: string;
  status: AdminCommercialRequestStatus;
  sourcePath: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminEnterpriseIntakeRequest = {
  id: string;
  commercialLeadId: string | null;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  companyDomain: string | null;
  teamSize: string;
  useCase: string;
  requirementSummary: string;
  securityRequirements: string;
  billingRequirements: string;
  onboardingRequirements: string;
  urgency: string;
  requestSource: string;
  status: AdminCommercialRequestStatus;
  sourcePath: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminGrowthLeadSummary = AdminCommercialLead & {
  accountName: string | null;
  taskCounts: {
    open: number;
    dueNow: number;
    overdue: number;
  };
  latestDemoRequest: AdminDemoRequest | null;
  latestEnterpriseRequest: AdminEnterpriseIntakeRequest | null;
};

export type AdminGrowthOverview = {
  generatedAt: string;
  counts: {
    totalLeads: number;
    new: number;
    engaged: number;
    evaluation: number;
    converted: number;
    coolingOff: number;
    lost: number;
    openTasks: number;
    dueNowTasks: number;
  };
  leads: AdminGrowthLeadSummary[];
  newLeads: AdminGrowthLeadSummary[];
  engagedLeads: AdminGrowthLeadSummary[];
  evaluationLeads: AdminGrowthLeadSummary[];
  convertedLeads: AdminGrowthLeadSummary[];
  coolingLeads: AdminGrowthLeadSummary[];
  enterpriseRequests: AdminEnterpriseIntakeRequest[];
  demoRequests: AdminDemoRequest[];
  tasksDueNow: AdminCommercialFollowUpTask[];
};

export type AdminGrowthLeadDetail = AdminGrowthLeadSummary & {
  events: AdminCommercialLeadEvent[];
  notes: AdminCommercialLeadNote[];
  tasks: AdminCommercialFollowUpTask[];
  demoRequests: AdminDemoRequest[];
  enterpriseRequests: AdminEnterpriseIntakeRequest[];
};
