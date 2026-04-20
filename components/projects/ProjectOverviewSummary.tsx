"use client";

import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type ProjectOverviewMetric = {
  label: string;
  value: string;
  sublabel: string;
};

type ProjectOverviewSummaryProps = {
  title: string;
  description: string;
  metrics: ProjectOverviewMetric[];
};

export default function ProjectOverviewSummary({
  title,
  description,
  metrics,
}: ProjectOverviewSummaryProps) {
  return (
    <OpsPanel eyebrow="Overview" title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            sub={metric.sublabel}
          />
        ))}
      </div>
    </OpsPanel>
  );
}
