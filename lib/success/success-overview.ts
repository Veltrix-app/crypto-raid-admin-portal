import { createClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import {
  deriveAccountActivationSummary,
  deriveMemberActivationSummary,
  deriveSuccessSignals,
  deriveTaskDueState,
  normalizeStringList,
} from "@/lib/success/success-contract";
import type {
  DbCustomerAccount,
  DbCustomerAccountActivation,
  DbCustomerAccountEntitlement,
  DbCustomerAccountSubscription,
  DbCustomerAccountSuccessNote,
  DbCustomerAccountSuccessSignal,
  DbCustomerAccountSuccessTask,
  DbMemberActivationState,
} from "@/types/database";
import type {
  AdminAccountActivationSummary,
  AdminMemberActivationState,
  AdminSuccessAccountDetail,
  AdminSuccessAccountSummary,
  AdminSuccessNote,
  AdminSuccessOverview,
  AdminSuccessSignal,
  AdminSuccessTask,
} from "@/types/entities/success";

type BasicCustomerAccountRow = Pick<
  DbCustomerAccount,
  "id" | "name" | "created_at" | "updated_at" | "primary_owner_auth_user_id"
>;

type CustomerAccountSubscriptionRow = Pick<
  DbCustomerAccountSubscription,
  "customer_account_id" | "billing_plan_id" | "status"
>;

type CustomerAccountEntitlementRow = Pick<
  DbCustomerAccountEntitlement,
  | "customer_account_id"
  | "current_projects"
  | "current_active_campaigns"
  | "current_providers"
  | "current_billable_seats"
>;

type MemberActivationComputation = {
  linkedProviderCount: number;
  walletVerified: boolean;
  joinedProjectCount: number;
  completedQuestCount: number;
  claimedRewardCount: number;
  streakDays: number;
  lastActivityAt: string | null;
};

type SuccessAccountComputation = {
  account: BasicCustomerAccountRow;
  billingPlanId: string | null;
  billingStatus: string | null;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  firstProjectId: string | null;
  firstLiveCampaignId: string | null;
  lastMemberActivityAt: string | null;
};

function shapeAccountActivation(row: DbCustomerAccountActivation): AdminAccountActivationSummary {
  return {
    customerAccountId: row.customer_account_id,
    activationStage: row.activation_stage,
    workspaceHealthState: row.workspace_health_state,
    successHealthState: row.success_health_state,
    completedMilestones: normalizeStringList(row.completed_milestones),
    blockers: normalizeStringList(row.blockers),
    nextBestActionKey: row.next_best_action_key ?? undefined,
    nextBestActionLabel: row.next_best_action_label ?? undefined,
    nextBestActionRoute: row.next_best_action_route ?? undefined,
    firstProjectId: row.first_project_id ?? undefined,
    firstLiveCampaignId: row.first_live_campaign_id ?? undefined,
    firstProviderConnectedAt: row.first_provider_connected_at ?? undefined,
    firstCampaignLiveAt: row.first_campaign_live_at ?? undefined,
    lastMemberActivityAt: row.last_member_activity_at ?? undefined,
    lastActivationAt: row.last_activation_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeSuccessNote(row: DbCustomerAccountSuccessNote): AdminSuccessNote {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    projectId: row.project_id ?? undefined,
    authorAuthUserId: row.author_auth_user_id ?? undefined,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    noteType: row.note_type,
    status: row.status,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

function shapeSuccessTask(row: DbCustomerAccountSuccessTask): AdminSuccessTask {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    projectId: row.project_id ?? undefined,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    taskType: row.task_type,
    status: row.status,
    dueState: row.due_state || deriveTaskDueState(row.status, row.due_at),
    title: row.title,
    summary: row.summary,
    dueAt: row.due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeSuccessSignal(row: DbCustomerAccountSuccessSignal): AdminSuccessSignal {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    projectId: row.project_id ?? undefined,
    dedupeKey: row.dedupe_key,
    signalType: row.signal_type,
    signalTone: row.signal_tone,
    status: row.status,
    summary: row.summary,
    signalPayload: row.signal_payload ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

function shapeMemberActivation(row: DbMemberActivationState): AdminMemberActivationState {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    primaryProjectId: row.primary_project_id ?? undefined,
    activationLane: row.activation_lane,
    memberHealthState: row.member_health_state,
    completedMilestones: normalizeStringList(row.completed_milestones),
    blockers: normalizeStringList(row.blockers),
    nextBestActionKey: row.next_best_action_key ?? undefined,
    nextBestActionLabel: row.next_best_action_label ?? undefined,
    nextBestActionRoute: row.next_best_action_route ?? undefined,
    linkedProviderCount: row.linked_provider_count,
    walletVerified: row.wallet_verified,
    joinedProjectCount: row.joined_project_count,
    completedQuestCount: row.completed_quest_count,
    claimedRewardCount: row.claimed_reward_count,
    streakDays: row.streak_days,
    lastActivityAt: row.last_activity_at ?? undefined,
    lastNudgeAt: row.last_nudge_at ?? undefined,
    lastReactivationAt: row.last_reactivation_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function computeMemberActivation(authUserId: string): Promise<MemberActivationComputation> {
  const supabase = getAccountsServiceClient();
  const [
    { data: progress, error: progressError },
    { data: reputation, error: reputationError },
    { count: linkedProviderCount, error: providerError },
    { data: walletLink, error: walletError },
    { count: completedQuestCount, error: completedQuestError },
    { count: claimedRewardCount, error: claimedRewardError },
    { data: xpEvent, error: xpEventError },
  ] = await Promise.all([
    supabase
      .from("user_progress")
      .select("joined_communities")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabase
      .from("user_global_reputation")
      .select("streak, updated_at")
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supabase
      .from("user_connected_accounts")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId)
      .eq("status", "connected"),
    supabase
      .from("wallet_links")
      .select("wallet_address")
      .eq("auth_user_id", authUserId)
      .eq("verified", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("quest_submissions")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId),
    supabase
      .from("reward_claims")
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId),
    supabase
      .from("xp_events")
      .select("created_at")
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (progressError) {
    throw new Error(progressError.message);
  }
  if (reputationError) {
    throw new Error(reputationError.message);
  }
  if (providerError) {
    throw new Error(providerError.message);
  }
  if (walletError) {
    throw new Error(walletError.message);
  }
  if (completedQuestError) {
    throw new Error(completedQuestError.message);
  }
  if (claimedRewardError) {
    throw new Error(claimedRewardError.message);
  }
  if (xpEventError) {
    throw new Error(xpEventError.message);
  }

  const joinedCommunities = Array.isArray(progress?.joined_communities)
    ? (progress.joined_communities as string[])
    : [];

  return {
    linkedProviderCount: linkedProviderCount ?? 0,
    walletVerified: Boolean(walletLink?.wallet_address),
    joinedProjectCount: joinedCommunities.length,
    completedQuestCount: completedQuestCount ?? 0,
    claimedRewardCount: claimedRewardCount ?? 0,
    streakDays: reputation?.streak ?? 0,
    lastActivityAt: xpEvent?.created_at ?? reputation?.updated_at ?? null,
  };
}

export async function syncMemberActivationState(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const computed = await computeMemberActivation(authUserId);
  const summary = deriveMemberActivationSummary({
    authUserId,
    linkedProviderCount: computed.linkedProviderCount,
    walletVerified: computed.walletVerified,
    joinedProjectCount: computed.joinedProjectCount,
    completedQuestCount: computed.completedQuestCount,
    claimedRewardCount: computed.claimedRewardCount,
    streakDays: computed.streakDays,
    lastActivityAt: computed.lastActivityAt,
    metadata: {
      syncedFrom: "success_overview",
    },
  });

  const now = new Date().toISOString();
  const { error } = await supabase.from("member_activation_states").upsert(
    {
      auth_user_id: authUserId,
      primary_project_id: summary.primaryProjectId ?? null,
      activation_lane: summary.activationLane,
      member_health_state: summary.memberHealthState,
      completed_milestones: summary.completedMilestones,
      blockers: summary.blockers,
      next_best_action_key: summary.nextBestActionKey ?? null,
      next_best_action_label: summary.nextBestActionLabel ?? null,
      next_best_action_route: summary.nextBestActionRoute ?? null,
      linked_provider_count: summary.linkedProviderCount,
      wallet_verified: summary.walletVerified,
      joined_project_count: summary.joinedProjectCount,
      completed_quest_count: summary.completedQuestCount,
      claimed_reward_count: summary.claimedRewardCount,
      streak_days: summary.streakDays,
      last_activity_at: summary.lastActivityAt ?? null,
      metadata: summary.metadata ?? {},
      updated_at: now,
    },
    { onConflict: "auth_user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  const { data, error: reloadError } = await supabase
    .from("member_activation_states")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (reloadError) {
    throw new Error(reloadError.message);
  }

  return shapeMemberActivation(data as DbMemberActivationState);
}

async function computeSuccessAccount(accountId: string): Promise<SuccessAccountComputation> {
  const supabase = getAccountsServiceClient();
  const [
    { data: account, error: accountError },
    { data: subscription, error: subscriptionError },
    { data: entitlements, error: entitlementError },
    { data: onboarding, error: onboardingError },
    { data: firstProject, error: projectError },
    { data: firstActiveCampaign, error: campaignError },
    { data: xpEvent, error: xpEventError },
  ] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("id, name, created_at, updated_at, primary_owner_auth_user_id")
      .eq("id", accountId)
      .single(),
    supabase
      .from("customer_account_subscriptions")
      .select("customer_account_id, billing_plan_id, status")
      .eq("customer_account_id", accountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_entitlements")
      .select("customer_account_id, current_projects, current_active_campaigns, current_providers, current_billable_seats")
      .eq("customer_account_id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_onboarding")
      .select("first_project_id")
      .eq("customer_account_id", accountId)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, created_at")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, created_at, project_id")
      .eq("status", "active")
      .in(
        "project_id",
        (
          await supabase.from("projects").select("id").eq("customer_account_id", accountId)
        ).data?.map((row) => row.id) ?? [""]
      )
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("xp_events")
      .select("created_at")
      .in(
        "project_id",
        (
          await supabase.from("projects").select("id").eq("customer_account_id", accountId)
        ).data?.map((row) => row.id) ?? [""]
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (accountError) {
    throw new Error(accountError.message);
  }
  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }
  if (entitlementError) {
    throw new Error(entitlementError.message);
  }
  if (onboardingError) {
    throw new Error(onboardingError.message);
  }
  if (projectError) {
    throw new Error(projectError.message);
  }
  if (campaignError) {
    throw new Error(campaignError.message);
  }
  if (xpEventError) {
    throw new Error(xpEventError.message);
  }

  return {
    account: account as BasicCustomerAccountRow,
    billingPlanId: (subscription as CustomerAccountSubscriptionRow | null)?.billing_plan_id ?? null,
    billingStatus: (subscription as CustomerAccountSubscriptionRow | null)?.status ?? null,
    projectCount: (entitlements as CustomerAccountEntitlementRow | null)?.current_projects ?? 0,
    activeCampaignCount:
      (entitlements as CustomerAccountEntitlementRow | null)?.current_active_campaigns ?? 0,
    providerCount: (entitlements as CustomerAccountEntitlementRow | null)?.current_providers ?? 0,
    billableSeatCount:
      (entitlements as CustomerAccountEntitlementRow | null)?.current_billable_seats ?? 0,
    firstProjectId:
      (onboarding as { first_project_id?: string | null } | null)?.first_project_id ??
      (firstProject as { id?: string | null } | null)?.id ??
      null,
    firstLiveCampaignId: (firstActiveCampaign as { id?: string | null } | null)?.id ?? null,
    lastMemberActivityAt: (xpEvent as { created_at?: string | null } | null)?.created_at ?? null,
  };
}

async function syncSuccessSignals(accountId: string, signals: AdminSuccessSignal[]) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();

  for (const signal of signals) {
    const { error } = await supabase.from("customer_account_success_signals").upsert(
      {
        customer_account_id: signal.customerAccountId,
        project_id: signal.projectId ?? null,
        dedupe_key: signal.dedupeKey,
        signal_type: signal.signalType,
        signal_tone: signal.signalTone,
        status: signal.status,
        summary: signal.summary,
        signal_payload: signal.signalPayload ?? {},
        updated_at: now,
      },
      { onConflict: "dedupe_key" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  const currentKeys = signals.map((signal) => signal.dedupeKey);
  const { data: existing, error: existingError } = await supabase
    .from("customer_account_success_signals")
    .select("id, dedupe_key, status")
    .eq("customer_account_id", accountId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  for (const row of (existing ?? []) as Array<{ id: string; dedupe_key: string; status: string }>) {
    if (currentKeys.includes(row.dedupe_key) || row.status === "resolved" || row.status === "dismissed") {
      continue;
    }

    const { error } = await supabase
      .from("customer_account_success_signals")
      .update({
        status: "resolved",
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function syncCustomerAccountSuccessState(accountId: string) {
  const supabase = getAccountsServiceClient();
  const computed = await computeSuccessAccount(accountId);
  const activation = deriveAccountActivationSummary({
    customerAccountId: accountId,
    firstProjectId: computed.firstProjectId,
    firstLiveCampaignId: computed.firstLiveCampaignId,
    billingPlanId: computed.billingPlanId,
    billingStatus: computed.billingStatus,
    projectCount: computed.projectCount,
    activeCampaignCount: computed.activeCampaignCount,
    providerCount: computed.providerCount,
    billableSeatCount: computed.billableSeatCount,
    lastMemberActivityAt: computed.lastMemberActivityAt,
    createdAt: computed.account.created_at,
    metadata: {
      billingPlanId: computed.billingPlanId,
      billingStatus: computed.billingStatus,
      projectCount: computed.projectCount,
      activeCampaignCount: computed.activeCampaignCount,
      providerCount: computed.providerCount,
      billableSeatCount: computed.billableSeatCount,
      syncedFrom: "success_overview",
    },
  });
  const now = new Date().toISOString();

  const { error: activationError } = await supabase.from("customer_account_activation").upsert(
    {
      customer_account_id: accountId,
      activation_stage: activation.activationStage,
      workspace_health_state: activation.workspaceHealthState,
      success_health_state: activation.successHealthState,
      completed_milestones: activation.completedMilestones,
      blockers: activation.blockers,
      next_best_action_key: activation.nextBestActionKey ?? null,
      next_best_action_label: activation.nextBestActionLabel ?? null,
      next_best_action_route: activation.nextBestActionRoute ?? null,
      first_project_id: activation.firstProjectId ?? null,
      first_live_campaign_id: activation.firstLiveCampaignId ?? null,
      first_provider_connected_at: activation.firstProviderConnectedAt ?? null,
      first_campaign_live_at: activation.firstCampaignLiveAt ?? null,
      last_member_activity_at: activation.lastMemberActivityAt ?? null,
      last_activation_at: now,
      metadata: activation.metadata ?? {},
      updated_at: now,
    },
    { onConflict: "customer_account_id" }
  );

  if (activationError) {
    throw new Error(activationError.message);
  }

  const signals = deriveSuccessSignals({
    accountId,
    accountName: computed.account.name,
    billingPlanId: computed.billingPlanId,
    projectCount: computed.projectCount,
    activeCampaignCount: computed.activeCampaignCount,
    providerCount: computed.providerCount,
    workspaceHealthState: activation.workspaceHealthState,
    successHealthState: activation.successHealthState,
    lastMemberActivityAt: activation.lastMemberActivityAt,
    nextBestActionLabel: activation.nextBestActionLabel,
  });

  await syncSuccessSignals(accountId, signals);

  return {
    account: computed.account,
    activation,
    billingPlanId: computed.billingPlanId,
    billingStatus: computed.billingStatus,
    projectCount: computed.projectCount,
    activeCampaignCount: computed.activeCampaignCount,
    providerCount: computed.providerCount,
    billableSeatCount: computed.billableSeatCount,
  };
}

async function loadPersistedSignals(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_success_signals")
    .select("*")
    .eq("customer_account_id", accountId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbCustomerAccountSuccessSignal[]).map(shapeSuccessSignal);
}

export async function loadSuccessAccountSummary(accountId: string): Promise<AdminSuccessAccountSummary> {
  const synced = await syncCustomerAccountSuccessState(accountId);

  return {
    accountId,
    accountName: synced.account.name,
    activation: synced.activation,
    billingPlanId: synced.billingPlanId ?? undefined,
    billingStatus: synced.billingStatus ?? undefined,
    workspaceHealthState: synced.activation.workspaceHealthState,
    successHealthState: synced.activation.successHealthState,
    projectCount: synced.projectCount,
    activeCampaignCount: synced.activeCampaignCount,
    providerCount: synced.providerCount,
    billableSeatCount: synced.billableSeatCount,
    blockers: synced.activation.blockers,
    nextBestActionLabel: synced.activation.nextBestActionLabel,
    nextBestActionRoute: synced.activation.nextBestActionRoute,
    lastMemberActivityAt: synced.activation.lastMemberActivityAt,
  };
}

export async function loadSuccessOverview(): Promise<AdminSuccessOverview> {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_accounts")
    .select("id")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const accountIds = ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const accounts = await Promise.all(accountIds.map((accountId) => loadSuccessAccountSummary(accountId)));
  const memberDrift = await supabase
    .from("member_activation_states")
    .select("*", { count: "exact", head: true })
    .in("member_health_state", ["drifting", "reactivation_needed"]);

  if (memberDrift.error) {
    throw new Error(memberDrift.error.message);
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      totalAccounts: accounts.length,
      notStarted: accounts.filter((account) => account.workspaceHealthState === "not_started").length,
      activating: accounts.filter((account) => account.workspaceHealthState === "activating").length,
      stalled: accounts.filter((account) => account.workspaceHealthState === "stalled").length,
      live: accounts.filter((account) => account.workspaceHealthState === "live").length,
      expansionReady: accounts.filter((account) => account.successHealthState === "expansion_ready").length,
      churnRisk: accounts.filter((account) => account.successHealthState === "churn_risk").length,
      memberDrift: memberDrift.count ?? 0,
    },
    accounts,
    stalledAccounts: accounts.filter((account) => account.workspaceHealthState === "stalled"),
    expansionAccounts: accounts.filter((account) => account.successHealthState === "expansion_ready"),
    riskAccounts: accounts.filter((account) => account.successHealthState === "churn_risk"),
  };
}

export async function loadSuccessAccountDetail(accountId: string): Promise<AdminSuccessAccountDetail | null> {
  const summary = await loadSuccessAccountSummary(accountId);
  const supabase = getAccountsServiceClient();
  const [
    { data: account, error: accountError },
    { data: notes, error: notesError },
    { data: tasks, error: tasksError },
    { data: activationSignals, error: signalsError },
  ] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("primary_owner_auth_user_id")
      .eq("id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_success_notes")
      .select("*")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_account_success_tasks")
      .select("*")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_account_success_signals")
      .select("*")
      .eq("customer_account_id", accountId)
      .order("updated_at", { ascending: false }),
  ]);

  if (accountError) {
    throw new Error(accountError.message);
  }
  if (notesError) {
    throw new Error(notesError.message);
  }
  if (tasksError) {
    throw new Error(tasksError.message);
  }
  if (signalsError) {
    throw new Error(signalsError.message);
  }

  const primaryOwnerAuthUserId = (account as { primary_owner_auth_user_id?: string | null } | null)?.primary_owner_auth_user_id;
  const memberState = primaryOwnerAuthUserId ? await syncMemberActivationState(primaryOwnerAuthUserId) : undefined;

  return {
    ...summary,
    notes: ((notes ?? []) as DbCustomerAccountSuccessNote[]).map(shapeSuccessNote),
    tasks: ((tasks ?? []) as DbCustomerAccountSuccessTask[]).map(shapeSuccessTask),
    signals:
      ((activationSignals ?? []) as DbCustomerAccountSuccessSignal[]).map(shapeSuccessSignal) ??
      (await loadPersistedSignals(accountId)),
    memberState,
  };
}

export async function resolvePrimaryAccountIdForUser(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.customer_account_id ?? null;
}

export async function assertInternalSuccessAccess() {
  return assertInternalSupportAccess();
}

export async function assertSuccessAccountAccess(accountId: string) {
  const serverSupabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    const error = new Error("You must be signed in to access success data.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }

  const supabase = getAccountsServiceClient();
  const [{ data: adminUser, error: adminError }, { data: membership, error: membershipError }] =
    await Promise.all([
      supabase
        .from("admin_users")
        .select("auth_user_id, role, status")
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("customer_account_memberships")
        .select("customer_account_id, role, status")
        .eq("customer_account_id", accountId)
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const isInternalAdmin = Boolean(adminUser?.auth_user_id);
  const hasMembership = Boolean(membership?.customer_account_id);

  if (!isInternalAdmin && !hasMembership) {
    const error = new Error("Success access denied.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return {
    authUserId: user.id,
    isInternalAdmin,
    hasMembership,
  };
}
