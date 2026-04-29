import { RELEASE_SMOKE_SCENARIOS } from "@/lib/release/smoke-packs";
import type {
  AdminEnvironmentAudit,
  AdminMigrationReleaseLink,
  AdminReleaseRunCheck,
  AdminReleaseRunSmokeResult,
} from "@/types/entities/release";
import type {
  EnvironmentAuditStatus,
  ReleaseBlockerSeverity,
  ReleaseCheckBlock,
  ReleaseCheckResult,
  ReleaseDecision,
  ReleaseGateMode,
  ReleaseServiceKey,
  ReleaseTargetEnvironment,
} from "@/types/database";

export const RELEASE_STATES = [
  "draft",
  "ready_for_review",
  "approved",
  "deploying",
  "smoke_pending",
  "verified",
  "degraded",
  "rolled_back",
] as const;

export const RELEASE_TARGET_ENVIRONMENTS = ["local", "preview", "production"] as const;
export const RELEASE_DECISIONS = ["undecided", "go", "no_go", "watch"] as const;
export const RELEASE_SERVICE_KEYS = ["webapp", "portal", "docs", "community_bot"] as const;
export const RELEASE_CHECK_BLOCKS = [
  "scope",
  "environment",
  "database",
  "deploy",
  "smoke",
  "rollback",
] as const;
export const RELEASE_CHECK_RESULTS = ["not_run", "passed", "warning", "failed"] as const;
export const RELEASE_BLOCKER_SEVERITIES = ["P0", "P1", "P2", "P3"] as const;
export const RELEASE_SMOKE_CATEGORIES = [
  "auth_and_entry",
  "billing_and_account",
  "support_and_status",
  "security_and_trust",
  "success_and_analytics",
  "docs_and_public_surfaces",
  "community_bot_readiness",
] as const;
export const ENVIRONMENT_AUDIT_STATUSES = ["not_reviewed", "ready", "warning", "critical"] as const;
export const MIGRATION_REVIEW_STATES = ["not_reviewed", "reviewed", "approved"] as const;
export const MIGRATION_RUN_STATES = ["not_needed", "pending", "run", "blocked"] as const;
export const HARD_GATED_SERVICE_KEYS: readonly ReleaseServiceKey[] = ["webapp", "portal"] as const;

type ReleaseServiceDefinition = {
  serviceKey: ReleaseServiceKey;
  label: string;
  gateMode: ReleaseGateMode;
  description: string;
  requiredKeys: string[];
};

type ReleaseCheckDefinition = {
  checkKey: string;
  label: string;
  checkBlock: ReleaseCheckBlock;
  severity: ReleaseBlockerSeverity;
  isBlocking: boolean;
  serviceKey?: ReleaseServiceKey;
  summary: string;
  nextAction: string;
};

export const RELEASE_SERVICE_DEFINITIONS: readonly ReleaseServiceDefinition[] = [
  {
    serviceKey: "webapp",
    label: "VYNTRO Webapp",
    gateMode: "hard",
    description: "Member-facing app, billing handoffs, support, trust center and public routes.",
    requiredKeys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_WEBAPP_URL",
      "NEXT_PUBLIC_PORTAL_URL",
    ],
  },
  {
    serviceKey: "portal",
    label: "Admin Portal",
    gateMode: "hard",
    description: "Workspace operations, billing, support, security and release control surfaces.",
    requiredKeys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "COMMUNITY_BOT_URL",
      "COMMUNITY_BOT_WEBHOOK_SECRET",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
  {
    serviceKey: "docs",
    label: "VYNTRO Docs",
    gateMode: "light",
    description: "Public documentation and buyer-facing reference surfaces.",
    requiredKeys: [],
  },
  {
    serviceKey: "community_bot",
    label: "Community Bot",
    gateMode: "light",
    description: "Discord and Telegram bridge, verification callbacks and community jobs.",
    requiredKeys: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "VERIFICATION_CALLBACK_URL",
      "VERIFICATION_CALLBACK_SECRET",
      "COMMUNITY_BOT_WEBHOOK_SECRET",
    ],
  },
] as const;

export const RELEASE_CHECK_DEFINITIONS: readonly ReleaseCheckDefinition[] = [
  {
    checkKey: "scope_review",
    label: "Scope reviewed",
    checkBlock: "scope",
    severity: "P1",
    isBlocking: true,
    summary: "Release scope is explicitly reviewed so no service ships by accident.",
    nextAction: "Confirm which services and migrations are in scope before review.",
  },
  {
    checkKey: "webapp_build",
    label: "Webapp build and typecheck",
    checkBlock: "scope",
    severity: "P0",
    isBlocking: true,
    serviceKey: "webapp",
    summary: "The member-facing app must build cleanly before launch-sensitive changes ship.",
    nextAction: "Run the webapp build and typecheck commands and record the result.",
  },
  {
    checkKey: "portal_build",
    label: "Portal build",
    checkBlock: "scope",
    severity: "P0",
    isBlocking: true,
    serviceKey: "portal",
    summary: "The operator portal must build cleanly before release approval.",
    nextAction: "Run the admin portal build and record the result.",
  },
  {
    checkKey: "environment_review",
    label: "Environment audit reviewed",
    checkBlock: "environment",
    severity: "P1",
    isBlocking: true,
    summary: "All in-scope services need a reviewed environment posture.",
    nextAction: "Review and update the environment audits for every included service.",
  },
  {
    checkKey: "migration_review",
    label: "Migration linked and reviewed",
    checkBlock: "database",
    severity: "P0",
    isBlocking: true,
    summary: "Database changes must be linked to the release with run and mitigation posture.",
    nextAction: "Attach the migration file or mark the release as not needing one.",
  },
  {
    checkKey: "deploy_sequence",
    label: "Deploy sequence confirmed",
    checkBlock: "deploy",
    severity: "P1",
    isBlocking: true,
    summary: "The deploy order and affected surfaces should be explicitly known before rollout.",
    nextAction: "Document the deploy order and confirm the release state before rollout.",
  },
  {
    checkKey: "smoke_completion",
    label: "Smoke pack completed",
    checkBlock: "smoke",
    severity: "P0",
    isBlocking: true,
    summary: "Critical post-deploy smoke checks must be run and recorded.",
    nextAction: "Complete the smoke results before marking the release verified.",
  },
  {
    checkKey: "rollback_ready",
    label: "Rollback posture documented",
    checkBlock: "rollback",
    severity: "P1",
    isBlocking: true,
    summary: "Launch-safe releases need a mitigation or rollback note.",
    nextAction: "Document rollback or mitigation posture on the release detail before approval.",
  },
  {
    checkKey: "docs_presence",
    label: "Docs readiness confirmed",
    checkBlock: "smoke",
    severity: "P2",
    isBlocking: false,
    serviceKey: "docs",
    summary: "Public docs or trust-facing reference pages should not lag behind launch changes.",
    nextAction: "Confirm docs surface presence where relevant.",
  },
  {
    checkKey: "community_bot_readiness",
    label: "Community bot readiness reviewed",
    checkBlock: "deploy",
    severity: "P2",
    isBlocking: false,
    serviceKey: "community_bot",
    summary: "Bot env and runtime posture should be reviewed when the release touches community rails.",
    nextAction: "Confirm bot envs and callback posture when community flows are affected.",
  },
] as const;

export function buildReleaseRef(date = new Date()) {
  const safe = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
  ].join("");

  return `REL-${safe}`;
}

export function getReleaseServiceDefinition(serviceKey: ReleaseServiceKey) {
  return RELEASE_SERVICE_DEFINITIONS.find((entry) => entry.serviceKey === serviceKey) ?? null;
}

export function isServiceHardGated(serviceKey: ReleaseServiceKey) {
  return HARD_GATED_SERVICE_KEYS.includes(serviceKey);
}

export function formatReleaseLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value.replaceAll("_", " ");
}

export function getReleaseDecisionTone(decision: ReleaseDecision) {
  switch (decision) {
    case "go":
      return "success" as const;
    case "no_go":
      return "danger" as const;
    case "watch":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export function getReleaseGateModeLabel(gateMode: ReleaseGateMode) {
  return gateMode === "hard" ? "hard gate" : "light gate";
}

export function countBlockingFailures(checks: Array<Pick<AdminReleaseRunCheck, "isBlocking" | "result">>) {
  return checks.filter((check) => check.isBlocking && check.result === "failed").length;
}

export function countWarnings(checks: Array<Pick<AdminReleaseRunCheck, "result">>) {
  return checks.filter((check) => check.result === "warning").length;
}

export function countSmokePending(smokeResults: Array<Pick<AdminReleaseRunSmokeResult, "result">>) {
  return smokeResults.filter((result) => result.result === "not_run").length;
}

export function countAuditWarnings(audits: Array<Pick<AdminEnvironmentAudit, "status">>) {
  return audits.filter((audit) =>
    audit.status === "warning" || audit.status === "critical" || audit.status === "not_reviewed"
  ).length;
}

export function deriveServiceReadiness(params: {
  gateMode: ReleaseGateMode;
  blockingFailures: number;
  warnings: number;
  smokePending: number;
  auditStatus: EnvironmentAuditStatus;
}) {
  if (
    params.blockingFailures > 0 ||
    params.auditStatus === "critical" ||
    (params.gateMode === "hard" && params.auditStatus === "not_reviewed")
  ) {
    return "critical" as const;
  }

  if (
    params.warnings > 0 ||
    params.smokePending > 0 ||
    params.auditStatus === "warning" ||
    params.auditStatus === "not_reviewed"
  ) {
    return "warning" as const;
  }

  return "ready" as const;
}

export function deriveReleaseDecision(params: {
  checks: Array<Pick<AdminReleaseRunCheck, "result" | "isBlocking" | "severity">>;
  smokeResults: Array<Pick<AdminReleaseRunSmokeResult, "result">>;
  audits: Array<Pick<AdminEnvironmentAudit, "status">>;
  migrationLinks: Array<Pick<AdminMigrationReleaseLink, "reviewState" | "runState">>;
}) {
  const hasP0Failure = params.checks.some(
    (check) => check.isBlocking && check.severity === "P0" && check.result === "failed"
  );
  if (hasP0Failure) {
    return "no_go" as const;
  }

  const hasPendingSmoke = params.smokeResults.some((result) => result.result === "not_run");
  const hasCriticalAudit = params.audits.some((audit) =>
    ["critical", "not_reviewed"].includes(audit.status)
  );
  const hasUnreviewedMigration = params.migrationLinks.some(
    (link) => link.reviewState === "not_reviewed" || link.runState === "blocked"
  );

  if (hasPendingSmoke || hasCriticalAudit || hasUnreviewedMigration) {
    return "watch" as const;
  }

  return "go" as const;
}

export function canMarkReleaseVerified(params: {
  checks: Array<Pick<AdminReleaseRunCheck, "result" | "isBlocking">>;
  smokeResults: Array<Pick<AdminReleaseRunSmokeResult, "result">>;
  audits: Array<Pick<AdminEnvironmentAudit, "status">>;
  migrationLinks: Array<Pick<AdminMigrationReleaseLink, "reviewState" | "runState">>;
}) {
  const blockingFailures = params.checks.some(
    (check) => check.isBlocking && check.result === "failed"
  );
  const incompleteBlockingChecks = params.checks.some(
    (check) => check.isBlocking && check.result === "not_run"
  );
  const pendingSmoke = params.smokeResults.some((result) => result.result === "not_run");
  const badAudits = params.audits.some((audit) =>
    ["critical", "not_reviewed"].includes(audit.status)
  );
  const blockedMigrations = params.migrationLinks.some(
    (link) => link.reviewState === "not_reviewed" || link.runState === "blocked"
  );

  return !(blockingFailures || incompleteBlockingChecks || pendingSmoke || badAudits || blockedMigrations);
}

export function buildInitialReleaseServices(releaseRunId: string) {
  const timestamp = new Date().toISOString();
  return RELEASE_SERVICE_DEFINITIONS.map((definition) => ({
    release_run_id: releaseRunId,
    service_key: definition.serviceKey,
    inclusion_status: "included",
    gate_mode: definition.gateMode,
    deploy_status: "pending",
    version_label: null,
    notes: definition.description,
    metadata: {
      seededBy: "phase15_release_machine",
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}

export function buildInitialReleaseChecks(releaseRunId: string) {
  const timestamp = new Date().toISOString();
  return RELEASE_CHECK_DEFINITIONS.map((definition) => ({
    release_run_id: releaseRunId,
    service_key: definition.serviceKey ?? null,
    check_block: definition.checkBlock,
    check_key: definition.checkKey,
    label: definition.label,
    result: "not_run",
    severity: definition.severity,
    is_blocking: definition.isBlocking,
    summary: definition.summary,
    next_action: definition.nextAction,
    metadata: {
      seededBy: "phase15_release_machine",
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}

export function buildInitialReleaseSmokeResults(releaseRunId: string) {
  const timestamp = new Date().toISOString();
  return RELEASE_SMOKE_SCENARIOS.map((scenario) => ({
    release_run_id: releaseRunId,
    service_key: scenario.serviceKey ?? null,
    smoke_category: scenario.smokeCategory,
    scenario_key: scenario.scenarioKey,
    scenario_label: scenario.scenarioLabel,
    result: "not_run",
    notes: "",
    metadata: {
      seededBy: "phase15_release_machine",
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}

export function buildInitialEnvironmentAudits(
  releaseRunId: string,
  targetEnvironment: ReleaseTargetEnvironment
) {
  const timestamp = new Date().toISOString();
  return RELEASE_SERVICE_DEFINITIONS.map((definition) => ({
    release_run_id: releaseRunId,
    service_key: definition.serviceKey,
    target_environment: targetEnvironment,
    status: "not_reviewed" as EnvironmentAuditStatus,
    summary:
      definition.requiredKeys.length > 0
        ? `Review ${definition.label} env posture before release approval.`
        : `${definition.label} does not currently track a strict env contract in-product; confirm manually if this release touches it.`,
    required_keys: definition.requiredKeys,
    missing_keys: [],
    mismatch_notes: [],
    metadata: {
      seededBy: "phase15_release_machine",
      gateMode: definition.gateMode,
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}
