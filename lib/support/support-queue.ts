import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { humanizeSupportValue } from "@/lib/support/support-contract";
import type {
  DbProject,
  DbServiceIncident,
  DbSupportTicket,
  DbSupportTicketEvent,
  DbSupportTicketHandoff,
} from "@/types/database";
import type {
  AdminServiceIncidentSummary,
  AdminSupportHandoffStatus,
  AdminSupportHandoffType,
  AdminSupportOverview,
  AdminSupportTicketDetail,
  AdminSupportTicketEvent,
  AdminSupportTicketPriority,
  AdminSupportTicketStatus,
  AdminSupportTicketSummary,
  AdminSupportTicketType,
  AdminSupportWaitingState,
} from "@/types/entities/support";

type SupportTicketFilters = {
  ticketType?: AdminSupportTicketType | "";
  priority?: AdminSupportTicketPriority | "";
  status?: AdminSupportTicketStatus | "";
  waitingState?: AdminSupportWaitingState | "";
  linkedAccountId?: string | "";
  linkedProjectId?: string | "";
  search?: string;
  includeClosed?: boolean;
  limit?: number;
};

export type SupportSurfaceContextRow = {
  handoffId: string;
  ticketId: string;
  ticketRef: string;
  subject: string;
  status: AdminSupportTicketStatus;
  priority: AdminSupportTicketPriority;
  handoffStatus: AdminSupportHandoffStatus;
  summary: string;
  targetRoute?: string;
  projectName?: string;
  createdAt: string;
};

const closedTicketStatuses = new Set<AdminSupportTicketStatus>(["resolved", "closed"]);

function severityFromPriority(priority: AdminSupportTicketPriority) {
  switch (priority) {
    case "urgent":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

function routeForHandoff(input: {
  handoffType: AdminSupportHandoffType;
  customerAccountId?: string | null;
  targetProjectId?: string | null;
  targetRecordId?: string | null;
}) {
  switch (input.handoffType) {
    case "billing":
      return input.customerAccountId
        ? `/business/accounts/${input.customerAccountId}`
        : "/business";
    case "trust":
      return "/moderation";
    case "payout":
      return input.targetRecordId ? `/claims/${input.targetRecordId}` : "/claims";
    case "onchain":
      return "/onchain";
    case "product_ops":
      return input.targetProjectId ? `/projects/${input.targetProjectId}` : "/overview";
    default:
      return "/support";
  }
}

function shapeIncidentSummary(row: DbServiceIncident, componentLabel?: string): AdminServiceIncidentSummary {
  return {
    id: row.id,
    incidentRef: row.incident_ref,
    title: row.title,
    componentKey: row.component_key,
    componentLabel: componentLabel ?? humanizeSupportValue(row.component_key),
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

function shapeTicketSummary(
  row: DbSupportTicket,
  accountName?: string | null,
  projectName?: string | null
): AdminSupportTicketSummary {
  return {
    id: row.id,
    ticketRef: row.ticket_ref,
    ticketType: row.ticket_type,
    priority: row.priority,
    status: row.status,
    waitingState: row.waiting_state,
    escalationState: row.escalation_state,
    subject: row.subject,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    customerAccountId: row.customer_account_id ?? undefined,
    customerAccountName: accountName ?? undefined,
    projectId: row.project_id ?? undefined,
    projectName: projectName ?? undefined,
    assignedAdminAuthUserId: row.assigned_admin_auth_user_id ?? undefined,
    latestCustomerUpdateAt: row.latest_customer_update_at ?? undefined,
    latestInternalUpdateAt: row.latest_internal_update_at ?? undefined,
    firstResponseAt: row.first_response_at ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeTicketEvent(row: DbSupportTicketEvent): AdminSupportTicketEvent {
  return {
    id: row.id,
    supportTicketId: row.support_ticket_id,
    eventType: row.event_type,
    visibilityScope: row.visibility_scope,
    actorAuthUserId: row.actor_auth_user_id ?? undefined,
    title: row.title ?? undefined,
    body: row.body,
    createdAt: row.created_at,
    metadata: row.metadata ?? undefined,
  };
}

async function loadAccountNameMap(accountIds: string[]) {
  if (accountIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_accounts")
    .select("id, name")
    .in("id", accountIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])
  );
}

async function loadProjectNameMap(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id, name").in("id", projectIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])
  );
}

async function shapeTicketRows(rows: DbSupportTicket[]) {
  const accountIds = Array.from(
    new Set(rows.map((row) => row.customer_account_id).filter((value): value is string => Boolean(value)))
  );
  const projectIds = Array.from(
    new Set(rows.map((row) => row.project_id).filter((value): value is string => Boolean(value)))
  );

  const [accountNameMap, projectNameMap] = await Promise.all([
    loadAccountNameMap(accountIds),
    loadProjectNameMap(projectIds),
  ]);

  return rows.map((row) =>
    shapeTicketSummary(
      row,
      row.customer_account_id ? accountNameMap.get(row.customer_account_id) ?? null : null,
      row.project_id ? projectNameMap.get(row.project_id) ?? null : null
    )
  );
}

export async function loadSupportOverview(): Promise<AdminSupportOverview> {
  const supabase = getServiceSupabaseClient();
  const [{ data: tickets, error: ticketError }, { data: incidents, error: incidentError }] =
    await Promise.all([
      supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("service_incidents")
        .select("*")
        .neq("state", "resolved")
        .order("updated_at", { ascending: false })
        .limit(12),
    ]);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  if (incidentError) {
    throw new Error(incidentError.message);
  }

  const ticketRows = (tickets ?? []) as DbSupportTicket[];
  const queue = await shapeTicketRows(ticketRows.filter((row) => !closedTicketStatuses.has(row.status)).slice(0, 16));
  const incidentRows = (incidents ?? []) as DbServiceIncident[];

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      totalOpen: ticketRows.filter((row) => !closedTicketStatuses.has(row.status)).length,
      new: ticketRows.filter((row) => row.status === "new").length,
      triaging: ticketRows.filter((row) => row.status === "triaging").length,
      waitingOnCustomer: ticketRows.filter((row) => row.status === "waiting_on_customer").length,
      waitingOnInternal: ticketRows.filter((row) => row.status === "waiting_on_internal").length,
      escalated: ticketRows.filter((row) => row.status === "escalated").length,
      resolvedToday: ticketRows.filter((row) => {
        if (!row.resolved_at) {
          return false;
        }
        const resolved = new Date(row.resolved_at);
        const now = new Date();
        return resolved.toDateString() === now.toDateString();
      }).length,
      activeIncidents: incidentRows.length,
    },
    queue,
    activeIncidents: incidentRows.map((row) => shapeIncidentSummary(row)),
  };
}

export async function loadSupportTickets(filters?: SupportTicketFilters) {
  const supabase = getServiceSupabaseClient();
  let query = supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });

  if (filters?.ticketType) {
    query = query.eq("ticket_type", filters.ticketType);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.waitingState) {
    query = query.eq("waiting_state", filters.waitingState);
  }

  if (filters?.linkedAccountId) {
    query = query.eq("customer_account_id", filters.linkedAccountId);
  }

  if (filters?.linkedProjectId) {
    query = query.eq("project_id", filters.linkedProjectId);
  }

  if (!filters?.includeClosed) {
    query = query.not("status", "in", '("resolved","closed")');
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  let shaped = await shapeTicketRows((data ?? []) as DbSupportTicket[]);

  if (filters?.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    shaped = shaped.filter((row) =>
      [
        row.ticketRef,
        row.subject,
        row.requesterName,
        row.requesterEmail,
        row.customerAccountName,
        row.projectName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }

  return shaped;
}

export async function loadSupportTicketDetail(ticketId: string): Promise<AdminSupportTicketDetail | null> {
  const supabase = getServiceSupabaseClient();
  const [{ data: ticket, error: ticketError }, { data: events, error: eventsError }, { data: handoffs, error: handoffError }] =
    await Promise.all([
      supabase.from("support_tickets").select("*").eq("id", ticketId).maybeSingle(),
      supabase
        .from("support_ticket_events")
        .select("*")
        .eq("support_ticket_id", ticketId)
        .order("created_at", { ascending: false }),
      supabase
        .from("support_ticket_handoffs")
        .select("*")
        .eq("support_ticket_id", ticketId)
        .order("created_at", { ascending: false }),
    ]);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  if (handoffError) {
    throw new Error(handoffError.message);
  }

  if (!ticket) {
    return null;
  }

  const [shapedTicket] = await shapeTicketRows([ticket as DbSupportTicket]);

  return {
    ...shapedTicket,
    message: (ticket as DbSupportTicket).message,
    authUserId: (ticket as DbSupportTicket).auth_user_id ?? undefined,
    linkedIncidentId: (ticket as DbSupportTicket).linked_incident_id ?? undefined,
    events: ((events ?? []) as DbSupportTicketEvent[]).map(shapeTicketEvent),
    handoffs: ((handoffs ?? []) as DbSupportTicketHandoff[]).map((row) => ({
      id: row.id,
      supportTicketId: row.support_ticket_id,
      handoffType: row.handoff_type,
      status: row.status,
      customerAccountId: row.customer_account_id ?? undefined,
      targetProjectId: row.target_project_id ?? undefined,
      targetRecordId: row.target_record_id ?? undefined,
      targetRoute: row.target_route ?? undefined,
      summary: row.summary,
      ownerAuthUserId: row.owner_auth_user_id ?? undefined,
      createdByAuthUserId: row.created_by_auth_user_id ?? undefined,
      acceptedAt: row.accepted_at ?? undefined,
      resolvedAt: row.resolved_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata ?? undefined,
    })),
  };
}

async function insertSupportEvent(input: {
  supportTicketId: string;
  eventType:
    | "status_changed"
    | "claimed"
    | "internal_note"
    | "customer_update"
    | "handoff_created"
    | "resolved"
    | "closed"
    | "reopened";
  visibilityScope: "internal" | "customer" | "both";
  actorAuthUserId: string;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("support_ticket_events").insert({
    support_ticket_id: input.supportTicketId,
    event_type: input.eventType,
    visibility_scope: input.visibilityScope,
    actor_auth_user_id: input.actorAuthUserId,
    title: input.title ?? null,
    body: input.body,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function claimSupportTicket(ticketId: string, actorAuthUserId: string) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      assigned_admin_auth_user_id: actorAuthUserId,
      status: "triaging",
      waiting_state: "internal",
      latest_internal_update_at: now,
      updated_at: now,
    })
    .eq("id", ticketId);

  if (error) {
    throw new Error(error.message);
  }

  await insertSupportEvent({
    supportTicketId: ticketId,
    eventType: "claimed",
    visibilityScope: "internal",
    actorAuthUserId,
    title: "Ticket claimed",
    body: "A Veltrix operator claimed this ticket and moved it into triage.",
  });

  return loadSupportTicketDetail(ticketId);
}

export async function changeSupportTicketStatus(input: {
  ticketId: string;
  actorAuthUserId: string;
  status: AdminSupportTicketStatus;
  waitingState?: AdminSupportWaitingState;
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: input.status,
    waiting_state:
      input.status === "waiting_on_customer"
        ? "customer"
        : input.status === "waiting_on_internal" || input.status === "escalated"
          ? "internal"
          : input.waitingState ?? "none",
    escalation_state: input.status === "escalated" ? "escalated" : "none",
    assigned_admin_auth_user_id: input.actorAuthUserId,
    latest_internal_update_at: now,
    updated_at: now,
  };

  if (input.status === "resolved") {
    payload.resolved_at = now;
  }

  if (input.status === "closed") {
    payload.closed_at = now;
  }

  const { error } = await supabase.from("support_tickets").update(payload).eq("id", input.ticketId);

  if (error) {
    throw new Error(error.message);
  }

  await insertSupportEvent({
    supportTicketId: input.ticketId,
    eventType:
      input.status === "resolved"
        ? "resolved"
        : input.status === "closed"
          ? "closed"
          : "status_changed",
    visibilityScope: "internal",
    actorAuthUserId: input.actorAuthUserId,
    title: "Ticket status changed",
    body: `Ticket moved to ${humanizeSupportValue(input.status)}.`,
    metadata: {
      status: input.status,
      waitingState: payload.waiting_state,
    },
  });

  return loadSupportTicketDetail(input.ticketId);
}

export async function addSupportInternalNote(input: {
  ticketId: string;
  actorAuthUserId: string;
  body: string;
}) {
  const note = input.body.trim();
  if (!note) {
    throw new Error("Internal note cannot be empty.");
  }

  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      latest_internal_update_at: now,
      assigned_admin_auth_user_id: input.actorAuthUserId,
      updated_at: now,
    })
    .eq("id", input.ticketId);

  if (error) {
    throw new Error(error.message);
  }

  await insertSupportEvent({
    supportTicketId: input.ticketId,
    eventType: "internal_note",
    visibilityScope: "internal",
    actorAuthUserId: input.actorAuthUserId,
    title: "Internal note added",
    body: note,
  });

  return loadSupportTicketDetail(input.ticketId);
}

export async function addSupportCustomerUpdate(input: {
  ticketId: string;
  actorAuthUserId: string;
  body: string;
}) {
  const message = input.body.trim();
  if (!message) {
    throw new Error("Customer update cannot be empty.");
  }

  const supabase = getServiceSupabaseClient();
  const { data: currentTicket, error: currentTicketError } = await supabase
    .from("support_tickets")
    .select("first_response_at")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (currentTicketError) {
    throw new Error(currentTicketError.message);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      latest_customer_update_at: now,
      latest_internal_update_at: now,
      first_response_at: currentTicket?.first_response_at ?? now,
      assigned_admin_auth_user_id: input.actorAuthUserId,
      updated_at: now,
    })
    .eq("id", input.ticketId);

  if (error) {
    throw new Error(error.message);
  }

  await insertSupportEvent({
    supportTicketId: input.ticketId,
    eventType: "customer_update",
    visibilityScope: "both",
    actorAuthUserId: input.actorAuthUserId,
    title: "Customer update added",
    body: message,
  });

  return loadSupportTicketDetail(input.ticketId);
}

export async function createSupportTicketHandoff(input: {
  ticketId: string;
  actorAuthUserId: string;
  handoffType: AdminSupportHandoffType;
  summary: string;
  customerAccountId?: string | null;
  targetProjectId?: string | null;
  targetRecordId?: string | null;
}) {
  const summary = input.summary.trim();
  if (!summary) {
    throw new Error("Handoff summary cannot be empty.");
  }

  const supabase = getServiceSupabaseClient();
  const { data: currentTicket, error: currentTicketError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", input.ticketId)
    .single();

  if (currentTicketError) {
    throw new Error(currentTicketError.message);
  }

  const targetRoute = routeForHandoff({
    handoffType: input.handoffType,
    customerAccountId: input.customerAccountId ?? currentTicket.customer_account_id,
    targetProjectId: input.targetProjectId ?? currentTicket.project_id,
    targetRecordId: input.targetRecordId,
  });
  const now = new Date().toISOString();

  const { data: handoff, error: handoffError } = await supabase
    .from("support_ticket_handoffs")
    .insert({
      support_ticket_id: input.ticketId,
      customer_account_id: input.customerAccountId ?? currentTicket.customer_account_id,
      target_project_id: input.targetProjectId ?? currentTicket.project_id,
      handoff_type: input.handoffType,
      status: "open",
      target_record_id: input.targetRecordId ?? null,
      target_route: targetRoute,
      summary,
      owner_auth_user_id: input.actorAuthUserId,
      created_by_auth_user_id: input.actorAuthUserId,
      created_at: now,
      updated_at: now,
      metadata: {},
    })
    .select("*")
    .single();

  if (handoffError || !handoff) {
    throw new Error(handoffError?.message ?? "Failed to create support handoff.");
  }

  const { error: ticketError } = await supabase
    .from("support_tickets")
    .update({
      status: "escalated",
      waiting_state: "internal",
      escalation_state: "handoff_open",
      assigned_admin_auth_user_id: input.actorAuthUserId,
      latest_internal_update_at: now,
      updated_at: now,
    })
    .eq("id", input.ticketId);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  await insertSupportEvent({
    supportTicketId: input.ticketId,
    eventType: "handoff_created",
    visibilityScope: "internal",
    actorAuthUserId: input.actorAuthUserId,
    title: "Support handoff created",
    body: summary,
    metadata: {
      handoffType: input.handoffType,
      handoffId: handoff.id,
      targetRoute,
    },
  });

  const dedupeKey = `support-ticket-handoff:${input.ticketId}:${input.handoffType}:${input.targetRecordId ?? input.targetProjectId ?? input.customerAccountId ?? "global"}`;
  await supabase.from("support_escalations").upsert(
    {
      project_id: input.targetProjectId ?? currentTicket.project_id,
      source_surface: "support",
      source_type: "ticket_handoff",
      source_id: handoff.id,
      dedupe_key: dedupeKey,
      title: currentTicket.subject,
      summary,
      severity: severityFromPriority(currentTicket.priority),
      status: "open",
      waiting_on: "internal",
      owner_auth_user_id: input.actorAuthUserId,
      opened_by_auth_user_id: input.actorAuthUserId,
      next_action_summary: `Continue in ${humanizeSupportValue(input.handoffType)}.`,
      metadata: {
        supportTicketId: input.ticketId,
        handoffType: input.handoffType,
        targetRoute,
      },
      opened_at: now,
      updated_at: now,
    },
    { onConflict: "dedupe_key" }
  );

  return loadSupportTicketDetail(input.ticketId);
}

export async function listSurfaceSupportContext(params: {
  handoffType: AdminSupportHandoffType;
  customerAccountId?: string | null;
  targetProjectId?: string | null;
  targetRecordId?: string | null;
  includeResolved?: boolean;
}) {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from("support_ticket_handoffs")
    .select("*")
    .eq("handoff_type", params.handoffType)
    .order("created_at", { ascending: false })
    .limit(20);

  if (params.customerAccountId) {
    query = query.eq("customer_account_id", params.customerAccountId);
  }

  if (params.targetProjectId) {
    query = query.eq("target_project_id", params.targetProjectId);
  }

  if (params.targetRecordId) {
    query = query.eq("target_record_id", params.targetRecordId);
  }

  if (!params.includeResolved) {
    query = query.not("status", "in", '("resolved","canceled")');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const handoffs = (data ?? []) as DbSupportTicketHandoff[];
  if (handoffs.length === 0) {
    return [] satisfies SupportSurfaceContextRow[];
  }

  const ticketIds = Array.from(new Set(handoffs.map((row) => row.support_ticket_id)));
  const projectIds = Array.from(
    new Set(handoffs.map((row) => row.target_project_id).filter((value): value is string => Boolean(value)))
  );

  const [{ data: tickets, error: ticketError }, projectNameMap] = await Promise.all([
    supabase.from("support_tickets").select("*").in("id", ticketIds),
    loadProjectNameMap(projectIds),
  ]);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  const ticketMap = new Map(
    ((tickets ?? []) as DbSupportTicket[]).map((row) => [row.id, row])
  );

  const rows: Array<SupportSurfaceContextRow | null> = handoffs.map((handoff) => {
    const ticket = ticketMap.get(handoff.support_ticket_id);
    if (!ticket) {
      return null;
    }

    const row: SupportSurfaceContextRow = {
      handoffId: handoff.id,
      ticketId: ticket.id,
      ticketRef: ticket.ticket_ref,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      handoffStatus: handoff.status,
      summary: handoff.summary,
      targetRoute: handoff.target_route ?? undefined,
      projectName: handoff.target_project_id
        ? projectNameMap.get(handoff.target_project_id) ?? undefined
        : undefined,
      createdAt: handoff.created_at,
    };

    return row;
  });

  return rows.filter((row): row is SupportSurfaceContextRow => row !== null);
}
