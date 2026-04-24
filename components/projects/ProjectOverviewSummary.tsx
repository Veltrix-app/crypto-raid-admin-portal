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
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="text-sm leading-7 text-sub">
            Keep this top section focused on posture first: what the project is, how far the
            workspace has progressed, and which systems are already helping it operate cleanly.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                {metric.label}
              </p>
              <p className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-text">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">{metric.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </OpsPanel>
  );
}
