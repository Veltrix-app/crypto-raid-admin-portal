import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { deriveTaskDueState } from "@/lib/success/success-contract";

export async function addSuccessNote(input: {
  customerAccountId: string;
  actorAuthUserId: string;
  noteType?: string;
  title: string;
  body: string;
  projectId?: string | null;
}) {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!title || !body) {
    throw new Error("Notes need both a title and a body.");
  }

  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("customer_account_success_notes")
    .insert({
      customer_account_id: input.customerAccountId,
      project_id: input.projectId ?? null,
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
    throw new Error(error?.message ?? "Failed to create success note.");
  }

  return data;
}

export async function addSuccessTask(input: {
  customerAccountId: string;
  actorAuthUserId: string;
  taskType?: string;
  title: string;
  summary: string;
  dueAt?: string | null;
  projectId?: string | null;
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
    .from("customer_account_success_tasks")
    .insert({
      customer_account_id: input.customerAccountId,
      project_id: input.projectId ?? null,
      owner_auth_user_id: input.actorAuthUserId,
      task_type: input.taskType ?? "activation_follow_up",
      status: "open",
      due_state: deriveTaskDueState("open", dueAt),
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
    throw new Error(error?.message ?? "Failed to create success task.");
  }

  return data;
}

export async function resolveSuccessTask(input: {
  taskId: string;
  actorAuthUserId: string;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("customer_account_success_tasks")
    .select("*")
    .eq("id", input.taskId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Success task not found.");
  }

  const { data, error } = await supabase
    .from("customer_account_success_tasks")
    .update({
      status: "resolved",
      due_state: "resolved",
      owner_auth_user_id: input.actorAuthUserId,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.taskId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to resolve success task.");
  }

  return data;
}
