"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { fetchCurrentPortalAccountActivation } from "@/lib/success/account-activation";
import { fetchCurrentPortalSecurityAccount } from "@/lib/security/security-actions";
import type { AdminCustomerGrowthSummary } from "@/types/entities/growth-analytics";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";
import type { PortalSecurityCurrentAccount } from "@/types/entities/security";

function AccountStateTile({
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

function AccountOverviewContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const [activationSummary, setActivationSummary] = useState<AdminSuccessAccountSummary | null>(null);
  const [growthSummary, setGrowthSummary] = useState<AdminCustomerGrowthSummary | null>(null);
  const [securitySummary, setSecuritySummary] = useState<PortalSecurityCurrentAccount | null>(null);
  const nextHref =
    primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
      ? `/projects/${primaryAccount.firstProjectId}/launch`
      : primaryAccount?.projectCount
      ? "/projects"
      : "/getting-started";
  const nextLabel =
    primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
      ? "Open launch workspace"
      : primaryAccount?.projectCount
        ? "Open projects"
        : "Continue onboarding";
  const nextBody =
    primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
      ? "The account is ready to hand into launch setup."
      : primaryAccount?.projectCount
        ? "Use the project roster as the next operating surface."
        : "Finish the first-run account path before deeper portal work.";

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

    async function loadGrowth() {
      try {
        const response = await fetch("/api/analytics/account/current", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              summary?: AdminCustomerGrowthSummary | null;
            }
          | null;

        if (!active) {
          return;
        }

        if (!response.ok || !payload?.ok) {
          setGrowthSummary(null);
          return;
        }

        setGrowthSummary(payload.summary ?? null);
      } catch {
        if (!active) {
          return;
        }

        setGrowthSummary(null);
      }
    }

    async function loadSecurity() {
      try {
        const payload = await fetchCurrentPortalSecurityAccount();
        if (!active) {
          return;
        }

        setSecuritySummary(payload);
      } catch {
        if (!active) {
          return;
        }

        setSecuritySummary(null);
      }
    }

    void loadActivation();
    void loadGrowth();
    void loadSecurity();

    return () => {
      active = false;
    };
  }, []);

  if (!primaryAccount) {
    return null;
  }

  return (
    <PortalPageFrame
      eyebrow="Workspace account"
      title="Account"
      description="This is the workspace layer above projects: identity, owner posture, onboarding state and the next clean route into the operational product."
      statusBand={
        <section className="rounded-[18px] border border-white/[0.035] bg-[linear-gradient(180deg,rgba(10,13,19,0.98),rgba(7,9,14,0.98))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
          <div className="grid gap-3 xl:items-start xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="max-w-3xl">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-primary">
                Account map
              </p>
              <h2 className="mt-1.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                Workspace identity, access and next route
              </h2>
              <p className="mt-1.5 text-[12px] leading-5 text-sub">
                This page should quickly answer who owns the workspace, what state it is in
                and where the owner should go next.
              </p>
            </div>

            <Link
              href={nextHref}
              className="rounded-[14px] border border-white/[0.035] bg-white/[0.018] px-3 py-2.5 transition hover:border-primary/20"
            >
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                Next move
              </p>
              <p className="mt-1.5 text-[0.9rem] font-semibold text-text">{nextLabel}</p>
              <p className="mt-1 text-[11px] leading-5 text-sub">{nextBody}</p>
            </Link>
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-4">
            <AccountStateTile
              label="Workspace"
              value={primaryAccount.name}
              detail="Primary account context."
            />
            <AccountStateTile
              label="Status"
              value={primaryAccount.status}
              detail="Account operating state."
            />
            <AccountStateTile
              label="Role"
              value={primaryAccount.role}
              detail="Current access level."
            />
            <AccountStateTile
              label="Projects"
              value={primaryAccount.projectCount}
              detail={primaryAccount.firstProjectName ?? "No first project yet."}
            />
          </div>
        </section>
      }
    >
      <div className="grid gap-4 xl:items-start xl:grid-cols-[1.05fr_0.95fr]">
        <OpsPanel
          eyebrow="Identity"
          title="Workspace posture"
          description="The account owns the project collection, the onboarding rail and the first team layer. It gives the portal a stable identity even before every deeper business system is live."
        >
          <div className="space-y-3">
            <OpsSnapshotRow label="Source" value={primaryAccount.sourceType} />
            <OpsSnapshotRow label="Membership" value={primaryAccount.membershipStatus} />
            <OpsSnapshotRow label="Current step" value={primaryAccount.currentStep} />
            <OpsSnapshotRow
              label="First project"
              value={primaryAccount.firstProjectName ?? "Not created yet"}
            />
          </div>
        </OpsPanel>

        <div className="space-y-4">
          <OpsPanel
            eyebrow="Team"
            title="Workspace members and invites"
            description="Invite management sits above projects in this phase, so the first team operations can start before deeper seat, billing or console grants arrive."
            action={
              <Link
                href="/account/team"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
              >
                Open team
              </Link>
            }
          >
            <div className="space-y-3">
              <OpsSnapshotRow label="Recommended next move" value="Invite first teammate" />
              <div className="pt-1">
                <OpsStatusPill tone="warning">Workspace roles only in this phase</OpsStatusPill>
              </div>
            </div>
          </OpsPanel>
        </div>
      </div>

      {activationSummary ? (
        <div>
          <SuccessActivationRail
            summary={activationSummary}
            eyebrow="Workspace activation"
            title="How this account is actually progressing"
            description="The account layer should explain both current health and the next real move, not only list identity fields."
          />
        </div>
      ) : null}

      {securitySummary ? (
        <div>
          <OpsPanel
            eyebrow="Security posture"
            title="Workspace access trust"
            description="Account security now lives alongside onboarding and growth, so the owner can see whether session, SSO and 2FA posture are actually healthy."
          >
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="2FA"
                value={securitySummary.userPosture?.twoFactorEnabled ? "Enabled" : "Pending"}
                emphasis="default"
              />
              <OpsMetricCard label="Current AAL" value={securitySummary.userPosture?.currentAal ?? "aal1"} />
              <OpsMetricCard label="Sessions" value={securitySummary.sessions.length} />
              <OpsMetricCard
                label="SSO"
                value={securitySummary.requiresSso ? "Required" : "Optional"}
                emphasis="default"
              />
            </div>

            <div className="mt-4">
              <OpsPriorityLink
                href="/settings/security"
                title="Open security controls"
                body="Review current sessions, enable 2FA, configure enterprise SSO posture and manage export/delete requests from one settings module."
                cta="Open security"
              />
            </div>
          </OpsPanel>
        </div>
      ) : null}

      {growthSummary ? (
        <div>
          <OpsPanel
            eyebrow="Growth analytics"
            title="How this workspace is performing against peers"
            description="Phase 13 keeps the account-facing analytics compact here: a peer label, the current growth score and the acquisition context that brought this workspace in."
          >
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="Peer band"
                value={growthSummary.benchmark.labelText}
                emphasis="default"
              />
              <OpsMetricCard
                label="Growth score"
                value={growthSummary.benchmark.currentValue}
                sub={growthSummary.benchmark.cohortLabel ?? "Benchmark building"}
              />
              <OpsMetricCard
                label="Campaigns live"
                value={growthSummary.activeCampaignCount}
                sub={`${growthSummary.projectCount} projects in workspace`}
              />
              <OpsMetricCard
                label="Providers"
                value={growthSummary.providerCount}
                sub={`${growthSummary.billableSeatCount} billable seats`}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:items-start xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-3">
                <OpsSnapshotRow
                  label="Peer cohort"
                  value={
                    growthSummary.benchmark.cohortLabel
                      ? `${growthSummary.benchmark.cohortLabel} (${growthSummary.benchmark.cohortSize} workspaces)`
                      : "Benchmark building as more workspaces enter this cohort."
                  }
                />
                <OpsSnapshotRow
                  label="Acquisition context"
                  value={[
                    growthSummary.firstTouchSource
                      ? `First touch: ${growthSummary.firstTouchSource}`
                      : null,
                    growthSummary.latestTouchSource
                      ? `Latest touch: ${growthSummary.latestTouchSource}`
                      : null,
                    growthSummary.conversionTouchSource
                      ? `Conversion touch: ${growthSummary.conversionTouchSource}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "This workspace has not captured enough attribution context yet."}
                />
              </div>

              <OpsPriorityLink
                href={nextHref}
                title="Use the benchmark to choose the next move"
                body={growthSummary.recommendedMove}
                cta="Open next move"
              />
            </div>
          </OpsPanel>
        </div>
      ) : null}
    </PortalPageFrame>
  );
}

export default function AccountOverviewPage() {
  return (
    <AdminShell>
      <AccountOverviewContent />
    </AdminShell>
  );
}
