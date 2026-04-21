import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbOnchainCase, DbOnchainCaseEvent } from "@/types/database";

export type InternalOnchainCaseSummary = {
  id: string;
  projectId: string;
  projectName: string;
  authUserId: string | null;
  username: string | null;
  walletAddress: string | null;
  assetId: string | null;
  assetSymbol: string | null;
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

export type InternalOnchainCaseDetail = InternalOnchainCaseSummary & {
  sourceId: string | null;
  dedupeKey: string;
  rawPayload: Record<string, unknown> | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
};

export type InternalOnchainCaseEvent = {
  id: string;
  onchainCaseId: string;
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
    throw new Error(error.message || "Failed to load on-chain case project names.");
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
    throw new Error(error.message || "Failed to load on-chain case usernames.");
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
    throw new Error(error.message || "Failed to load on-chain case asset symbols.");
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; symbol: string | null }>).map((row) => [
      row.id,
      row.symbol ?? "Asset",
    ])
  );
}

function shapeInternalCase(
  row: DbOnchainCase,
  projectNameById: Map<string, string>,
  usernameByAuthUserId: Map<string, string>,
  assetSymbolById: Map<string, string>
): InternalOnchainCaseDetail {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: projectNameById.get(row.project_id) ?? "Project",
    authUserId: row.auth_user_id,
    username: row.auth_user_id ? usernameByAuthUserId.get(row.auth_user_id) ?? "Unknown user" : null,
    walletAddress: row.wallet_address,
    assetId: row.asset_id,
    assetSymbol: row.asset_id ? assetSymbolById.get(row.asset_id) ?? "Asset" : null,
    caseType: row.case_type,
    severity: row.severity,
    status: row.status,
    sourceType: row.source_type,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    summary: row.summary,
    evidenceSummary: row.evidence_summary,
    rawPayload: row.raw_payload,
    resolutionNotes: row.resolution_notes,
    escalationState: row.escalation_state,
    metadata: row.metadata,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    updatedAt: row.updated_at,
  };
}

export async function listInternalOnchainCases() {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("onchain_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(160);

  if (error) {
    throw new Error(error.message || "Failed to load internal on-chain cases.");
  }

  const rows = (data ?? []) as DbOnchainCase[];
  const [projectNameById, usernameByAuthUserId, assetSymbolById] = await Promise.all([
    buildProjectNameMap(Array.from(new Set(rows.map((row) => row.project_id).filter(Boolean)))),
    buildUsernameMap(
      Array.from(new Set(rows.map((row) => row.auth_user_id).filter(Boolean) as string[]))
    ),
    buildAssetSymbolMap(
      Array.from(new Set(rows.map((row) => row.asset_id).filter(Boolean) as string[]))
    ),
  ]);

  return rows.map((row) =>
    shapeInternalCase(row, projectNameById, usernameByAuthUserId, assetSymbolById)
  );
}

export async function loadInternalOnchainCaseDetail(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("onchain_cases").select("*").eq("id", caseId).maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load on-chain case.");
  }

  if (!data) {
    return null;
  }

  const row = data as DbOnchainCase;
  const [projectNameById, usernameByAuthUserId, assetSymbolById] = await Promise.all([
    buildProjectNameMap([row.project_id]),
    buildUsernameMap(row.auth_user_id ? [row.auth_user_id] : []),
    buildAssetSymbolMap(row.asset_id ? [row.asset_id] : []),
  ]);

  return shapeInternalCase(row, projectNameById, usernameByAuthUserId, assetSymbolById);
}

export async function listInternalOnchainCaseEvents(caseId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("onchain_case_events")
    .select("*")
    .eq("onchain_case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load on-chain case events.");
  }

  return ((data ?? []) as DbOnchainCaseEvent[]).map((row) => ({
    id: row.id,
    onchainCaseId: row.onchain_case_id,
    eventType: row.event_type,
    visibilityScope: row.visibility_scope,
    actorAuthUserId: row.actor_auth_user_id,
    summary: row.summary,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  })) satisfies InternalOnchainCaseEvent[];
}
