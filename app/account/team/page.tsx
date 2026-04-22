"use client";

import { useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountInvitePanel from "@/components/accounts/AccountInvitePanel";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { OpsMetricCard } from "@/components/layout/ops/OpsPrimitives";

function AccountTeamContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const [teamState, setTeamState] = useState({
    memberCount: 0,
    pendingInviteCount: 0,
  });

  if (!primaryAccount) {
    return null;
  }

  return (
    <PortalPageFrame
      eyebrow="Workspace team"
      title="Team and invites"
      description="Manage the first workspace members from the account layer instead of burying invite logic inside project-only surfaces."
      statusBand={
        <div className="grid gap-4 md:grid-cols-3">
          <OpsMetricCard label="Workspace" value={primaryAccount.name} emphasis="primary" />
          <OpsMetricCard label="Members" value={teamState.memberCount || 1} />
          <OpsMetricCard
            label="Pending invites"
            value={teamState.pendingInviteCount}
            emphasis={teamState.pendingInviteCount ? "warning" : "default"}
          />
        </div>
      }
    >
      <AccountInvitePanel accountId={primaryAccount.id} onStateChange={setTeamState} />
    </PortalPageFrame>
  );
}

export default function AccountTeamPage() {
  return (
    <AdminShell>
      <AccountTeamContent />
    </AdminShell>
  );
}
