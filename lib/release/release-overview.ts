import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { loadReleaseDeployCheckSummary } from "@/lib/release/environment-audits";
import {
  countAuditWarnings,
  countBlockingFailures,
  countSmokePending,
  countWarnings,
  deriveReleaseDecision,
  deriveServiceReadiness,
  getReleaseServiceDefinition,
  RELEASE_SERVICE_DEFINITIONS,
} from "@/lib/release/release-contract";
import type {
  AdminEnvironmentAudit,
  AdminMigrationReleaseLink,
  AdminQaOverview,
  AdminQaReadinessSurface,
  AdminReleaseDetail,
  AdminReleaseOverview,
  AdminReleaseRun,
  AdminReleaseRunCheck,
  AdminReleaseRunService,
  AdminReleaseRunSmokeResult,
  AdminReleaseRunSummary,
} from "@/types/entities/release";
import type {
  DbEnvironmentAudit,
  DbMigrationReleaseLink,
  DbReleaseRun,
  DbReleaseRunCheck,
  DbReleaseRunService,
  DbReleaseRunSmokeResult,
  EnvironmentAuditStatus,
  ReleaseServiceKey,
} from "@/types/database";

function mapReleaseRun(row: DbReleaseRun): AdminReleaseRun {
  return {
    id: row.id,
    releaseRef: row.release_ref,
    title: row.title,
    summary: row.summary,
    targetEnvironment: row.target_environment,
    state: row.state,
    decision: row.decision,
    decisionNotes: row.decision_notes,
    blockerSummary: row.blocker_summary,
    rollbackNotes: row.rollback_notes,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    deployingAt: row.deploying_at ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReleaseRunService(row: DbReleaseRunService): AdminReleaseRunService {
  return {
    id: row.id,
    releaseRunId: row.release_run_id,
    serviceKey: row.service_key,
    inclusionStatus: row.inclusion_status,
    gateMode: row.gate_mode,
    deployStatus: row.deploy_status,
    versionLabel: row.version_label ?? undefined,
    notes: row.notes,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReleaseRunCheck(row: DbReleaseRunCheck): AdminReleaseRunCheck {
  return {
    id: row.id,
    releaseRunId: row.release_run_id,
    serviceKey: row.service_key ?? undefined,
    checkBlock: row.check_block,
    checkKey: row.check_key,
    label: row.label,
    result: row.result,
    severity: row.severity,
    isBlocking: row.is_blocking,
    summary: row.summary,
    nextAction: row.next_action,
    verifiedByAuthUserId: row.verified_by_auth_user_id ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReleaseRunSmokeResult(row: DbReleaseRunSmokeResult): AdminReleaseRunSmokeResult {
  return {
    id: row.id,
    releaseRunId: row.release_run_id,
    serviceKey: row.service_key ?? undefined,
    smokeCategory: row.smoke_category,
    scenarioKey: row.scenario_key,
    scenarioLabel: row.scenario_label,
    result: row.result,
    notes: row.notes,
    verifiedByAuthUserId: row.verified_by_auth_user_id ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEnvironmentAudit(row: DbEnvironmentAudit): AdminEnvironmentAudit {
  return {
    id: row.id,
    releaseRunId: row.release_run_id,
    serviceKey: row.service_key,
    targetEnvironment: row.target_environment,
    status: row.status,
    summary: row.summary,
    requiredKeys: row.required_keys ?? [],
    missingKeys: row.missing_keys ?? [],
    mismatchNotes: row.mismatch_notes ?? [],
    verifiedByAuthUserId: row.verified_by_auth_user_id ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMigrationLink(row: DbMigrationReleaseLink): AdminMigrationReleaseLink {
  return {
    id: row.id,
    releaseRunId: row.release_run_id,
    migrationFilename: row.migration_filename,
    reviewState: row.review_state,
    runState: row.run_state,
    mitigationNotes: row.mitigation_notes,
    reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    executedAt: row.executed_at ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function compareSeverity(a: AdminReleaseRunCheck, b: AdminReleaseRunCheck) {
  const priority = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
  } as const;
  return priority[a.severity] - priority[b.severity];
}

function compareAuditStatus(a: EnvironmentAuditStatus, b: EnvironmentAuditStatus) {
  const priority = {
    critical: 0,
    warning: 1,
    not_reviewed: 2,
    ready: 3,
  } as const;
  return priority[a] - priority[b];
}

async function loadReleaseDataset(options?: { releaseId?: string; limit?: number }) {
  const supabase = getAccountsServiceClient();
  const releaseQuery = supabase
    .from("release_runs")
    .select(
      "id, release_ref, title, summary, target_environment, state, decision, decision_notes, blocker_summary, rollback_notes, owner_auth_user_id, approved_at, deploying_at, verified_at, metadata, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (options?.releaseId) {
    releaseQuery.eq("id", options.releaseId);
  } else if (options?.limit) {
    releaseQuery.limit(options.limit);
  }

  const releasesResponse = await releaseQuery;
  if (releasesResponse.error) {
    throw new Error(releasesResponse.error.message || "Failed to load releases.");
  }

  const releaseRows = (releasesResponse.data ?? []) as DbReleaseRun[];
  const releaseIds = releaseRows.map((row) => row.id);
  if (releaseIds.length === 0) {
    return {
      releases: [] as AdminReleaseRun[],
      services: [] as AdminReleaseRunService[],
      checks: [] as AdminReleaseRunCheck[],
      smokeResults: [] as AdminReleaseRunSmokeResult[],
      environmentAudits: [] as AdminEnvironmentAudit[],
      migrationLinks: [] as AdminMigrationReleaseLink[],
    };
  }

  const [
    servicesResponse,
    checksResponse,
    smokeResponse,
    auditsResponse,
    migrationsResponse,
  ] = await Promise.all([
    supabase
      .from("release_run_services")
      .select(
        "id, release_run_id, service_key, inclusion_status, gate_mode, deploy_status, version_label, notes, metadata, created_at, updated_at"
      )
      .in("release_run_id", releaseIds),
    supabase
      .from("release_run_checks")
      .select(
        "id, release_run_id, service_key, check_block, check_key, label, result, severity, is_blocking, summary, next_action, verified_by_auth_user_id, verified_at, metadata, created_at, updated_at"
      )
      .in("release_run_id", releaseIds),
    supabase
      .from("release_run_smoke_results")
      .select(
        "id, release_run_id, service_key, smoke_category, scenario_key, scenario_label, result, notes, verified_by_auth_user_id, verified_at, metadata, created_at, updated_at"
      )
      .in("release_run_id", releaseIds),
    supabase
      .from("environment_audits")
      .select(
        "id, release_run_id, service_key, target_environment, status, summary, required_keys, missing_keys, mismatch_notes, verified_by_auth_user_id, verified_at, metadata, created_at, updated_at"
      )
      .in("release_run_id", releaseIds),
    supabase
      .from("migration_release_links")
      .select(
        "id, release_run_id, migration_filename, review_state, run_state, mitigation_notes, reviewed_by_auth_user_id, reviewed_at, executed_at, metadata, created_at, updated_at"
      )
      .in("release_run_id", releaseIds),
  ]);

  const responses = [
    servicesResponse,
    checksResponse,
    smokeResponse,
    auditsResponse,
    migrationsResponse,
  ];
  const firstError = responses.find((response) => response.error);
  if (firstError?.error) {
    throw new Error(firstError.error.message || "Failed to load release detail tables.");
  }

  return {
    releases: releaseRows.map(mapReleaseRun),
    services: ((servicesResponse.data ?? []) as DbReleaseRunService[]).map(mapReleaseRunService),
    checks: ((checksResponse.data ?? []) as DbReleaseRunCheck[]).map(mapReleaseRunCheck),
    smokeResults: ((smokeResponse.data ?? []) as DbReleaseRunSmokeResult[]).map(
      mapReleaseRunSmokeResult
    ),
    environmentAudits: ((auditsResponse.data ?? []) as DbEnvironmentAudit[]).map(mapEnvironmentAudit),
    migrationLinks: ((migrationsResponse.data ?? []) as DbMigrationReleaseLink[]).map(
      mapMigrationLink
    ),
  };
}

function buildReleaseSummary(params: {
  release: AdminReleaseRun;
  services: AdminReleaseRunService[];
  checks: AdminReleaseRunCheck[];
  smokeResults: AdminReleaseRunSmokeResult[];
  environmentAudits: AdminEnvironmentAudit[];
  migrationLinks: AdminMigrationReleaseLink[];
}) {
  const derivedDecision = deriveReleaseDecision({
    checks: params.checks,
    smokeResults: params.smokeResults,
    audits: params.environmentAudits,
    migrationLinks: params.migrationLinks,
  });

  return {
    ...params.release,
    decision: derivedDecision,
    counts: {
      servicesIncluded: params.services.filter((service) => service.inclusionStatus === "included")
        .length,
      blockingFailures: countBlockingFailures(params.checks),
      warnings: countWarnings(params.checks),
      smokePending: countSmokePending(params.smokeResults),
      envWarnings: countAuditWarnings(params.environmentAudits),
      migrationLinks: params.migrationLinks.length,
    },
  } satisfies AdminReleaseRunSummary;
}

function getRelatedByReleaseId<T extends { releaseRunId: string }>(items: T[], releaseId: string) {
  return items.filter((item) => item.releaseRunId === releaseId);
}

function buildQaReadinessSurface(params: {
  serviceKey: ReleaseServiceKey;
  releases: AdminReleaseRunSummary[];
  services: AdminReleaseRunService[];
  checks: AdminReleaseRunCheck[];
  smokeResults: AdminReleaseRunSmokeResult[];
  environmentAudits: AdminEnvironmentAudit[];
}) {
  const definition = getReleaseServiceDefinition(params.serviceKey);
  if (!definition) {
    return null;
  }

  const activeReleaseIds = params.releases.map((release) => release.id);
  const includedServices = params.services.filter(
    (service) =>
      service.serviceKey === params.serviceKey &&
      service.inclusionStatus === "included" &&
      activeReleaseIds.includes(service.releaseRunId)
  );
  const serviceChecks = params.checks.filter(
    (check) =>
      check.serviceKey === params.serviceKey && activeReleaseIds.includes(check.releaseRunId)
  );
  const serviceSmoke = params.smokeResults.filter(
    (result) =>
      result.serviceKey === params.serviceKey && activeReleaseIds.includes(result.releaseRunId)
  );
  const serviceAudits = params.environmentAudits.filter(
    (audit) =>
      audit.serviceKey === params.serviceKey && activeReleaseIds.includes(audit.releaseRunId)
  );

  const auditStatus =
    serviceAudits.length > 0
      ? serviceAudits
          .map((audit) => audit.status)
          .sort(compareAuditStatus)[0]
      : ("ready" as const);

  const blockingFailures = serviceChecks.filter(
    (check) => check.isBlocking && check.result === "failed"
  ).length;
  const warnings = serviceChecks.filter((check) => check.result === "warning").length;
  const smokePending = serviceSmoke.filter((result) => result.result === "not_run").length;

  return {
    serviceKey: params.serviceKey,
    label: definition.label,
    gateMode: definition.gateMode,
    blockingFailures,
    warnings,
    smokePending,
    auditStatus,
    readiness: deriveServiceReadiness({
      gateMode: definition.gateMode,
      blockingFailures,
      warnings,
      smokePending,
      auditStatus,
    }),
    releaseCount: includedServices.length,
  } satisfies AdminQaReadinessSurface;
}

export async function loadReleaseOverview() {
  const dataset = await loadReleaseDataset({ limit: 12 });
  const releaseSummaries = dataset.releases.map((release) =>
    buildReleaseSummary({
      release,
      services: getRelatedByReleaseId(dataset.services, release.id),
      checks: getRelatedByReleaseId(dataset.checks, release.id),
      smokeResults: getRelatedByReleaseId(dataset.smokeResults, release.id),
      environmentAudits: getRelatedByReleaseId(dataset.environmentAudits, release.id),
      migrationLinks: getRelatedByReleaseId(dataset.migrationLinks, release.id),
    })
  );

  const activeRelease =
    releaseSummaries.find((release) => !["verified", "rolled_back"].includes(release.state)) ??
    releaseSummaries[0] ??
    null;

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      openReleases: releaseSummaries.filter(
        (release) => !["verified", "rolled_back"].includes(release.state)
      ).length,
      verifiedReleases: releaseSummaries.filter((release) => release.state === "verified").length,
      blockingFailures: releaseSummaries.reduce(
        (sum, release) => sum + release.counts.blockingFailures,
        0
      ),
      smokePending: releaseSummaries.reduce((sum, release) => sum + release.counts.smokePending, 0),
      environmentWarnings: releaseSummaries.reduce(
        (sum, release) => sum + release.counts.envWarnings,
        0
      ),
    },
    activeRelease,
    releases: releaseSummaries,
  } satisfies AdminReleaseOverview;
}

export async function loadReleaseDetail(releaseId: string) {
  const dataset = await loadReleaseDataset({ releaseId });
  const release = dataset.releases[0];
  if (!release) {
    throw new Error("Release detail was not found.");
  }

  const services = getRelatedByReleaseId(dataset.services, release.id).sort((a, b) =>
    RELEASE_SERVICE_DEFINITIONS.findIndex((entry) => entry.serviceKey === a.serviceKey) -
    RELEASE_SERVICE_DEFINITIONS.findIndex((entry) => entry.serviceKey === b.serviceKey)
  );
  const checks = getRelatedByReleaseId(dataset.checks, release.id).sort((a, b) => {
    const blockOrder = {
      scope: 0,
      environment: 1,
      database: 2,
      deploy: 3,
      smoke: 4,
      rollback: 5,
    } as const;
    const left = blockOrder[a.checkBlock] - blockOrder[b.checkBlock];
    if (left !== 0) {
      return left;
    }
    return compareSeverity(a, b);
  });
  const smokeResults = getRelatedByReleaseId(dataset.smokeResults, release.id).sort((a, b) =>
    a.scenarioLabel.localeCompare(b.scenarioLabel)
  );
  const environmentAudits = getRelatedByReleaseId(dataset.environmentAudits, release.id).sort(
    (a, b) =>
      RELEASE_SERVICE_DEFINITIONS.findIndex((entry) => entry.serviceKey === a.serviceKey) -
      RELEASE_SERVICE_DEFINITIONS.findIndex((entry) => entry.serviceKey === b.serviceKey)
  );
  const migrationLinks = getRelatedByReleaseId(dataset.migrationLinks, release.id).sort((a, b) =>
    a.migrationFilename.localeCompare(b.migrationFilename)
  );

  return {
    release: buildReleaseSummary({
      release,
      services,
      checks,
      smokeResults,
      environmentAudits,
      migrationLinks,
    }),
    services,
    checks,
    smokeResults,
    environmentAudits,
    migrationLinks,
  } satisfies AdminReleaseDetail;
}

export async function loadQaOverview() {
  const [overview, deployChecks] = await Promise.all([
    loadReleaseOverview(),
    loadReleaseDeployCheckSummary().catch(() => null),
  ]);

  const activeReleases = overview.releases.filter(
    (release) => !["verified", "rolled_back"].includes(release.state)
  );
  const releaseIds = activeReleases.map((release) => release.id);
  const dataset = releaseIds.length > 0 ? await loadReleaseDataset({ limit: 12 }) : null;
  const checks = (dataset?.checks ?? []).filter((check) => releaseIds.includes(check.releaseRunId));
  const smokeResults = (dataset?.smokeResults ?? []).filter((result) =>
    releaseIds.includes(result.releaseRunId)
  );
  const environmentAudits = (dataset?.environmentAudits ?? []).filter((audit) =>
    releaseIds.includes(audit.releaseRunId)
  );
  const services = (dataset?.services ?? []).filter((service) =>
    releaseIds.includes(service.releaseRunId)
  );

  const readinessByService = RELEASE_SERVICE_DEFINITIONS.map((definition) =>
    buildQaReadinessSurface({
      serviceKey: definition.serviceKey,
      releases: activeReleases,
      services,
      checks,
      smokeResults,
      environmentAudits,
    })
  ).filter((entry): entry is AdminQaReadinessSurface => Boolean(entry));

  return {
    generatedAt: new Date().toISOString(),
    activeRelease: overview.activeRelease,
    releaseCandidatesWaitingOnQa: activeReleases.filter(
      (release) =>
        release.counts.blockingFailures > 0 ||
        release.counts.smokePending > 0 ||
        release.counts.envWarnings > 0
    ),
    blockingChecks: checks
      .filter((check) => check.isBlocking && check.result === "failed")
      .sort(compareSeverity),
    warningChecks: checks.filter((check) => check.result === "warning").sort(compareSeverity),
    incompleteSmoke: smokeResults.filter((result) => result.result === "not_run"),
    environmentWarnings: environmentAudits
      .filter((audit) => ["warning", "critical", "not_reviewed"].includes(audit.status))
      .sort((a, b) => compareAuditStatus(a.status, b.status)),
    readinessByService,
    deployChecks,
  } satisfies AdminQaOverview;
}

