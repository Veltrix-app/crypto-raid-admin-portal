export type OnchainCaseListRow = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  sourceType: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username?: string | null;
  projectName?: string | null;
  walletAddress?: string | null;
  assetSymbol?: string | null;
  openedAt: string;
  updatedAt: string;
};

export type OnchainCaseDetailRecord = OnchainCaseListRow & {
  projectId?: string;
  authUserId?: string | null;
  assetId?: string | null;
  sourceId?: string | null;
  dedupeKey?: string;
  rawPayload?: Record<string, unknown> | null;
  resolutionNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
};

export type OnchainCaseTimelineEventRecord = {
  id: string;
  eventType: string;
  visibilityScope?: string;
  actorAuthUserId?: string | null;
  summary: string | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

export type ProjectOnchainAccessSummary = {
  isSuperAdmin: boolean;
  membershipRole: string | null;
  visibilityPermissions: string[];
  actionPermissions: string[];
};

export type ProjectOnchainPermissionAssignmentRecord = {
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
