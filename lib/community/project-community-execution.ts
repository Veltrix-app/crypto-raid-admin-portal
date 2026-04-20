import { createClient } from "@supabase/supabase-js";
import {
  COMMUNITY_AUTOMATION_LABELS,
  COMMUNITY_AUTOMATION_POSTURE_LABELS,
  COMMUNITY_AUTOMATION_SEQUENCE_LABELS,
  COMMUNITY_CAPTAIN_PERMISSION_LABELS,
  COMMUNITY_PLAYBOOK_DEFAULTS,
  type CommunityAutomationCadence,
  type CommunityAutomationExecutionPosture,
  type CommunityAutomationRecord,
  type CommunityAutomationSequence,
  type CommunityAutomationRunRecord,
  type CommunityAutomationType,
  type CommunityCaptainActionRecord,
  type CommunityCaptainDueState,
  type CommunityCaptainPermission,
  type CommunityCaptainResolutionState,
  type CommunityCaptainSeatScope,
  type CommunityPlaybookConfig,
  type CommunityPlaybookKey,
  type CommunityPlaybookRunRecord,
  type CommunityDeliveryTarget,
} from "@/components/community/community-config";
import { getServiceSupabaseClient, loadCommunitySettingsRows, updateCommunityMetadata } from "@/lib/community/project-community-ops";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const communityBotUrl = process.env.COMMUNITY_BOT_URL;
const communityBotWebhookSecret = process.env.COMMUNITY_BOT_WEBHOOK_SECRET;
const communityRetryJobSecret = process.env.COMMUNITY_RETRY_JOB_SECRET;

type CommunitySettingsRow = Record<string, unknown>;

type CommunityAutomationMetadata = {
  missionDigestEnabled?: boolean;
  missionDigestCadence?: CommunityAutomationCadence;
  missionDigestTarget?: CommunityDeliveryTarget;
  raidAlertsEnabled?: boolean;
  raidRemindersEnabled?: boolean;
  raidCadence?: CommunityAutomationCadence;
  newcomerFunnelEnabled?: boolean;
  reactivationFunnelEnabled?: boolean;
  activationBoardsEnabled?: boolean;
  activationBoardCadence?: CommunityAutomationCadence;
  captainPermissionMap?: Record<string, unknown>;
  captainSeatScopeMap?: Record<string, unknown>;
  captainAssignments?: unknown;
  playbookConfigs?: Record<string, unknown>;
};

type CommunityAutomationSeedContext = {
  sequencingKey: CommunityAutomationSequence;
  ownerLabel: string;
  ownerSummary: string;
};

type CommunityAutomationRow = {
  id: string;
  project_id: string;
  automation_type: string;
  status: string;
  cadence: string;
  provider_scope: string;
  target_provider: string | null;
  title: string | null;
  config: Record<string, unknown> | null;
  sequencing_key: string | null;
  execution_posture: string | null;
  owner_label: string | null;
  owner_summary: string | null;
  paused_reason: string | null;
  last_success_at: string | null;
  last_error_code: string | null;
  last_error_at: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  last_result: string | null;
  last_result_summary: string | null;
};

type CommunityAutomationRunRow = {
  id: string;
  automation_id: string | null;
  automation_type: string;
  status: string;
  trigger_source: string;
  triggered_by_auth_user_id: string | null;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
};

type CommunityPlaybookRunRow = {
  id: string;
  playbook_key: string;
  status: string;
  trigger_source: string;
  triggered_by_auth_user_id: string | null;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
};

type CommunityCaptainActionRow = {
  id: string;
  auth_user_id: string | null;
  captain_role: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  status: string;
  summary: string | null;
  queue_item_id: string | null;
  actor_scope: string | null;
  due_state: string | null;
  resolution_state: string | null;
  blocked_reason_code: string | null;
  blocked_reason_summary: string | null;
  resolved_at: string | null;
  created_at: string;
};

const AUTOMATION_TYPES: CommunityAutomationType[] = [
  "rank_sync",
  "leaderboard_pulse",
  "mission_digest",
  "raid_reminder",
  "newcomer_pulse",
  "reactivation_pulse",
  "activation_board",
];

const CAPTAIN_PERMISSION_VALUES = new Set<CommunityCaptainPermission>(
  Object.keys(COMMUNITY_CAPTAIN_PERMISSION_LABELS) as CommunityCaptainPermission[]
);

function getRuntimeSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for Community OS execution.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeCadence(value: unknown): CommunityAutomationCadence {
  return value === "daily" || value === "weekly" ? value : "manual";
}

function sanitizeProviderScope(value: unknown): CommunityDeliveryTarget {
  return value === "discord" || value === "telegram" ? value : "both";
}

function sanitizeAutomationStatus(value: unknown) {
  return value === "active" ? "active" : "paused";
}

function sanitizeAutomationSequence(value: unknown): CommunityAutomationSequence {
  return value === "launch" ||
    value === "raid" ||
    value === "comeback" ||
    value === "campaign_push"
    ? value
    : "always_on";
}

function sanitizeAutomationExecutionPosture(value: unknown): CommunityAutomationExecutionPosture {
  return value === "ready" ||
    value === "running" ||
    value === "blocked" ||
    value === "degraded"
    ? value
    : "watching";
}

function sanitizeCaptainDueState(value: unknown): CommunityCaptainDueState {
  return value === "due_now" || value === "overdue" || value === "resolved" ? value : "upcoming";
}

function sanitizeCaptainResolutionState(value: unknown): CommunityCaptainResolutionState {
  return value === "waiting" || value === "resolved" || value === "canceled" ? value : "open";
}

function buildAutomationSeedContext(
  automationType: CommunityAutomationType
): CommunityAutomationSeedContext {
  if (automationType === "leaderboard_pulse") {
    return {
      sequencingKey: "always_on",
      ownerLabel: "Leaderboard cadence",
      ownerSummary: "Keep community momentum visible with recurring leaderboard pressure.",
    };
  }

  if (automationType === "mission_digest") {
    return {
      sequencingKey: "launch",
      ownerLabel: "Mission visibility",
      ownerSummary: "Keep live mission inventory in front of the community at the right cadence.",
    };
  }

  if (automationType === "raid_reminder") {
    return {
      sequencingKey: "raid",
      ownerLabel: "Raid pressure",
      ownerSummary: "Support live raids with reminder waves and coordinated follow-through.",
    };
  }

  if (automationType === "newcomer_pulse") {
    return {
      sequencingKey: "always_on",
      ownerLabel: "Newcomer lane",
      ownerSummary: "Move fresh contributors into the first useful community lane.",
    };
  }

  if (automationType === "reactivation_pulse") {
    return {
      sequencingKey: "comeback",
      ownerLabel: "Comeback lane",
      ownerSummary: "Bring dormant contributors back into live project pressure.",
    };
  }

  if (automationType === "activation_board") {
    return {
      sequencingKey: "campaign_push",
      ownerLabel: "Activation board",
      ownerSummary: "Publish the strongest lane recommendation for the current campaign pressure.",
    };
  }

  return {
    sequencingKey: "always_on",
    ownerLabel: "Rank sync",
    ownerSummary: "Keep Discord rank state aligned with live Veltrix contributor progress.",
  };
}

function readPrimaryCommunityMetadata(settingsByIntegrationId: Map<string, CommunitySettingsRow>, integrationId: string | null) {
  if (!integrationId) {
    return {} as CommunityAutomationMetadata;
  }

  const row = settingsByIntegrationId.get(integrationId);
  if (!row?.metadata || typeof row.metadata !== "object") {
    return {} as CommunityAutomationMetadata;
  }

  return row.metadata as CommunityAutomationMetadata;
}

function buildDefaultAutomationSeed(params: {
  projectId: string;
  integrationId: string | null;
  settingsRow: CommunitySettingsRow | undefined;
  metadata: CommunityAutomationMetadata;
}) {
  const { projectId, integrationId, settingsRow, metadata } = params;
  const rankSeed = buildAutomationSeedContext("rank_sync");
  const leaderboardSeed = buildAutomationSeedContext("leaderboard_pulse");
  const missionSeed = buildAutomationSeedContext("mission_digest");
  const raidSeed = buildAutomationSeedContext("raid_reminder");
  const newcomerSeed = buildAutomationSeedContext("newcomer_pulse");
  const reactivationSeed = buildAutomationSeedContext("reactivation_pulse");
  const activationSeed = buildAutomationSeedContext("activation_board");

  return {
    rank_sync: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "rank_sync",
      status: settingsRow?.rank_sync_enabled === true ? "active" : "paused",
      cadence: "manual",
      provider_scope: "discord",
      target_provider: "discord",
      title: "Rank sync",
      sequencing_key: rankSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: rankSeed.ownerLabel,
      owner_summary: rankSeed.ownerSummary,
      config: { permission: "rank_sync" },
    },
    leaderboard_pulse: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "leaderboard_pulse",
      status: settingsRow?.leaderboard_enabled !== false ? "active" : "paused",
      cadence: sanitizeCadence(settingsRow?.leaderboard_cadence),
      provider_scope: "discord",
      target_provider: "discord",
      title: "Leaderboard pulse",
      sequencing_key: leaderboardSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: leaderboardSeed.ownerLabel,
      owner_summary: leaderboardSeed.ownerSummary,
      config: { permission: "leaderboard_post" },
    },
    mission_digest: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "mission_digest",
      status: metadata.missionDigestEnabled === true ? "active" : "paused",
      cadence: sanitizeCadence(metadata.missionDigestCadence),
      provider_scope: sanitizeProviderScope(metadata.missionDigestTarget),
      target_provider: sanitizeProviderScope(metadata.missionDigestTarget),
      title: "Mission digest",
      sequencing_key: missionSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: missionSeed.ownerLabel,
      owner_summary: missionSeed.ownerSummary,
      config: { permission: "mission_digest" },
    },
    raid_reminder: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "raid_reminder",
      status:
        metadata.raidAlertsEnabled === true || metadata.raidRemindersEnabled === true
          ? "active"
          : "paused",
      cadence: sanitizeCadence(metadata.raidCadence),
      provider_scope: "both",
      target_provider: "both",
      title: "Raid reminder",
      sequencing_key: raidSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: raidSeed.ownerLabel,
      owner_summary: raidSeed.ownerSummary,
      config: { permission: "raid_alert" },
    },
    newcomer_pulse: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "newcomer_pulse",
      status: metadata.newcomerFunnelEnabled === true ? "active" : "paused",
      cadence: "manual",
      provider_scope: "both",
      target_provider: "both",
      title: "Newcomer pulse",
      sequencing_key: newcomerSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: newcomerSeed.ownerLabel,
      owner_summary: newcomerSeed.ownerSummary,
      config: { permission: "newcomer_wave" },
    },
    reactivation_pulse: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "reactivation_pulse",
      status: metadata.reactivationFunnelEnabled === true ? "active" : "paused",
      cadence: "manual",
      provider_scope: "both",
      target_provider: "both",
      title: "Reactivation pulse",
      sequencing_key: reactivationSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: reactivationSeed.ownerLabel,
      owner_summary: reactivationSeed.ownerSummary,
      config: { permission: "reactivation_wave" },
    },
    activation_board: {
      project_id: projectId,
      integration_id: integrationId,
      automation_type: "activation_board",
      status: metadata.activationBoardsEnabled === true ? "active" : "paused",
      cadence: sanitizeCadence(metadata.activationBoardCadence),
      provider_scope: "both",
      target_provider: "both",
      title: "Activation board",
      sequencing_key: activationSeed.sequencingKey,
      execution_posture: "watching",
      owner_label: activationSeed.ownerLabel,
      owner_summary: activationSeed.ownerSummary,
      config: { permission: "activation_board" },
    },
  } satisfies Record<CommunityAutomationType, Record<string, unknown>>;
}

async function ensureCommunityAutomationRows(projectId: string) {
  const supabase = getRuntimeSupabaseClient();
  const { integrations, settingsByIntegrationId } = await loadCommunitySettingsRows(projectId);
  const primaryIntegration =
    integrations.find((integration) => integration.provider === "discord") ?? integrations[0] ?? null;
  const settingsRow = primaryIntegration
    ? settingsByIntegrationId.get(primaryIntegration.id)
    : undefined;
  const metadata = readPrimaryCommunityMetadata(
    settingsByIntegrationId,
    primaryIntegration?.id ?? null
  );

  const { data: rows, error } = await supabase
    .from("community_automations")
    .select(
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, title, config, sequencing_key, execution_posture, owner_label, owner_summary, paused_reason, last_success_at, last_error_code, last_error_at, last_run_at, next_run_at, last_result, last_result_summary"
    )
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message || "Failed to load Community OS automations.");
  }

  const existingRows = (rows ?? []) as CommunityAutomationRow[];
  const existingTypes = new Set(existingRows.map((row) => row.automation_type));
  const seeds = buildDefaultAutomationSeed({
    projectId,
    integrationId: primaryIntegration?.id ?? null,
    settingsRow,
    metadata,
  });
  const missingRows = AUTOMATION_TYPES.filter((type) => !existingTypes.has(type)).map(
    (type) => seeds[type]
  );

  if (missingRows.length > 0) {
    const { error: insertError } = await supabase.from("community_automations").insert(
      missingRows.map((row) => ({
        ...row,
        next_run_at: sanitizeCadence(row.cadence) === "manual" ? null : new Date().toISOString(),
      }))
    );

    if (insertError) {
      throw new Error(insertError.message || "Failed to seed Community OS automations.");
    }
  }

  const { data: refreshedRows, error: refreshedError } = await supabase
    .from("community_automations")
    .select(
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, title, config, sequencing_key, execution_posture, owner_label, owner_summary, paused_reason, last_success_at, last_error_code, last_error_at, last_run_at, next_run_at, last_result, last_result_summary"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (refreshedError) {
    throw new Error(refreshedError.message || "Failed to refresh Community OS automations.");
  }

  return {
    integrations,
    settingsByIntegrationId,
    primaryIntegrationId: primaryIntegration?.id ?? null,
    metadata,
    automationRows: (refreshedRows ?? []) as CommunityAutomationRow[],
  };
}

function mapAutomationRow(row: CommunityAutomationRow): CommunityAutomationRecord {
  const automationType = (AUTOMATION_TYPES.includes(row.automation_type as CommunityAutomationType)
    ? row.automation_type
    : "mission_digest") as CommunityAutomationType;
  const seedContext = buildAutomationSeedContext(automationType);
  const sequencingKey = sanitizeAutomationSequence(row.sequencing_key);
  const executionPosture = sanitizeAutomationExecutionPosture(row.execution_posture);

  return {
    id: row.id,
    projectId: row.project_id,
    automationType,
    status: sanitizeAutomationStatus(row.status),
    cadence: sanitizeCadence(row.cadence),
    providerScope: sanitizeProviderScope(row.provider_scope),
    targetProvider: sanitizeProviderScope(row.target_provider),
    title: trimText(row.title) || COMMUNITY_AUTOMATION_LABELS[automationType],
    description:
      automationType === "rank_sync"
        ? "Keep Discord rank roles aligned with live Veltrix contributor state."
        : automationType === "leaderboard_pulse"
          ? "Post a live leaderboard pulse into the community rail."
          : automationType === "mission_digest"
            ? "Broadcast the current mission and reward surface."
            : automationType === "raid_reminder"
              ? "Pulse live raid pressure into the active community targets."
              : automationType === "newcomer_pulse"
                ? "Move fresh contributors into the starter lane."
                : automationType === "reactivation_pulse"
                  ? "Pull dormant contributors back into live campaign pressure."
                  : "Surface a campaign activation board with the right lane recommendation.",
    config: row.config ?? {},
    sequencingKey,
    executionPosture,
    ownerLabel:
      trimText(row.owner_label) ||
      `${seedContext.ownerLabel} · ${COMMUNITY_AUTOMATION_SEQUENCE_LABELS[sequencingKey]}`,
    ownerSummary:
      trimText(row.owner_summary) ||
      `${seedContext.ownerSummary} Current posture: ${COMMUNITY_AUTOMATION_POSTURE_LABELS[executionPosture].toLowerCase()}.`,
    pausedReason: trimText(row.paused_reason),
    lastSuccessAt: row.last_success_at ?? "",
    lastErrorCode: trimText(row.last_error_code),
    lastErrorAt: row.last_error_at ?? "",
    lastRunAt: row.last_run_at ?? "",
    nextRunAt: row.next_run_at ?? "",
    lastResult: trimText(row.last_result),
    lastResultSummary: trimText(row.last_result_summary),
  };
}

function mapAutomationRunRow(row: CommunityAutomationRunRow): CommunityAutomationRunRecord {
  return {
    id: row.id,
    automationId: row.automation_id,
    automationType: row.automation_type as CommunityAutomationType,
    status: (row.status || "pending") as CommunityAutomationRunRecord["status"],
    triggerSource: (row.trigger_source || "manual") as CommunityAutomationRunRecord["triggerSource"],
    triggeredByAuthUserId: row.triggered_by_auth_user_id ?? "",
    summary: trimText(row.summary),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? "",
  };
}

function mapPlaybookRunRow(row: CommunityPlaybookRunRow): CommunityPlaybookRunRecord {
  return {
    id: row.id,
    playbookKey: row.playbook_key as CommunityPlaybookKey,
    status: (row.status || "pending") as CommunityPlaybookRunRecord["status"],
    triggerSource: (row.trigger_source || "manual") as CommunityPlaybookRunRecord["triggerSource"],
    triggeredByAuthUserId: row.triggered_by_auth_user_id ?? "",
    summary: trimText(row.summary),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? "",
  };
}

function mapCaptainActionRow(row: CommunityCaptainActionRow): CommunityCaptainActionRecord {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? "",
    captainRole: trimText(row.captain_role),
    actionType: row.action_type,
    targetType: trimText(row.target_type),
    targetId: trimText(row.target_id),
    status: (row.status || "success") as CommunityCaptainActionRecord["status"],
    summary: trimText(row.summary),
    queueItemId: row.queue_item_id,
    actorScope:
      row.actor_scope === "owner" || row.actor_scope === "system" ? row.actor_scope : "captain",
    dueState: sanitizeCaptainDueState(row.due_state),
    resolutionState: sanitizeCaptainResolutionState(row.resolution_state),
    blockedReasonCode: trimText(row.blocked_reason_code),
    blockedReasonSummary: trimText(row.blocked_reason_summary),
    resolvedAt: row.resolved_at ?? "",
    createdAt: row.created_at,
  };
}

function readCaptainPermissionMap(metadata: CommunityAutomationMetadata) {
  const assignments = Array.isArray(metadata.captainAssignments)
    ? metadata.captainAssignments
        .map((candidate) =>
          candidate && typeof candidate === "object"
            ? (candidate as Record<string, unknown>)
            : {}
        )
        .map((candidate) => ({
          authUserId:
            typeof candidate.authUserId === "string" ? candidate.authUserId.trim() : "",
          role: typeof candidate.role === "string" ? candidate.role.trim() : "community_captain",
        }))
        .filter((assignment) => assignment.authUserId.length > 0)
    : [];
  const raw = metadata.captainPermissionMap;
  if (!raw || typeof raw !== "object") {
    return {} as Record<string, CommunityCaptainPermission[]>;
  }

  const result: Record<string, CommunityCaptainPermission[]> = {};
  for (const [seatKey, permissions] of Object.entries(raw)) {
    if (!seatKey.trim()) {
      continue;
    }

    const normalized = Array.isArray(permissions)
      ? permissions
          .filter((value): value is CommunityCaptainPermission => typeof value === "string" && CAPTAIN_PERMISSION_VALUES.has(value as CommunityCaptainPermission))
      : [];
    const normalizedPermissions = Array.from(new Set(normalized));

    if (seatKey.includes(":")) {
      result[seatKey] = normalizedPermissions;
      continue;
    }

    const matchingAssignments = assignments.filter((assignment) => assignment.authUserId === seatKey);
    if (matchingAssignments.length === 0) {
      result[seatKey] = normalizedPermissions;
      continue;
    }

    for (const assignment of matchingAssignments) {
      result[`${assignment.authUserId}:${assignment.role}`] = normalizedPermissions;
    }
  }

  return result;
}

function normalizeCaptainSeatScope(value: unknown): CommunityCaptainSeatScope {
  if (
    value === "project_only" ||
    value === "community_only" ||
    value === "project_and_community"
  ) {
    return value;
  }

  return "project_and_community";
}

function readCaptainSeatScopeMap(metadata: CommunityAutomationMetadata) {
  const assignments = Array.isArray(metadata.captainAssignments)
    ? metadata.captainAssignments
        .map((candidate) =>
          candidate && typeof candidate === "object"
            ? (candidate as Record<string, unknown>)
            : {}
        )
        .map((candidate) => ({
          authUserId:
            typeof candidate.authUserId === "string" ? candidate.authUserId.trim() : "",
          role: typeof candidate.role === "string" ? candidate.role.trim() : "community_captain",
        }))
        .filter((assignment) => assignment.authUserId.length > 0)
    : [];
  const raw = metadata.captainSeatScopeMap;
  if (!raw || typeof raw !== "object") {
    return {} as Record<string, CommunityCaptainSeatScope>;
  }

  const result: Record<string, CommunityCaptainSeatScope> = {};
  for (const [seatKey, scope] of Object.entries(raw)) {
    if (!seatKey.trim()) {
      continue;
    }

    if (seatKey.includes(":")) {
      result[seatKey] = normalizeCaptainSeatScope(scope);
      continue;
    }

    const matchingAssignments = assignments.filter((assignment) => assignment.authUserId === seatKey);
    if (matchingAssignments.length === 0) {
      result[seatKey] = normalizeCaptainSeatScope(scope);
      continue;
    }

    for (const assignment of matchingAssignments) {
      result[`${assignment.authUserId}:${assignment.role}`] = normalizeCaptainSeatScope(scope);
    }
  }

  return result;
}

function readPlaybookConfigs(metadata: CommunityAutomationMetadata, runs: CommunityPlaybookRunRecord[]) {
  const raw = metadata.playbookConfigs && typeof metadata.playbookConfigs === "object"
    ? (metadata.playbookConfigs as Record<string, unknown>)
    : {};
  const lastRunByKey = new Map<CommunityPlaybookKey, string>();

  for (const run of runs) {
    if (!lastRunByKey.has(run.playbookKey)) {
      lastRunByKey.set(run.playbookKey, run.createdAt);
    }
  }

  return COMMUNITY_PLAYBOOK_DEFAULTS.map((playbook) => {
    const override =
      raw[playbook.key] && typeof raw[playbook.key] === "object"
        ? (raw[playbook.key] as Record<string, unknown>)
        : {};

    return {
      ...playbook,
      enabled: override.enabled === true,
      providerScope: sanitizeProviderScope(override.providerScope ?? playbook.providerScope),
      lastRunAt: lastRunByKey.get(playbook.key) ?? "",
    } satisfies CommunityPlaybookConfig;
  });
}

export async function loadProjectCommunityExecution(projectId: string) {
  const supabase = getRuntimeSupabaseClient();
  const { metadata, automationRows } = await ensureCommunityAutomationRows(projectId);

  const [
    { data: automationRuns, error: automationRunsError },
    { data: playbookRuns, error: playbookRunsError },
    { data: captainActions, error: captainActionsError },
  ] = await Promise.all([
    supabase
      .from("community_automation_runs")
      .select(
        "id, automation_id, automation_type, status, trigger_source, triggered_by_auth_user_id, summary, created_at, completed_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(18),
    supabase
      .from("community_playbook_runs")
      .select(
        "id, playbook_key, status, trigger_source, triggered_by_auth_user_id, summary, created_at, completed_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("community_captain_actions")
      .select(
        "id, auth_user_id, captain_role, action_type, target_type, target_id, status, summary, queue_item_id, actor_scope, due_state, resolution_state, blocked_reason_code, blocked_reason_summary, resolved_at, created_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (automationRunsError) {
    throw new Error(automationRunsError.message || "Failed to load automation runs.");
  }
  if (playbookRunsError) {
    throw new Error(playbookRunsError.message || "Failed to load playbook runs.");
  }
  if (captainActionsError) {
    throw new Error(captainActionsError.message || "Failed to load captain actions.");
  }

  const mappedAutomationRuns = ((automationRuns ?? []) as CommunityAutomationRunRow[]).map(
    mapAutomationRunRow
  );
  const mappedPlaybookRuns = ((playbookRuns ?? []) as CommunityPlaybookRunRow[]).map(
    mapPlaybookRunRow
  );

  return {
    automations: automationRows.map(mapAutomationRow),
    automationRuns: mappedAutomationRuns,
    playbooks: readPlaybookConfigs(metadata, mappedPlaybookRuns),
    playbookRuns: mappedPlaybookRuns,
    captainPermissions: readCaptainPermissionMap(metadata),
    captainSeatScopes: readCaptainSeatScopeMap(metadata),
    captainActions: ((captainActions ?? []) as CommunityCaptainActionRow[]).map(
      mapCaptainActionRow
    ),
  };
}

export async function saveProjectCommunityAutomations(params: {
  projectId: string;
  authUserId: string;
  automations: CommunityAutomationRecord[];
}) {
  const supabase = getRuntimeSupabaseClient();
  const { automationRows } = await ensureCommunityAutomationRows(params.projectId);
  const existingIds = new Set(automationRows.map((row) => row.id));
  const payload = params.automations
    .filter((automation) => existingIds.has(automation.id))
    .map((automation) => ({
      id: automation.id,
      project_id: params.projectId,
      automation_type: automation.automationType,
      status: sanitizeAutomationStatus(automation.status),
      cadence: sanitizeCadence(automation.cadence),
      provider_scope: sanitizeProviderScope(automation.providerScope),
      target_provider: sanitizeProviderScope(automation.targetProvider),
      title: trimText(automation.title) || COMMUNITY_AUTOMATION_LABELS[automation.automationType],
      sequencing_key: sanitizeAutomationSequence(automation.sequencingKey),
      execution_posture: sanitizeAutomationExecutionPosture(automation.executionPosture),
      owner_label:
        trimText(automation.ownerLabel) || buildAutomationSeedContext(automation.automationType).ownerLabel,
      owner_summary:
        trimText(automation.ownerSummary) ||
        buildAutomationSeedContext(automation.automationType).ownerSummary,
      paused_reason: trimText(automation.pausedReason) || null,
      last_success_at: automation.lastSuccessAt || null,
      last_error_code: trimText(automation.lastErrorCode) || null,
      last_error_at: automation.lastErrorAt || null,
      config: automation.config ?? {},
      next_run_at:
        sanitizeAutomationStatus(automation.status) === "active" &&
        sanitizeCadence(automation.cadence) !== "manual"
          ? automation.nextRunAt || new Date().toISOString()
          : null,
      updated_by_auth_user_id: params.authUserId,
      updated_at: new Date().toISOString(),
    }));

  if (payload.length === 0) {
    return loadProjectCommunityExecution(params.projectId);
  }

  const { error } = await supabase
    .from("community_automations")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(error.message || "Failed to save community automations.");
  }

  return loadProjectCommunityExecution(params.projectId);
}

async function postRuntimeCommunityCommand(path: string, body: Record<string, unknown>) {
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing for Community OS execution.");
  }

  const response = await fetch(`${communityBotUrl.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(communityRetryJobSecret || communityBotWebhookSecret
        ? { "x-community-job-secret": communityRetryJobSecret || communityBotWebhookSecret || "" }
        : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Community runtime execution failed.");
  }

  return payload;
}

export async function runProjectCommunityAutomation(params: {
  projectId: string;
  automationId?: string;
  automationType?: CommunityAutomationType;
  authUserId: string;
}) {
  return postRuntimeCommunityCommand("/community/automations/run", params);
}

export async function saveProjectCaptainPermissions(params: {
  projectId: string;
  permissionMap: Record<string, CommunityCaptainPermission[]>;
  seatScopeMap: Record<string, CommunityCaptainSeatScope>;
}) {
  await updateCommunityMetadata({
    projectId: params.projectId,
    metadataPatch: {
      captainPermissionMap: params.permissionMap,
      captainSeatScopeMap: params.seatScopeMap,
    },
  });

  return loadProjectCommunityExecution(params.projectId);
}

export async function saveProjectPlaybooks(params: {
  projectId: string;
  playbooks: Array<Pick<CommunityPlaybookConfig, "key" | "enabled" | "providerScope">>;
}) {
  const patch = Object.fromEntries(
    params.playbooks.map((playbook) => [
      playbook.key,
      {
        enabled: playbook.enabled,
        providerScope: playbook.providerScope,
      },
    ])
  );

  await updateCommunityMetadata({
    projectId: params.projectId,
    metadataPatch: {
      playbookConfigs: patch,
    },
  });

  return loadProjectCommunityExecution(params.projectId);
}

export async function runProjectCommunityPlaybook(params: {
  projectId: string;
  playbookKey: CommunityPlaybookKey;
  authUserId: string;
}) {
  return postRuntimeCommunityCommand("/community/playbooks/run", params);
}
