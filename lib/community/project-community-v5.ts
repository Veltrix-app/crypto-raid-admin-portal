import {
  COMMUNITY_CAPTAIN_PERMISSION_LABELS,
  type CommunityAutomationExecutionPosture,
  type CommunityAutomationType,
  type CommunityCaptainActionRecord,
  type CommunityCaptainCoverageSignal,
  type CommunityCaptainDueState,
  type CommunityCaptainPermission,
  type CommunityCaptainQueueItem,
  type CommunityCaptainQueueItemPriority,
  type CommunityCaptainResolutionState,
  type CommunityCaptainQueueItemStatus,
  type CommunityCohortSnapshot,
  type CommunityHealthSignal,
  type CommunityHealthRollup,
  type CommunityJourneyOutcome,
  type CommunityJourneyOutcomeKey,
  type CommunityJourneyOutcomeRecord,
  type CommunityOwnerRecommendation,
  type CommunityPlaybookKey,
} from "@/components/community/community-config";
import {
  ProjectCommunityAccessError,
  assertProjectCommunityAccess,
} from "@/lib/community/project-community-auth";
import {
  loadProjectCommunityExecution,
  runProjectCommunityAutomation,
  runProjectCommunityPlaybook,
} from "@/lib/community/project-community-execution";
import {
  getServiceSupabaseClient,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

type RawRecord = Record<string, unknown>;
type ProjectCommunityAccess = Awaited<ReturnType<typeof assertProjectCommunityAccess>>;

type ProjectCommunityCaptainAssignmentRow = RawRecord & {
  id?: string | null;
  auth_user_id?: string | null;
  authUserId?: string | null;
  role_type?: string | null;
  roleType?: string | null;
  permission_scope?: string | null;
  permissionScope?: string | null;
  status?: string | null;
  metadata?: RawRecord | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityCaptainQueueRow = RawRecord & {
  id?: string | null;
  auth_user_id?: string | null;
  authUserId?: string | null;
  captain_assignment_id?: string | null;
  captainAssignmentId?: string | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  escalation_state?: string | null;
  escalationState?: string | null;
  due_at?: string | null;
  priority?: string | null;
  seat_key?: string | null;
  due_state?: string | null;
  resolution_state?: string | null;
  action_type?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  blocked_reason_code?: string | null;
  blocked_reason_summary?: string | null;
  last_actor_auth_user_id?: string | null;
  resolved_at?: string | null;
  source_type?: string | null;
  source?: string | null;
  metadata?: RawRecord | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityCohortSnapshotRow = RawRecord & {
  cohort_key?: string | null;
  member_count?: number | null;
  ready_count?: number | null;
  blocked_count?: number | null;
  active_count?: number | null;
  average_trust?: number | null;
  computed_at?: string | null;
  updated_at?: string | null;
};

type ProjectCommunityHealthRollupRow = RawRecord & {
  signal_key?: string | null;
  signal_value?: string | null;
  signal_tone?: string | null;
  summary?: string | null;
  window_key?: string | null;
  computed_at?: string | null;
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
  execution_posture?: string | null;
};

export type ProjectCommunityV5ExecutionSummary = {
  automations: number;
  activeAutomationCount: number;
  readyAutomationCount: number;
  blockedAutomationCount: number;
  degradedAutomationCount: number;
  recentAutomationRuns: number;
  recentPlaybookRuns: number;
  recentCaptainActions: number;
  recentFailureCount: number;
  recentSuccessCount: number;
  automationSuccessRate: number;
};

export type ProjectCommunityCaptainWorkspaceSummary = {
  activeAssignments: number;
  queueItemCount: number;
  blockedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  overdueCount: number;
  highPriorityCount: number;
  unassignedCount: number;
  items: CommunityCaptainQueueItem[];
};

export type ProjectCommunityCaptainWorkspaceViewer = {
  authUserId: string;
  role: "owner" | "captain" | "observer";
  isOwner: boolean;
  isCaptain: boolean;
  activeAssignmentCount: number;
  permissions: CommunityCaptainPermission[];
};

export type ProjectCommunityV5Payload = {
  projectId: string;
  execution: ProjectCommunityV5ExecutionSummary;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  ownerRecommendations: CommunityOwnerRecommendation[];
  healthSignals: CommunityHealthSignal[];
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  captainCoverage: CommunityCaptainCoverageSignal;
};

export type ProjectCommunityCaptainWorkspacePayload = {
  projectId: string;
  viewer: ProjectCommunityCaptainWorkspaceViewer;
  summary: ProjectCommunityCaptainWorkspaceSummary;
  queue: CommunityCaptainQueueItem[];
  priorities: CommunityCaptainQueueItem[];
  blockedItems: CommunityCaptainQueueItem[];
  recentResults: CommunityCaptainActionRecord[];
};

export type ProjectCommunityRecommendationsPayload = {
  projectId: string;
  recommendations: CommunityOwnerRecommendation[];
  healthSignals: CommunityHealthSignal[];
  execution: ProjectCommunityV5ExecutionSummary;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  captainCoverage: CommunityCaptainCoverageSignal;
};

export type ProjectCommunityOutcomesPayload = {
  projectId: string;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  healthSignals: CommunityHealthSignal[];
  execution: ProjectCommunityV5ExecutionSummary;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  recentResults: CommunityCaptainActionRecord[];
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  captainCoverage: CommunityCaptainCoverageSignal;
};

export type ProjectCommunityCaptainActionRunPayload = {
  projectId: string;
  actionId: string;
};

export type ProjectCommunityCaptainActionRunResult = {
  projectId: string;
  queueItemId: string;
  actionRecordId: string;
  status: "success" | "failed" | "skipped";
  summary: string;
  actionType: string;
  targetType: string;
  targetId: string;
  runtimeResult: Record<string, unknown> | null;
};

const JOURNEY_LABELS: Record<CommunityJourneyOutcome["key"], string> = {
  onboarding: "Onboarding",
  comeback: "Comeback",
  activation: "Activation",
  retention: "Retention",
};

const ACTIONABLE_QUEUE_STATUSES = ["queued", "in_progress", "blocked", "escalated"] as const;
const ACTIONABLE_QUEUE_DB_STATUSES = ["queued", "in_progress", "blocked"] as const;
const AUTOMATION_TYPES = [
  "rank_sync",
  "leaderboard_pulse",
  "mission_digest",
  "raid_reminder",
  "newcomer_pulse",
  "reactivation_pulse",
  "activation_board",
] as const;
const AUTOMATION_PERMISSION_MAP: Record<CommunityAutomationType, CommunityCaptainPermission> = {
  rank_sync: "rank_sync",
  leaderboard_pulse: "leaderboard_post",
  mission_digest: "mission_digest",
  raid_reminder: "raid_alert",
  newcomer_pulse: "newcomer_wave",
  reactivation_pulse: "reactivation_wave",
  activation_board: "activation_board",
};
const PLAYBOOK_PERMISSION_MAP: Record<CommunityPlaybookKey, CommunityCaptainPermission> = {
  launch_week: "activation_board",
  raid_week: "raid_alert",
  comeback_week: "reactivation_wave",
  campaign_push: "activation_board",
};
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
    automationRows,
    automationRuns,
    playbookRuns,
    captainActions,
  ] = await Promise.all([
    loadOptionalRows<ProjectCommunityExecutionSampleRow>(
      supabase
        .from("community_automations")
        .select("status, execution_posture")
        .eq("project_id", projectId),
      "Failed to load community automations."
    ),
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
    automations: automationRows.length > 0 ? automationRows.length : AUTOMATION_TYPES.length,
    automationRows,
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

function toMetadataRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : {};
}

function isCommunityCaptainPermission(value: unknown): value is CommunityCaptainPermission {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COMMUNITY_CAPTAIN_PERMISSION_LABELS, value)
  );
}

function isCommunityAutomationType(value: unknown): value is CommunityAutomationType {
  return typeof value === "string" && (AUTOMATION_TYPES as readonly string[]).includes(value);
}

function isCommunityPlaybookKey(value: unknown): value is CommunityPlaybookKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PLAYBOOK_PERMISSION_MAP, value)
  );
}

function normalizeQueueStatus(
  value: unknown,
  escalationState?: unknown
): CommunityCaptainQueueItemStatus {
  if (toText(escalationState) === "escalated") {
    return "escalated";
  }

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

function normalizeExecutionPosture(value: unknown): CommunityAutomationExecutionPosture {
  const posture = toText(value);
  if (posture === "ready" || posture === "running" || posture === "blocked" || posture === "degraded") {
    return posture;
  }
  return "watching";
}

function normalizeDueState(value: unknown, dueAt: string, resolutionState: CommunityCaptainResolutionState) {
  const dueState = toText(value);
  if (dueState === "due_now" || dueState === "overdue" || dueState === "resolved") {
    return dueState as CommunityCaptainDueState;
  }
  if (resolutionState === "resolved") {
    return "resolved";
  }
  if (!dueAt) {
    return "upcoming";
  }

  const dueTimestamp = timestampValue(dueAt);
  if (!dueTimestamp) {
    return "upcoming";
  }

  const now = Date.now();
  if (dueTimestamp < now) {
    return "overdue";
  }
  if (dueTimestamp - now <= 24 * 60 * 60 * 1000) {
    return "due_now";
  }
  return "upcoming";
}

function normalizeResolutionState(value: unknown, status: CommunityCaptainQueueItemStatus) {
  const resolutionState = toText(value);
  if (resolutionState === "waiting" || resolutionState === "resolved" || resolutionState === "canceled") {
    return resolutionState as CommunityCaptainResolutionState;
  }
  return status === "completed" ? "resolved" : "open";
}

function normalizeQueueSource(value: unknown) {
  const source = toText(value);
  if (source === "owner_assigned") {
    return "owner" as const;
  }
  if (source === "automation_generated") {
    return "automation" as const;
  }
  if (source === "playbook_generated") {
    return "playbook" as const;
  }
  if (source === "journey_generated") {
    return "journey" as const;
  }
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

function readQueueMetadata(row: ProjectCommunityCaptainQueueRow) {
  return toMetadataRecord(row.metadata);
}

function readQueueSource(row: ProjectCommunityCaptainQueueRow) {
  const metadata = readQueueMetadata(row);
  return normalizeQueueSource(metadata.source ?? row.source_type ?? row.source);
}

function readQueuePriority(row: ProjectCommunityCaptainQueueRow) {
  const metadata = readQueueMetadata(row);
  return normalizeQueuePriority(metadata.priority ?? row.priority);
}

function readQueueActionLabel(row: ProjectCommunityCaptainQueueRow) {
  const metadata = readQueueMetadata(row);
  return toText(metadata.actionLabel ?? metadata.action_label);
}

function readQueueBlockedReason(row: ProjectCommunityCaptainQueueRow) {
  const metadata = readQueueMetadata(row);
  return (
    metadata.blockedReason ??
    metadata.blocked_reason ??
    row.blocked_reason_summary ??
    row.blocked_reason_code ??
    ""
  );
}

function inferQueuePermission(row: ProjectCommunityCaptainQueueRow): CommunityCaptainPermission | null {
  const metadata = readQueueMetadata(row);
  const directPermission = metadata.requiredPermission ?? metadata.permission;
  if (isCommunityCaptainPermission(directPermission)) {
    return directPermission;
  }

  const automationType = metadata.automationType ?? metadata.automation_type;
  if (isCommunityAutomationType(automationType)) {
    return AUTOMATION_PERMISSION_MAP[automationType];
  }

  const playbookKey = metadata.playbookKey ?? metadata.playbook_key;
  if (isCommunityPlaybookKey(playbookKey)) {
    return PLAYBOOK_PERMISSION_MAP[playbookKey];
  }

  const source = readQueueSource(row);
  if (source === "journey") {
    return "newcomer_wave";
  }

  return null;
}

function isOwnerLikeAccess(access: ProjectCommunityAccess) {
  return access.isSuperAdmin || access.membershipRole === "owner" || access.membershipRole === "admin";
}

function buildCaptainWorkspaceViewer(input: {
  access: ProjectCommunityAccess;
  activeAssignments: ProjectCommunityCaptainAssignmentRow[];
  permissions: CommunityCaptainPermission[];
}): ProjectCommunityCaptainWorkspaceViewer {
  const isOwner = isOwnerLikeAccess(input.access);
  const isCaptain = input.activeAssignments.length > 0;
  return {
    authUserId: input.access.authUserId,
    role: isOwner ? "owner" : isCaptain ? "captain" : "observer",
    isOwner,
    isCaptain,
    activeAssignmentCount: input.activeAssignments.length,
    permissions: input.permissions,
  };
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
      const source = readQueueSource(row);
      const status = normalizeQueueStatus(row.status, row.escalation_state ?? row.escalationState);
      const priority = readQueuePriority(row);
      const resolutionState = normalizeResolutionState(row.resolution_state, status);
      const dueAt = toIsoTimestamp(row.due_at);
      const dueState = normalizeDueState(row.due_state, dueAt, resolutionState);
      const fallbackId = [
        "queue",
        source,
        priority,
        toText(row.title, "action").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ]
        .filter(Boolean)
        .join("-");

      return {
        id: toText(row.id) || fallbackId,
        title: toText(row.title, "Captain action"),
        summary: toText(row.summary, "Keep this project rail moving."),
        status,
        priority,
        dueAt,
        blockedReason: sanitizeBlockedReason({
          rawReason: readQueueBlockedReason(row),
          status,
          source,
        }),
        source,
        actionLabel: toText(readQueueActionLabel(row), getQueueActionLabel(source)),
        dueState,
        resolutionState,
        seatKey: toText(row.seat_key),
        actionType: toText(row.action_type),
        targetType: toText(row.target_type),
        targetId: toText(row.target_id),
        lastActorAuthUserId: toText(row.last_actor_auth_user_id),
        resolvedAt: toIsoTimestamp(row.resolved_at),
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
  automationRows: ProjectCommunityExecutionSampleRow[];
  automationRuns: ProjectCommunityExecutionSampleRow[];
  playbookRuns: ProjectCommunityExecutionSampleRow[];
  captainActions: ProjectCommunityExecutionSampleRow[];
}): ProjectCommunityV5ExecutionSummary {
  const activeAutomationCount = execution.automationRows.filter((row) => row.status === "active").length;
  const readyAutomationCount = execution.automationRows.filter(
    (row) => normalizeExecutionPosture(row.execution_posture) === "ready"
  ).length;
  const blockedAutomationCount = execution.automationRows.filter(
    (row) => normalizeExecutionPosture(row.execution_posture) === "blocked"
  ).length;
  const degradedAutomationCount = execution.automationRows.filter(
    (row) => normalizeExecutionPosture(row.execution_posture) === "degraded"
  ).length;
  const failedAutomationRuns = execution.automationRuns.filter((run) => run.status === "failed").length;
  const failedPlaybookRuns = execution.playbookRuns.filter((run) => run.status === "failed").length;
  const failedCaptainActions = execution.captainActions.filter((action) => action.status === "failed").length;
  const successAutomationRuns = execution.automationRuns.filter((run) => run.status === "success").length;
  const successPlaybookRuns = execution.playbookRuns.filter((run) => run.status === "success").length;
  const successCaptainActions = execution.captainActions.filter((action) => action.status === "success").length;
  const runSampleCount =
    execution.automationRuns.length + execution.playbookRuns.length + execution.captainActions.length;
  const successSampleCount = successAutomationRuns + successPlaybookRuns + successCaptainActions;

  return {
    automations: execution.automations,
    activeAutomationCount,
    readyAutomationCount,
    blockedAutomationCount,
    degradedAutomationCount,
    recentAutomationRuns: execution.automationRuns.length,
    recentPlaybookRuns: execution.playbookRuns.length,
    recentCaptainActions: execution.captainActions.length,
    recentFailureCount: failedAutomationRuns + failedPlaybookRuns + failedCaptainActions,
    recentSuccessCount: successAutomationRuns + successPlaybookRuns + successCaptainActions,
    automationSuccessRate: roundPercentage(successSampleCount, runSampleCount),
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

function mapCohortSnapshotRow(row: ProjectCommunityCohortSnapshotRow): CommunityCohortSnapshot | null {
  const key = toText(row.cohort_key);
  if (
    key !== "newcomer" &&
    key !== "active" &&
    key !== "reactivation" &&
    key !== "high_trust" &&
    key !== "watchlist"
  ) {
    return null;
  }

  return {
    key,
    label:
      key === "newcomer"
        ? "Newcomers"
        : key === "active"
          ? "Active contributors"
          : key === "reactivation"
            ? "Reactivation"
            : key === "high_trust"
              ? "High trust"
              : "Watchlist",
    memberCount: Number(row.member_count ?? 0),
    readyCount: Number(row.ready_count ?? 0),
    blockedCount: Number(row.blocked_count ?? 0),
    activeCount: Number(row.active_count ?? 0),
    averageTrust: Number(row.average_trust ?? 0),
    updatedAt: toIsoTimestamp(row.computed_at ?? row.updated_at),
  };
}

function mapHealthRollupRow(row: ProjectCommunityHealthRollupRow): CommunityHealthRollup | null {
  const key = toText(row.signal_key);
  if (!key) {
    return null;
  }

  const tone =
    row.signal_tone === "success" ||
    row.signal_tone === "warning" ||
    row.signal_tone === "danger"
      ? row.signal_tone
      : "default";

  return {
    key,
    label: key.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    value: toText(row.signal_value),
    tone,
    summary: toText(row.summary),
    windowKey: toText(row.window_key, "current"),
    updatedAt: toIsoTimestamp(row.computed_at ?? row.updated_at),
  };
}

function buildCaptainCoverage(input: {
  activeAssignments: number;
  queueItems: CommunityCaptainQueueItem[];
  unassignedCount: number;
}): CommunityCaptainCoverageSignal {
  const inferredSeatCount =
    input.activeAssignments > 0
      ? input.activeAssignments + input.unassignedCount
      : input.queueItems.length > 0
        ? Math.max(1, input.unassignedCount)
        : 0;

  return {
    totalSeats: inferredSeatCount,
    activeCaptains: input.activeAssignments,
    unassignedSeats: input.unassignedCount,
    coverageRate: roundPercentage(input.activeAssignments, inferredSeatCount),
    updatedAt: new Date().toISOString(),
  };
}

function buildOwnerRecommendations(input: {
  projectId: string;
  captainWorkspace: ProjectCommunityCaptainWorkspaceSummary;
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  execution: ProjectCommunityV5ExecutionSummary;
  captainCoverage: CommunityCaptainCoverageSignal;
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
}): CommunityOwnerRecommendation[] {
  const recommendations: CommunityOwnerRecommendation[] = [];
  const onboarding = input.journeyOutcomes.onboarding;
  const comeback = input.journeyOutcomes.comeback;
  const watchlistCohort = input.cohortSnapshots.find((cohort) => cohort.key === "watchlist");
  const highTrustCohort = input.cohortSnapshots.find((cohort) => cohort.key === "high_trust");

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

  if (input.execution.blockedAutomationCount > 0 || input.execution.degradedAutomationCount > 0) {
    recommendations.push({
      key: "stabilize-automation-posture",
      title: "Stabilize automation posture",
      summary: "One or more project automations are blocked or degraded and need owner attention before cadence slips.",
      priority: "high",
      actionLabel: "Open automation center",
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

  if (input.captainCoverage.activeCaptains === 0 && input.captainWorkspace.queueItemCount > 0) {
    recommendations.push({
      key: "assign-captain-coverage",
      title: "Assign captain coverage",
      summary: "This project has active work queued, but no live captain assignment to own it.",
      priority: "high",
      actionLabel: "Assign a captain",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (input.captainWorkspace.overdueCount > 0) {
    recommendations.push({
      key: "clear-overdue-actions",
      title: "Clear overdue captain actions",
      summary: "There are overdue community actions that should either be resolved, reassigned or explicitly escalated.",
      priority: "high",
      actionLabel: "Open captain workspace",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (watchlistCohort && watchlistCohort.memberCount > 0 && !highTrustCohort?.memberCount) {
    recommendations.push({
      key: "rebalance-community-quality",
      title: "Rebalance community quality",
      summary: "Watchlist pressure is visible while trusted depth is thin. Tighten who gets pushed into live rails.",
      priority: "medium",
      actionLabel: "Review cohorts",
      route: `/projects/${input.projectId}/community`,
    });
  }

  if (input.healthRollups.some((signal) => signal.tone === "danger")) {
    recommendations.push({
      key: "review-health-rollups",
      title: "Review community health rollups",
      summary: "Recent community health rollups show danger-level posture that should be reviewed before the next push cycle.",
      priority: "medium",
      actionLabel: "Open community health",
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
  captainCoverage: CommunityCaptainCoverageSignal;
  healthRollups: CommunityHealthRollup[];
}): CommunityHealthSignal[] {
  if (input.healthRollups.length > 0) {
    return input.healthRollups.slice(0, 4).map((signal) => ({
      key: signal.key,
      label: signal.label,
      value: signal.value,
      tone: signal.tone,
      summary: signal.summary,
    }));
  }

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
      value: `${input.execution.automationSuccessRate}%`,
      tone:
        input.execution.blockedAutomationCount > 0 || input.execution.degradedAutomationCount > 0
          ? "warning"
          : input.execution.automationSuccessRate >= 75
            ? "success"
            : "danger",
      summary: "Automation and execution health reflects sampled success plus blocked or degraded posture.",
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
      value: `${input.captainCoverage.coverageRate}%`,
      tone: input.captainCoverage.activeCaptains > 0 ? "success" : "warning",
      summary: "Captain coverage is derived from active seats versus unassigned project queue pressure.",
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
    overdueCount,
    highPriorityCount,
    unassignedCount,
    captainQueueRows,
    cohortRows,
    healthRollupRows,
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
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
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
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .eq("escalation_state", "escalated")
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .gte("due_at", dueSoonLowerBoundIso)
        .lte("due_at", dueSoonWindowIso)
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .lt("due_at", queueDueSoonWindowIso)
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .in("priority", ["high", "urgent"])
    ),
    loadCountOrZero(
      supabase
        .from("community_captain_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .is("auth_user_id", null)
    ),
    loadOptionalRows<ProjectCommunityCaptainQueueRow>(
      supabase
        .from("community_captain_action_queue")
        .select("project_id, id, auth_user_id, captain_assignment_id, title, summary, status, escalation_state, due_at, priority, seat_key, due_state, resolution_state, action_type, target_type, target_id, blocked_reason_code, blocked_reason_summary, last_actor_auth_user_id, resolved_at, source_type, metadata, updated_at")
        .eq("project_id", access.projectId)
        .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(48),
      "Failed to load captain queue rows."
    ),
    loadOptionalRows<ProjectCommunityCohortSnapshotRow>(
      supabase
        .from("community_cohort_snapshots")
        .select("cohort_key, member_count, ready_count, blocked_count, active_count, average_trust, computed_at, updated_at")
        .eq("project_id", access.projectId)
        .order("cohort_key", { ascending: true }),
      "Failed to load community cohort snapshots."
    ),
    loadOptionalRows<ProjectCommunityHealthRollupRow>(
      supabase
        .from("community_health_rollups")
        .select("signal_key, signal_value, signal_tone, summary, window_key, computed_at, updated_at")
        .eq("project_id", access.projectId)
        .eq("window_key", "current")
        .order("computed_at", { ascending: false }),
      "Failed to load community health rollups."
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
    overdueCount,
    highPriorityCount,
    unassignedCount,
    items: captainWorkspaceItems.slice(0, 12),
  };

  const executionSummary = summarizeExecutionHistory(execution);
  const cohortSnapshots = cohortRows
    .map((row) => mapCohortSnapshotRow(row))
    .filter((row): row is CommunityCohortSnapshot => Boolean(row));
  const healthRollups = healthRollupRows
    .map((row) => mapHealthRollupRow(row))
    .filter((row): row is CommunityHealthRollup => Boolean(row));
  const captainCoverage = buildCaptainCoverage({
    activeAssignments,
    queueItems: captainWorkspaceItems,
    unassignedCount,
  });
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
    captainCoverage,
    cohortSnapshots,
    healthRollups,
  });
  const healthSignals = buildHealthSignals({
    captainWorkspace,
    journeyOutcomes,
    execution: executionSummary,
    captainCoverage,
    healthRollups,
  });

  return {
    projectId: access.projectId,
    execution: executionSummary,
    captainWorkspace,
    journeyOutcomes,
    ownerRecommendations,
    healthSignals,
    cohortSnapshots,
    healthRollups,
    captainCoverage,
  };
}

async function loadViewerCaptainAssignments(projectId: string, authUserId: string) {
  const supabase = getServiceSupabaseClient();
  return loadOptionalRows<ProjectCommunityCaptainAssignmentRow>(
    supabase
      .from("community_captain_assignments")
      .select("id, auth_user_id, role_type, permission_scope, status, metadata, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("auth_user_id", authUserId)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    "Failed to load captain assignments."
  );
}

async function loadProjectCaptainQueueRows(projectId: string) {
  const supabase = getServiceSupabaseClient();
  return loadOptionalRows<ProjectCommunityCaptainQueueRow>(
    supabase
      .from("community_captain_action_queue")
      .select("id, project_id, auth_user_id, captain_assignment_id, title, summary, status, escalation_state, due_at, priority, seat_key, due_state, resolution_state, action_type, target_type, target_id, blocked_reason_code, blocked_reason_summary, last_actor_auth_user_id, resolved_at, source_type, metadata, created_at, updated_at")
      .eq("project_id", projectId)
      .in("status", ACTIONABLE_QUEUE_DB_STATUSES)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(48),
    "Failed to load captain queue rows."
  );
}

function canViewerAccessQueueRow(input: {
  row: ProjectCommunityCaptainQueueRow;
  viewer: ProjectCommunityCaptainWorkspaceViewer;
}) {
  if (input.viewer.isOwner) {
    return true;
  }

  const assignedAuthUserId = toText(input.row.auth_user_id ?? input.row.authUserId);
  if (assignedAuthUserId && assignedAuthUserId !== input.viewer.authUserId) {
    return false;
  }

  const requiredPermission = inferQueuePermission(input.row);
  return !requiredPermission || input.viewer.permissions.includes(requiredPermission);
}

function selectCaptainRecentResults(input: {
  results: CommunityCaptainActionRecord[];
  viewer: ProjectCommunityCaptainWorkspaceViewer;
}) {
  const scopedResults = input.viewer.isOwner
    ? input.results
    : input.results.filter((result) => result.authUserId === input.viewer.authUserId);

  return scopedResults.slice(0, 8);
}

function buildCaptainWorkspacePayload(input: {
  access: ProjectCommunityAccess;
  summary: ProjectCommunityCaptainWorkspaceSummary;
  queueRows: ProjectCommunityCaptainQueueRow[];
  captainPermissions: Record<string, CommunityCaptainPermission[]>;
  captainAssignments: ProjectCommunityCaptainAssignmentRow[];
  recentResults: CommunityCaptainActionRecord[];
}): ProjectCommunityCaptainWorkspacePayload {
  const viewerPermissions = input.captainPermissions[input.access.authUserId] ?? [];
  const viewer = buildCaptainWorkspaceViewer({
    access: input.access,
    activeAssignments: input.captainAssignments,
    permissions: viewerPermissions,
  });

  const scopedQueue = buildCaptainQueueItems(
    input.queueRows.filter((row) => canViewerAccessQueueRow({ row, viewer }))
  ).slice(0, 12);
  const priorities = scopedQueue
    .filter((item) => item.status === "queued" || item.status === "in_progress")
    .slice(0, 5);
  const blockedItems = scopedQueue
    .filter((item) => item.status === "blocked" || item.status === "escalated")
    .slice(0, 6);

  return {
    projectId: input.access.projectId,
    viewer,
    summary: input.summary,
    queue: scopedQueue,
    priorities,
    blockedItems,
    recentResults: selectCaptainRecentResults({
      results: input.recentResults,
      viewer,
    }),
  };
}

function resolveCaptainQueueExecutionTarget(row: ProjectCommunityCaptainQueueRow) {
  const metadata = readQueueMetadata(row);
  const automationId = toText(metadata.automationId ?? metadata.automation_id ?? row.target_id);
  const automationTypeRaw = metadata.automationType ?? metadata.automation_type;
  const automationType = isCommunityAutomationType(automationTypeRaw) ? automationTypeRaw : null;
  const playbookKeyRaw = metadata.playbookKey ?? metadata.playbook_key;
  const playbookKey = isCommunityPlaybookKey(playbookKeyRaw) ? playbookKeyRaw : null;
  const requiredPermission = inferQueuePermission(row);
  const fallbackActionType =
    playbookKey ? `playbook:${playbookKey}` : automationType ? `automation:${automationType}` : "captain_action";
  const fallbackTargetType = playbookKey ? "playbook" : automationId || automationType ? "automation" : "queue_item";
  const fallbackTargetId = playbookKey ?? automationId ?? automationType ?? toText(row.id);

  return {
    automationId,
    automationType,
    playbookKey,
    requiredPermission,
    actionType: toText(metadata.actionType ?? metadata.action_type ?? row.action_type, fallbackActionType),
    targetType: toText(metadata.targetType ?? metadata.target_type ?? row.target_type, fallbackTargetType),
    targetId: toText(metadata.targetId ?? metadata.target_id ?? row.target_id, fallbackTargetId),
  };
}

async function insertCaptainActionRecord(input: {
  projectId: string;
  authUserId: string;
  captainRole: string;
  actionType: string;
  targetType: string;
  targetId: string;
  status: "success" | "failed" | "skipped";
  summary: string;
  queueItemId: string;
  actorScope: "owner" | "captain" | "system";
  dueState: CommunityCaptainDueState;
  resolutionState: CommunityCaptainResolutionState;
  blockedReasonCode: string;
  blockedReasonSummary: string;
  resolvedAt: string | null;
  metadata: RawRecord;
}) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("community_captain_actions")
    .insert({
      project_id: input.projectId,
      auth_user_id: input.authUserId,
      captain_role: input.captainRole,
      action_type: input.actionType,
      target_type: input.targetType,
      target_id: input.targetId,
      status: input.status,
      summary: input.summary,
      queue_item_id: input.queueItemId,
      actor_scope: input.actorScope,
      due_state: input.dueState,
      resolution_state: input.resolutionState,
      blocked_reason_code: input.blockedReasonCode || null,
      blocked_reason_summary: input.blockedReasonSummary || null,
      resolved_at: input.resolvedAt,
      metadata: input.metadata,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to write captain action record.");
  }

  return toText(data?.id);
}

export async function loadProjectCommunityCaptainWorkspace(
  projectId: string
): Promise<ProjectCommunityCaptainWorkspacePayload> {
  const access = await assertProjectCommunityAccess(projectId);
  const [payload, execution, captainAssignments, queueRows] = await Promise.all([
    loadProjectCommunityV5(access.projectId),
    loadProjectCommunityExecution(access.projectId),
    loadViewerCaptainAssignments(access.projectId, access.authUserId),
    loadProjectCaptainQueueRows(access.projectId),
  ]);

  return buildCaptainWorkspacePayload({
    access,
    summary: payload.captainWorkspace,
    queueRows,
    captainPermissions: execution.captainPermissions,
    captainAssignments,
    recentResults: execution.captainActions,
  });
}

export async function loadProjectCommunityRecommendations(
  projectId: string
): Promise<ProjectCommunityRecommendationsPayload> {
  const payload = await loadProjectCommunityV5(projectId);
  return {
    projectId: payload.projectId,
    recommendations: payload.ownerRecommendations,
    healthSignals: payload.healthSignals,
    execution: payload.execution,
    captainWorkspace: payload.captainWorkspace,
    captainCoverage: payload.captainCoverage,
  };
}

export async function loadProjectCommunityOutcomes(
  projectId: string
): Promise<ProjectCommunityOutcomesPayload> {
  const [payload, execution] = await Promise.all([
    loadProjectCommunityV5(projectId),
    loadProjectCommunityExecution(projectId),
  ]);

  return {
    projectId: payload.projectId,
    journeyOutcomes: payload.journeyOutcomes,
    healthSignals: payload.healthSignals,
    execution: payload.execution,
    captainWorkspace: payload.captainWorkspace,
    recentResults: execution.captainActions.slice(0, 8),
    cohortSnapshots: payload.cohortSnapshots,
    healthRollups: payload.healthRollups,
    captainCoverage: payload.captainCoverage,
  };
}

export async function runProjectCommunityCaptainAction(
  input: ProjectCommunityCaptainActionRunPayload
): Promise<ProjectCommunityCaptainActionRunResult> {
  const access = await assertProjectCommunityAccess(input.projectId);
  const supabase = getServiceSupabaseClient();
  const [{ data: queueRow, error: queueError }, execution, captainAssignments] = await Promise.all([
    supabase
      .from("community_captain_action_queue")
      .select("id, project_id, auth_user_id, captain_assignment_id, title, summary, status, escalation_state, due_at, priority, seat_key, due_state, resolution_state, action_type, target_type, target_id, blocked_reason_code, blocked_reason_summary, last_actor_auth_user_id, resolved_at, source_type, metadata, created_at, updated_at")
      .eq("project_id", access.projectId)
      .eq("id", input.actionId)
      .maybeSingle(),
    loadProjectCommunityExecution(access.projectId),
    loadViewerCaptainAssignments(access.projectId, access.authUserId),
  ]);

  if (queueError) {
    throw new Error(queueError.message || "Failed to load captain action queue item.");
  }
  if (!queueRow) {
    throw new ProjectCommunityAccessError(404, "Captain action not found for this project.");
  }

  const queueRecord = queueRow as ProjectCommunityCaptainQueueRow;
  const viewerPermissions = execution.captainPermissions[access.authUserId] ?? [];
  const viewer = buildCaptainWorkspaceViewer({
    access,
    activeAssignments: captainAssignments,
    permissions: viewerPermissions,
  });

  if (!canViewerAccessQueueRow({ row: queueRecord, viewer })) {
    throw new ProjectCommunityAccessError(403, "This captain action is outside your current project scope.");
  }

  const assignedAuthUserId = toText(queueRecord.auth_user_id ?? queueRecord.authUserId);
  if (!viewer.isOwner && assignedAuthUserId && assignedAuthUserId !== access.authUserId) {
    throw new ProjectCommunityAccessError(403, "This captain action is assigned to another captain.");
  }

  const status = normalizeQueueStatus(queueRecord.status, queueRecord.escalation_state ?? queueRecord.escalationState);
  if (status === "completed") {
    throw new ProjectCommunityAccessError(400, "This captain action has already been completed.");
  }

  const resolvedTarget = resolveCaptainQueueExecutionTarget(queueRecord);
  if (!viewer.isOwner && resolvedTarget.requiredPermission && !viewer.permissions.includes(resolvedTarget.requiredPermission)) {
    throw new ProjectCommunityAccessError(403, "This captain action requires a permission your current seat does not have.");
  }

  const nowIso = new Date().toISOString();
  const queueMetadata = readQueueMetadata(queueRecord);
  const queueItem = buildCaptainQueueItems([queueRecord])[0];
  const captainRole = viewer.isOwner
    ? access.membershipRole ?? "owner"
    : toText(captainAssignments[0]?.role_type ?? captainAssignments[0]?.roleType, "captain");

  const { error: startError } = await supabase
    .from("community_captain_action_queue")
    .update({
      status: "in_progress",
      started_at: nowIso,
      auth_user_id: assignedAuthUserId || access.authUserId,
      due_state: queueItem?.dueState ?? "upcoming",
      resolution_state: "open",
      last_actor_auth_user_id: access.authUserId,
      updated_by_auth_user_id: access.authUserId,
      updated_at: nowIso,
    })
    .eq("project_id", access.projectId)
    .eq("id", input.actionId);

  if (startError) {
    throw new Error(startError.message || "Failed to start captain action.");
  }

  let actionStatus: ProjectCommunityCaptainActionRunResult["status"] = "skipped";
  let actionSummary = "Captain action is missing executable metadata.";
  let runtimeResult: Record<string, unknown> | null = null;

  try {
    if (resolvedTarget.playbookKey) {
      runtimeResult = (await runProjectCommunityPlaybook({
        projectId: access.projectId,
        playbookKey: resolvedTarget.playbookKey,
        authUserId: access.authUserId,
      })) as Record<string, unknown>;
      actionStatus = "success";
      actionSummary = `Captain playbook ${resolvedTarget.playbookKey} executed successfully.`;
    } else if (resolvedTarget.automationId || resolvedTarget.automationType) {
      runtimeResult = (await runProjectCommunityAutomation({
        projectId: access.projectId,
        automationId: resolvedTarget.automationId || undefined,
        automationType: resolvedTarget.automationType || undefined,
        authUserId: access.authUserId,
      })) as Record<string, unknown>;
      actionStatus = "success";
      actionSummary = `Captain automation ${resolvedTarget.targetId} executed successfully.`;
    }
  } catch (error) {
    actionStatus = "failed";
    actionSummary = error instanceof Error ? error.message : "Captain action execution failed.";
  }

  const finishStatus = actionStatus === "success" ? "done" : actionStatus === "failed" ? "blocked" : "blocked";
  const finishResolutionState: CommunityCaptainResolutionState =
    actionStatus === "success" ? "resolved" : "waiting";
  const finishMetadata: RawRecord = {
    ...queueMetadata,
    lastRunStatus: actionStatus,
    lastRunAt: nowIso,
    lastRunByAuthUserId: access.authUserId,
    lastRunSummary: actionSummary,
  };

  const { error: finishError } = await supabase
    .from("community_captain_action_queue")
    .update({
      status: finishStatus,
      completed_at: actionStatus === "success" ? nowIso : null,
      resolution_state: finishResolutionState,
      resolved_at: actionStatus === "success" ? nowIso : null,
      last_actor_auth_user_id: access.authUserId,
      updated_by_auth_user_id: access.authUserId,
      updated_at: nowIso,
      metadata: finishMetadata,
    })
    .eq("project_id", access.projectId)
    .eq("id", input.actionId);

  if (finishError) {
    throw new Error(finishError.message || "Failed to finalize captain action.");
  }

  const actionRecordId = await insertCaptainActionRecord({
    projectId: access.projectId,
    authUserId: access.authUserId,
    captainRole,
    actionType: resolvedTarget.actionType,
    targetType: resolvedTarget.targetType,
    targetId: resolvedTarget.targetId,
    status: actionStatus,
    summary: actionSummary,
    queueItemId: input.actionId,
    actorScope: viewer.isOwner ? "owner" : "captain",
    dueState: queueItem?.dueState ?? "upcoming",
    resolutionState: finishResolutionState,
    blockedReasonCode: queueItem?.blockedReason.code ?? "",
    blockedReasonSummary: queueItem?.blockedReason.summary ?? "",
    resolvedAt: actionStatus === "success" ? nowIso : null,
    metadata: {
      queueItemId: input.actionId,
      viewerRole: viewer.role,
      requiredPermission: resolvedTarget.requiredPermission,
      runtimeResult,
    },
  });

  await writeProjectCommunityAuditLog({
    projectId: access.projectId,
    sourceTable: "community_captain_action_queue",
    sourceId: input.actionId,
    action: "community_captain_action_run",
    summary: actionSummary,
    metadata: {
      actorAuthUserId: access.authUserId,
      captainRole,
      queueItemId: input.actionId,
      actionRecordId,
      status: actionStatus,
      targetType: resolvedTarget.targetType,
      targetId: resolvedTarget.targetId,
    },
  });

  return {
    projectId: access.projectId,
    queueItemId: input.actionId,
    actionRecordId,
    status: actionStatus,
    summary: actionSummary,
    actionType: resolvedTarget.actionType,
    targetType: resolvedTarget.targetType,
    targetId: resolvedTarget.targetId,
    runtimeResult,
  };
}
