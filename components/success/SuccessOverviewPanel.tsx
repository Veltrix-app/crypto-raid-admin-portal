"use client";

import Link from "next/link";
import {
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessOverview } from "@/types/entities/success";

export function SuccessOverviewPanel({
  overview,
  loading,
  error,
}: {
  overview: AdminSuccessOverview | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <OpsPanel
      eyebrow="Customer success"
      title="Activation and growth posture"
      description="This reads activation health, expansion readiness and churn pressure from one shared success truth."
    >
      {error ? (
        <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
        <OpsMetricCard label="Accounts" value={loading ? "..." : overview?.counts.totalAccounts ?? 0} />
        <OpsMetricCard label="Not started" value={loading ? "..." : overview?.counts.notStarted ?? 0} />
        <OpsMetricCard label="Activating" value={loading ? "..." : overview?.counts.activating ?? 0} />
        <OpsMetricCard
          label="Stalled"
          value={loading ? "..." : overview?.counts.stalled ?? 0}
          emphasis={(overview?.counts.stalled ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Live"
          value={loading ? "..." : overview?.counts.live ?? 0}
          emphasis={(overview?.counts.live ?? 0) > 0 ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Expansion"
          value={loading ? "..." : overview?.counts.expansionReady ?? 0}
          emphasis={(overview?.counts.expansionReady ?? 0) > 0 ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Churn risk"
          value={loading ? "..." : overview?.counts.churnRisk ?? 0}
          emphasis={(overview?.counts.churnRisk ?? 0) > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Member drift"
          value={loading ? "..." : overview?.counts.memberDrift ?? 0}
          emphasis={(overview?.counts.memberDrift ?? 0) > 0 ? "warning" : "default"}
        />
      </div>

      {overview?.stalledAccounts.length ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {overview.stalledAccounts.slice(0, 3).map((account) => (
            <Link
              key={account.accountId}
              href={`/success/accounts/${account.accountId}`}
              className="rounded-[22px] border border-line bg-card2 p-4 transition hover:border-primary/30 hover:bg-primary/8"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{account.accountName}</p>
                <OpsStatusPill tone="warning">
                  {humanizeSuccessValue(account.workspaceHealthState)}
                </OpsStatusPill>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">
                {account.blockers[0] ?? "This workspace needs a concrete next move."}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </OpsPanel>
  );
}
