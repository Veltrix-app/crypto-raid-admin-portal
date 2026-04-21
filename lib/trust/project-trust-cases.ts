import type { DbTrustCase, DbTrustCaseEvent } from "@/types/database";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  hasTrustVisibilityPermission,
  type ProjectTrustAccessResult,
  TrustAccessError,
} from "./project-trust-auth";

export type ProjectTrustCaseSummary = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username: string | null;
  openedAt: string;
  updatedAt: string;
};

export type ProjectTrustCaseDetail = ProjectTrustCaseSummary & {
  authUserId: string | null;
  walletAddress: string | null;
  rawSignalPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  sourceType: string;
  sourceId: string | null;
  events: Array<{
    id: string;
    eventType: string;
    summary: string | null;
    createdAt: string;
    eventPayload: Record<string, unknown> | null;
  }>;
};

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
    throw new Error(error.message || "Failed to load trust usernames.");
  }

  return new Map(
    ((data ?? []) as Array<{ auth_user_id: string; username: string | null }>).map((row) => [
      row.auth_user_id,
      row.username ?? "Unknown user",
    ])
  );
}

function shapeProjectTrustCaseSummary(
  row: DbTrustCase,
  usernameByAuthUserId: Map<string, string>,
  access: ProjectTrustAccessResult
): ProjectTrustCaseSummary {
  const canSeeMemberDetail = hasTrustVisibilityPermission(access, "member_case_detail");
  return {
    id: row.id,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    escalationState: row.escalation_state,
    username:
      canSeeMemberDetail && row.auth_user_id
        ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user"
        : null,
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectTrustCases(access: ProjectTrustAccessResult) {
  if (!hasTrustVisibilityPermission(access, "trust_case_list")) {
    throw new TrustAccessError(403, "You do not have access to the project trust case list.");
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("trust_cases")
    .select("*")
    .eq("project_id", access.projectId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message || "Failed to load project trust cases.");
  }

  const rows = (data ?? []) as DbTrustCase[];
  const usernameByAuthUserId = await buildUsernameMap(
    Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
  );

  return rows.map((row) => shapeProjectTrustCaseSummary(row, usernameByAuthUserId, access));
}

export async function loadProjectTrustCaseDetail(
  caseId: string,
  access: ProjectTrustAccessResult
) {
  if (!hasTrustVisibilityPermission(access, "trust_case_list")) {
    throw new TrustAccessError(403, "You do not have access to project trust cases.");
  }

  const supabase = getServiceSupabaseClient();
  const [{ data: caseRow, error: caseError }, { data: eventRows, error: eventError }] =
    await Promise.all([
      supabase
        .from("trust_cases")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("id", caseId)
        .maybeSingle(),
      supabase
        .from("trust_case_events")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("trust_case_id", caseId)
        .in("visibility_scope", ["project", "both"])
        .order("created_at", { ascending: false }),
    ]);

  if (caseError) {
    throw new Error(caseError.message || "Failed to load trust case detail.");
  }
  if (eventError) {
    throw new Error(eventError.message || "Failed to load trust case timeline.");
  }
  if (!caseRow) {
    return null;
  }

  const row = caseRow as DbTrustCase;
  const usernameByAuthUserId = await buildUsernameMap(
    row.auth_user_id ? [row.auth_user_id] : []
  );

  const canSeeMemberDetail = hasTrustVisibilityPermission(access, "member_case_detail");
  const canSeeWalletDetail = hasTrustVisibilityPermission(access, "wallet_detail");
  const canSeeRawSignal = hasTrustVisibilityPermission(access, "raw_signal_detail");
  const canSeeHistory = hasTrustVisibilityPermission(access, "resolution_history");

  return {
    ...shapeProjectTrustCaseSummary(row, usernameByAuthUserId, access),
    authUserId: canSeeMemberDetail ? row.auth_user_id : null,
    walletAddress: canSeeWalletDetail ? row.wallet_address : null,
    rawSignalPayload: canSeeRawSignal ? row.raw_signal_payload : null,
    resolutionNotes: canSeeHistory ? row.resolution_notes : null,
    metadata: canSeeRawSignal ? row.metadata : null,
    sourceType: row.source_type,
    sourceId: row.source_id,
    events: canSeeHistory
      ? ((eventRows ?? []) as DbTrustCaseEvent[]).map((event) => ({
          id: event.id,
          eventType: event.event_type,
          summary: event.summary,
          createdAt: event.created_at,
          eventPayload: canSeeRawSignal ? event.event_payload : null,
        }))
      : [],
  } satisfies ProjectTrustCaseDetail;
}
