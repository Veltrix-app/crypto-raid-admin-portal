import { createClient } from "@supabase/supabase-js";
import { resolveQuestIntegration } from "@/lib/quest-integration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type IntegrationProvider = "discord" | "telegram" | "x";

type ConfirmQuestVerificationInput = {
  authUserId: string;
  questId: string;
  provider: IntegrationProvider;
  eventType: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
};

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function confirmQuestVerification(input: ConfirmQuestVerificationInput) {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select(
      "id, title, project_id, quest_type, verification_type, verification_provider, completion_mode, verification_config"
    )
    .eq("id", input.questId)
    .single();

  if (questError || !quest) {
    throw new Error("Quest not found.");
  }

  const resolvedIntegration = resolveQuestIntegration(quest);

  if (resolvedIntegration.verificationProvider !== input.provider) {
    throw new Error("Quest provider does not match the confirmation provider.");
  }

  if (resolvedIntegration.completionMode !== "integration_auto") {
    throw new Error("Quest is not configured for integration-based auto verification.");
  }

  const { error: eventError } = await supabase.from("verification_events").insert({
    auth_user_id: input.authUserId,
    project_id: quest.project_id ?? null,
    quest_id: quest.id,
    provider: input.provider,
    event_type: input.eventType,
    external_ref: input.externalRef ?? null,
    metadata: input.metadata ?? {},
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to insert verification event.");
  }

  const { data: existingSubmission } = await supabase
    .from("quest_submissions")
    .select("id")
    .eq("auth_user_id", input.authUserId)
    .eq("quest_id", quest.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let submissionId = existingSubmission?.id ?? null;

  if (existingSubmission?.id) {
    const { error: updateSubmissionError } = await supabase
      .from("quest_submissions")
      .update({
        status: "approved",
        proof_text: input.externalRef ?? input.eventType,
        updated_at: now,
      })
      .eq("id", existingSubmission.id);

    if (updateSubmissionError) {
      throw new Error(updateSubmissionError.message || "Failed to update quest submission.");
    }
  } else {
    const { data: createdSubmission, error: createSubmissionError } = await supabase
      .from("quest_submissions")
      .insert({
        auth_user_id: input.authUserId,
        quest_id: quest.id,
        status: "approved",
        proof_text: input.externalRef ?? input.eventType,
      })
      .select("id")
      .single();

    if (createSubmissionError || !createdSubmission) {
      throw new Error(createSubmissionError?.message || "Failed to create quest submission.");
    }

    submissionId = createdSubmission.id;
  }

  if (!submissionId) {
    throw new Error("Missing submission id after verification confirmation.");
  }

  await supabase.from("quest_verification_runs").insert({
    auth_user_id: input.authUserId,
    project_id: quest.project_id ?? null,
    quest_id: quest.id,
    provider: input.provider,
    result: "approved",
    reason: `${input.provider} verification confirmed successfully.`,
    metadata: {
      ...(input.metadata ?? {}),
      eventType: input.eventType,
      externalRef: input.externalRef ?? null,
    },
  });

  await supabase.from("verification_results").insert({
    auth_user_id: input.authUserId,
    project_id: quest.project_id ?? null,
    quest_id: quest.id,
    source_table: "quest_submissions",
    source_id: submissionId,
    verification_type: quest.verification_type ?? "manual_review",
    route: "integration_auto",
    decision_status: "approved",
    decision_reason: `${input.provider} verification confirmed.`,
    confidence_score: 96,
    required_config_keys: [],
    missing_config_keys: [],
    duplicate_signal_types: [],
    metadata: {
      questTitle: quest.title,
      provider: input.provider,
      eventType: input.eventType,
      externalRef: input.externalRef ?? null,
      ...(input.metadata ?? {}),
    },
  });

  const { data: userProgress } = await supabase
    .from("user_progress")
    .select("id, quest_statuses")
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  if (userProgress?.id) {
    const nextQuestStatuses =
      userProgress.quest_statuses && typeof userProgress.quest_statuses === "object"
        ? { ...(userProgress.quest_statuses as Record<string, string>), [quest.id]: "approved" }
        : { [quest.id]: "approved" };

    await supabase
      .from("user_progress")
      .update({
        quest_statuses: nextQuestStatuses,
        updated_at: now,
      })
      .eq("id", userProgress.id);
  }

  await supabase.from("app_notifications").insert({
    auth_user_id: input.authUserId,
    title: "Quest auto-approved",
    body: `${quest.title} completed automatically after ${input.provider} verification was confirmed.`,
    type: "quest",
    read: false,
    source_table: "quest_submissions",
    source_id: submissionId,
    metadata: {
      questId: quest.id,
      provider: input.provider,
      eventType: input.eventType,
      externalRef: input.externalRef ?? null,
    },
  });

  return {
    ok: true,
    status: "approved" as const,
    submissionId,
    questId: quest.id,
    provider: input.provider,
  };
}
