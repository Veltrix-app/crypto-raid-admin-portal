export type PayoutCaseListRow = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username?: string | null;
  projectName?: string | null;
  rewardTitle?: string | null;
  campaignTitle?: string | null;
  openedAt: string;
  updatedAt: string;
};

export type PayoutCaseDetailRecord = PayoutCaseListRow & {
  projectId?: string;
  campaignId?: string | null;
  campaignTitle?: string | null;
  rewardId?: string | null;
  claimId?: string | null;
  authUserId?: string | null;
  walletAddress?: string | null;
  sourceType?: string;
  sourceId?: string | null;
  claimMethod?: string | null;
  rawPayload?: Record<string, unknown> | null;
  resolutionNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
};

export type PayoutCaseTimelineEventRecord = {
  id: string;
  eventType: string;
  visibilityScope?: string;
  actorAuthUserId?: string | null;
  summary: string | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

export type ProjectPayoutAccessSummary = {
  isSuperAdmin: boolean;
  membershipRole: string | null;
  visibilityPermissions: string[];
  actionPermissions: string[];
};

export type ProjectPayoutPermissionAssignmentRecord = {
  id: string;
  subjectAuthUserId: string;
  visibilityPermissions: string[];
  actionPermissions: string[];
  presetKey: string | null;
  status: "active" | "revoked";
  notes: string | null;
  grantedByAuthUserId: string | null;
  updatedByAuthUserId: string | null;
  createdAt: string;
  updatedAt: string;
};
