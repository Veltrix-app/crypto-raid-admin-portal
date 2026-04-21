import type { DbOnchainCase, DbOnchainCaseEvent } from "@/types/database";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  hasOnchainVisibilityPermission,
  type ProjectOnchainAccessResult,
  OnchainAccessError,
} from "./project-onchain-auth";

export type ProjectOnchainCaseSummary = {
  id: string;
  caseType: string;
  severity: string;
  status: string;
  sourceType: string;
  summary: string;
  evidenceSummary: string | null;
  escalationState: string;
  username: string | null;
  walletAddress: string | null;
  assetSymbol: string | null;
  openedAt: string;
  updatedAt: string;
};

export type ProjectOnchainCaseDetail = ProjectOnchainCaseSummary & {
  authUserId: string | null;
  assetId: string | null;
  sourceId: string | null;
  dedupeKey: string;
  rawPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
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
    throw new Error(error.message || "Failed to load on-chain usernames.");
  }

  return new Map(
    ((data ?? []) as Array<{ auth_user_id: string; username: string | null }>).map((row) => [
      row.auth_user_id,
      row.username ?? "Unknown user",
    ])
  );
}

async function buildAssetSymbolMap(assetIds: string[]) {
  if (assetIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select("id, symbol")
    .in("id", assetIds);

  if (error) {
    throw new Error(error.message || "Failed to load on-chain asset symbols.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; symbol: string | null }>).map((row) => [
      row.id,
      row.symbol ?? "Asset",
    ])
  );
}

function shapeProjectOnchainCaseSummary(
  row: DbOnchainCase,
  usernameByAuthUserId: Map<string, string>,
  assetSymbolById: Map<string, string>,
  access: ProjectOnchainAccessResult
): ProjectOnchainCaseSummary {
  const canSeeMemberDetail = hasOnchainVisibilityPermission(access, "member_wallet_detail");
  return {
    id: row.id,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    sourceType: row.source_type,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    escalationState: row.escalation_state,
    username:
      canSeeMemberDetail && row.auth_user_id
        ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user"
        : null,
    walletAddress: canSeeMemberDetail ? row.wallet_address : null,
    assetSymbol: row.asset_id ? assetSymbolById.get(row.asset_id) ?? "Asset" : null,
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectOnchainCases(access: ProjectOnchainAccessResult) {
  if (!hasOnchainVisibilityPermission(access, "case_list")) {
    throw new OnchainAccessError(403, "You do not have access to the project on-chain case list.");
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("onchain_cases")
    .select("*")
    .eq("project_id", access.projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message || "Failed to load project on-chain cases.");
  }

  const rows = (data ?? []) as DbOnchainCase[];
  const [usernameByAuthUserId, assetSymbolById] = await Promise.all([
    buildUsernameMap(
      Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
    ),
    buildAssetSymbolMap(
      Array.from(new Set(rows.map((row) => row.asset_id).filter(Boolean) as string[]))
    ),
  ]);

  return rows.map((row) =>
    shapeProjectOnchainCaseSummary(row, usernameByAuthUserId, assetSymbolById, access)
  );
}

export async function loadProjectOnchainCaseDetail(
  caseId: string,
  access: ProjectOnchainAccessResult
) {
  if (!hasOnchainVisibilityPermission(access, "case_list")) {
    throw new OnchainAccessError(403, "You do not have access to project on-chain cases.");
  }

  const supabase = getServiceSupabaseClient();
  const [{ data: caseRow, error: caseError }, { data: eventRows, error: eventError }] =
    await Promise.all([
      supabase
        .from("onchain_cases")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("id", caseId)
        .maybeSingle(),
      supabase
        .from("onchain_case_events")
        .select("*")
        .eq("project_id", access.projectId)
        .eq("onchain_case_id", caseId)
        .in("visibility_scope", ["project", "both"])
        .order("created_at", { ascending: false }),
    ]);

  if (caseError) {
    throw new Error(caseError.message || "Failed to load on-chain case detail.");
  }
  if (eventError) {
    throw new Error(eventError.message || "Failed to load on-chain case timeline.");
  }
  if (!caseRow) {
    return null;
  }

  const row = caseRow as DbOnchainCase;
  const [usernameByAuthUserId, assetSymbolById] = await Promise.all([
    buildUsernameMap(row.auth_user_id ? [row.auth_user_id] : []),
    buildAssetSymbolMap(row.asset_id ? [row.asset_id] : []),
  ]);

  const canSeeMemberDetail = hasOnchainVisibilityPermission(access, "member_wallet_detail");
  const canSeeEventDetail = hasOnchainVisibilityPermission(access, "event_detail");
  const canSeeRawSignal = hasOnchainVisibilityPermission(access, "raw_signal_detail");
  const canSeeHistory = hasOnchainVisibilityPermission(access, "resolution_history");

  return {
    ...shapeProjectOnchainCaseSummary(row, usernameByAuthUserId, assetSymbolById, access),
    authUserId: canSeeMemberDetail ? row.auth_user_id : null,
    assetId: row.asset_id,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    rawPayload: canSeeRawSignal ? row.raw_payload : null,
    resolutionNotes: canSeeHistory ? row.resolution_notes : null,
    metadata: canSeeRawSignal ? row.metadata : null,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    events: canSeeHistory
      ? ((eventRows ?? []) as DbOnchainCaseEvent[]).map((event) => ({
          id: event.id,
          eventType: event.event_type,
          summary: event.summary,
          createdAt: event.created_at,
          eventPayload: canSeeEventDetail || canSeeRawSignal ? event.event_payload : null,
        }))
      : [],
  } satisfies ProjectOnchainCaseDetail;
}
