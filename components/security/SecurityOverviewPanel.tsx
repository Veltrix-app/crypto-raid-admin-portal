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
      tone="accent"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <OpsMetricCard label="Accounts" value={overview.counts.accounts} />
        <OpsMetricCard
          label="Enterprise hardened"
          value={overview.counts.enterpriseHardenedAccounts}
        />
        <OpsMetricCard
          label="Weak posture"
          value={overview.counts.weakPostureAccounts}
          emphasis={overview.counts.weakPostureAccounts > 0 ? "warning" : "default"}
        />
        <OpsMetricCard label="Active sessions" value={overview.counts.activeSessions} />
        <OpsMetricCard
          label="Open data requests"
          value={overview.counts.openDataRequests}
          emphasis={overview.counts.openDataRequests > 0 ? "warning" : "default"}
        />
      </div>
    </OpsPanel>
  );
}
