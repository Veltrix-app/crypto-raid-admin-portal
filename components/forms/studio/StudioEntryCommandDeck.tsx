"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, Layers3 } from "lucide-react";

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
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.08),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(0,255,163,0.05),transparent_22%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.965))] p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.011)_1px,transparent_1px)] bg-[length:60px_60px] opacity-[0.28]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] xl:items-center">
        <div className="min-w-0">
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
        </div>

        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 rounded-[13px] border border-white/[0.024] bg-white/[0.014] px-3 py-2"
              >
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
                  {metric.label}
                </p>
                <p className="mt-1 truncate text-[12px] font-semibold text-text">
                  {metric.value}
                </p>
              </div>
            ))}
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

      {projectName ? (
        <div className="relative mt-3 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2 text-[11px] leading-5 text-sub">
          Active project: <span className="font-semibold text-text">{projectName}</span>
        </div>
      ) : null}
    </section>
  );
}
