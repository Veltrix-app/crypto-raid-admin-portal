"use client";

import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { AdminSecurityOverview } from "@/types/entities/security";

export function SecurityOverviewPanel({
  overview,
}: {
  overview: AdminSecurityOverview;
}) {
  return (
    <OpsPanel
      eyebrow="Security overview"
      title="Global security posture"
      description="Track how enterprise identity, 2FA, session review and compliance posture are behaving across accounts."
    >
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <OpsMetricCard label="Accounts" value={overview.counts.accounts} />
        <OpsMetricCard
          label="Enterprise hardened"
          value={overview.counts.enterpriseHardenedAccounts}
        />
        <OpsMetricCard label="Weak posture" value={overview.counts.weakPostureAccounts} />
        <OpsMetricCard label="Active sessions" value={overview.counts.activeSessions} />
        <OpsMetricCard label="Open data requests" value={overview.counts.openDataRequests} />
      </div>
    </OpsPanel>
  );
}
