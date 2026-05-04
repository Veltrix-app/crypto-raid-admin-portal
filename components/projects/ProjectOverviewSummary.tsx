"use client";

import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

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
  const leadMetrics = metrics.slice(0, 3);
  const supportMetrics = metrics.slice(3);

  return (
    <section className={`relative overflow-hidden rounded-[20px] border border-white/[0.022] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.045),transparent_26%),linear-gradient(180deg,rgba(11,14,20,0.93),rgba(7,9,14,0.9))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.11)] ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)]" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(250px,0.48fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone="default">Overview</OpsStatusPill>
            <OpsStatusPill tone="success">Workspace read</OpsStatusPill>
          </div>
          <h2 className="mt-2.5 break-words text-[1.02rem] font-semibold tracking-[-0.03em] text-text [overflow-wrap:anywhere]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
            {description}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          {leadMetrics.map((metric) => (
            <ProjectOverviewMetricTile key={metric.label} metric={metric} emphasis />
          ))}
        </div>
      </div>

      {supportMetrics.length > 0 ? (
        <div className="relative mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {supportMetrics.map((metric) => (
            <ProjectOverviewMetricTile key={metric.label} metric={metric} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ProjectOverviewMetricTile({
  metric,
  emphasis = false,
}: {
  metric: ProjectOverviewMetric;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-[14px] border px-3 py-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.075)] ${
        emphasis
          ? "border-primary/[0.12] bg-primary/[0.032]"
          : "border-white/[0.016] bg-white/[0.01]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
        {metric.label}
      </p>
      <p className="mt-1.5 break-words text-[0.92rem] font-semibold tracking-[-0.03em] text-text [overflow-wrap:anywhere]">
        {metric.value}
      </p>
      <p className="mt-1 line-clamp-2 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
        {metric.sublabel}
      </p>
    </div>
  );
}
