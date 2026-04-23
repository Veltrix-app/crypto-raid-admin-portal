"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountBootstrapCard from "@/components/accounts/AccountBootstrapCard";
import AccountOnboardingChecklist from "@/components/accounts/AccountOnboardingChecklist";
import ReceivedWorkspaceInvitesCard from "@/components/accounts/ReceivedWorkspaceInvitesCard";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import { OpsMetricCard } from "@/components/layout/ops/OpsPrimitives";
import { fetchCurrentPortalAccountActivation } from "@/lib/success/account-activation";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";

function GettingStartedContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const [activationSummary, setActivationSummary] = useState<AdminSuccessAccountSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivation() {
      try {
        const payload = await fetchCurrentPortalAccountActivation();
        if (!active) {
          return;
        }

        setActivationSummary(payload.summary);
      } catch {
        if (!active) {
          return;
        }

        setActivationSummary(null);
      }
    }

    void loadActivation();

    return () => {
      active = false;
    };
  }, []);

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
      {activationSummary ? (
        <SuccessActivationRail
          summary={activationSummary}
          eyebrow="Activation truth"
          title="What still needs to happen before this workspace is truly live"
          description="This is the customer-facing read of the same success model the internal team sees in `/success`."
        />
      ) : null}
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
