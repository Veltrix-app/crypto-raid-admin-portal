import type {
  AdminAccountActivationSummary,
  AdminActivationLane,
  AdminActivationStage,
  AdminMemberActivationState,
  AdminMemberHealthState,
  AdminSuccessHealthState,
  AdminSuccessSignal,
  AdminSuccessSignalStatus,
  AdminSuccessSignalTone,
  AdminSuccessSignalType,
  AdminSuccessTaskDueState,
  AdminWorkspaceHealthState,
} from "@/types/entities/success";

type AccountActivationInput = {
  customerAccountId: string;
  firstProjectId?: string | null;
  firstLiveCampaignId?: string | null;
  billingPlanId?: string | null;
  billingStatus?: string | null;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  lastMemberActivityAt?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown>;
};

type MemberActivationInput = {
  authUserId: string;
  primaryProjectId?: string | null;
  linkedProviderCount: number;
  walletVerified: boolean;
  joinedProjectCount: number;
  completedQuestCount: number;
  claimedRewardCount: number;
  streakDays: number;
  lastActivityAt?: string | null;
  metadata?: Record<string, unknown>;
};

export const SUCCESS_SIGNAL_STATUSES: readonly AdminSuccessSignalStatus[] = [
  "open",
  "watching",
  "resolved",
  "dismissed",
];

export function normalizeStringList(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function diffDays(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24));
}

function pushIfMissing(target: string[], value: string, enabled: boolean) {
  if (enabled && !target.includes(value)) {
    target.push(value);
  }
}

export function humanizeSuccessValue(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function deriveAccountStage(input: AccountActivationInput): AdminActivationStage {
  if (input.projectCount === 0) {
    return "workspace_created";
  }

  if (input.providerCount === 0) {
    return "first_project_created";
  }

  if (input.activeCampaignCount === 0) {
    return "provider_connected";
  }

  if (!input.lastMemberActivityAt) {
    return "campaign_live";
  }

  return "live";
}

function deriveWorkspaceHealth(
  input: AccountActivationInput,
  stage: AdminActivationStage
): AdminWorkspaceHealthState {
  const accountAge = diffDays(input.createdAt);
  const lastMemberActivityAge = diffDays(input.lastMemberActivityAt);

  if (stage === "live" && lastMemberActivityAge !== null && lastMemberActivityAge <= 14) {
    return "live";
  }

  if (stage === "workspace_created" && (accountAge === null || accountAge <= 3)) {
    return "not_started";
  }

  if (
    accountAge !== null &&
    ((stage === "workspace_created" && accountAge >= 7) ||
      (stage === "first_project_created" && accountAge >= 10) ||
      (stage === "provider_connected" && accountAge >= 14) ||
      (stage === "campaign_live" && accountAge >= 21))
  ) {
    return "stalled";
  }

  if (lastMemberActivityAge !== null && lastMemberActivityAge <= 30 && stage === "live") {
    return "live";
  }

  return "activating";
}

function deriveSuccessHealth(
  input: AccountActivationInput,
  workspaceHealthState: AdminWorkspaceHealthState
): AdminSuccessHealthState {
  const lastMemberActivityAge = diffDays(input.lastMemberActivityAt);
  const isPaid = Boolean(input.billingPlanId && input.billingPlanId !== "free");

  if (
    (isPaid && workspaceHealthState === "stalled") ||
    (isPaid && input.projectCount > 0 && input.activeCampaignCount === 0 && diffDays(input.createdAt) !== null && diffDays(input.createdAt)! >= 21)
  ) {
    return "churn_risk";
  }

  if (
    input.projectCount >= 2 ||
    input.activeCampaignCount >= 2 ||
    input.billableSeatCount >= 4 ||
    (lastMemberActivityAge !== null && lastMemberActivityAge <= 7 && input.activeCampaignCount > 0)
  ) {
    return "expansion_ready";
  }

  if (workspaceHealthState === "stalled") {
    return "watching";
  }

  return "healthy";
}

function deriveAccountBlockers(input: AccountActivationInput) {
  const blockers: string[] = [];

  pushIfMissing(blockers, "Create the first project workspace.", input.projectCount === 0);
  pushIfMissing(
    blockers,
    "Connect the first provider to unlock delivery and member entry rails.",
    input.projectCount > 0 && input.providerCount === 0
  );
  pushIfMissing(
    blockers,
    "Publish the first live campaign so the workspace actually starts moving.",
    input.providerCount > 0 && input.activeCampaignCount === 0
  );
  pushIfMissing(
    blockers,
    "Drive the first member activity so the workspace closes the launch-to-usage loop.",
    input.activeCampaignCount > 0 && !input.lastMemberActivityAt
  );

  return blockers;
}

function deriveAccountCompletedMilestones(input: AccountActivationInput) {
  const milestones: string[] = ["Workspace created"];

  pushIfMissing(milestones, "First project created", input.projectCount > 0);
  pushIfMissing(milestones, "First provider connected", input.providerCount > 0);
  pushIfMissing(milestones, "First campaign live", input.activeCampaignCount > 0);
  pushIfMissing(milestones, "First member activity", Boolean(input.lastMemberActivityAt));

  return milestones;
}

function deriveAccountNextAction(input: AccountActivationInput) {
  if (input.projectCount === 0) {
    return {
      key: "create_first_project",
      label: "Create first project",
      route: "/projects",
    };
  }

  if (input.providerCount === 0) {
    return {
      key: "connect_first_provider",
      label: "Connect first provider",
      route: input.firstProjectId ? `/projects/${input.firstProjectId}/settings` : "/projects",
    };
  }

  if (input.activeCampaignCount === 0) {
    return {
      key: "publish_first_campaign",
      label: "Publish first campaign",
      route: input.firstProjectId ? `/projects/${input.firstProjectId}/launch` : "/projects",
    };
  }

  if (!input.lastMemberActivityAt) {
    return {
      key: "drive_first_member_activity",
      label: "Drive first member activity",
      route: input.firstProjectId ? `/projects/${input.firstProjectId}/community` : "/projects",
    };
  }

  return {
    key: "keep_workspace_moving",
    label: "Keep the workspace moving",
    route: input.firstProjectId ? `/projects/${input.firstProjectId}` : "/account",
  };
}

export function deriveAccountActivationSummary(
  input: AccountActivationInput
): AdminAccountActivationSummary {
  const activationStage = deriveAccountStage(input);
  const workspaceHealthState = deriveWorkspaceHealth(input, activationStage);
  const successHealthState = deriveSuccessHealth(input, workspaceHealthState);
  const nextAction = deriveAccountNextAction(input);

  return {
    customerAccountId: input.customerAccountId,
    activationStage,
    workspaceHealthState,
    successHealthState,
    completedMilestones: deriveAccountCompletedMilestones(input),
    blockers: deriveAccountBlockers(input),
    nextBestActionKey: nextAction.key,
    nextBestActionLabel: nextAction.label,
    nextBestActionRoute: nextAction.route,
    firstProjectId: input.firstProjectId ?? undefined,
    firstLiveCampaignId: input.firstLiveCampaignId ?? undefined,
    lastMemberActivityAt: input.lastMemberActivityAt ?? undefined,
    metadata: input.metadata,
  };
}

function deriveMemberLane(input: MemberActivationInput): AdminActivationLane {
  if (input.linkedProviderCount === 0 || !input.walletVerified || input.joinedProjectCount === 0) {
    return "onboarding";
  }

  const lastActivityAge = diffDays(input.lastActivityAt);
  if (lastActivityAge !== null && lastActivityAge >= 14) {
    return "comeback";
  }

  return "active";
}

function deriveMemberHealth(
  input: MemberActivationInput,
  lane: AdminActivationLane
): AdminMemberHealthState {
  if (lane === "onboarding") {
    return "new";
  }

  const lastActivityAge = diffDays(input.lastActivityAt);
  if (lastActivityAge !== null && lastActivityAge >= 30) {
    return "reactivation_needed";
  }

  if (lane === "comeback") {
    return "drifting";
  }

  return "active";
}

function deriveMemberCompletedMilestones(input: MemberActivationInput) {
  const milestones: string[] = [];

  pushIfMissing(milestones, "Provider linked", input.linkedProviderCount > 0);
  pushIfMissing(milestones, "Wallet verified", input.walletVerified);
  pushIfMissing(milestones, "Joined first project", input.joinedProjectCount > 0);
  pushIfMissing(milestones, "First quest completed", input.completedQuestCount > 0);
  pushIfMissing(milestones, "First reward claimed", input.claimedRewardCount > 0);

  return milestones;
}

function deriveMemberBlockers(input: MemberActivationInput) {
  const blockers: string[] = [];

  pushIfMissing(blockers, "Link the first provider account.", input.linkedProviderCount === 0);
  pushIfMissing(blockers, "Verify the first wallet.", !input.walletVerified);
  pushIfMissing(blockers, "Join the first project community.", input.joinedProjectCount === 0);
  pushIfMissing(
    blockers,
    "Complete the first quest to move into the active lane.",
    input.joinedProjectCount > 0 && input.completedQuestCount === 0
  );

  const lastActivityAge = diffDays(input.lastActivityAt);
  pushIfMissing(
    blockers,
    "Return through a comeback flow to restore visible momentum.",
    lastActivityAge !== null && lastActivityAge >= 14
  );

  return blockers;
}

function deriveMemberNextAction(input: MemberActivationInput) {
  if (input.linkedProviderCount === 0) {
    return {
      key: "link_first_provider",
      label: "Link first provider",
      route: "/community/onboarding",
    };
  }

  if (!input.walletVerified) {
    return {
      key: "verify_first_wallet",
      label: "Verify first wallet",
      route: "/community/onboarding",
    };
  }

  if (input.joinedProjectCount === 0) {
    return {
      key: "join_first_project",
      label: "Join first project",
      route: "/community/onboarding",
    };
  }

  const lastActivityAge = diffDays(input.lastActivityAt);
  if (lastActivityAge !== null && lastActivityAge >= 14) {
    return {
      key: "resume_member_momentum",
      label: "Resume momentum",
      route: "/community/comeback",
    };
  }

  return {
    key: "open_live_missions",
    label: "Open live missions",
    route: "/home",
  };
}

export function deriveMemberActivationSummary(
  input: MemberActivationInput
): AdminMemberActivationState {
  const activationLane = deriveMemberLane(input);
  const memberHealthState = deriveMemberHealth(input, activationLane);
  const nextAction = deriveMemberNextAction(input);

  return {
    id: input.authUserId,
    authUserId: input.authUserId,
    primaryProjectId: input.primaryProjectId ?? undefined,
    activationLane,
    memberHealthState,
    completedMilestones: deriveMemberCompletedMilestones(input),
    blockers: deriveMemberBlockers(input),
    nextBestActionKey: nextAction.key,
    nextBestActionLabel: nextAction.label,
    nextBestActionRoute: nextAction.route,
    linkedProviderCount: input.linkedProviderCount,
    walletVerified: input.walletVerified,
    joinedProjectCount: input.joinedProjectCount,
    completedQuestCount: input.completedQuestCount,
    claimedRewardCount: input.claimedRewardCount,
    streakDays: input.streakDays,
    lastActivityAt: input.lastActivityAt ?? undefined,
    metadata: input.metadata,
    createdAt: input.lastActivityAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildSignal(
  accountId: string,
  type: AdminSuccessSignalType,
  tone: AdminSuccessSignalTone,
  summary: string,
  payload?: Record<string, unknown>,
  projectId?: string
): AdminSuccessSignal {
  const now = new Date().toISOString();

  return {
    id: `${accountId}:${type}`,
    customerAccountId: accountId,
    projectId,
    dedupeKey: `${accountId}:${type}:${projectId ?? "global"}`,
    signalType: type,
    signalTone: tone,
    status: tone === "danger" ? "open" : tone === "warning" ? "watching" : "open",
    summary,
    signalPayload: payload,
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveSuccessSignals(input: {
  accountId: string;
  accountName: string;
  billingPlanId?: string | null;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  workspaceHealthState: AdminWorkspaceHealthState;
  successHealthState: AdminSuccessHealthState;
  lastMemberActivityAt?: string | null;
  nextBestActionLabel?: string;
}): AdminSuccessSignal[] {
  const signals: AdminSuccessSignal[] = [];
  const isPaid = Boolean(input.billingPlanId && input.billingPlanId !== "free");
  const lastMemberActivityAge = diffDays(input.lastMemberActivityAt);

  if (input.projectCount === 0) {
    signals.push(
      buildSignal(
        input.accountId,
        "first_project_missing",
        "warning",
        `${input.accountName} still has no first project.`
      )
    );
  }

  if (input.projectCount > 0 && input.activeCampaignCount === 0) {
    signals.push(
      buildSignal(
        input.accountId,
        "first_campaign_missing",
        "warning",
        `${input.accountName} has project structure but no live campaign yet.`,
        {
          providerCount: input.providerCount,
          nextBestActionLabel: input.nextBestActionLabel,
        }
      )
    );
  }

  if (input.workspaceHealthState === "stalled") {
    signals.push(
      buildSignal(
        input.accountId,
        "activation_stalled",
        isPaid ? "danger" : "warning",
        `${input.accountName} is stalled and needs a clear follow-up to move again.`
      )
    );
  }

  if (lastMemberActivityAge !== null && lastMemberActivityAge >= 14) {
    signals.push(
      buildSignal(
        input.accountId,
        "member_drift",
        "warning",
        `${input.accountName} shows member drift and likely needs a comeback push.`,
        {
          lastMemberActivityAge,
        }
      )
    );
  }

  if (input.successHealthState === "expansion_ready") {
    signals.push(
      buildSignal(
        input.accountId,
        "expansion_ready",
        "success",
        `${input.accountName} is ready for expansion follow-up instead of only activation support.`
      )
    );
  }

  if (isPaid && input.successHealthState === "churn_risk") {
    signals.push(
      buildSignal(
        input.accountId,
        "paid_low_usage",
        "danger",
        `${input.accountName} is paid but not showing enough healthy activation movement.`
      )
    );
  }

  if (
    input.projectCount > 0 &&
    input.activeCampaignCount > 0 &&
    input.workspaceHealthState === "live" &&
    input.successHealthState === "healthy"
  ) {
    signals.push(
      buildSignal(
        input.accountId,
        "healthy_repeat_usage",
        "success",
        `${input.accountName} is showing healthy repeat usage and can stay on light-touch monitoring.`
      )
    );
  }

  return signals;
}

export function deriveTaskDueState(
  status: string,
  dueAt?: string | null
): AdminSuccessTaskDueState {
  if (status === "resolved" || status === "canceled") {
    return "resolved";
  }

  if (!dueAt) {
    return "upcoming";
  }

  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return "upcoming";
  }

  const now = Date.now();
  if (due.getTime() < now - 1000 * 60 * 60 * 24) {
    return "overdue";
  }

  if (due.getTime() <= now + 1000 * 60 * 60 * 24) {
    return "due_now";
  }

  return "upcoming";
}
