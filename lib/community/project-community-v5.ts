import { type CommunityCaptainQueueItem, type CommunityCaptainQueueItemPriority, type CommunityCaptainQueueItemStatus, type CommunityHealthSignal, type CommunityJourneyOutcome, type CommunityJourneyOutcomeKey, type CommunityJourneyOutcomeRecord, type CommunityOwnerRecommendation } from "@/components/community/community-config";
import { assertProjectCommunityAccess } from "@/lib/community/project-community-auth";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

type RawRecord = Record<string, unknown>;

type ProjectCommunityCaptainAssignmentRow = RawRecord & {
  auth_user_id?: string | null;
  authUserId?: string | null;
  role?: string | null;
  label?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityCaptainQueueRow = RawRecord & {
  id?: string | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  priority?: string | null;
  due_at?: string | null;
  blocked_reason?: string | null;
  source_type?: string | null;
  source?: string | null;
  action_label?: string | null;
  actionLabel?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityJourneyEventRow = RawRecord & {
  id?: string | null;
  auth_user_id?: string | null;
  authUserId?: string | null;
  journey_key?: string | null;
  journeyKey?: string | null;
  event_type?: string | null;
  eventType?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityJourneySnapshotRow = RawRecord & {
  id?: string | null;
  auth_user_id?: string | null;
  authUserId?: string | null;
  journey_key?: string | null;
  journeyKey?: string | null;
  status?: string | null;
  stage?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityJourneyRow = RawRecord & {
  id?: string | null;
  auth_user_id?: string | null;
  authUserId?: string | null;
  journey_key?: string | null;
  journeyKey?: string | null;
  status?: string | null;
  stage?: string | null;
  completed_at?: string | null;
  completedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityExecutionSampleRow = {
  status?: string | null;
};

type ProjectCommunityV5ExecutionSummary = {
  automations: number;
  recentAutomationRuns: number;
  recentPlaybookRuns: number;
  recentCaptainActions: number;
  recentFailureCount: number;
  recentSuccessCount: number;
};

type ProjectCommunityCaptainWorkspaceSummary = {
  activeAssignments: number;
  queueItemCount: number;
  blockedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  items: CommunityCaptainQueueItem[];
};

export type ProjectCommunityV5Payload = {
  projectId: string;
  execution: ProjectCommunityV5ExecutionSummary;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  ownerRecommendations: CommunityOwnerRecommendation[];
  healthSignals: CommunityHealthSignal[];
};

const JOURNEY_LABELS: Record<CommunityJourneyOutcome["key"], string> = {
  onboarding: "Onboarding",
  comeback: "Comeback",
  activation: "Activation",
  retention: "Retention",
};

const ACTIONABLE_QUEUE_STATUSES = ["queued", "in_progress", "blocked", "escalated"] as const;
const AUTOMATION_TYPES = [
  "rank_sync",
  "leaderboard_pulse",
  "mission_digest",
  "raid_reminder",
  "newcomer_pulse",
  "reactivation_pulse",
  "activation_board",
] as const;
const DUE_SOON_WINDOW_HOURS = 72;

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01";
}

function throwMissingV5SchemaError(fallbackMessage: string): never {
  throw new Error(
    `${fallbackMessage} Community OS V5 schema is unavailable. Run the Task 1 migration before loading this helper.`
  );
}

async function loadRowsOrEmpty<T>(
  request: PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>,
  fallbackMessage: string
) {
  const { data, error } = await request;

  if (error) {
    if (isMissingRelationError(error)) {
      throwMissingV5SchemaError(fallbackMessage);
    }

    throw new Error(error.message || fallbackMessage);
  }

  return (data ?? []) as T[];
}

async function loadCountOrZero(
  request: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>
) {
  const { count, error } = await request;

  if (error) {
    if (isMissingRelationError(error)) {
      throwMissingV5SchemaError("Failed to load community count.");
    }

    throw new Error(error.message || "Failed to load community count.");
  }

  return Number(count ?? 0);
}

async function loadProjectCommunityExecutionReadOnly(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const [
    automationRuns,
    playbookRuns,
    captainActions,
  ] = await Promise.all([
    loadOptionalRows<ProjectCommunityExecutionSampleRow>(
      supabase
        .from("community_automation_runs")
        .select("status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(18),
      "Failed to load automation runs."
    ),
    loadOptionalRows<ProjectCommunityExecutionSampleRow>(
      supabase
        .from("community_playbook_runs")
        .select("status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(12),
      "Failed to load playbook runs."
    ),
    loadOptionalRows<ProjectCommunityExecutionSampleRow>(
      supabase
        .from("community_captain_actions")
        .select("status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(12),
      "Failed to load captain actions."
    ),
  ]);

  return {
    automations: AUTOMATION_TYPES.length,
    automationRuns,
    playbookRuns,
    captainActions,
  };
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toIsoTimestamp(value: unknown) {
  const text = toText(value);
  return text ? text : "";
}

function normalizeQueueStatus(value: unknown): CommunityCaptainQueueItemStatus {
  const status = toText(value);
  if (status === "in_progress" || status === "blocked" || status === "escalated") {
    return status;
  }
  if (status === "completed" || status === "done" || status === "success") {
    return "completed";
  }
  return "queued";
}

function isActionableQueueStatus(value: CommunityCaptainQueueItemStatus) {
  return value === "queued" || value === "in_progress" || value === "blocked" || value === "escalated";
}

function normalizeQueuePriority(value: unknown): CommunityCaptainQueueItemPriority {
  const priority = toText(value);
  if (priority === "urgent" || priority === "high" || priority === "low") {
    return priority;
  }
  return "normal";
}

function normalizeQueueSource(value: unknown) {
  const source = toText(value);
  if (source === "playbook" || source === "owner" || source === "journey") {
    return source;
  }
  return "automation" as const;
}

function getQueueActionLabel(source: CommunityCaptainQueueItem["source"]) {
  if (source === "playbook") return "Run playbook";
  if (source === "owner") return "Review owner request";
  if (source === "journey") return "Advance journey";
  return "Run automation";
}

function sanitizeBlockedReason(input: {
  rawReason: unknown;
  status: CommunityCaptainQueueItemStatus;
  source: CommunityCaptainQueueItem["source"];
}): CommunityCaptainQueueItem["blockedReason"] {
  if (input.status !== "blocked" && input.status !== "escalated") {
    return {
      code: "not_blocked",
      label: "Not blocked",
      summary: "This action is not currently blocked.",
    };
  }

  const rawReason = toText(input.rawReason).toLowerCase();
  const code =
    rawReason.includes("permission") || rawReason.includes("scope")
      ? "permission_gate"
      : rawReason.includes("dependency") || rawReason.includes("pending")
        ? "dependency_gate"
        : rawReason.includes("review") || rawReason.includes("approval")
          ? "review_gate"
          : input.source === "journey"
            ? "journey_gate"
            : input.source === "owner"
              ? "owner_gate"
              : "project_gate";

  const label =
    code === "permission_gate"
      ? "Permission gate"
      : code === "dependency_gate"
        ? "Dependency gate"
        : code === "review_gate"
          ? "Review gate"
          : code === "journey_gate"
            ? "Journey gate"
            : code === "owner_gate"
              ? "Owner gate"
              : "Project gate";

  const summary =
    code === "permission_gate"
      ? "This action needs the right project permission before it can continue."
      : code === "dependency_gate"
        ? "A project dependency must clear before this action can move."
        : code === "review_gate"
          ? "This action is waiting on a review step before it can proceed."
          : code === "journey_gate"
            ? "A journey transition is required before this action can advance."
            : code === "owner_gate"
              ? "Owner review is required before this action can continue."
              : "This project action is blocked and needs attention.";

  return { code, label, summary };
}

function priorityRank(priority: CommunityCaptainQueueItemPriority) {
  if (priority === "urgent") return 0;
  if (priority === "high") return 1;
  if (priority === "normal") return 2;
  return 3;
}

function timestampValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function buildCaptainQueueItems(rows: ProjectCommunityCaptainQueueRow[]) {
  return rows
    .map((row): CommunityCaptainQueueItem => {
      const source = normalizeQueueSource(row.source_type ?? row.source);
      const status = normalizeQueueStatus(row.status);
      const fallbackId = [
        "queue",
        source,
        normalizeQueuePriority(row.priority),
        toText(row.title, "action").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ]
        .filter(Boolean)
        .join("-");

      return {
        id: toText(row.id) || fallbackId,
        title: toText(row.title, "Captain action"),
        summary: toText(row.summary, "Keep this project rail moving."),
        status,
        priority: normalizeQueuePriority(row.priority),
        dueAt: toIsoTimestamp(row.due_at),
        blockedReason: sanitizeBlockedReason({
          rawReason: row.blocked_reason,
          status,
          source,
        }),
        source,
        actionLabel: toText(row.action_label ?? row.actionLabel, getQueueActionLabel(source)),
      };
    })
    .filter((item) => isActionableQueueStatus(item.status))
    .sort((left, right) => {
      const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
      if (priorityDelta !== 0) return priorityDelta;
      const leftDue = left.dueAt ? timestampValue(left.dueAt) : Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueAt ? timestampValue(right.dueAt) : Number.MAX_SAFE_INTEGER;
      return leftDue - rightDue;
    });
}

function summarizeExecutionHistory(execution: {
  automations: number;
  automationRuns: ProjectCommunityExecutionSampleRow[];
  playbookRuns: ProjectCommunityExecutionSampleRow[];
  captainActions: ProjectCommunityExecutionSampleRow[];
}): ProjectCommunityV5ExecutionSummary {
  const failedAutomationRuns = execution.automationRuns.filter((run) => run.status === "failed").length;
  const failedPlaybookRuns = execution.playbookRuns.filter((run) => run.status === "failed").length;
  const failedCaptainActions = execution.captainActions.filter((action) => action.status === "failed").length;
  const successAutomationRuns = execution.automationRuns.filter((run) => run.status === "success").length;
  const successPlaybookRuns = execution.playbookRuns.filter((run) => run.status === "success").length;
  const successCaptainActions = execution.captainActions.filter((action) => action.status === "success").length;

  return {
    automations: execution.automations,
    recentAutomationRuns: execution.automationRuns.length,
    recentPlaybookRuns: execution.playbookRuns.length,
    recentCaptainActions: execution.captainActions.length,
    recentFailureCount: failedAutomationRuns + failedPlaybookRuns + failedCaptainActions,
    recentSuccessCount: successAutomationRuns + successPlaybookRuns + successCaptainActions,
  };
}

function buildJourneyOutcome(input: {
  key: CommunityJourneyOutcome["key"];
  startedCount: number;
  completedCount: number;
  blockedCount: number;
  recentCompletedCount: number;
  lastUpdatedAt: string;
}): CommunityJourneyOutcome {
  return {
    key: input.key,
    label: JOURNEY_LABELS[input.key],
    startedCount: input.startedCount,
    completedCount: input.completedCount,
    completionRate: roundPercentage(input.completedCount, input.startedCount),
    blockedCount: input.blockedCount,
    recentCompletedCount: input.recentCompletedCount,
    lastUpdatedAt: input.lastUpdatedAt,
  };
}

function normalizeJourneyStatus(value: unknown) {
  const status = toText(value);
  if (status === "completed" || status === "active" || status === "blocked" || status === "paused") {
    return status;
  }
  if (status === "done" || status === "finished") {
    return "completed";
  }
  if (status === "at_risk" || status === "watchlist") {
    return "blocked";
  }
  return "active";
}

function readJourneyOutcomeKey(row: RawRecord) {
  return toText(row.journey_key ?? row.journeyKey);
}

function isJourneyCompletionEventType(value: unknown) {
  const eventType = toText(value);
  return (
    eventType === "completed" ||
    eventType === "step_completed" ||
    eventType === "milestone_unlocked" ||
    eventType === "returned"
  );
}

function buildJourneyOutcomes(input: {
  journeyRows: ProjectCommunityJourneyRow[];
  snapshotRows: ProjectCommunityJourneySnapshotRow[];
  eventRows: ProjectCommunityJourneyEventRow[];
}): CommunityJourneyOutcomeRecord {
  const recentWindowIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const aggregate = {
    onboarding: { startedCount: 0, completedCount: 0, blockedCount: 0, recentCompletedCount: 0, lastUpdatedAt: "" },
    comeback: { startedCount: 0, completedCount: 0, blockedCount: 0, recentCompletedCount: 0, lastUpdatedAt: "" },
    activation: { startedCount: 0, completedCount: 0, blockedCount: 0, recentCompletedCount: 0, lastUpdatedAt: "" },
    retention: { startedCount: 0, completedCount: 0, blockedCount: 0, recentCompletedCount: 0, lastUpdatedAt: "" },
  } satisfies Record<
    CommunityJourneyOutcomeKey,
    {
      startedCount: number;
      completedCount: number;
      blockedCount: number;
      recentCompletedCount: number;
      lastUpdatedAt: string;
    }
  >;

  for (const row of input.journeyRows) {
    const key = readJourneyOutcomeKey(row);
    const memberId = toText(row.auth_user_id ?? row.authUserId);
    if (!memberId || !(key in aggregate)) continue;

    const bucket = aggregate[key as CommunityJourneyOutcomeKey];
    const status = normalizeJourneyStatus(row.status ?? row.stage);
    const createdAt = toIsoTimestamp(row.created_at ?? row.updated_at);
    const completedAt = toIsoTimestamp(row.completed_at ?? row.completedAt);
    const updatedAt = completedAt || createdAt;

    bucket.startedCount += 1;
    if (status === "completed" || Boolean(completedAt)) bucket.completedCount += 1;
    if (updatedAt && (!bucket.lastUpdatedAt || timestampValue(updatedAt) > timestampValue(bucket.lastUpdatedAt))) {
      bucket.lastUpdatedAt = updatedAt;
    }
  }

  const latestSnapshotByJourneyAndMember = new Map<CommunityJourneyOutcomeKey, Map<string, ProjectCommunityJourneySnapshotRow>>();
  for (const key of Object.keys(aggregate) as CommunityJourneyOutcomeKey[]) {
    latestSnapshotByJourneyAndMember.set(key, new Map());
  }

  for (const row of input.snapshotRows) {
    const key = readJourneyOutcomeKey(row);
    const memberId = toText(row.auth_user_id ?? row.authUserId);
    if (!memberId || !(key in aggregate)) continue;

    const bucket = latestSnapshotByJourneyAndMember.get(key as CommunityJourneyOutcomeKey);
    if (!bucket) continue;

    const updatedAt = toIsoTimestamp(row.updated_at ?? row.created_at);
    const existing = bucket.get(memberId);
    const existingUpdatedAt = existing ? toIsoTimestamp(existing.updated_at ?? existing.created_at) : "";
    if (!existing || !existingUpdatedAt || timestampValue(updatedAt) >= timestampValue(existingUpdatedAt)) {
      bucket.set(memberId, row);
    }
  }

  for (const key of Object.keys(aggregate) as CommunityJourneyOutcomeKey[]) {
    const snapshots = latestSnapshotByJourneyAndMember.get(key);
    if (!snapshots) continue;

    const bucket = aggregate[key];
    for (const snapshot of snapshots.values()) {
      const status = normalizeJourneyStatus(snapshot.status ?? snapshot.stage);
      const updatedAt = toIsoTimestamp(snapshot.updated_at ?? snapshot.created_at);
      if (status === "blocked") {
        bucket.blockedCount += 1;
      }
      if (updatedAt && (!bucket.lastUpdatedAt || timestampValue(updatedAt) > timestampValue(bucket.lastUpdatedAt))) {
        bucket.lastUpdatedAt = updatedAt;
      }
    }
  }

  const recentCompletionMembersByJourney = new Map<CommunityJourneyOutcomeKey, Set<string>>();
  for (const key of Object.keys(aggregate) as CommunityJourneyOutcomeKey[]) {
    recentCompletionMembersByJourney.set(key, new Set());
  }

  for (const row of input.eventRows) {
    const key = readJourneyOutcomeKey(row);
    const memberId = toText(row.auth_user_id ?? row.authUserId);
    if (!memberId || !(key in aggregate)) continue;

    const eventType = toText(row.event_type ?? row.eventType);
    const createdAt = toIsoTimestamp(row.created_at ?? row.updated_at);
    const updatedAt = toIsoTimestamp(row.updated_at ?? row.created_at);
    const bucket = aggregate[key as CommunityJourneyOutcomeKey];
    if (updatedAt && (!bucket.lastUpdatedAt || timestampValue(updatedAt) > timestampValue(bucket.lastUpdatedAt))) {
      bucket.lastUpdatedAt = updatedAt;
    }

    if (!isJourneyCompletionEventType(eventType) || createdAt < recentWindowIso) continue;

    const recentMembers = recentCompletionMembersByJourney.get(key as CommunityJourneyOutcomeKey);
    if (!recentMembers) continue;
    recentMembers.add(memberId);
  }

  for (const key of Object.keys(aggregate) as CommunityJourneyOutcomeKey[]) {
    const recentMembers = recentCompletionMembersByJourney.get(key);
    if (recentMembers) {
      aggregate[key].recentCompletedCount = recentMembers.size;
    }
  }

  return {
    onboarding: buildJourneyOutcome({ key: "onboarding", ...aggregate.onboarding }),
    comeback: buildJourneyOutcome({ key: "comeback", ...aggregate.comeback }),
    activation: buildJourneyOutcome({ key: "activation", ...aggregate.activation }),
    retention: buildJourneyOutcome({ key: "retention", ...aggregate.retention }),
  };
}

function buildOwnerRecommendations(input: {
  projectId: string;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  execution: ProjectCommunityV5ExecutionSummary;
}): CommunityOwnerRecommendation[] {
  const recommendations: CommunityOwnerRecommendation[] = [];
  const onboarding = input.journeyOutcomes.onboarding;
  const comeback = input.journeyOutcomes.comeback;

  if (input.captainWorkspace.blockedCount > 0 || input.captainWorkspace.escalatedCount > 0) {
    recommendations.push({
      key: "clear-captain-blockers",
      title: "Clear captain blockers",
      summary: "Blocked or escalated captain work should be resolved before the queue backs up.",
      priority: "high",
      actionLabel: "Review blocked queue",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (input.execution.recentFailureCount > 0) {
    recommendations.push({
      key: "review-execution-health",
      title: "Review execution health",
      summary: "Recent sampled automation, playbook, or captain failures are worth a direct owner check-in.",
      priority: "high",
      actionLabel: "Review failed runs",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (onboarding && onboarding.startedCount > 0 && onboarding.completionRate < 60) {
    recommendations.push({
      key: "tighten-onboarding",
      title: "Tighten onboarding rail",
      summary: "Onboarding is moving, but the current conversion rate is still under target.",
      priority: "medium",
      actionLabel: "Open onboarding rail",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (comeback && comeback.startedCount > 0 && comeback.completionRate < 50) {
    recommendations.push({
      key: "activate-comeback",
      title: "Activate comeback rail",
      summary: "Dormant members need a sharper re-entry path before retention slips further.",
      priority: "medium",
      actionLabel: "Open comeback rail",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (input.captainWorkspace.activeAssignments === 0 && input.captainWorkspace.queueItemCount > 0) {
    recommendations.push({
      key: "assign-captain-coverage",
      title: "Assign captain coverage",
      summary: "This project has active work queued, but no live captain assignment to own it.",
      priority: "high",
      actionLabel: "Assign a captain",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      key: "maintain-current-rails",
      title: "Maintain current rails",
      summary: "The community machine looks stable. Keep captains and automations on the current cadence.",
      priority: "low",
      actionLabel: "Review summary",
      route: `/projects/${input.projectId}/community`,
    });
  }

  return recommendations.slice(0, 4);
}

function buildHealthSignals(input: {
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  execution: ProjectCommunityV5ExecutionSummary;
}): CommunityHealthSignal[] {
  const onboarding = input.journeyOutcomes.onboarding;
  const comeback = input.journeyOutcomes.comeback;
  const weightedCompletion = [onboarding, comeback].reduce(
    (accumulator, journey) => {
      if (!journey || journey.startedCount <= 0) {
        return accumulator;
      }

      accumulator.started += journey.startedCount;
      accumulator.completed += journey.completedCount;
      return accumulator;
    },
    { started: 0, completed: 0 }
  );
  const journeyCompletionRate = roundPercentage(weightedCompletion.completed, weightedCompletion.started);

  return [
    {
      key: "queue_pressure",
      label: "Queue pressure",
      value: `${input.captainWorkspace.blockedCount} blocked`,
      tone:
        input.captainWorkspace.blockedCount > 0 || input.captainWorkspace.escalatedCount > 0
          ? "warning"
          : "success",
      summary: "Captain queue pressure stays visible and project-scoped.",
    },
    {
      key: "execution_health",
      label: "Execution health",
      value: `${input.execution.recentFailureCount} recent failures`,
      tone: input.execution.recentFailureCount > 0 ? "warning" : "success",
      summary: "Recent sampled automation, playbook, and captain activity stays folded into the owner view.",
    },
    {
      key: "journey_conversion",
      label: "Journey conversion",
      value: `${journeyCompletionRate}%`,
      tone:
        journeyCompletionRate >= 70 ? "success" : journeyCompletionRate >= 50 ? "warning" : "danger",
      summary: "Weighted onboarding and comeback conversion is computed from started members only.",
    },
    {
      key: "captain_coverage",
      label: "Captain coverage",
      value: `${input.captainWorkspace.activeAssignments} active`,
      tone: input.captainWorkspace.activeAssignments > 0 ? "success" : "warning",
      summary: "Captain seats are counted only at the project scope.",
    },
  ];
}

async function loadOptionalRows<T>(
  request: PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>,
  fallbackMessage: string
) {
  return loadRowsOrEmpty<T>(request, fallbackMessage);
}

export async function loadProjectCommunityV5(projectId: string): Promise<ProjectCommunityV5Payload> {
  const access = await assertProjectCommunityAccess(projectId);
  const supabase = getServiceSupabaseClient();
  const queueDueSoonWindowIso = new Date().toISOString();
  const dueSoonLowerBoundIso = queueDueSoonWindowIso;
  const dueSoonWindowIso = new Date(Date.now() + DUE_SOON_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const recentJourneyEventWindowIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    activeAssignments,
    queueItemCount,
    blockedCount,
    escalatedCount,
    dueSoonCount,
    captainQueueRows,
    snapshotRows,
    journeyRows,
    eventRows,
    execution,
  ] = await Promise.all([
    loadCountOrZero(
      supabase
        .from("community_captain_assignments")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .eq("status", "active")
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_STATUSES)
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .eq("status", "blocked")
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .eq("status", "escalated")
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_STATUSES)
        .gte("due_at", dueSoonLowerBoundIso)
        .lte("due_at", dueSoonWindowIso)
    ),
    loadOptionalRows<ProjectCommunityCaptainQueueRow>(
      supabase
        .from("community_captain_action_queue")
        .select("project_id, id, title, summary, status, priority, due_at, blocked_reason, source_type, source, action_label, updated_at")
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_STATUSES)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(48),
      "Failed to load captain queue rows."
    ),
    loadOptionalRows<ProjectCommunityJourneySnapshotRow>(
      supabase
        .from("community_member_status_snapshots")
        .select("project_id, auth_user_id, journey_key, status, stage, updated_at")
        .eq("project_id", access.projectId)
        .in("journey_key", ["onboarding", "comeback", "activation", "retention"]),
      "Failed to load community journey snapshots."
    ),
    loadOptionalRows<ProjectCommunityJourneyRow>(
      supabase
        .from("community_member_journeys")
        .select("project_id, auth_user_id, journey_key, status, stage, completed_at, created_at, updated_at")
        .eq("project_id", access.projectId)
        .in("journey_key", ["onboarding", "comeback", "activation", "retention"]),
      "Failed to load community journeys."
    ),
    loadOptionalRows<ProjectCommunityJourneyEventRow>(
      supabase
        .from("community_member_journey_events")
        .select("project_id, auth_user_id, journey_key, event_type, created_at, updated_at")
        .eq("project_id", access.projectId)
        .in("journey_key", ["onboarding", "comeback", "activation", "retention"])
        .in("event_type", ["completed", "step_completed", "milestone_unlocked", "returned"])
        .gte("created_at", recentJourneyEventWindowIso)
        .order("created_at", { ascending: false }),
      "Failed to load community journey events."
    ),
    loadProjectCommunityExecutionReadOnly(access.projectId),
  ]);

  const captainWorkspaceItems = buildCaptainQueueItems(captainQueueRows);
  const captainWorkspace: ProjectCommunityCaptainWorkspaceSummary = {
    activeAssignments,
    queueItemCount,
    blockedCount,
    dueSoonCount,
    escalatedCount,
    items: captainWorkspaceItems.slice(0, 12),
  };

  const executionSummary = summarizeExecutionHistory(execution);
  const journeyOutcomes = buildJourneyOutcomes({
    journeyRows,
    snapshotRows,
    eventRows,
  });
  const ownerRecommendations = buildOwnerRecommendations({
    projectId: access.projectId,
    captainWorkspace,
    journeyOutcomes,
    execution: executionSummary,
  });
  const healthSignals = buildHealthSignals({
    captainWorkspace,
    journeyOutcomes,
    execution: executionSummary,
  });

  return {
    projectId: access.projectId,
    execution: executionSummary,
    captainWorkspace,
    journeyOutcomes,
    ownerRecommendations,
    healthSignals,
  };
}
