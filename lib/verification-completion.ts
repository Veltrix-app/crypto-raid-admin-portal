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

function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 1000) + 1);
}

function calculateContributionTier(xp: number) {
  if (xp >= 10000) {
    return "legend";
  }

  if (xp >= 5000) {
    return "champion";
  }

  if (xp >= 2000) {
    return "contender";
  }

  return "explorer";
}

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
      "id, title, project_id, xp, quest_type, verification_type, verification_provider, completion_mode, verification_config"
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
    .select("id, status")
    .eq("auth_user_id", input.authUserId)
    .eq("quest_id", quest.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const wasAlreadyApproved = existingSubmission?.status === "approved";

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

  if (!wasAlreadyApproved) {
    const questXp = typeof quest.xp === "number" ? quest.xp : 0;

    const [{ data: profile }, { data: globalReputation }, { data: projectReputation }] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("auth_user_id, xp, level, streak, status")
        .eq("auth_user_id", input.authUserId)
        .maybeSingle(),
      supabase
        .from("user_global_reputation")
        .select(
          "auth_user_id, total_xp, level, streak, trust_score, sybil_score, contribution_tier, reputation_rank, quests_completed, raids_completed, rewards_claimed, status"
        )
        .eq("auth_user_id", input.authUserId)
        .maybeSingle(),
      quest.project_id
        ? supabase
            .from("user_project_reputation")
            .select(
              "auth_user_id, project_id, xp, level, streak, trust_score, contribution_tier, quests_completed, raids_completed, rewards_claimed"
            )
            .eq("auth_user_id", input.authUserId)
            .eq("project_id", quest.project_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const nextProfileXp = (profile?.xp ?? 0) + questXp;
    const nextProfileLevel = calculateLevelFromXp(nextProfileXp);
    const nextGlobalXp = (globalReputation?.total_xp ?? 0) + questXp;
    const nextGlobalLevel = calculateLevelFromXp(nextGlobalXp);
    const nextGlobalQuestsCompleted = (globalReputation?.quests_completed ?? 0) + 1;

    const profileUpsert = supabase.from("user_profiles").upsert({
      auth_user_id: input.authUserId,
      xp: nextProfileXp,
      level: nextProfileLevel,
      streak: profile?.streak ?? 0,
      status: profile?.status ?? "active",
    });

    const globalReputationUpsert = supabase.from("user_global_reputation").upsert({
      auth_user_id: input.authUserId,
      total_xp: nextGlobalXp,
      level: nextGlobalLevel,
      streak: globalReputation?.streak ?? 0,
      trust_score: globalReputation?.trust_score ?? 50,
      sybil_score: globalReputation?.sybil_score ?? 0,
      contribution_tier: calculateContributionTier(nextGlobalXp),
      reputation_rank: globalReputation?.reputation_rank ?? 0,
      quests_completed: nextGlobalQuestsCompleted,
      raids_completed: globalReputation?.raids_completed ?? 0,
      rewards_claimed: globalReputation?.rewards_claimed ?? 0,
      status: globalReputation?.status ?? "active",
      updated_at: now,
    });

    const writes = [profileUpsert, globalReputationUpsert];

    if (quest.project_id) {
      const nextProjectXp = ((projectReputation as { xp?: number } | null)?.xp ?? 0) + questXp;
      const nextProjectQuestsCompleted =
        ((projectReputation as { quests_completed?: number } | null)?.quests_completed ?? 0) + 1;

      writes.push(
        supabase.from("user_project_reputation").upsert({
          auth_user_id: input.authUserId,
          project_id: quest.project_id,
          xp: nextProjectXp,
          level: calculateLevelFromXp(nextProjectXp),
          streak: (projectReputation as { streak?: number } | null)?.streak ?? 0,
          trust_score: (projectReputation as { trust_score?: number } | null)?.trust_score ?? 50,
          contribution_tier: calculateContributionTier(nextProjectXp),
          quests_completed: nextProjectQuestsCompleted,
          raids_completed: (projectReputation as { raids_completed?: number } | null)?.raids_completed ?? 0,
          rewards_claimed: (projectReputation as { rewards_claimed?: number } | null)?.rewards_claimed ?? 0,
          last_activity_at: now,
          updated_at: now,
        })
      );
    }

    const writeResults = await Promise.all(writes);
    const writeError = writeResults.find((result) => "error" in result && result.error)?.error;

    if (writeError) {
      throw new Error(writeError.message || "Failed to update quest reputation progress.");
    }
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

  if (!wasAlreadyApproved) {
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
  }

  return {
    ok: true,
    status: "approved" as const,
    submissionId,
    questId: quest.id,
    provider: input.provider,
  };
}
