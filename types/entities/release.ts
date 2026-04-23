import type {
  EnvironmentAuditStatus,
  MigrationReviewState,
  MigrationRunState,
  ReleaseCheckBlock,
  ReleaseCheckResult,
  ReleaseDecision,
  ReleaseRunState,
  ReleaseServiceDeployStatus,
  ReleaseServiceInclusionStatus,
  ReleaseServiceKey,
  ReleaseSmokeCategory,
  ReleaseTargetEnvironment,
  ReleaseBlockerSeverity,
} from "@/types/database";

export type AdminReleaseRun = {
  id: string;
  releaseRef: string;
  title: string;
  summary: string;
  targetEnvironment: ReleaseTargetEnvironment;
  state: ReleaseRunState;
  decision: ReleaseDecision;
  decisionNotes: string;
  blockerSummary: string;
  rollbackNotes: string;
  ownerAuthUserId?: string;
  approvedAt?: string;
  deployingAt?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminReleaseRunService = {
  id: string;
  releaseRunId: string;
  serviceKey: ReleaseServiceKey;
  inclusionStatus: ReleaseServiceInclusionStatus;
  gateMode: "hard" | "light";
  deployStatus: ReleaseServiceDeployStatus;
  versionLabel?: string;
  notes: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminReleaseRunCheck = {
  id: string;
  releaseRunId: string;
  serviceKey?: ReleaseServiceKey;
  checkBlock: ReleaseCheckBlock;
  checkKey: string;
  label: string;
  result: ReleaseCheckResult;
  severity: ReleaseBlockerSeverity;
  isBlocking: boolean;
  summary: string;
  nextAction: string;
  verifiedByAuthUserId?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminReleaseRunSmokeResult = {
  id: string;
  releaseRunId: string;
  serviceKey?: ReleaseServiceKey;
  smokeCategory: ReleaseSmokeCategory;
  scenarioKey: string;
  scenarioLabel: string;
  result: ReleaseCheckResult;
  notes: string;
  verifiedByAuthUserId?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminEnvironmentAudit = {
  id: string;
  releaseRunId: string;
  serviceKey: ReleaseServiceKey;
  targetEnvironment: ReleaseTargetEnvironment;
  status: EnvironmentAuditStatus;
  summary: string;
  requiredKeys: string[];
  missingKeys: string[];
  mismatchNotes: string[];
  verifiedByAuthUserId?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminMigrationReleaseLink = {
  id: string;
  releaseRunId: string;
  migrationFilename: string;
  reviewState: MigrationReviewState;
  runState: MigrationRunState;
  mitigationNotes: string;
  reviewedByAuthUserId?: string;
  reviewedAt?: string;
  executedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminReleaseRunSummary = AdminReleaseRun & {
  counts: {
    servicesIncluded: number;
    blockingFailures: number;
    warnings: number;
    smokePending: number;
    envWarnings: number;
    migrationLinks: number;
  };
};

export type AdminReleaseOverview = {
  generatedAt: string;
  counts: {
    openReleases: number;
    verifiedReleases: number;
    blockingFailures: number;
    smokePending: number;
    environmentWarnings: number;
  };
  activeRelease: AdminReleaseRunSummary | null;
  releases: AdminReleaseRunSummary[];
};

export type AdminReleaseDetail = {
  release: AdminReleaseRunSummary;
  services: AdminReleaseRunService[];
  checks: AdminReleaseRunCheck[];
  smokeResults: AdminReleaseRunSmokeResult[];
  environmentAudits: AdminEnvironmentAudit[];
  migrationLinks: AdminMigrationReleaseLink[];
};

export type AdminDeployCheckRecord = {
  key: string;
  label: string;
  state: "healthy" | "warning" | "critical";
  summary: string;
  nextAction: string;
};

export type AdminDeployCheckSummary = {
  generatedAt: string;
  overallState: "healthy" | "warning" | "critical";
  warningCount: number;
  criticalCount: number;
  checks: AdminDeployCheckRecord[];
};

export type AdminQaReadinessSurface = {
  serviceKey: ReleaseServiceKey;
  label: string;
  gateMode: "hard" | "light";
  blockingFailures: number;
  warnings: number;
  smokePending: number;
  auditStatus: EnvironmentAuditStatus;
  readiness: "ready" | "warning" | "critical";
  releaseCount: number;
};

export type AdminQaOverview = {
  generatedAt: string;
  activeRelease: AdminReleaseRunSummary | null;
  releaseCandidatesWaitingOnQa: AdminReleaseRunSummary[];
  blockingChecks: AdminReleaseRunCheck[];
  warningChecks: AdminReleaseRunCheck[];
  incompleteSmoke: AdminReleaseRunSmokeResult[];
  environmentWarnings: AdminEnvironmentAudit[];
  readinessByService: AdminQaReadinessSurface[];
  deployChecks: AdminDeployCheckSummary | null;
};
