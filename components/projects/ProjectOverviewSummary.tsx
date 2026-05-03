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
  className?: string;
};

export default function ProjectOverviewSummary({
  title,
  description,
  metrics,
  className,
}: ProjectOverviewSummaryProps) {
  return (
    <OpsPanel eyebrow="Overview" title={title} description={description} className={className}>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 rounded-[14px] border border-white/[0.016] bg-white/[0.01] px-3 py-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.075)]"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
                {metric.label}
              </p>
              <p className="mt-1.5 break-words text-[0.92rem] font-semibold tracking-[-0.03em] text-text [overflow-wrap:anywhere]">
                {metric.value}
              </p>
              <p className="mt-1 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">{metric.sublabel}</p>
            </div>
          ))}
      </div>
    </OpsPanel>
  );
}
