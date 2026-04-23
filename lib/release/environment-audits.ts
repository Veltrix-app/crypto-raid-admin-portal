import { loadDeployChecks } from "@/lib/observability/deploy-checks";
import { RELEASE_SERVICE_DEFINITIONS } from "@/lib/release/release-contract";
import type {
  AdminDeployCheckSummary,
  AdminEnvironmentAudit,
} from "@/types/entities/release";
import type {
  EnvironmentAuditStatus,
  ReleaseServiceKey,
  ReleaseTargetEnvironment,
} from "@/types/database";

export type ReleaseEnvironmentExpectation = {
  serviceKey: ReleaseServiceKey;
  label: string;
  gateMode: "hard" | "light";
  description: string;
  requiredKeys: string[];
};

export const RELEASE_ENVIRONMENT_EXPECTATIONS: readonly ReleaseEnvironmentExpectation[] =
  RELEASE_SERVICE_DEFINITIONS.map((definition) => ({
    serviceKey: definition.serviceKey,
    label: definition.label,
    gateMode: definition.gateMode,
    description: definition.description,
    requiredKeys: definition.requiredKeys,
  }));

export function getReleaseEnvironmentExpectation(serviceKey: ReleaseServiceKey) {
  return (
    RELEASE_ENVIRONMENT_EXPECTATIONS.find((entry) => entry.serviceKey === serviceKey) ?? null
  );
}

export function normalizeListInput(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function deriveEnvironmentAuditStatus(input: {
  missingKeys: string[];
  mismatchNotes: string[];
  reviewedAt?: string | null;
  currentStatus?: EnvironmentAuditStatus;
}) {
  if (input.currentStatus === "critical") {
    return "critical" as const;
  }

  if (input.missingKeys.length > 0) {
    return "critical" as const;
  }

  if (input.mismatchNotes.length > 0 || input.currentStatus === "warning") {
    return "warning" as const;
  }

  if (input.reviewedAt || input.currentStatus === "ready") {
    return "ready" as const;
  }

  return "not_reviewed" as const;
}

export function summarizeEnvironmentAuditCounts(audits: AdminEnvironmentAudit[]) {
  return {
    ready: audits.filter((audit) => audit.status === "ready").length,
    warning: audits.filter((audit) => audit.status === "warning").length,
    critical: audits.filter((audit) => audit.status === "critical").length,
    notReviewed: audits.filter((audit) => audit.status === "not_reviewed").length,
  };
}

export async function loadReleaseDeployCheckSummary(): Promise<AdminDeployCheckSummary> {
  const summary = await loadDeployChecks();
  return {
    generatedAt: summary.generatedAt,
    overallState: summary.overallState,
    warningCount: summary.warningCount,
    criticalCount: summary.criticalCount,
    checks: summary.checks.map((check) => ({
      key: check.key,
      label: check.label,
      state: check.state,
      summary: check.summary,
      nextAction: check.nextAction,
    })),
  };
}

export function buildEnvironmentAuditScaffold(
  releaseRunId: string,
  targetEnvironment: ReleaseTargetEnvironment
) {
  const timestamp = new Date().toISOString();
  return RELEASE_ENVIRONMENT_EXPECTATIONS.map((expectation) => ({
    release_run_id: releaseRunId,
    service_key: expectation.serviceKey,
    target_environment: targetEnvironment,
    status: "not_reviewed" as const,
    summary:
      expectation.requiredKeys.length > 0
        ? `Review ${expectation.label} env posture before release approval.`
        : `${expectation.label} has a lighter v1 env contract; confirm it manually if this release touches it.`,
    required_keys: expectation.requiredKeys,
    missing_keys: [],
    mismatch_notes: [],
    metadata: {
      seededBy: "phase15_release_machine",
      gateMode: expectation.gateMode,
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}

