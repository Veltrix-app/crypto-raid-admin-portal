import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { SUPPORT_COMPONENTS, supportImpactCopy } from "@/lib/support/support-contract";
import type {
  DbServiceIncident,
  DbServiceIncidentUpdate,
} from "@/types/database";
import type {
  AdminServiceIncidentDetail,
  AdminServiceIncidentImpactScope,
  AdminServiceIncidentSeverity,
  AdminServiceIncidentState,
  AdminServiceIncidentSummary,
  AdminServiceStatusLevel,
} from "@/types/entities/support";

function buildIncidentRef() {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `INC-${stamp}-${suffix}`;
}

function defaultStatusLevel(impactScope: AdminServiceIncidentImpactScope): AdminServiceStatusLevel {
  switch (impactScope) {
    case "major_outage":
      return "major_outage";
    case "partial_outage":
      return "partial_outage";
    case "maintenance":
      return "maintenance";
    default:
      return "degraded";
  }
}

function componentLabel(componentKey: string) {
  return (
    SUPPORT_COMPONENTS.find((component) => component.key === componentKey)?.label ??
    componentKey.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase())
  );
}

function shapeIncidentSummary(row: DbServiceIncident): AdminServiceIncidentSummary {
  return {
    id: row.id,
    incidentRef: row.incident_ref,
    title: row.title,
    componentKey: row.component_key,
    componentLabel: componentLabel(row.component_key),
    severity: row.severity,
    impactScope: row.impact_scope,
    state: row.state,
    publicSummary: row.public_summary,
    internalSummary: row.internal_summary,
    publicVisible: row.public_visible,
    declaredByAuthUserId: row.declared_by_auth_user_id ?? undefined,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServiceIncidents(options?: {
  includeResolved?: boolean;
  limit?: number;
}) {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from("service_incidents")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(options?.limit ?? 20);

  if (!options?.includeResolved) {
    query = query.neq("state", "resolved");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbServiceIncident[]).map(shapeIncidentSummary);
}

export async function loadServiceIncidentDetail(
  incidentId: string
): Promise<AdminServiceIncidentDetail | null> {
  const supabase = getServiceSupabaseClient();
  const [{ data: incident, error: incidentError }, { data: updates, error: updatesError }] =
    await Promise.all([
      supabase.from("service_incidents").select("*").eq("id", incidentId).maybeSingle(),
      supabase
        .from("service_incident_updates")
        .select("*")
        .eq("service_incident_id", incidentId)
        .order("created_at", { ascending: false }),
    ]);

  if (incidentError) {
    throw new Error(incidentError.message);
  }

  if (updatesError) {
    throw new Error(updatesError.message);
  }

  if (!incident) {
    return null;
  }

  return {
    ...shapeIncidentSummary(incident as DbServiceIncident),
    updates: ((updates ?? []) as DbServiceIncidentUpdate[]).map((row) => ({
      id: row.id,
      serviceIncidentId: row.service_incident_id,
      updateType: row.update_type,
      visibilityScope: row.visibility_scope,
      incidentState: row.incident_state ?? undefined,
      componentStatus: row.component_status ?? undefined,
      title: row.title ?? undefined,
      message: row.message,
      actorAuthUserId: row.actor_auth_user_id ?? undefined,
      createdAt: row.created_at,
      metadata: row.metadata ?? undefined,
    })),
  };
}

async function writeStatusSnapshot(input: {
  componentKey: string;
  status: AdminServiceStatusLevel;
  summary: string;
  publicMessage: string;
  serviceIncidentId?: string;
  actorAuthUserId: string;
  snapshotSource: "incident_command" | "manual";
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("service_status_snapshots").insert({
    component_key: input.componentKey,
    component_label: componentLabel(input.componentKey),
    status: input.status,
    summary: input.summary,
    public_message: input.publicMessage,
    service_incident_id: input.serviceIncidentId ?? null,
    snapshot_source: input.snapshotSource,
    is_public: true,
    created_by_auth_user_id: input.actorAuthUserId,
    metadata: {},
    created_at: now,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function appendIncidentUpdate(input: {
  incidentId: string;
  actorAuthUserId: string;
  updateType: "state_change" | "public_update" | "internal_note";
  visibilityScope: "internal" | "public" | "both";
  title?: string;
  message: string;
  incidentState?: AdminServiceIncidentState;
  componentStatus?: AdminServiceStatusLevel;
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("service_incident_updates").insert({
    service_incident_id: input.incidentId,
    update_type: input.updateType,
    visibility_scope: input.visibilityScope,
    incident_state: input.incidentState ?? null,
    component_status: input.componentStatus ?? null,
    title: input.title ?? null,
    message: input.message,
    actor_auth_user_id: input.actorAuthUserId,
    metadata: {},
    created_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createServiceIncident(input: {
  actorAuthUserId: string;
  title: string;
  componentKey: string;
  severity: AdminServiceIncidentSeverity;
  impactScope: AdminServiceIncidentImpactScope;
  publicSummary: string;
  internalSummary: string;
  publicVisible?: boolean;
}) {
  const title = input.title.trim();
  const publicSummary = input.publicSummary.trim();
  const internalSummary = input.internalSummary.trim();

  if (!title || !publicSummary || !internalSummary) {
    throw new Error("Incidents need a title, public summary and internal summary.");
  }

  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const incidentRef = buildIncidentRef();

  const { data: incident, error } = await supabase
    .from("service_incidents")
    .insert({
      incident_ref: incidentRef,
      title,
      component_key: input.componentKey,
      severity: input.severity,
      impact_scope: input.impactScope,
      state: "investigating",
      public_summary: publicSummary,
      internal_summary: internalSummary,
      public_visible: input.publicVisible ?? true,
      declared_by_auth_user_id: input.actorAuthUserId,
      owner_auth_user_id: input.actorAuthUserId,
      opened_at: now,
      created_at: now,
      updated_at: now,
      metadata: {},
    })
    .select("*")
    .single();

  if (error || !incident) {
    throw new Error(error?.message ?? "Failed to create service incident.");
  }

  await appendIncidentUpdate({
    incidentId: incident.id,
    actorAuthUserId: input.actorAuthUserId,
    updateType: "internal_note",
    visibilityScope: "internal",
    title: "Incident declared",
    message: internalSummary,
    incidentState: "investigating",
  });

  await appendIncidentUpdate({
    incidentId: incident.id,
    actorAuthUserId: input.actorAuthUserId,
    updateType: "public_update",
    visibilityScope: "public",
    title: "Investigating",
    message: publicSummary,
    incidentState: "investigating",
    componentStatus: defaultStatusLevel(input.impactScope),
  });

  await writeStatusSnapshot({
    componentKey: input.componentKey,
    status: defaultStatusLevel(input.impactScope),
    summary: internalSummary,
    publicMessage: publicSummary,
    serviceIncidentId: incident.id,
    actorAuthUserId: input.actorAuthUserId,
    snapshotSource: "incident_command",
  });

  return loadServiceIncidentDetail(incident.id);
}

export async function runIncidentAction(input: {
  incidentId: string;
  actorAuthUserId: string;
  action: "state_transition" | "public_update" | "internal_note";
  title?: string;
  message: string;
  state?: AdminServiceIncidentState;
  componentStatus?: AdminServiceStatusLevel;
}) {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Incident updates need a message.");
  }

  const supabase = getServiceSupabaseClient();
  const { data: currentIncident, error: currentIncidentError } = await supabase
    .from("service_incidents")
    .select("*")
    .eq("id", input.incidentId)
    .single();

  if (currentIncidentError || !currentIncident) {
    throw new Error(currentIncidentError?.message ?? "Incident not found.");
  }

  const incident = currentIncident as DbServiceIncident;
  const nextState = input.state ?? incident.state;
  const now = new Date().toISOString();

  if (input.action === "state_transition") {
    const { error } = await supabase
      .from("service_incidents")
      .update({
        state: nextState,
        owner_auth_user_id: input.actorAuthUserId,
        updated_at: now,
        resolved_at: nextState === "resolved" ? now : null,
      })
      .eq("id", input.incidentId);

    if (error) {
      throw new Error(error.message);
    }
  }

  await appendIncidentUpdate({
    incidentId: input.incidentId,
    actorAuthUserId: input.actorAuthUserId,
    updateType:
      input.action === "public_update"
        ? "public_update"
        : input.action === "internal_note"
          ? "internal_note"
          : "state_change",
    visibilityScope: input.action === "internal_note" ? "internal" : "public",
    title: input.title,
    message,
    incidentState: input.action === "internal_note" ? undefined : nextState,
    componentStatus: input.componentStatus,
  });

  if (input.action !== "internal_note") {
    const publicMessage =
      input.action === "public_update"
        ? message
        : supportImpactCopy({
            componentLabel: componentLabel(incident.component_key),
            impactScope: incident.impact_scope,
            state: nextState,
          });

    const { error } = await supabase
      .from("service_incidents")
      .update({
        state: nextState,
        public_summary: publicMessage,
        owner_auth_user_id: input.actorAuthUserId,
        updated_at: now,
        resolved_at: nextState === "resolved" ? now : null,
      })
      .eq("id", input.incidentId);

    if (error) {
      throw new Error(error.message);
    }

    await writeStatusSnapshot({
      componentKey: incident.component_key,
      status:
        input.componentStatus ??
        (nextState === "resolved" ? "operational" : defaultStatusLevel(incident.impact_scope)),
      summary: message,
      publicMessage,
      serviceIncidentId: incident.id,
      actorAuthUserId: input.actorAuthUserId,
      snapshotSource: "incident_command",
    });
  }

  return loadServiceIncidentDetail(input.incidentId);
}
