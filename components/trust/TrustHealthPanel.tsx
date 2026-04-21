"use client";

import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type TrustHealthMetric = {
  label: string;
  value: string | number;
  sub?: string;
  emphasis?: "default" | "primary" | "warning";
};

export default function TrustHealthPanel({
  eyebrow,
  title,
  description,
  metrics,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: TrustHealthMetric[];
}) {
  return (
    <OpsPanel eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            sub={metric.sub}
            emphasis={metric.emphasis}
          />
        ))}
      </div>
    </OpsPanel>
  );
}
