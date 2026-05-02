"use client";

import Link from "next/link";
import { Activity, ArrowRight, Rocket } from "lucide-react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

export default function LaunchHealthBoard({
  activeProjects,
  launchReadyProjects,
  activationRate,
  linkedReadinessRate,
  snapshotStale,
  latestPlatformSnapshotDate,
  latestProjectSnapshotDate,
}: {
  activeProjects: number;
  launchReadyProjects: number;
  activationRate: number;
  linkedReadinessRate: number;
  snapshotStale: boolean;
  latestPlatformSnapshotDate: string | null;
  latestProjectSnapshotDate: string | null;
}) {
  return (
    <OpsPanel
      eyebrow="Launch command"
      title="Launch posture"
      description="Readiness, activation, and data freshness in one scan before you drop into a queue."
      tone="accent"
      action={
        <OpsStatusPill tone={snapshotStale ? "warning" : "success"}>
          {snapshotStale ? "Snapshots stale" : "Snapshots fresh"}
        </OpsStatusPill>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricSurface
            icon={<Rocket size={16} />}
            label="Launch-ready projects"
            value={`${launchReadyProjects}`}
            sub={`${activeProjects} active project${activeProjects === 1 ? "" : "s"} in motion`}
          />
          <MetricSurface
            icon={<Activity size={16} />}
            label="Member activation"
            value={`${activationRate}%`}
            sub={`${linkedReadinessRate}% linked readiness across tracked members`}
          />
        </div>

        <div className="rounded-[18px] border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Snapshot posture
          </p>
          <div className="mt-4 space-y-3">
            <SnapshotRow label="Platform metrics" value={latestPlatformSnapshotDate ?? "Missing"} />
            <SnapshotRow label="Project metrics" value={latestProjectSnapshotDate ?? "Missing"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-[18px] border border-primary/30 bg-primary/[0.065] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
            >
              Open analytics
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-sub transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              Open projects
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function MetricSurface({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/[0.055]">
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{value}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{sub}</p>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
