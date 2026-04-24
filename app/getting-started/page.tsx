"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountBootstrapCard from "@/components/accounts/AccountBootstrapCard";
import AccountOnboardingChecklist from "@/components/accounts/AccountOnboardingChecklist";
import ReceivedWorkspaceInvitesCard from "@/components/accounts/ReceivedWorkspaceInvitesCard";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import { OpsMetricCard, OpsPanel, OpsPriorityLink, OpsSnapshotRow } from "@/components/layout/ops/OpsPrimitives";
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
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <OpsPanel
            eyebrow="Onboarding posture"
            title="Keep the first-run path obvious"
            description="The first-run rail should make it clear what already exists, what is still missing and what move unlocks the operational product next."
          >
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
          </OpsPanel>

          <OpsPanel
            eyebrow="Next move"
            title={
              primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
                ? "Open the launch workspace"
                : primaryAccount?.projectCount
                  ? "Create or open the next project"
                  : primaryAccount
                    ? "Create the first project"
                    : "Create the workspace account"
            }
            description={
              primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
                ? "The account layer is in place. The next clean handoff is launch setup inside the first project."
                : primaryAccount?.projectCount
                  ? "The account layer exists, so the next move is inside the project roster and launch flow."
                  : primaryAccount
                    ? "The workspace now exists above projects. The next move is to create the first operational project."
                    : "This session is authenticated, but still needs the workspace account that sits above every project."
            }
            tone="accent"
          >
            <div className="space-y-3">
              <OpsSnapshotRow
                label="Workspace state"
                value={primaryAccount ? `${primaryAccount.status} / ${primaryAccount.role}` : "Awaiting bootstrap"}
              />
              <OpsSnapshotRow
                label="First project"
                value={primaryAccount?.firstProjectName ?? "Not created yet"}
              />
              <OpsPriorityLink
                href={
                  primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
                    ? `/projects/${primaryAccount.firstProjectId}/launch`
                    : primaryAccount
                      ? "/projects"
                      : "/getting-started"
                }
                title="Continue on the onboarding spine"
                body="This page should always hand you to the next safe operator move instead of leaving you to browse the full portal tree."
                cta="Continue"
                emphasis
              />
            </div>
          </OpsPanel>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <ReceivedWorkspaceInvitesCard />
          {accessState?.overview?.needsWorkspaceBootstrap ? <AccountBootstrapCard /> : null}
        </div>

        <OpsPanel
          eyebrow="Why this page exists"
          title="Orientation before depth"
          description="Getting Started should feel like a guided rail, not a second dashboard. It exists to move the workspace from identity into the first real launch surface."
        >
          <div className="space-y-3">
            <OpsSnapshotRow
              label="What this page owns"
              value="Workspace bootstrap, first project handoff and the account-level activation read."
            />
            <OpsSnapshotRow
              label="What comes after"
              value="Once the first project exists, the clean path is Launch, then the project workspace and team surfaces."
            />
          </div>
        </OpsPanel>
      </div>

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
