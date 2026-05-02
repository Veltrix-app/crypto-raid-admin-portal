"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { OpsCommandRead, OpsMetricCard, OpsPriorityLink, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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
              <OpsStatusPill tone="default">
                {(overview?.counts.stalled ?? 0) > 0 ? "Stalled accounts present" : "Activation rail clear"}
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Accounts" value={loading ? "..." : overview?.counts.totalAccounts ?? 0} />
              <OpsMetricCard label="Stalled" value={loading ? "..." : overview?.counts.stalled ?? 0} />
              <OpsMetricCard label="Expansion" value={loading ? "..." : overview?.counts.expansionReady ?? 0} />
              <OpsMetricCard label="Churn risk" value={loading ? "..." : overview?.counts.churnRisk ?? 0} />
            </div>

            <OpsCommandRead
              eyebrow="Success command read"
              title="Read activation drag first, then decide whether the next move is rescue, expansion, or billing alignment."
              description="This cockpit works best when it answers where customers are stalling, who deserves named follow-up next, and which accounts are quietly becoming expansion or churn stories."
              now={
                (overview?.counts.stalled ?? 0) > 0
                  ? `${overview?.counts.stalled ?? 0} accounts are stalled in activation`
                  : "Activation flow looks calm right now"
              }
              next={
                topRiskAccount
                  ? `Open ${topRiskAccount.accountName} as the next named success follow-up`
                  : "No urgent account is bubbling to the top"
              }
              watch={
                (overview?.counts.expansionReady ?? 0) > 0
                  ? `${overview?.counts.expansionReady ?? 0} accounts are leaning toward expansion`
                  : "Expansion pressure is currently modest"
              }
              rail={
                <div className="rounded-[18px] border border-white/[0.028] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary/90">
                    Success posture
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <OpsStatusPill tone="default">
                      {overview?.counts.stalled ?? 0} stalled
                    </OpsStatusPill>
                    <OpsStatusPill tone="default">
                      {overview?.counts.expansionReady ?? 0} expansion-ready
                    </OpsStatusPill>
                    <OpsStatusPill tone="default">
                      {overview?.counts.churnRisk ?? 0} churn-risk
                    </OpsStatusPill>
                  </div>
                </div>
              }
            />
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
