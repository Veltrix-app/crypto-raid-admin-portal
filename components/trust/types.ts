export type TrustCaseListRow = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username?: string | null;
  projectName?: string | null;
  openedAt: string;
  updatedAt: string;
};

export type TrustCaseDetailRecord = TrustCaseListRow & {
  projectId?: string;
  authUserId?: string | null;
  walletAddress?: string | null;
  sourceType?: string;
  sourceId?: string | null;
  dedupeKey?: string;
  rawSignalPayload?: Record<string, unknown> | null;
  resolutionNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
};

export type TrustCaseTimelineEventRecord = {
  id: string;
  eventType: string;
  visibilityScope?: string;
  actorAuthUserId?: string | null;
  summary: string | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

export type ProjectTrustAccessSummary = {
  isSuperAdmin: boolean;
  membershipRole: string | null;
  visibilityPermissions: string[];
  actionPermissions: string[];
};

export type ProjectTrustPermissionAssignmentRecord = {
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
