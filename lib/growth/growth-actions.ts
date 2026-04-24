import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { deriveCommercialTaskDueState } from "@/lib/growth/growth-contract";

export async function updateCommercialLead(input: {
  leadId: string;
  actorAuthUserId: string;
  leadState?: string;
  ownerAuthUserId?: string | null;
  qualificationSummary?: string;
  intentSummary?: string;
}) {
  const supabase = getAccountsServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("commercial_leads")
    .select("*")
    .eq("id", input.leadId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Commercial lead not found.");
  }

  const now = new Date().toISOString();
  const payload = {
    lead_state: input.leadState ?? existing.lead_state,
    owner_auth_user_id:
      input.ownerAuthUserId === undefined ? existing.owner_auth_user_id : input.ownerAuthUserId,
    qualification_summary: input.qualificationSummary ?? existing.qualification_summary,
    intent_summary: input.intentSummary ?? existing.intent_summary,
    last_contact_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("commercial_leads")
    .update(payload)
    .eq("id", input.leadId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update commercial lead.");
  }

  const eventType =
    payload.lead_state !== existing.lead_state ? "state_changed" : "signal_captured";

  const { error: eventError } = await supabase.from("commercial_lead_events").insert({
    commercial_lead_id: input.leadId,
    event_type: eventType,
    actor_auth_user_id: input.actorAuthUserId,
    summary:
      eventType === "state_changed"
        ? `Lead state changed from ${existing.lead_state} to ${payload.lead_state}.`
        : "Lead detail updated in the internal growth workspace.",
    event_payload: {
      previousState: existing.lead_state,
      nextState: payload.lead_state,
    },
    created_at: now,
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to write commercial lead event.");
  }

  return data;
}

export async function addCommercialLeadNote(input: {
  leadId: string;
  actorAuthUserId: string;
  noteType?: string;
  title: string;
  body: string;
}) {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!title || !body) {
    throw new Error("Notes need both a title and a body.");
  }

  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("commercial_lead_notes")
    .insert({
      commercial_lead_id: input.leadId,
      author_auth_user_id: input.actorAuthUserId,
      owner_auth_user_id: input.actorAuthUserId,
      note_type: input.noteType ?? "general",
      status: "open",
      title,
      body,
      metadata: {},
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create commercial lead note.");
  }

  const { error: eventError } = await supabase.from("commercial_lead_events").insert({
    commercial_lead_id: input.leadId,
    event_type: "note_added",
    actor_auth_user_id: input.actorAuthUserId,
    summary: `Internal note added: ${title}`,
    event_payload: {
      noteId: data.id,
      noteType: data.note_type,
    },
    created_at: now,
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to append commercial lead event.");
  }

  return data;
}

export async function addCommercialLeadTask(input: {
  leadId: string;
  actorAuthUserId: string;
  taskType?: string;
  title: string;
  summary: string;
  dueAt?: string | null;
}) {
  const title = input.title.trim();
  const summary = input.summary.trim();

  if (!title || !summary) {
    throw new Error("Tasks need both a title and a summary.");
  }

  const dueAt = input.dueAt?.trim() ? input.dueAt.trim() : null;
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("commercial_follow_up_tasks")
    .insert({
      commercial_lead_id: input.leadId,
      owner_auth_user_id: input.actorAuthUserId,
      task_type: input.taskType ?? "follow_up",
      status: "open",
      due_state: deriveCommercialTaskDueState("open", dueAt),
      title,
      summary,
      due_at: dueAt,
      metadata: {},
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create follow-up task.");
  }

  const { error: eventError } = await supabase.from("commercial_lead_events").insert({
    commercial_lead_id: input.leadId,
    event_type: "task_added",
    actor_auth_user_id: input.actorAuthUserId,
    summary: `Follow-up task added: ${title}`,
    event_payload: {
      taskId: data.id,
      taskType: data.task_type,
      dueAt: data.due_at,
    },
    created_at: now,
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to append commercial lead event.");
  }

  return data;
}

export async function resolveCommercialLeadTask(input: {
  taskId: string;
  actorAuthUserId: string;
}) {
  const supabase = getAccountsServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("commercial_follow_up_tasks")
    .select("*")
    .eq("id", input.taskId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Commercial follow-up task not found.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("commercial_follow_up_tasks")
    .update({
      owner_auth_user_id: input.actorAuthUserId,
      status: "resolved",
      due_state: "resolved",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.taskId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to resolve follow-up task.");
  }

  const { error: eventError } = await supabase.from("commercial_lead_events").insert({
    commercial_lead_id: existing.commercial_lead_id,
    event_type: "task_resolved",
    actor_auth_user_id: input.actorAuthUserId,
    summary: `Follow-up task resolved: ${existing.title}`,
    event_payload: {
      taskId: existing.id,
    },
    created_at: now,
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to append commercial lead event.");
  }

  return data;
}
