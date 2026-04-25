"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { OpsMetricCard, OpsPriorityLink, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { SuccessOverviewPanel } from "@/components/success/SuccessOverviewPanel";
import { SuccessQueueTable, type SuccessQueueFilters } from "@/components/success/SuccessQueueTable";
import type { AdminSuccessOverview } from "@/types/entities/success";

const defaultFilters: SuccessQueueFilters = {
  search: "",
  workspaceHealthState: "",
  successHealthState: "",
};

export default function SuccessPage() {
  const [overview, setOverview] = useState<AdminSuccessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SuccessQueueFilters>(defaultFilters);

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/success/overview", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; overview?: AdminSuccessOverview; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.overview) {
        throw new Error(payload?.error ?? "Failed to load success overview.");
      }

      setOverview(payload.overview);
    } catch (nextError) {
      setOverview(null);
      setError(nextError instanceof Error ? nextError.message : "Failed to load success overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const topRiskAccount = useMemo(() => overview?.riskAccounts[0] ?? overview?.stalledAccounts[0] ?? null, [overview]);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Customer success"
        title="Success"
        description="Run activation, follow-up, expansion and churn posture from one shared success cockpit instead of splitting it across billing, onboarding and support."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">Success posture</p>
            <p className="text-base font-extrabold text-text">
              {overview?.counts.totalAccounts ?? 0} tracked accounts
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "success"}>
                {(overview?.counts.stalled ?? 0) > 0 ? "Stalled accounts present" : "Activation rail clear"}
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Accounts" value={loading ? "..." : overview?.counts.totalAccounts ?? 0} />
              <OpsMetricCard label="Stalled" value={loading ? "..." : overview?.counts.stalled ?? 0} emphasis={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Expansion" value={loading ? "..." : overview?.counts.expansionReady ?? 0} emphasis={(overview?.counts.expansionReady ?? 0) > 0 ? "primary" : "default"} />
              <OpsMetricCard label="Churn risk" value={loading ? "..." : overview?.counts.churnRisk ?? 0} emphasis={(overview?.counts.churnRisk ?? 0) > 0 ? "warning" : "default"} />
            </div>

            <div className="rounded-[20px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(18,24,36,0.82),rgba(12,16,24,0.92))] px-3.5 py-3.5 shadow-[0_10px_34px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Success command read
                  </p>
                  <h2 className="mt-1.5 text-[0.94rem] font-semibold tracking-tight text-text">
                    Read activation drag first, then decide whether the next move is rescue, expansion, or billing alignment.
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-sub">
                    This cockpit works best when it answers where customers are stalling, who deserves named follow-up next, and which accounts are quietly becoming expansion or churn stories.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "success"}>
                    {overview?.counts.stalled ?? 0} stalled
                  </OpsStatusPill>
                  <OpsStatusPill tone={(overview?.counts.expansionReady ?? 0) > 0 ? "success" : "default"}>
                    {overview?.counts.expansionReady ?? 0} expansion-ready
                  </OpsStatusPill>
                  <OpsStatusPill tone={(overview?.counts.churnRisk ?? 0) > 0 ? "warning" : "default"}>
                    {overview?.counts.churnRisk ?? 0} churn-risk
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-3.5 grid gap-2.5 lg:grid-cols-3">
                <OpsSnapshotRow
                  label="Now"
                  value={
                    (overview?.counts.stalled ?? 0) > 0
                      ? `${overview?.counts.stalled ?? 0} accounts are stalled in activation`
                      : "Activation flow looks calm right now"
                  }
                />
                <OpsSnapshotRow
                  label="Next"
                  value={
                    topRiskAccount
                      ? `Open ${topRiskAccount.accountName} as the next named success follow-up`
                      : "No urgent account is bubbling to the top"
                  }
                />
                <OpsSnapshotRow
                  label="Watch"
                  value={
                    (overview?.counts.expansionReady ?? 0) > 0
                      ? `${overview?.counts.expansionReady ?? 0} accounts are leaning toward expansion`
                      : "Expansion pressure is currently modest"
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <SuccessOverviewPanel overview={overview} loading={loading} error={error} />

        <div className="grid gap-4 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
          <SuccessQueueTable
            accounts={overview?.accounts ?? []}
            filters={filters}
            loading={loading}
            onFiltersChange={setFilters}
          />

          <div className="space-y-4">
            <OpsPriorityLink
              href={topRiskAccount ? `/success/accounts/${topRiskAccount.accountId}` : "/success"}
              title="Open the next account that needs a named owner"
              body={
                topRiskAccount
                  ? `${topRiskAccount.accountName} currently needs the sharpest follow-up.`
                  : "The queue is clear right now."
              }
              cta={topRiskAccount ? "Open account" : "Queue clear"}
              emphasis={Boolean(topRiskAccount)}
            />

            <OpsPriorityLink
              href="/getting-started"
              title="Check the customer-facing activation rail"
              body="Use the same success truth to verify that the customer-facing next moves still read clearly."
              cta="Open getting started"
            />

            <OpsPriorityLink
              href="/business"
              title="Cross-check billing pressure"
              body="Expansion and churn signals should stay aligned with the business cockpit rather than drifting into separate narratives."
              cta="Open business"
            />
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
