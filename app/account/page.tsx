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
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <OpsPanel
            eyebrow="Account posture"
            title="Read the workspace before dropping into projects"
            description="The account layer should explain the identity, health and next move of the workspace without feeling like another dense admin dashboard."
          >
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Workspace" value={primaryAccount.name} emphasis="primary" />
              <OpsMetricCard label="Status" value={primaryAccount.status} />
              <OpsMetricCard label="Role" value={primaryAccount.role} />
              <OpsMetricCard label="Projects" value={primaryAccount.projectCount} />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Continue from account"
            title="Use the account layer to choose the next clean route"
            description="This page should make it obvious whether the owner should continue onboarding, open the launch workspace or move into team and security posture."
            tone="accent"
          >
            <div className="space-y-3">
              <OpsSnapshotRow label="Current step" value={primaryAccount.currentStep} />
              <OpsSnapshotRow
                label="First project"
                value={primaryAccount.firstProjectName ?? "Not created yet"}
              />
              <OpsPriorityLink
                href={nextHref}
                title="Continue from the account rail"
                body="The account layer should never feel like a dead end. It exists to hand you into the next safe operator move."
                cta="Continue"
                emphasis
              />
            </div>
          </OpsPanel>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OpsPanel
          eyebrow="Identity"
          title="Workspace posture"
          description="The account owns the project collection, the onboarding rail and the first team layer. It gives the portal a stable identity even before every deeper business system is live."
          tone="accent"
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

        <div className="space-y-6">
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
        <div className="mt-6">
          <SuccessActivationRail
            summary={activationSummary}
            eyebrow="Workspace activation"
            title="How this account is actually progressing"
            description="The account layer should explain both current health and the next real move, not only list identity fields."
          />
        </div>
      ) : null}

      {securitySummary ? (
        <div className="mt-6">
          <OpsPanel
            eyebrow="Security posture"
            title="Workspace access trust"
            description="Account security now lives alongside onboarding and growth, so the owner can see whether session, SSO and 2FA posture are actually healthy."
          >
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="2FA"
                value={securitySummary.userPosture?.twoFactorEnabled ? "Enabled" : "Pending"}
                emphasis={securitySummary.userPosture?.twoFactorEnabled ? "primary" : "warning"}
              />
              <OpsMetricCard label="Current AAL" value={securitySummary.userPosture?.currentAal ?? "aal1"} />
              <OpsMetricCard label="Sessions" value={securitySummary.sessions.length} />
              <OpsMetricCard
                label="SSO"
                value={securitySummary.requiresSso ? "Required" : "Optional"}
                emphasis={securitySummary.requiresSso ? "warning" : "default"}
              />
            </div>

            <div className="mt-6">
              <OpsPriorityLink
                href="/settings/security"
                title="Open security controls"
                body="Review current sessions, enable 2FA, configure enterprise SSO posture and manage export/delete requests from one settings module."
                cta="Open security"
                emphasis
              />
            </div>
          </OpsPanel>
        </div>
      ) : null}

      {growthSummary ? (
        <div className="mt-6">
          <OpsPanel
            eyebrow="Growth analytics"
            title="How this workspace is performing against peers"
            description="Phase 13 keeps the account-facing analytics compact here: a peer label, the current growth score and the acquisition context that brought this workspace in."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="Peer band"
                value={growthSummary.benchmark.labelText}
                emphasis={growthSummary.benchmark.label === "below_peer_range" ? "warning" : "primary"}
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

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
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
                emphasis
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
