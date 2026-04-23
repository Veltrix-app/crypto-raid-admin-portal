"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  AdminQaOverview,
  AdminReleaseDetail,
  AdminReleaseOverview,
} from "@/types/entities/release";
import type {
  EnvironmentAuditStatus,
  ReleaseCheckResult,
  ReleaseRunState,
  ReleaseServiceDeployStatus,
  ReleaseServiceInclusionStatus,
  ReleaseServiceKey,
  ReleaseTargetEnvironment,
} from "@/types/database";

async function getSupabaseAccessToken() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function readJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallback
    );
  }

  return payload as T;
}

async function buildAuthorizedHeaders(extra?: HeadersInit) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

export async function fetchReleaseOverview() {
  const response = await fetch("/api/releases", {
    method: "GET",
    headers: await buildAuthorizedHeaders(),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ ok: true; overview: AdminReleaseOverview }>(
    response,
    "Failed to load release overview."
  );

  return payload.overview;
}

export async function createDraftPortalRelease(input: {
  title?: string;
  summary?: string;
  targetEnvironment?: ReleaseTargetEnvironment;
  rollbackNotes?: string;
  blockerSummary?: string;
}) {
  const response = await fetch("/api/releases", {
    method: "POST",
    headers: await buildAuthorizedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to create draft release."
  );

  return payload.detail;
}

export async function fetchReleaseDetail(releaseId: string) {
  const response = await fetch(`/api/releases/${releaseId}`, {
    method: "GET",
    headers: await buildAuthorizedHeaders(),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to load release detail."
  );

  return payload.detail;
}

export async function updatePortalRelease(input: {
  releaseId: string;
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
    reviewState?: "not_reviewed" | "reviewed" | "approved";
    runState?: "not_needed" | "pending" | "run" | "blocked";
    mitigationNotes?: string;
  }>;
}) {
  const response = await fetch(`/api/releases/${input.releaseId}`, {
    method: "PATCH",
    headers: await buildAuthorizedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to update release."
  );

  return payload.detail;
}

export async function updatePortalReleaseCheck(input: {
  releaseId: string;
  checkId: string;
  result: ReleaseCheckResult;
  summary?: string;
  nextAction?: string;
}) {
  const response = await fetch(`/api/releases/${input.releaseId}/checks`, {
    method: "PATCH",
    headers: await buildAuthorizedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to update release check."
  );

  return payload.detail;
}

export async function updatePortalReleaseSmoke(input: {
  releaseId: string;
  smokeResultId: string;
  result: ReleaseCheckResult;
  notes?: string;
}) {
  const response = await fetch(`/api/releases/${input.releaseId}/smoke`, {
    method: "PATCH",
    headers: await buildAuthorizedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to update smoke result."
  );

  return payload.detail;
}

export async function updatePortalEnvironmentAudit(input: {
  releaseId: string;
  auditId: string;
  status?: EnvironmentAuditStatus;
  summary?: string;
  missingKeys?: string | string[];
  mismatchNotes?: string | string[];
}) {
  const response = await fetch(`/api/releases/${input.releaseId}/environment-audits`, {
    method: "PATCH",
    headers: await buildAuthorizedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ ok: true; detail: AdminReleaseDetail }>(
    response,
    "Failed to update environment audit."
  );

  return payload.detail;
}

export async function fetchQaOverview() {
  const response = await fetch("/api/qa/overview", {
    method: "GET",
    headers: await buildAuthorizedHeaders(),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ ok: true; overview: AdminQaOverview }>(
    response,
    "Failed to load QA overview."
  );

  return payload.overview;
}

