import {
  getMetricDefinition,
  isMetricKey,
  type MetricKey,
} from "@/lib/analytics/metric-definitions";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

export type MetricSummaryPoint = {
  date: string;
  value: number;
  healthState: string;
};

export type MetricSummaryRow = {
  key: MetricKey;
  label: string;
  section: string;
  unit: string;
  value: number;
  healthState: string;
  points: MetricSummaryPoint[];
};

export type PlatformMetricSummary = {
  latestSnapshotDate: string | null;
  metrics: MetricSummaryRow[];
};

function asRecords(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

export async function loadPlatformMetricSummary(): Promise<PlatformMetricSummary> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("platform_metric_snapshots")
    .select("metric_key, metric_section, metric_value, unit, health_state, snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(400);

  if (error) {
    throw new Error(error.message);
  }

  const rows = asRecords(data);
  const latestSnapshotDate = rows[0]?.snapshot_date?.toString() ?? null;
  const metricsByKey = new Map<MetricKey, MetricSummaryRow>();

  for (const row of rows) {
    const key = String(row.metric_key ?? "");
    if (!isMetricKey(key)) continue;
    const definition = getMetricDefinition(key);
    const metricValue = Number(row.metric_value ?? 0);
    const snapshotDate = row.snapshot_date?.toString() ?? "";
    const existing = metricsByKey.get(key);

    if (!existing) {
      metricsByKey.set(key, {
        key,
        label: definition.label,
        section: definition.section,
        unit: definition.unit,
        value: snapshotDate === latestSnapshotDate ? metricValue : 0,
        healthState:
          snapshotDate === latestSnapshotDate ? String(row.health_state ?? "healthy") : "healthy",
        points: [{ date: snapshotDate, value: metricValue, healthState: String(row.health_state ?? "healthy") }],
      });
      continue;
    }

    existing.points.push({
      date: snapshotDate,
      value: metricValue,
      healthState: String(row.health_state ?? "healthy"),
    });
    if (snapshotDate === latestSnapshotDate) {
      existing.value = metricValue;
      existing.healthState = String(row.health_state ?? "healthy");
    }
  }

  return {
    latestSnapshotDate,
    metrics: Array.from(metricsByKey.values()).map((metric) => ({
      ...metric,
      points: metric.points
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7),
    })),
  };
}
