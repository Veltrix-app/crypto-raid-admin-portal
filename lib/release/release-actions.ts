import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import {
  buildEnvironmentAuditScaffold,
  deriveEnvironmentAuditStatus,
  normalizeListInput,
} from "@/lib/release/environment-audits";
import {
  buildInitialReleaseChecks,
  buildInitialReleaseServices,
  buildInitialReleaseSmokeResults,
  buildReleaseRef,
  canMarkReleaseVerified,
  deriveReleaseDecision,
} from "@/lib/release/release-contract";
import { loadReleaseDetail } from "@/lib/release/release-overview";
import type {
  AdminReleaseDetail,
  AdminReleaseRunCheck,
  AdminReleaseRunSmokeResult,
} from "@/types/entities/release";
import type {
  EnvironmentAuditStatus,
  MigrationReviewState,
  MigrationRunState,
  ReleaseCheckResult,
  ReleaseRunState,
  ReleaseServiceDeployStatus,
  ReleaseServiceInclusionStatus,
  ReleaseServiceKey,
  ReleaseTargetEnvironment,
} from "@/types/database";

type CreateReleaseInput = {
  title?: string;
  summary?: string;
  targetEnvironment?: ReleaseTargetEnvironment;
  rollbackNotes?: string;
  blockerSummary?: string;
};

type UpdateReleaseInput = {
  title?: string;
  summary?: string;
  targetEnvironment?: ReleaseTargetEnvironment;
  state?: ReleaseRunState;
  decisionNotes?: string;
  blockerSummary?: string;
  rollbackNotes?: string;
  services?: Array<{
    serviceKey: ReleaseServiceKey;
    inclusionStatus?: ReleaseServiceInclusionStatus;
    deployStatus?: ReleaseServiceDeployStatus;
    versionLabel?: string | null;
    notes?: string;
  }>;
  migrationLinks?: Array<{
    migrationFilename: string;
    reviewState?: MigrationReviewState;
    runState?: MigrationRunState;
    mitigationNotes?: string;
  }>;
};

function cleanText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function sanitizeNullableText(value: string | null | undefined) {
  const safe = cleanText(value);
  return safe.length > 0 ? safe : null;
}

function buildTimestampPatch(targetState?: ReleaseRunState) {
  const timestamp = new Date().toISOString();
  return {
    approved_at: targetState === "approved" ? timestamp : undefined,
    deploying_at: targetState === "deploying" ? timestamp : undefined,
    verified_at: targetState === "verified" ? timestamp : undefined,
  };
}

async function syncReleasePosture(releaseId: string) {
  const supabase = getAccountsServiceClient();
  const detail = await loadReleaseDetail(releaseId);
  const decision = deriveReleaseDecision({
    checks: detail.checks,
    smokeResults: detail.smokeResults,
    audits: detail.environmentAudits,
    migrationLinks: detail.migrationLinks,
  });

  const state =
    detail.release.state === "verified" && decision !== "go"
      ? ("degraded" as const)
      : detail.release.state;

  const { error } = await supabase
    .from("release_runs")
    .update({
      decision,
      state,
      updated_at: new Date().toISOString(),
    })
    .eq("id", releaseId);

  if (error) {
    throw new Error(error.message || "Failed to sync release posture.");
  }
}

async function assertReleaseCanTransition(releaseId: string, targetState: ReleaseRunState) {
  if (targetState !== "verified") {
    return;
  }

  const detail = await loadReleaseDetail(releaseId);
  if (
    !canMarkReleaseVerified({
      checks: detail.checks,
      smokeResults: detail.smokeResults,
      audits: detail.environmentAudits,
      migrationLinks: detail.migrationLinks,
    })
  ) {
    throw new Error(
      "This release still has blocking checks, pending smoke, critical audits or unresolved migration posture."
    );
  }
}

export async function createDraftRelease(
  authUserId: string,
  input: CreateReleaseInput = {}
) {
  const supabase = getAccountsServiceClient();
  const now = new Date();
  const releaseRef = `${buildReleaseRef(now)}-${String(now.getUTCSeconds()).padStart(2, "0")}`;
  const targetEnvironment = input.targetEnvironment ?? "production";
  const title = cleanText(input.title) || `Release candidate ${releaseRef}`;

  const { data: releaseRow, error: releaseError } = await supabase
    .from("release_runs")
    .insert({
      release_ref: releaseRef,
      title,
      summary: cleanText(input.summary),
      target_environment: targetEnvironment,
      state: "draft",
      decision: "undecided",
      decision_notes: "",
      blocker_summary: cleanText(input.blockerSummary),
      rollback_notes: cleanText(input.rollbackNotes),
      owner_auth_user_id: authUserId,
      metadata: {
        seededBy: "phase15_release_machine",
      },
    })
    .select("id")
    .single();

  if (releaseError || !releaseRow?.id) {
    throw new Error(releaseError?.message || "Failed to create draft release.");
  }

  const [servicesError, checksError, smokeError, auditsError] = await Promise.all([
    supabase.from("release_run_services").insert(buildInitialReleaseServices(releaseRow.id)),
    supabase.from("release_run_checks").insert(buildInitialReleaseChecks(releaseRow.id)),
    supabase.from("release_run_smoke_results").insert(buildInitialReleaseSmokeResults(releaseRow.id)),
    supabase
      .from("environment_audits")
      .insert(buildEnvironmentAuditScaffold(releaseRow.id, targetEnvironment)),
  ]).then((results) => results.map((result) => result.error));

  const firstError = [servicesError, checksError, smokeError, auditsError].find(Boolean);
  if (firstError) {
    throw new Error(firstError.message || "Failed to seed release controls.");
  }

  await syncReleasePosture(releaseRow.id);
  return loadReleaseDetail(releaseRow.id);
}

export async function updateReleaseRun(
  releaseId: string,
  authUserId: string,
  input: UpdateReleaseInput
) {
  const supabase = getAccountsServiceClient();
  const targetState = input.state;
  if (targetState) {
    await assertReleaseCanTransition(releaseId, targetState);
  }

  const timestampPatch = buildTimestampPatch(targetState);
  const updatePayload = {
    title: cleanText(input.title) || undefined,
    summary: input.summary !== undefined ? cleanText(input.summary) : undefined,
    target_environment: input.targetEnvironment,
    state: targetState,
    decision_notes: input.decisionNotes !== undefined ? cleanText(input.decisionNotes) : undefined,
    blocker_summary: input.blockerSummary !== undefined ? cleanText(input.blockerSummary) : undefined,
    rollback_notes: input.rollbackNotes !== undefined ? cleanText(input.rollbackNotes) : undefined,
    updated_at: new Date().toISOString(),
    ...timestampPatch,
  };

  const { error: updateError } = await supabase
    .from("release_runs")
    .update(updatePayload)
    .eq("id", releaseId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to update release.");
  }

  if (input.services?.length) {
    const rows = input.services.map((service) => ({
      release_run_id: releaseId,
      service_key: service.serviceKey,
      inclusion_status: service.inclusionStatus,
      deploy_status: service.deployStatus,
      version_label: sanitizeNullableText(service.versionLabel),
      notes: service.notes !== undefined ? cleanText(service.notes) : undefined,
      updated_at: new Date().toISOString(),
      metadata: {
        updatedBy: authUserId,
      },
    }));

    const { error } = await supabase
      .from("release_run_services")
      .upsert(rows, { onConflict: "release_run_id,service_key" });
    if (error) {
      throw new Error(error.message || "Failed to update release services.");
    }
  }

  if (input.migrationLinks?.length) {
    const rows = input.migrationLinks.map((link) => ({
      release_run_id: releaseId,
      migration_filename: cleanText(link.migrationFilename),
      review_state: link.reviewState ?? "not_reviewed",
      run_state: link.runState ?? "pending",
      mitigation_notes: cleanText(link.mitigationNotes),
      reviewed_by_auth_user_id:
        link.reviewState && link.reviewState !== "not_reviewed" ? authUserId : null,
      reviewed_at:
        link.reviewState && link.reviewState !== "not_reviewed"
          ? new Date().toISOString()
          : null,
      executed_at: link.runState === "run" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      metadata: {
        updatedBy: authUserId,
      },
    }));

    const { error } = await supabase
      .from("migration_release_links")
      .upsert(rows, { onConflict: "release_run_id,migration_filename" });
    if (error) {
      throw new Error(error.message || "Failed to update migration linkage.");
    }
  }

  await syncReleasePosture(releaseId);
  return loadReleaseDetail(releaseId);
}

export async function updateReleaseCheck(input: {
  releaseId: string;
  checkId: string;
  authUserId: string;
  result: ReleaseCheckResult;
  summary?: string;
  nextAction?: string;
}) {
  const supabase = getAccountsServiceClient();
  const { error } = await supabase
    .from("release_run_checks")
    .update({
      result: input.result,
      summary: input.summary !== undefined ? cleanText(input.summary) : undefined,
      next_action: input.nextAction !== undefined ? cleanText(input.nextAction) : undefined,
      verified_by_auth_user_id: input.authUserId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        updatedBy: input.authUserId,
      },
    })
    .eq("id", input.checkId)
    .eq("release_run_id", input.releaseId);

  if (error) {
    throw new Error(error.message || "Failed to update release check.");
  }

  await syncReleasePosture(input.releaseId);
  return loadReleaseDetail(input.releaseId);
}

export async function updateReleaseSmokeResult(input: {
  releaseId: string;
  smokeResultId: string;
  authUserId: string;
  result: ReleaseCheckResult;
  notes?: string;
}) {
  const supabase = getAccountsServiceClient();
  const { error } = await supabase
    .from("release_run_smoke_results")
    .update({
      result: input.result,
      notes: input.notes !== undefined ? cleanText(input.notes) : undefined,
      verified_by_auth_user_id: input.authUserId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        updatedBy: input.authUserId,
      },
    })
    .eq("id", input.smokeResultId)
    .eq("release_run_id", input.releaseId);

  if (error) {
    throw new Error(error.message || "Failed to update smoke result.");
  }

  await syncReleasePosture(input.releaseId);
  return loadReleaseDetail(input.releaseId);
}

export async function updateEnvironmentAudit(input: {
  releaseId: string;
  auditId: string;
  authUserId: string;
  status?: EnvironmentAuditStatus;
  summary?: string;
  missingKeys?: string | string[];
  mismatchNotes?: string | string[];
}) {
  const supabase = getAccountsServiceClient();
  const { data: currentAudit, error: currentError } = await supabase
    .from("environment_audits")
    .select("status, missing_keys, mismatch_notes, verified_at")
    .eq("id", input.auditId)
    .eq("release_run_id", input.releaseId)
    .single();

  if (currentError || !currentAudit) {
    throw new Error(currentError?.message || "Failed to load current environment audit.");
  }

  const missingKeys = input.missingKeys !== undefined
    ? normalizeListInput(input.missingKeys)
    : (currentAudit.missing_keys ?? []);
  const mismatchNotes = input.mismatchNotes !== undefined
    ? normalizeListInput(input.mismatchNotes)
    : (currentAudit.mismatch_notes ?? []);

  const status = deriveEnvironmentAuditStatus({
    missingKeys,
    mismatchNotes,
    reviewedAt: currentAudit.verified_at,
    currentStatus: input.status ?? currentAudit.status,
  });

  const { error } = await supabase
    .from("environment_audits")
    .update({
      status,
      summary: input.summary !== undefined ? cleanText(input.summary) : undefined,
      missing_keys: missingKeys,
      mismatch_notes: mismatchNotes,
      verified_by_auth_user_id: input.authUserId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        updatedBy: input.authUserId,
      },
    })
    .eq("id", input.auditId)
    .eq("release_run_id", input.releaseId);

  if (error) {
    throw new Error(error.message || "Failed to update environment audit.");
  }

  await syncReleasePosture(input.releaseId);
  return loadReleaseDetail(input.releaseId);
}

