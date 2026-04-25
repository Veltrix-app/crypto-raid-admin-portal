"use client";

import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";

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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[16px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] px-3 py-2.5 shadow-[0_12px_26px_rgba(0,0,0,0.12)]"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
                {metric.label}
              </p>
              <p className="mt-1.5 text-[0.92rem] font-extrabold tracking-[-0.03em] text-text">
                {metric.value}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-sub">{metric.sublabel}</p>
            </div>
          ))}
      </div>
    </OpsPanel>
  );
}
