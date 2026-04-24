import { NextRequest } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  getAccountsServiceClient,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import type {
  DbCommercialFollowUpTask,
  DbCommercialLead,
  DbCommercialLeadEvent,
  DbCommercialLeadNote,
  DbCustomerAccount,
  DbDemoRequest,
  DbEnterpriseIntakeRequest,
} from "@/types/database";
import type {
  AdminCommercialFollowUpTask,
  AdminCommercialLead,
  AdminCommercialLeadEvent,
  AdminCommercialLeadNote,
  AdminDemoRequest,
  AdminEnterpriseIntakeRequest,
  AdminGrowthLeadDetail,
  AdminGrowthLeadSummary,
  AdminGrowthOverview,
} from "@/types/entities/growth-sales";

function mapLead(row: DbCommercialLead): AdminCommercialLead {
  return {
    id: row.id,
    leadState: row.lead_state,
    source: row.source,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    companyName: row.company_name,
    companyDomain: row.company_domain,
    ownerAuthUserId: row.owner_auth_user_id,
    linkedCustomerAccountId: row.linked_customer_account_id,
    qualificationSummary: row.qualification_summary,
    intentSummary: row.intent_summary,
    lastSignalAt: row.last_signal_at,
    lastContactAt: row.last_contact_at,
    convertedAt: row.converted_at,
    lostAt: row.lost_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLeadEvent(row: DbCommercialLeadEvent): AdminCommercialLeadEvent {
  return {
    id: row.id,
    commercialLeadId: row.commercial_lead_id,
    eventType: row.event_type,
    actorAuthUserId: row.actor_auth_user_id,
    summary: row.summary,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  };
}

function mapLeadNote(row: DbCommercialLeadNote): AdminCommercialLeadNote {
  return {
    id: row.id,
    commercialLeadId: row.commercial_lead_id,
    authorAuthUserId: row.author_auth_user_id,
    ownerAuthUserId: row.owner_auth_user_id,
    noteType: row.note_type,
    status: row.status,
    title: row.title,
    body: row.body,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function mapTask(row: DbCommercialFollowUpTask): AdminCommercialFollowUpTask {
  return {
    id: row.id,
    commercialLeadId: row.commercial_lead_id,
    ownerAuthUserId: row.owner_auth_user_id,
    taskType: row.task_type,
    status: row.status,
    dueState: row.due_state,
    title: row.title,
    summary: row.summary,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDemoRequest(row: DbDemoRequest): AdminDemoRequest {
  return {
    id: row.id,
    commercialLeadId: row.commercial_lead_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    companyName: row.company_name,
    companyDomain: row.company_domain,
    teamSize: row.team_size,
    useCase: row.use_case,
    urgency: row.urgency,
    requestSource: row.request_source,
    status: row.status,
    sourcePath: row.source_path,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEnterpriseRequest(row: DbEnterpriseIntakeRequest): AdminEnterpriseIntakeRequest {
  return {
    id: row.id,
    commercialLeadId: row.commercial_lead_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    companyName: row.company_name,
    companyDomain: row.company_domain,
    teamSize: row.team_size,
    useCase: row.use_case,
    requirementSummary: row.requirement_summary,
    securityRequirements: row.security_requirements,
    billingRequirements: row.billing_requirements,
    onboardingRequirements: row.onboarding_requirements,
    urgency: row.urgency,
    requestSource: row.request_source,
    status: row.status,
    sourcePath: row.source_path,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildTaskCountMap(tasks: AdminCommercialFollowUpTask[]) {
  const counts = new Map<
    string,
    {
      open: number;
      dueNow: number;
      overdue: number;
    }
  >();

  for (const task of tasks) {
    if (task.status === "resolved" || task.status === "canceled") {
      continue;
    }

    const current = counts.get(task.commercialLeadId) ?? {
      open: 0,
      dueNow: 0,
      overdue: 0,
    };

    current.open += 1;
    if (task.dueState === "due_now") {
      current.dueNow += 1;
    }
    if (task.dueState === "overdue") {
      current.overdue += 1;
    }

    counts.set(task.commercialLeadId, current);
  }

  return counts;
}

function buildLatestRequestMap<T extends { commercialLeadId: string | null; createdAt: string }>(rows: T[]) {
  const map = new Map<string, T>();

  for (const row of rows) {
    if (!row.commercialLeadId) {
      continue;
    }

    const current = map.get(row.commercialLeadId);
    if (!current || current.createdAt < row.createdAt) {
      map.set(row.commercialLeadId, row);
    }
  }

  return map;
}

export async function assertInternalGrowthAccess(request: NextRequest) {
  const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
  await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
  return authenticatedUser;
}

export async function loadGrowthOverview(): Promise<AdminGrowthOverview> {
  const supabase = getAccountsServiceClient();

  const [
    leadsResponse,
    tasksResponse,
    demoRequestsResponse,
    enterpriseRequestsResponse,
  ] = await Promise.all([
    supabase.from("commercial_leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("commercial_follow_up_tasks").select("*").order("due_at", { ascending: true }),
    supabase.from("demo_requests").select("*").order("created_at", { ascending: false }),
    supabase
      .from("enterprise_intake_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (leadsResponse.error) {
    throw new Error(leadsResponse.error.message || "Failed to load commercial leads.");
  }
  if (tasksResponse.error) {
    throw new Error(tasksResponse.error.message || "Failed to load commercial follow-up tasks.");
  }
  if (demoRequestsResponse.error) {
    throw new Error(demoRequestsResponse.error.message || "Failed to load demo requests.");
  }
  if (enterpriseRequestsResponse.error) {
    throw new Error(
      enterpriseRequestsResponse.error.message || "Failed to load enterprise intake requests."
    );
  }

  const leads = ((leadsResponse.data ?? []) as DbCommercialLead[]).map(mapLead);
  const tasks = ((tasksResponse.data ?? []) as DbCommercialFollowUpTask[]).map(mapTask);
  const demoRequests = ((demoRequestsResponse.data ?? []) as DbDemoRequest[]).map(mapDemoRequest);
  const enterpriseRequests = (
    (enterpriseRequestsResponse.data ?? []) as DbEnterpriseIntakeRequest[]
  ).map(mapEnterpriseRequest);

  const accountIds = Array.from(
    new Set(leads.map((lead) => lead.linkedCustomerAccountId).filter(Boolean))
  ) as string[];
  const accountsById = new Map<string, string>();

  if (accountIds.length) {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("id, name")
      .in("id", accountIds);

    if (error) {
      throw new Error(error.message || "Failed to load linked customer accounts.");
    }

    for (const account of (data ?? []) as Pick<DbCustomerAccount, "id" | "name">[]) {
      accountsById.set(account.id, account.name);
    }
  }

  const taskCounts = buildTaskCountMap(tasks);
  const latestDemoRequests = buildLatestRequestMap(demoRequests);
  const latestEnterpriseRequests = buildLatestRequestMap(enterpriseRequests);

  const leadSummaries: AdminGrowthLeadSummary[] = leads.map((lead) => ({
    ...lead,
    accountName: lead.linkedCustomerAccountId ? accountsById.get(lead.linkedCustomerAccountId) ?? null : null,
    taskCounts: taskCounts.get(lead.id) ?? {
      open: 0,
      dueNow: 0,
      overdue: 0,
    },
    latestDemoRequest: latestDemoRequests.get(lead.id) ?? null,
    latestEnterpriseRequest: latestEnterpriseRequests.get(lead.id) ?? null,
  }));

  const tasksDueNow = tasks.filter(
    (task) =>
      task.status !== "resolved" &&
      task.status !== "canceled" &&
      (task.dueState === "due_now" || task.dueState === "overdue")
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      totalLeads: leadSummaries.length,
      new: leadSummaries.filter((lead) => lead.leadState === "new" || lead.leadState === "qualified").length,
      engaged: leadSummaries.filter((lead) => lead.leadState === "engaged").length,
      evaluation: leadSummaries.filter((lead) => lead.leadState === "evaluation").length,
      converted: leadSummaries.filter((lead) => lead.leadState === "converted").length,
      coolingOff: leadSummaries.filter((lead) => lead.leadState === "cooling_off").length,
      lost: leadSummaries.filter((lead) => lead.leadState === "lost").length,
      openTasks: tasks.filter((task) => task.status === "open" || task.status === "in_progress").length,
      dueNowTasks: tasksDueNow.length,
    },
    leads: leadSummaries,
    newLeads: leadSummaries.filter((lead) =>
      ["new", "qualified", "watching"].includes(lead.leadState)
    ),
    engagedLeads: leadSummaries.filter((lead) => lead.leadState === "engaged"),
    evaluationLeads: leadSummaries.filter((lead) => lead.leadState === "evaluation"),
    convertedLeads: leadSummaries.filter((lead) => lead.leadState === "converted"),
    coolingLeads: leadSummaries.filter((lead) =>
      ["cooling_off", "lost"].includes(lead.leadState)
    ),
    enterpriseRequests: enterpriseRequests.slice(0, 8),
    demoRequests: demoRequests.slice(0, 8),
    tasksDueNow,
  };
}

export async function loadGrowthLeadDetail(leadId: string): Promise<AdminGrowthLeadDetail> {
  const supabase = getAccountsServiceClient();
  const [
    leadResponse,
    eventsResponse,
    notesResponse,
    tasksResponse,
    demoRequestsResponse,
    enterpriseRequestsResponse,
  ] = await Promise.all([
    supabase.from("commercial_leads").select("*").eq("id", leadId).single(),
    supabase
      .from("commercial_lead_events")
      .select("*")
      .eq("commercial_lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("commercial_lead_notes")
      .select("*")
      .eq("commercial_lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("commercial_follow_up_tasks")
      .select("*")
      .eq("commercial_lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("demo_requests")
      .select("*")
      .eq("commercial_lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("enterprise_intake_requests")
      .select("*")
      .eq("commercial_lead_id", leadId)
      .order("created_at", { ascending: false }),
  ]);

  if (leadResponse.error || !leadResponse.data) {
    throw new Error(leadResponse.error?.message || "Commercial lead not found.");
  }
  if (eventsResponse.error) {
    throw new Error(eventsResponse.error.message || "Failed to load lead timeline.");
  }
  if (notesResponse.error) {
    throw new Error(notesResponse.error.message || "Failed to load lead notes.");
  }
  if (tasksResponse.error) {
    throw new Error(tasksResponse.error.message || "Failed to load lead tasks.");
  }
  if (demoRequestsResponse.error) {
    throw new Error(demoRequestsResponse.error.message || "Failed to load demo requests.");
  }
  if (enterpriseRequestsResponse.error) {
    throw new Error(
      enterpriseRequestsResponse.error.message || "Failed to load enterprise intake requests."
    );
  }

  const lead = mapLead(leadResponse.data as DbCommercialLead);
  const events = ((eventsResponse.data ?? []) as DbCommercialLeadEvent[]).map(mapLeadEvent);
  const notes = ((notesResponse.data ?? []) as DbCommercialLeadNote[]).map(mapLeadNote);
  const tasks = ((tasksResponse.data ?? []) as DbCommercialFollowUpTask[]).map(mapTask);
  const demoRequests = ((demoRequestsResponse.data ?? []) as DbDemoRequest[]).map(mapDemoRequest);
  const enterpriseRequests = (
    (enterpriseRequestsResponse.data ?? []) as DbEnterpriseIntakeRequest[]
  ).map(mapEnterpriseRequest);

  let accountName: string | null = null;
  if (lead.linkedCustomerAccountId) {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("name")
      .eq("id", lead.linkedCustomerAccountId)
      .maybeSingle();

    if (!error) {
      accountName = data?.name ?? null;
    }
  }

  const taskCount = buildTaskCountMap(tasks).get(lead.id) ?? {
    open: 0,
    dueNow: 0,
    overdue: 0,
  };

  return {
    ...lead,
    accountName,
    taskCounts: taskCount,
    latestDemoRequest: demoRequests[0] ?? null,
    latestEnterpriseRequest: enterpriseRequests[0] ?? null,
    events,
    notes,
    tasks,
    demoRequests,
    enterpriseRequests,
  };
}
