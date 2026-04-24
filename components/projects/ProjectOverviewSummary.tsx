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
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="text-sm leading-6 text-sub">
            Keep this top section focused on posture first: what the project is, how far the
            workspace has progressed, and which systems are already helping it operate cleanly.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] px-3.5 py-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.14)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                {metric.label}
              </p>
              <p className="mt-2 text-[1.02rem] font-extrabold tracking-[-0.03em] text-text">
                {metric.value}
              </p>
              <p className="mt-1.5 text-sm leading-5.5 text-sub">{metric.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </OpsPanel>
  );
}
