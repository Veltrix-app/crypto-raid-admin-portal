import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

export type ProjectOperationObjectType =
  | "campaign"
  | "quest"
  | "raid"
  | "reward"
  | "claim"
  | "automation"
  | "community_run"
  | "provider_sync";

export type ProjectOperationAuditAction =
  | "created"
  | "updated"
  | "published"
  | "paused"
  | "resumed"
  | "retried"
  | "resolved"
  | "dismissed"
  | "archived"
  | "tested";

export type ProjectOperationIncidentSource =
  | "provider"
  | "job"
  | "manual_test"
  | "pipeline"
  | "runtime";

export type ProjectOperationIncidentSeverity = "info" | "warning" | "critical";
export type ProjectOperationIncidentStatus = "open" | "watching" | "resolved" | "dismissed";
export type ProjectOperationOverrideType =
  | "pause"
  | "manual_retry"
  | "manual_complete"
  | "skip"
  | "mute";
export type ProjectOperationOverrideStatus = "active" | "resolved" | "canceled";

export type ProjectOperationAuditRecord = {
  id: string;
  project_id: string;
  object_type: ProjectOperationObjectType;
  object_id: string;
  action_type: ProjectOperationAuditAction;
  actor_auth_user_id: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProjectOperationIncidentRecord = {
  id: string;
  project_id: string;
  object_type: ProjectOperationObjectType;
  object_id: string;
  source_type: ProjectOperationIncidentSource;
  severity: ProjectOperationIncidentSeverity;
  status: ProjectOperationIncidentStatus;
  title: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectOperationOverrideRecord = {
  id: string;
  project_id: string;
  object_type: ProjectOperationObjectType;
  object_id: string;
  override_type: ProjectOperationOverrideType;
  status: ProjectOperationOverrideStatus;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_by_auth_user_id: string | null;
  resolved_by_auth_user_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

function coerceMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function listProjectOperationIncidents(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_operation_incidents")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    metadata: coerceMetadata(row.metadata),
  })) as ProjectOperationIncidentRecord[];
}

export async function listProjectOperationAudits(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_operation_audits")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    metadata: coerceMetadata(row.metadata),
  })) as ProjectOperationAuditRecord[];
}

export async function listProjectOperationOverrides(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_operation_overrides")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    metadata: coerceMetadata(row.metadata),
  })) as ProjectOperationOverrideRecord[];
}

export async function createProjectOperationAudit(input: {
  projectId: string;
  objectType: ProjectOperationObjectType;
  objectId: string;
  actionType: ProjectOperationAuditAction;
  actorAuthUserId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_operation_audits")
    .insert({
      project_id: input.projectId,
      object_type: input.objectType,
      object_id: input.objectId,
      action_type: input.actionType,
      actor_auth_user_id: input.actorAuthUserId ?? null,
      actor_role: input.actorRole ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as Record<string, unknown>),
    metadata: coerceMetadata((data as Record<string, unknown>).metadata),
  } as ProjectOperationAuditRecord;
}

export async function createProjectOperationIncident(input: {
  projectId: string;
  objectType: ProjectOperationObjectType;
  objectId: string;
  sourceType: ProjectOperationIncidentSource;
  severity?: ProjectOperationIncidentSeverity;
  status?: ProjectOperationIncidentStatus;
  title: string;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const payload = {
    project_id: input.projectId,
    object_type: input.objectType,
    object_id: input.objectId,
    source_type: input.sourceType,
    severity: input.severity ?? "warning",
    status: input.status ?? "open",
    title: input.title,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
    opened_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("project_operation_incidents")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as Record<string, unknown>),
    metadata: coerceMetadata((data as Record<string, unknown>).metadata),
  } as ProjectOperationIncidentRecord;
}

export async function resolveProjectOperationIncident(input: {
  incidentId: string;
  status: Extract<ProjectOperationIncidentStatus, "resolved" | "dismissed" | "watching">;
}) {
  const supabase = getServiceSupabaseClient();
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "resolved") {
    patch.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("project_operation_incidents")
    .update(patch)
    .eq("id", input.incidentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as Record<string, unknown>),
    metadata: coerceMetadata((data as Record<string, unknown>).metadata),
  } as ProjectOperationIncidentRecord;
}

export async function upsertProjectOperationOverride(input: {
  projectId: string;
  objectType: ProjectOperationObjectType;
  objectId: string;
  overrideType: ProjectOperationOverrideType;
  reason?: string | null;
  actorAuthUserId?: string | null;
  status?: ProjectOperationOverrideStatus;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_operation_overrides")
    .insert({
      project_id: input.projectId,
      object_type: input.objectType,
      object_id: input.objectId,
      override_type: input.overrideType,
      status: input.status ?? "active",
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
      created_by_auth_user_id: input.actorAuthUserId ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as Record<string, unknown>),
    metadata: coerceMetadata((data as Record<string, unknown>).metadata),
  } as ProjectOperationOverrideRecord;
}

export async function resolveProjectOperationOverride(input: {
  overrideId: string;
  actorAuthUserId?: string | null;
  status?: Extract<ProjectOperationOverrideStatus, "resolved" | "canceled">;
}) {
  const supabase = getServiceSupabaseClient();
  const nextStatus = input.status ?? "resolved";
  const { data, error } = await supabase
    .from("project_operation_overrides")
    .update({
      status: nextStatus,
      resolved_by_auth_user_id: input.actorAuthUserId ?? null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.overrideId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as Record<string, unknown>),
    metadata: coerceMetadata((data as Record<string, unknown>).metadata),
  } as ProjectOperationOverrideRecord;
}
