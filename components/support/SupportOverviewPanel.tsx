"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { AdminSupportOverview } from "@/types/entities/support";

export function SupportOverviewPanel({
  overview,
  loading,
  error,
}: {
  overview: AdminSupportOverview | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <OpsPanel
      eyebrow="Support operations"
      title="Queue and incident posture"
      description="Keep the incoming queue, waiting states, escalations and live service incidents visible from one internal control layer."
      action={
        overview ? (
          <OpsStatusPill tone={overview.counts.activeIncidents > 0 ? "warning" : "success"}>
            {overview.counts.activeIncidents > 0 ? "Active incidents" : "No live incidents"}
          </OpsStatusPill>
        ) : null
      }
    >
      {error ? (
        <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/[0.055] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
        <OpsMetricCard label="Open" value={loading ? "..." : overview?.counts.totalOpen ?? 0} />
        <OpsMetricCard
          label="New"
          value={loading ? "..." : overview?.counts.new ?? 0}
          emphasis={(overview?.counts.new ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard label="Triaging" value={loading ? "..." : overview?.counts.triaging ?? 0} />
        <OpsMetricCard
          label="Waiting customer"
          value={loading ? "..." : overview?.counts.waitingOnCustomer ?? 0}
        />
        <OpsMetricCard
          label="Waiting internal"
          value={loading ? "..." : overview?.counts.waitingOnInternal ?? 0}
        />
        <OpsMetricCard
          label="Escalated"
          value={loading ? "..." : overview?.counts.escalated ?? 0}
          emphasis={(overview?.counts.escalated ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Resolved today"
          value={loading ? "..." : overview?.counts.resolvedToday ?? 0}
          emphasis={(overview?.counts.resolvedToday ?? 0) > 0 ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Active incidents"
          value={loading ? "..." : overview?.counts.activeIncidents ?? 0}
          emphasis={(overview?.counts.activeIncidents ?? 0) > 0 ? "warning" : "default"}
        />
      </div>

      {overview?.activeIncidents.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.activeIncidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/support/incidents/${incident.id}`}
              className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4 transition hover:border-primary/30 hover:bg-primary/8"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {incident.componentLabel}
                </p>
                <OpsStatusPill tone={incident.state === "resolved" ? "success" : "warning"}>
                  {incident.state.replaceAll("_", " ")}
                </OpsStatusPill>
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-text">{incident.title}</h3>
              <p className="mt-3 text-sm leading-6 text-sub">{incident.publicSummary}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Open incident
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </OpsPanel>
  );
}
