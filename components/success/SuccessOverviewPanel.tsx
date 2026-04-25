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
        <div className="rounded-[18px] border border-white/[0.035] bg-white/[0.018] px-4 py-3 text-sm text-sub">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2.5 md:grid-cols-4 xl:grid-cols-8">
        <OpsMetricCard label="Accounts" value={loading ? "..." : overview?.counts.totalAccounts ?? 0} />
        <OpsMetricCard label="Not started" value={loading ? "..." : overview?.counts.notStarted ?? 0} />
        <OpsMetricCard label="Activating" value={loading ? "..." : overview?.counts.activating ?? 0} />
        <OpsMetricCard label="Stalled" value={loading ? "..." : overview?.counts.stalled ?? 0} />
        <OpsMetricCard label="Live" value={loading ? "..." : overview?.counts.live ?? 0} />
        <OpsMetricCard label="Expansion" value={loading ? "..." : overview?.counts.expansionReady ?? 0} />
        <OpsMetricCard label="Churn risk" value={loading ? "..." : overview?.counts.churnRisk ?? 0} />
        <OpsMetricCard label="Member drift" value={loading ? "..." : overview?.counts.memberDrift ?? 0} />
      </div>

      {overview?.stalledAccounts.length ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {overview.stalledAccounts.slice(0, 3).map((account) => (
            <Link
              key={account.accountId}
              href={`/success/accounts/${account.accountId}`}
              className="rounded-[18px] border border-white/[0.025] bg-white/[0.014] p-4 transition hover:border-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{account.accountName}</p>
                <OpsStatusPill tone="default">
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
