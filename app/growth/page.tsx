"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { GrowthOverviewPanel } from "@/components/growth/GrowthOverviewPanel";
import { LeadQueuePanel } from "@/components/growth/LeadQueuePanel";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { OpsPriorityLink, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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
