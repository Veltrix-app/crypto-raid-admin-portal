import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  evaluateMetricHealthState,
  type MetricHealthState,
  type MetricKey,
} from "@/lib/analytics/metric-definitions";

export type PlatformHealthSummary = {
  generatedAt: string;
  latestPlatformSnapshotDate: string | null;
  latestProjectSnapshotDate: string | null;
  snapshotStale: boolean;
  latestMetricValues: Partial<Record<MetricKey, number>>;
  providerFailureCount: number;
  queueBacklogCount: number;
  supportEscalationCount: number;
  automationFailureCount: number;
  openTrustCaseCount: number;
  openPayoutCaseCount: number;
  openOnchainCaseCount: number;
  openIncidentCount: number;
  activeOverrideCount: number;
  metricHealth: Array<{
    key: MetricKey;
    value: number;
    healthState: MetricHealthState;
  }>;
};

export type ProjectHealthSummary = {
  projectId: string;
  generatedAt: string;
  latestProjectSnapshotDate: string | null;
  snapshotStale: boolean;
  latestMetricValues: Partial<Record<MetricKey, number>>;
  providerFailureCount: number;
  queueBacklogCount: number;
  supportEscalationCount: number;
  automationFailureCount: number;
  openTrustCaseCount: number;
  openPayoutCaseCount: number;
  openOnchainCaseCount: number;
  openIncidentCount: number;
  activeOverrideCount: number;
  metricHealth: Array<{
    key: MetricKey;
    value: number;
    healthState: MetricHealthState;
  }>;
};

const CLOSED_CASE_STATUSES = new Set(["resolved", "dismissed"]);
const CLOSED_ESCALATION_STATUSES = new Set(["resolved", "dismissed"]);

function asRecords(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function toDateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

function isSnapshotStale(value: string | null) {
  const date = toDateOnly(value);
  if (!date || Number.isNaN(date.getTime())) {
    return true;
  }

  const now = new Date();
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const snapshotDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayDiff = Math.floor((utcToday - snapshotDay) / (24 * 60 * 60 * 1000));
  return dayDiff > 1;
}

export async function loadPlatformHealthSummary(): Promise<PlatformHealthSummary> {
  const supabase = getServiceSupabaseClient();
  const automationFailureCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    platformSnapshots,
    projectSnapshots,
    incidents,
    overrides,
    trustCases,
    payoutCases,
    onchainCases,
    escalations,
    automationRuns,
  ] = await Promise.all([
    supabase
      .from("platform_metric_snapshots")
      .select("metric_key, metric_value, snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(50),
    supabase
      .from("project_metric_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1),
    supabase.from("project_operation_incidents").select("status, source_type"),
    supabase.from("project_operation_overrides").select("status"),
    supabase.from("trust_cases").select("status"),
    supabase.from("payout_cases").select("status"),
    supabase.from("onchain_cases").select("status"),
    supabase.from("support_escalations").select("status"),
    supabase
      .from("community_automation_runs")
      .select("status")
      .gte("created_at", automationFailureCutoff),
  ]);

  if (platformSnapshots.error) throw new Error(platformSnapshots.error.message);
  if (projectSnapshots.error) throw new Error(projectSnapshots.error.message);
  if (incidents.error) throw new Error(incidents.error.message);
  if (overrides.error) throw new Error(overrides.error.message);
  if (trustCases.error) throw new Error(trustCases.error.message);
  if (payoutCases.error) throw new Error(payoutCases.error.message);
  if (onchainCases.error) throw new Error(onchainCases.error.message);
  if (escalations.error) throw new Error(escalations.error.message);
  if (automationRuns.error) throw new Error(automationRuns.error.message);

  const latestPlatformSnapshotDate =
    asRecords(platformSnapshots.data)[0]?.snapshot_date?.toString() ?? null;
  const latestMetricValues = Object.fromEntries(
    asRecords(platformSnapshots.data)
      .filter((row) => row.snapshot_date?.toString() === latestPlatformSnapshotDate)
      .map((row) => [String(row.metric_key ?? ""), asNumber(row.metric_value)])
      .filter(([key]) => Boolean(key))
  ) as Partial<Record<MetricKey, number>>;
  const latestProjectSnapshotDate =
    asRecords(projectSnapshots.data)[0]?.snapshot_date?.toString() ?? null;
  const providerFailureCount = asRecords(incidents.data).filter(
    (row) => row.status === "open" && row.source_type === "provider"
  ).length;
  const openIncidentCount = asRecords(incidents.data).filter((row) => row.status === "open").length;
  const activeOverrideCount = asRecords(overrides.data).filter((row) => row.status === "active").length;
  const openTrustCaseCount = asRecords(trustCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const openPayoutCaseCount = asRecords(payoutCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const openOnchainCaseCount = asRecords(onchainCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const supportEscalationCount = asRecords(escalations.data).filter(
    (row) => !CLOSED_ESCALATION_STATUSES.has(String(row.status ?? ""))
  ).length;
  const queueBacklogCount =
    openTrustCaseCount + openPayoutCaseCount + openOnchainCaseCount + providerFailureCount;
  const automationFailureCount = asRecords(automationRuns.data).filter(
    (row) => row.status === "failed"
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    latestPlatformSnapshotDate,
    latestProjectSnapshotDate,
    snapshotStale:
      isSnapshotStale(latestPlatformSnapshotDate) || isSnapshotStale(latestProjectSnapshotDate),
    latestMetricValues,
    providerFailureCount,
    queueBacklogCount,
    supportEscalationCount,
    automationFailureCount,
    openTrustCaseCount,
    openPayoutCaseCount,
    openOnchainCaseCount,
    openIncidentCount,
    activeOverrideCount,
    metricHealth: [
      {
        key: "provider_failure_count",
        value: providerFailureCount,
        healthState: evaluateMetricHealthState("provider_failure_count", providerFailureCount),
      },
      {
        key: "queue_backlog_count",
        value: queueBacklogCount,
        healthState: evaluateMetricHealthState("queue_backlog_count", queueBacklogCount),
      },
      {
        key: "support_escalation_count",
        value: supportEscalationCount,
        healthState: evaluateMetricHealthState("support_escalation_count", supportEscalationCount),
      },
      {
        key: "open_trust_case_count",
        value: openTrustCaseCount,
        healthState: evaluateMetricHealthState("open_trust_case_count", openTrustCaseCount),
      },
      {
        key: "open_payout_case_count",
        value: openPayoutCaseCount,
        healthState: evaluateMetricHealthState("open_payout_case_count", openPayoutCaseCount),
      },
      {
        key: "open_onchain_case_count",
        value: openOnchainCaseCount,
        healthState: evaluateMetricHealthState("open_onchain_case_count", openOnchainCaseCount),
      },
    ],
  };
}

export async function loadProjectHealthSummary(projectId: string): Promise<ProjectHealthSummary> {
  const supabase = getServiceSupabaseClient();
  const automationFailureCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    projectSnapshots,
    incidents,
    overrides,
    trustCases,
    payoutCases,
    onchainCases,
    escalations,
    automationRuns,
  ] = await Promise.all([
    supabase
      .from("project_metric_snapshots")
      .select("metric_key, metric_value, snapshot_date")
      .eq("project_id", projectId)
      .order("snapshot_date", { ascending: false })
      .limit(50),
    supabase.from("project_operation_incidents").select("status, source_type").eq("project_id", projectId),
    supabase.from("project_operation_overrides").select("status").eq("project_id", projectId),
    supabase.from("trust_cases").select("status").eq("project_id", projectId),
    supabase.from("payout_cases").select("status").eq("project_id", projectId),
    supabase.from("onchain_cases").select("status").eq("project_id", projectId),
    supabase.from("support_escalations").select("status").eq("project_id", projectId),
    supabase
      .from("community_automation_runs")
      .select("status")
      .eq("project_id", projectId)
      .gte("created_at", automationFailureCutoff),
  ]);

  if (projectSnapshots.error) throw new Error(projectSnapshots.error.message);
  if (incidents.error) throw new Error(incidents.error.message);
  if (overrides.error) throw new Error(overrides.error.message);
  if (trustCases.error) throw new Error(trustCases.error.message);
  if (payoutCases.error) throw new Error(payoutCases.error.message);
  if (onchainCases.error) throw new Error(onchainCases.error.message);
  if (escalations.error) throw new Error(escalations.error.message);
  if (automationRuns.error) throw new Error(automationRuns.error.message);

  const latestProjectSnapshotDate =
    asRecords(projectSnapshots.data)[0]?.snapshot_date?.toString() ?? null;
  const latestMetricValues = Object.fromEntries(
    asRecords(projectSnapshots.data)
      .filter((row) => row.snapshot_date?.toString() === latestProjectSnapshotDate)
      .map((row) => [String(row.metric_key ?? ""), asNumber(row.metric_value)])
      .filter(([key]) => Boolean(key))
  ) as Partial<Record<MetricKey, number>>;
  const providerFailureCount = asRecords(incidents.data).filter(
    (row) => row.status === "open" && row.source_type === "provider"
  ).length;
  const openIncidentCount = asRecords(incidents.data).filter((row) => row.status === "open").length;
  const activeOverrideCount = asRecords(overrides.data).filter((row) => row.status === "active").length;
  const openTrustCaseCount = asRecords(trustCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const openPayoutCaseCount = asRecords(payoutCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const openOnchainCaseCount = asRecords(onchainCases.data).filter(
    (row) => !CLOSED_CASE_STATUSES.has(String(row.status ?? ""))
  ).length;
  const supportEscalationCount = asRecords(escalations.data).filter(
    (row) => !CLOSED_ESCALATION_STATUSES.has(String(row.status ?? ""))
  ).length;
  const queueBacklogCount =
    openTrustCaseCount + openPayoutCaseCount + openOnchainCaseCount + providerFailureCount;
  const automationFailureCount = asRecords(automationRuns.data).filter(
    (row) => row.status === "failed"
  ).length;

  return {
    projectId,
    generatedAt: new Date().toISOString(),
    latestProjectSnapshotDate,
    snapshotStale: isSnapshotStale(latestProjectSnapshotDate),
    latestMetricValues,
    providerFailureCount,
    queueBacklogCount,
    supportEscalationCount,
    automationFailureCount,
    openTrustCaseCount,
    openPayoutCaseCount,
    openOnchainCaseCount,
    openIncidentCount,
    activeOverrideCount,
    metricHealth: [
      {
        key: "project_provider_failure_count",
        value: providerFailureCount,
        healthState: evaluateMetricHealthState(
          "project_provider_failure_count",
          providerFailureCount
        ),
      },
      {
        key: "project_queue_backlog_count",
        value: queueBacklogCount,
        healthState: evaluateMetricHealthState("project_queue_backlog_count", queueBacklogCount),
      },
      {
        key: "project_support_escalation_count",
        value: supportEscalationCount,
        healthState: evaluateMetricHealthState(
          "project_support_escalation_count",
          supportEscalationCount
        ),
      },
      {
        key: "project_open_trust_case_count",
        value: openTrustCaseCount,
        healthState: evaluateMetricHealthState(
          "project_open_trust_case_count",
          openTrustCaseCount
        ),
      },
      {
        key: "project_open_payout_case_count",
        value: openPayoutCaseCount,
        healthState: evaluateMetricHealthState(
          "project_open_payout_case_count",
          openPayoutCaseCount
        ),
      },
      {
        key: "project_open_onchain_case_count",
        value: openOnchainCaseCount,
        healthState: evaluateMetricHealthState(
          "project_open_onchain_case_count",
          openOnchainCaseCount
        ),
      },
    ],
  };
}
