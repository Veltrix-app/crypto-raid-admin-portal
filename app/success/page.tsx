"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { OpsMetricCard, OpsPriorityLink, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Success posture</p>
            <p className="text-lg font-extrabold text-text">
              {overview?.counts.totalAccounts ?? 0} tracked accounts
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "success"}>
                {(overview?.counts.stalled ?? 0) > 0 ? "Stalled accounts present" : "Activation rail clear"}
              </OpsStatusPill>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Accounts" value={loading ? "..." : overview?.counts.totalAccounts ?? 0} />
          <OpsMetricCard label="Stalled" value={loading ? "..." : overview?.counts.stalled ?? 0} emphasis={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Expansion" value={loading ? "..." : overview?.counts.expansionReady ?? 0} emphasis={(overview?.counts.expansionReady ?? 0) > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Churn risk" value={loading ? "..." : overview?.counts.churnRisk ?? 0} emphasis={(overview?.counts.churnRisk ?? 0) > 0 ? "warning" : "default"} />
        </div>

        <SuccessOverviewPanel overview={overview} loading={loading} error={error} />

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SuccessQueueTable
            accounts={overview?.accounts ?? []}
            filters={filters}
            loading={loading}
            onFiltersChange={setFilters}
          />

          <div className="space-y-6">
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
