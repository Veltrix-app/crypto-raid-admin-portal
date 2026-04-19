import { createClient } from "@supabase/supabase-js";
import {
  COMMUNITY_AUTOMATION_LABELS,
  COMMUNITY_CAPTAIN_PERMISSION_LABELS,
  COMMUNITY_PLAYBOOK_DEFAULTS,
  type CommunityAutomationCadence,
  type CommunityAutomationRecord,
  type CommunityAutomationRunRecord,
  type CommunityAutomationType,
  type CommunityCaptainActionRecord,
  type CommunityCaptainPermission,
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
  playbookConfigs?: Record<string, unknown>;
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
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, title, config, last_run_at, next_run_at, last_result, last_result_summary"
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
      "id, project_id, automation_type, status, cadence, provider_scope, target_provider, title, config, last_run_at, next_run_at, last_result, last_result_summary"
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
    createdAt: row.created_at,
  };
}

function readCaptainPermissionMap(metadata: CommunityAutomationMetadata) {
  const raw = metadata.captainPermissionMap;
  if (!raw || typeof raw !== "object") {
    return {} as Record<string, CommunityCaptainPermission[]>;
  }

  const result: Record<string, CommunityCaptainPermission[]> = {};
  for (const [authUserId, permissions] of Object.entries(raw)) {
    if (!authUserId.trim()) {
      continue;
    }

    const normalized = Array.isArray(permissions)
      ? permissions
          .filter((value): value is CommunityCaptainPermission => typeof value === "string" && CAPTAIN_PERMISSION_VALUES.has(value as CommunityCaptainPermission))
      : [];
    result[authUserId] = Array.from(new Set(normalized));
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
        "id, auth_user_id, captain_role, action_type, target_type, target_id, status, summary, created_at"
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
  automationId: string;
  authUserId: string;
}) {
  return postRuntimeCommunityCommand("/community/automations/run", params);
}

export async function saveProjectCaptainPermissions(params: {
  projectId: string;
  permissionMap: Record<string, CommunityCaptainPermission[]>;
}) {
  await updateCommunityMetadata({
    projectId: params.projectId,
    metadataPatch: {
      captainPermissionMap: params.permissionMap,
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
