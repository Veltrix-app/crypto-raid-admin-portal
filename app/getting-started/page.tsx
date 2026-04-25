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
import { fetchCurrentPortalAccountActivation } from "@/lib/success/account-activation";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";

function OnboardingStateTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.035] bg-white/[0.018] px-3 py-2.5">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[0.92rem] font-semibold tracking-[-0.02em] text-text">{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-sub">{detail}</p>
    </div>
  );
}

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
        <section className="rounded-[18px] border border-white/[0.035] bg-[linear-gradient(180deg,rgba(10,13,19,0.98),rgba(7,9,14,0.98))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
          <div className="grid gap-3 xl:items-start xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="max-w-3xl">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-primary">
                Onboarding map
              </p>
              <h2 className="mt-1.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                One clean path into launch
              </h2>
              <p className="mt-1.5 text-[12px] leading-5 text-sub">
                This page should read like a guided spine: account status, project handoff,
                checklist, then activation truth. No separate islands.
              </p>
            </div>

            <OpsSnapshotRow
              label="First project"
              value={primaryAccount?.firstProjectName ?? "Not created yet"}
            />
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-3">
            <OnboardingStateTile
              label="Workspace"
              value={primaryAccount?.name ?? "Pending"}
              detail={primaryAccount ? "Account layer exists." : "Create the workspace account first."}
            />
            <OnboardingStateTile
              label="Current step"
              value={primaryAccount?.currentStep ?? "create_workspace"}
              detail="This determines the next safe operator move."
            />
            <OnboardingStateTile
              label="Projects"
              value={primaryAccount?.projectCount ?? 0}
              detail={primaryAccount?.projectCount ? "Project handoff is available." : "No operational project yet."}
            />
          </div>
        </section>
      }
    >
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
