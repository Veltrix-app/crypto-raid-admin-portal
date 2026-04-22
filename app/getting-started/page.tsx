"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountBootstrapCard from "@/components/accounts/AccountBootstrapCard";
import AccountOnboardingChecklist from "@/components/accounts/AccountOnboardingChecklist";
import ReceivedWorkspaceInvitesCard from "@/components/accounts/ReceivedWorkspaceInvitesCard";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { OpsMetricCard } from "@/components/layout/ops/OpsPrimitives";

function GettingStartedContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;

  return (
    <PortalPageFrame
      eyebrow="Account onboarding"
      title="Getting Started"
      description="This workspace keeps the first-run path calm: create the account layer, create the first project, then move directly into launch operations."
      statusBand={
        <div className="grid gap-4 md:grid-cols-3">
          <OpsMetricCard
            label="Workspace"
            value={primaryAccount?.name ?? "Pending"}
            emphasis={primaryAccount ? "primary" : "warning"}
          />
          <OpsMetricCard
            label="Current step"
            value={primaryAccount?.currentStep ?? "create_workspace"}
            emphasis="warning"
          />
          <OpsMetricCard
            label="Projects"
            value={primaryAccount?.projectCount ?? 0}
            emphasis={primaryAccount?.projectCount ? "primary" : "default"}
          />
        </div>
      }
    >
      <ReceivedWorkspaceInvitesCard />
      {accessState?.overview?.needsWorkspaceBootstrap ? <AccountBootstrapCard /> : null}
      <AccountOnboardingChecklist />
    </PortalPageFrame>
  );
}

export default function GettingStartedPage() {
  return (
    <AdminShell>
      <GettingStartedContent />
    </AdminShell>
  );
}
