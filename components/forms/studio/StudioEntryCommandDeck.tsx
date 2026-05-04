"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Flag,
  Layers3,
  Sparkles,
} from "lucide-react";

type StudioEntryMetric = {
  label: string;
  value: string;
};

type StudioEntryCommandDeckProps = {
  studio: string;
  title: string;
  description: string;
  projectName?: string;
  entrySourceLabel?: string;
  returnHref?: string | null;
  metrics: StudioEntryMetric[];
  builderAnchor?: string;
};

export default function StudioEntryCommandDeck({
  studio,
  title,
  description,
  projectName,
  entrySourceLabel,
  returnHref,
  metrics,
  builderAnchor = "studio-builder",
}: StudioEntryCommandDeckProps) {
  const missingMetric = metrics.find((metric) =>
    ["choose", "missing", "needed"].includes(metric.value.trim().toLowerCase())
  );
  const optionalMetric = metrics.find((metric) => metric.value.trim().toLowerCase() === "optional");
  const readyMetricCount = metrics.filter(
    (metric) =>
      metric.value.trim() &&
      !["choose", "missing", "needed", "optional"].includes(metric.value.trim().toLowerCase())
  ).length;
  const readinessLabel = missingMetric
    ? `Set ${missingMetric.label.toLowerCase()}`
    : optionalMetric
      ? `Review ${optionalMetric.label.toLowerCase()}`
      : "Ready to build";
  const workflowSteps = getStudioWorkflow(studio);

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.08),transparent_25%),radial-gradient(circle_at_88%_10%,rgba(78,216,255,0.052),transparent_22%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.965))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.011)_1px,transparent_1px)] bg-[length:60px_60px] opacity-[0.28]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.34fr)] xl:items-stretch">
        <div className="min-w-0 rounded-[18px] border border-white/[0.022] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/[0.16] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              <Layers3 size={12} />
              {studio}
            </span>
            {entrySourceLabel ? (
              <span className="rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
                From {entrySourceLabel}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-[1rem] font-semibold tracking-[-0.025em] text-text md:text-[1.18rem]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
            {description}
          </p>

          <div className="mt-3 grid gap-2.5 md:grid-cols-3">
            {metrics.map((metric) => {
              const value = metric.value.trim();
              const lowered = value.toLowerCase();
              const ready = value && !["choose", "missing", "needed", "optional"].includes(lowered);
              const optional = lowered === "optional";

              return (
                <div
                  key={metric.label}
                  className={`min-w-0 rounded-[14px] border px-3 py-2.5 ${
                    ready
                      ? "border-primary/[0.12] bg-primary/[0.04]"
                      : optional
                        ? "border-white/[0.028] bg-white/[0.014]"
                        : "border-amber-300/[0.12] bg-amber-300/[0.035]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
                      {metric.label}
                    </p>
                    {ready ? (
                      <CheckCircle2 size={13} className="shrink-0 text-primary" />
                    ) : (
                      <CircleAlert
                        size={13}
                        className={optional ? "shrink-0 text-sub" : "shrink-0 text-amber-300"}
                      />
                    )}
                  </div>
                  <p className="mt-1 truncate text-[12px] font-semibold text-text">
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Next decision
              </p>
              <p className="mt-1.5 truncate text-[0.95rem] font-semibold text-text">
                {readinessLabel}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-sub">
                {readyMetricCount}/{metrics.length} context signals are ready before the builder.
              </p>
            </div>
            <Sparkles size={17} className="shrink-0 text-primary" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`#${builderAnchor}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[11px] font-black text-black transition hover:brightness-105"
            >
              Continue builder
              <ArrowDown size={13} />
            </Link>
            {returnHref ? (
              <Link
                href={returnHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3.5 py-2 text-[11px] font-black text-text transition hover:bg-white/[0.035]"
              >
                Back to workspace
                <ArrowUpRight size={13} className="text-primary" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid gap-2.5 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <div
            key={step.label}
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-[14px] border border-white/[0.022] bg-white/[0.012] px-3 py-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/[0.12] bg-primary/[0.045] text-[10px] font-black text-primary">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-text">{step.label}</p>
              <p className="mt-0.5 truncate text-[10px] text-sub">{step.body}</p>
            </div>
            {index === workflowSteps.length - 1 ? (
              <Flag size={13} className="shrink-0 text-primary" />
            ) : (
              <ArrowRight size={13} className="shrink-0 text-sub" />
            )}
          </div>
        ))}
      </div>

      {projectName ? (
        <div className="relative mt-3 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2 text-[11px] leading-5 text-sub">
          Active project: <span className="font-semibold text-text">{projectName}</span>
        </div>
      ) : null}
    </section>
  );
}

function getStudioWorkflow(studio: string) {
  const normalizedStudio = studio.toLowerCase();

  if (normalizedStudio.includes("raid")) {
    return [
      { label: "Place route", body: "Project and campaign context" },
      { label: "Set pressure", body: "Action, proof and urgency" },
      { label: "Launch raid", body: "Submit into raid ops" },
    ];
  }

  if (normalizedStudio.includes("quest")) {
    return [
      { label: "Place route", body: "Project and campaign context" },
      { label: "Shape action", body: "Task, verification and reward" },
      { label: "Publish quest", body: "Submit member action" },
    ];
  }

  return [
    { label: "Place route", body: "Project, source and template" },
    { label: "Shape lane", body: "Story, missions and rewards" },
    { label: "Create campaign", body: "Submit launch-ready lane" },
  ];
}
