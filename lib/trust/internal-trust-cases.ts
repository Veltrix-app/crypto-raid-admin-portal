import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbTrustCase, DbTrustCaseEvent } from "@/types/database";

export type InternalTrustCaseSummary = {
  id: string;
  projectId: string;
  projectName: string;
  authUserId: string | null;
  username: string | null;
  walletAddress: string | null;
  caseType: string;
  severity: string;
  status: string;
  sourceType: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  openedAt: string;
  updatedAt: string;
};

export type InternalTrustCaseDetail = InternalTrustCaseSummary & {
  sourceId: string | null;
  dedupeKey: string;
  rawSignalPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
};

export type InternalTrustCaseEvent = {
  id: string;
  trustCaseId: string;
  eventType: string;
  visibilityScope: string;
  actorAuthUserId: string | null;
  summary: string | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
};

async function buildProjectNameMap(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id, name").in("id", projectIds);

  if (error) {
    throw new Error(error.message || "Failed to load trust-case project names.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; name: string | null }>).map((row) => [
      row.id,
      row.name ?? "Project",
    ])
  );
}

async function buildUsernameMap(authUserIds: string[]) {
  if (authUserIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("auth_user_id, username")
    .in("auth_user_id", authUserIds);

  if (error) {
    throw new Error(error.message || "Failed to load trust-case usernames.");
  }

  return new Map(
    ((data ?? []) as Array<{ auth_user_id: string; username: string | null }>).map((row) => [
      row.auth_user_id,
      row.username ?? "Unknown user",
    ])
  );
}

function shapeInternalCase(
  row: DbTrustCase,
  projectNameById: Map<string, string>,
  usernameByAuthUserId: Map<string, string>
): InternalTrustCaseDetail {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: projectNameById.get(row.project_id) ?? "Project",
    authUserId: row.auth_user_id,
    username: row.auth_user_id ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user" : null,
    walletAddress: row.wallet_address,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    sourceType: row.source_type,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    rawSignalPayload: row.raw_signal_payload,
    resolutionNotes: row.resolution_notes,
    escalationState: row.escalation_state,
    metadata: row.metadata,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    updatedAt: row.updated_at,
  };
}

export async function listInternalTrustCases() {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("trust_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message || "Failed to load internal trust cases.");
  }

  const rows = (data ?? []) as DbTrustCase[];
  const projectNameById = await buildProjectNameMap(
    Array.from(new Set(rows.map((row) => row.project_id).filter(Boolean)))
  );
  const usernameByAuthUserId = await buildUsernameMap(
    Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
  );

  return rows.map((row) => shapeInternalCase(row, projectNameById, usernameByAuthUserId));
}

export async function loadInternalTrustCaseDetail(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("trust_cases").select("*").eq("id", caseId).maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load trust case.");
  }

  if (!data) {
    return null;
  }

  const row = data as DbTrustCase;
  const [projectNameById, usernameByAuthUserId] = await Promise.all([
    buildProjectNameMap([row.project_id]),
    buildUsernameMap(row.auth_user_id ? [row.auth_user_id] : []),
  ]);

  return shapeInternalCase(row, projectNameById, usernameByAuthUserId);
}

export async function listInternalTrustCaseEvents(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("trust_case_events")
    .select("*")
    .eq("trust_case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load trust case events.");
  }

  return ((data ?? []) as DbTrustCaseEvent[]).map((row) => ({
    id: row.id,
    trustCaseId: row.trust_case_id,
    eventType: row.event_type,
    visibilityScope: row.visibility_scope,
    actorAuthUserId: row.actor_auth_user_id,
    summary: row.summary,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  })) satisfies InternalTrustCaseEvent[];
}
