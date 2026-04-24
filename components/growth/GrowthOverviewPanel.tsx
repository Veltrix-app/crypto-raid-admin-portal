"use client";

import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { AdminGrowthOverview } from "@/types/entities/growth-sales";

export function GrowthOverviewPanel({
  overview,
  loading,
}: {
  overview: AdminGrowthOverview | null;
  loading: boolean;
}) {
  return (
    <OpsPanel
      eyebrow="Commercial overview"
      title="Lead and intake posture"
      description="Track the buyer queue before dropping into a specific lead."
      tone="accent"
    >
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
        <OpsMetricCard label="Total leads" value={loading ? "..." : overview?.counts.totalLeads ?? 0} />
        <OpsMetricCard
          label="New + qualified"
          value={loading ? "..." : overview?.counts.new ?? 0}
          emphasis={(overview?.counts.new ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Engaged"
          value={loading ? "..." : overview?.counts.engaged ?? 0}
          emphasis={(overview?.counts.engaged ?? 0) > 0 ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Evaluation"
          value={loading ? "..." : overview?.counts.evaluation ?? 0}
          emphasis={(overview?.counts.evaluation ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Tasks due now"
          value={loading ? "..." : overview?.counts.dueNowTasks ?? 0}
          emphasis={(overview?.counts.dueNowTasks ?? 0) > 0 ? "warning" : "default"}
        />
      </div>
    </OpsPanel>
  );
}
