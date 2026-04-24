"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { GrowthOverviewPanel } from "@/components/growth/GrowthOverviewPanel";
import { LeadQueuePanel } from "@/components/growth/LeadQueuePanel";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { OpsMetricCard, OpsPriorityLink, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { AdminGrowthOverview } from "@/types/entities/growth-sales";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function GrowthPage() {
  const role = useAdminAuthStore((s) => s.role);
  const [overview, setOverview] = useState<AdminGrowthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/growth/overview", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; overview?: AdminGrowthOverview; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.overview) {
          throw new Error(payload?.error ?? "Failed to load growth overview.");
        }

        if (!cancelled) {
          setOverview(payload.overview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(loadError instanceof Error ? loadError.message : "Failed to load growth overview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void loadOverview();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshNonce, role]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Growth is internal-only"
          description="This commercial workspace is reserved for Veltrix super admins because it exposes cross-account lead and buyer context."
          tone="warning"
          actions={
            <Link
              href="/overview"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to overview
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading growth workspace"
          description="Veltrix is resolving leads, buyer requests and follow-up tasks into the internal commercial cockpit."
        />
      </AdminShell>
    );
  }

  if (error || !overview) {
    return (
      <AdminShell>
        <StatePanel
          title="Growth workspace could not load"
          description={error ?? "The commercial workspace did not return an overview payload."}
          tone="warning"
          actions={
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Retry
            </button>
          }
        />
      </AdminShell>
    );
  }

  const topLead = overview.evaluationLeads[0] ?? overview.engagedLeads[0] ?? overview.newLeads[0] ?? null;

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Commercial ops"
        title="Growth"
        description="Run the market machine from one internal queue: high-intent buyers, enterprise requests, follow-up and converted context."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Veltrix internal</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={(overview.counts.evaluation ?? 0) > 0 ? "warning" : "default"}>
                {overview.counts.evaluation} in evaluation
              </OpsStatusPill>
              <OpsStatusPill tone={(overview.counts.dueNowTasks ?? 0) > 0 ? "warning" : "success"}>
                {overview.counts.dueNowTasks} tasks due now
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="New leads" value={overview.counts.new} emphasis={overview.counts.new > 0 ? "primary" : "default"} />
              <OpsMetricCard label="Evaluation" value={overview.counts.evaluation} emphasis={overview.counts.evaluation > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Due now" value={overview.counts.dueNowTasks} emphasis={overview.counts.dueNowTasks > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Converted" value={overview.counts.converted} emphasis={overview.counts.converted > 0 ? "primary" : "default"} />
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.92))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Growth command read
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                    Read buyer intent first, then decide whether the next move is follow-up, enterprise handling, or self-serve conversion pressure.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    This workspace should tell you which commercial conversations are heating up, where human follow-up is late, and when a lead should stay in the queue versus move into Business or Success.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={overview.counts.evaluation > 0 ? "warning" : "default"}>
                    {overview.counts.evaluation} evaluating
                  </OpsStatusPill>
                  <OpsStatusPill tone={overview.counts.dueNowTasks > 0 ? "warning" : "success"}>
                    {overview.counts.dueNowTasks} follow-ups due
                  </OpsStatusPill>
                  <OpsStatusPill tone={overview.counts.converted > 0 ? "success" : "default"}>
                    {overview.counts.converted} converted
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <OpsSnapshotRow
                  label="Now"
                  value={
                    overview.counts.evaluation > 0
                      ? `${overview.counts.evaluation} leads are in active evaluation`
                      : "No lead is in a hot evaluation lane right now"
                  }
                />
                <OpsSnapshotRow
                  label="Next"
                  value={
                    topLead
                      ? `Open ${topLead.companyName || topLead.contactName} as the next commercial lead`
                      : "The queue is calm right now"
                  }
                />
                <OpsSnapshotRow
                  label="Watch"
                  value={
                    overview.counts.dueNowTasks > 0
                      ? `${overview.counts.dueNowTasks} follow-up tasks are already due`
                      : "Follow-up timing looks healthy"
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <GrowthOverviewPanel overview={overview} loading={loading} />

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <LeadQueuePanel overview={overview} loading={loading} />

          <div className="space-y-6">
            <OpsPriorityLink
              href={topLead ? `/growth/leads/${topLead.id}` : "/growth"}
              title="Open the next lead that needs a human move"
              body={
                topLead
                  ? `${topLead.companyName || topLead.contactName} is the next commercial lead with real motion behind it.`
                  : "The queue is calm right now."
              }
              cta={topLead ? "Open lead" : "Queue clear"}
              emphasis={Boolean(topLead)}
            />

            <OpsPriorityLink
              href="/business"
              title="Cross-check commercial pressure"
              body="Use Business when a lead is already a customer account and the next question is billing, pressure or collections."
              cta="Open business"
            />

            <OpsPriorityLink
              href="/success"
              title="Cross-check expansion and activation"
              body="Use Success when the commercial next step depends on product activation, drift or expansion posture."
              cta="Open success"
            />
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
