"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import AccountBootstrapCard from "@/components/accounts/AccountBootstrapCard";
import AccountOnboardingChecklist from "@/components/accounts/AccountOnboardingChecklist";
import ReceivedWorkspaceInvitesCard from "@/components/accounts/ReceivedWorkspaceInvitesCard";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import { OpsPanel, OpsSnapshotRow } from "@/components/layout/ops/OpsPrimitives";
import {
  PROJECT_FIRST_RUN_STEPS,
  ProjectOnboardingHero,
  ProjectOnboardingPriorityPill,
  ProjectOnboardingStepGrid,
} from "@/components/projects/onboarding/ProjectOnboardingPrimitives";
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
      description="Create the workspace account, create the first project, then move into a guided launch cockpit."
      statusBand={
        <ProjectOnboardingHero
          title="Move from account setup into the first live project."
          description="This page is the entry path for new teams. Complete the account step, create the first project, invite the right people, then continue inside Launch with a clear checklist."
          modeLabel={primaryAccount?.name ?? "Workspace not created yet"}
          outcomeLabel={primaryAccount?.firstProjectName ?? "First project not created yet"}
        >
          <div className="flex flex-wrap gap-2">
            <ProjectOnboardingPriorityPill priority="required">
              {(primaryAccount?.currentStep ?? "create_workspace").replaceAll("_", " ")}
            </ProjectOnboardingPriorityPill>
            <ProjectOnboardingPriorityPill priority={primaryAccount?.projectCount ? "complete" : "recommended"}>
              {primaryAccount?.projectCount ?? 0} project{primaryAccount?.projectCount === 1 ? "" : "s"}
            </ProjectOnboardingPriorityPill>
          </div>
        </ProjectOnboardingHero>
      }
    >
      <OpsPanel
        eyebrow="First project path"
        title="What the project will do after the workspace exists"
        description="This is the same language used in project creation and Launch, so onboarding feels like one product instead of separate setup screens."
        tone="accent"
      >
        <ProjectOnboardingStepGrid steps={PROJECT_FIRST_RUN_STEPS} />
      </OpsPanel>

      {accessState?.overview?.needsWorkspaceBootstrap || accessState?.overview?.invites?.length ? (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-4">
          <ReceivedWorkspaceInvitesCard />
          {accessState?.overview?.needsWorkspaceBootstrap ? <AccountBootstrapCard /> : null}
        </div>

        <OpsPanel
          eyebrow="Guidance"
          title="Orientation before depth"
          description="This page only exists to move the account into its first project and launch workspace."
        >
          <div className="space-y-3">
            <OpsSnapshotRow
              label="Owns"
              value="Workspace bootstrap and first project handoff."
            />
            <OpsSnapshotRow
              label="After"
              value="Launch, then project workspace and team surfaces."
            />
          </div>
        </OpsPanel>
      </div>
      ) : null}

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
