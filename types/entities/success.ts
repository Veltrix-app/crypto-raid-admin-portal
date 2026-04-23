export type AdminActivationStage =
  | "workspace_created"
  | "first_project_created"
  | "provider_connected"
  | "campaign_live"
  | "member_active"
  | "live";

export type AdminWorkspaceHealthState =
  | "not_started"
  | "activating"
  | "live"
  | "stalled";

export type AdminSuccessHealthState =
  | "healthy"
  | "watching"
  | "expansion_ready"
  | "churn_risk";

export type AdminMemberHealthState =
  | "new"
  | "active"
  | "drifting"
  | "reactivation_needed";

export type AdminActivationLane = "onboarding" | "active" | "comeback";

export type AdminSuccessSignalType =
  | "activation_stalled"
  | "first_project_missing"
  | "first_campaign_missing"
  | "member_drift"
  | "expansion_ready"
  | "paid_low_usage"
  | "healthy_repeat_usage";

export type AdminSuccessSignalTone = "default" | "success" | "warning" | "danger";

export type AdminSuccessSignalStatus = "open" | "watching" | "resolved" | "dismissed";

export type AdminSuccessNoteType =
  | "general"
  | "activation_blocker"
  | "expansion"
  | "churn_risk"
  | "member_health"
  | "follow_up";

export type AdminSuccessNoteStatus = "open" | "resolved" | "archived";

export type AdminSuccessTaskType =
  | "activation_follow_up"
  | "expansion_follow_up"
  | "risk_review"
  | "member_reactivation"
  | "billing_follow_up";

export type AdminSuccessTaskStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "canceled";

export type AdminSuccessTaskDueState =
  | "upcoming"
  | "due_now"
  | "overdue"
  | "resolved";

export type AdminActivationNudgeTargetType = "account" | "project" | "member";

export type AdminActivationNudgeChannel = "in_product" | "email";

export type AdminActivationNudgeStatus =
  | "pending"
  | "shown"
  | "sent"
  | "dismissed"
  | "completed";

export type AdminAccountActivationSummary = {
  customerAccountId: string;
  activationStage: AdminActivationStage;
  workspaceHealthState: AdminWorkspaceHealthState;
  successHealthState: AdminSuccessHealthState;
  completedMilestones: string[];
  blockers: string[];
  nextBestActionKey?: string;
  nextBestActionLabel?: string;
  nextBestActionRoute?: string;
  firstProjectId?: string;
  firstLiveCampaignId?: string;
  firstProviderConnectedAt?: string;
  firstCampaignLiveAt?: string;
  lastMemberActivityAt?: string;
  lastActivationAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSuccessNote = {
  id: string;
  customerAccountId: string;
  projectId?: string;
  authorAuthUserId?: string;
  ownerAuthUserId?: string;
  noteType: AdminSuccessNoteType;
  status: AdminSuccessNoteStatus;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type AdminSuccessTask = {
  id: string;
  customerAccountId: string;
  projectId?: string;
  ownerAuthUserId?: string;
  taskType: AdminSuccessTaskType;
  status: AdminSuccessTaskStatus;
  dueState: AdminSuccessTaskDueState;
  title: string;
  summary: string;
  dueAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSuccessSignal = {
  id: string;
  customerAccountId: string;
  projectId?: string;
  dedupeKey: string;
  signalType: AdminSuccessSignalType;
  signalTone: AdminSuccessSignalTone;
  status: AdminSuccessSignalStatus;
  summary: string;
  signalPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type AdminMemberActivationState = {
  id: string;
  authUserId: string;
  primaryProjectId?: string;
  activationLane: AdminActivationLane;
  memberHealthState: AdminMemberHealthState;
  completedMilestones: string[];
  blockers: string[];
  nextBestActionKey?: string;
  nextBestActionLabel?: string;
  nextBestActionRoute?: string;
  linkedProviderCount: number;
  walletVerified: boolean;
  joinedProjectCount: number;
  completedQuestCount: number;
  claimedRewardCount: number;
  streakDays: number;
  lastActivityAt?: string;
  lastNudgeAt?: string;
  lastReactivationAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminActivationNudge = {
  id: string;
  dedupeKey: string;
  targetType: AdminActivationNudgeTargetType;
  customerAccountId?: string;
  projectId?: string;
  authUserId?: string;
  channel: AdminActivationNudgeChannel;
  reasonKey: string;
  status: AdminActivationNudgeStatus;
  title: string;
  body: string;
  route?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type AdminSuccessAccountSummary = {
  accountId: string;
  accountName: string;
  activation: AdminAccountActivationSummary;
  billingPlanId?: string;
  billingStatus?: string;
  workspaceHealthState: AdminWorkspaceHealthState;
  successHealthState: AdminSuccessHealthState;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  blockers: string[];
  nextBestActionLabel?: string;
  nextBestActionRoute?: string;
  lastMemberActivityAt?: string;
};

export type AdminSuccessOverview = {
  generatedAt: string;
  counts: {
    totalAccounts: number;
    notStarted: number;
    activating: number;
    stalled: number;
    live: number;
    expansionReady: number;
    churnRisk: number;
    memberDrift: number;
  };
  accounts: AdminSuccessAccountSummary[];
  stalledAccounts: AdminSuccessAccountSummary[];
  expansionAccounts: AdminSuccessAccountSummary[];
  riskAccounts: AdminSuccessAccountSummary[];
};

export type AdminSuccessAccountDetail = AdminSuccessAccountSummary & {
  notes: AdminSuccessNote[];
  tasks: AdminSuccessTask[];
  signals: AdminSuccessSignal[];
  memberState?: AdminMemberActivationState;
};
