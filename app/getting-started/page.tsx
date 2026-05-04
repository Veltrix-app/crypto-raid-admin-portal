"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountBootstrapCard from "@/components/accounts/AccountBootstrapCard";
import AccountOnboardingChecklist from "@/components/accounts/AccountOnboardingChecklist";
import ReceivedWorkspaceInvitesCard from "@/components/accounts/ReceivedWorkspaceInvitesCard";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import {
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import {
  PROJECT_FIRST_RUN_STEPS,
  ProjectOnboardingStepGrid,
} from "@/components/projects/onboarding/ProjectOnboardingPrimitives";
import { fetchCurrentPortalAccountActivation } from "@/lib/success/account-activation";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";

function GettingStartedContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const [activationSummary, setActivationSummary] = useState<AdminSuccessAccountSummary | null>(null);
  const needsEntryAction = Boolean(
    accessState?.overview?.needsWorkspaceBootstrap || accessState?.overview?.invites?.length
  );
  const currentStepLabel = (primaryAccount?.currentStep ?? "create_workspace").replaceAll("_", " ");
  const projectCount = primaryAccount?.projectCount ?? 0;

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
      description="A focused entry path: workspace first, first project second, then launch setup."
      actions={
        <div className="flex min-w-[220px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sub">
              Current step
            </p>
            <p className="mt-1 truncate text-[0.92rem] font-semibold text-text">
              {currentStepLabel}
            </p>
          </div>
          <OpsStatusPill tone={primaryAccount ? "success" : "warning"}>
            {projectCount} project{projectCount === 1 ? "" : "s"}
          </OpsStatusPill>
        </div>
      }
    >
      {needsEntryAction ? (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] xl:items-start">
          <div className="space-y-3">
            <ReceivedWorkspaceInvitesCard />
            {accessState?.overview?.needsWorkspaceBootstrap ? <AccountBootstrapCard /> : null}
          </div>

          <OpsPanel
            eyebrow="Page role"
            title="One job: unlock the workspace"
            description="Once this account layer exists, the page gets out of the way and sends the team into project setup."
          >
            <div className="space-y-2.5">
              <OpsSnapshotRow
                label="Now"
                value="Accept an invite or create the workspace account."
              />
              <OpsSnapshotRow
                label="Next"
                value="Create the first project and open Launch."
              />
            </div>
          </OpsPanel>
        </div>
      ) : null}

      <AccountOnboardingChecklist />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] xl:items-start">
        <OpsPanel
          eyebrow="First project path"
          title="What unlocks after the workspace exists"
          description="The same language appears in project creation and Launch so teams do not feel moved between separate products."
        >
          <ProjectOnboardingStepGrid steps={PROJECT_FIRST_RUN_STEPS} />
        </OpsPanel>

        {activationSummary ? (
          <SuccessActivationRail
            summary={activationSummary}
            eyebrow="Activation truth"
            title="What still needs to happen"
            description="Customer-facing activation truth from the same success model the internal team sees."
          />
        ) : null}
      </div>
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
