"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";

function AccountOverviewContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const nextHref =
    primaryAccount?.firstProjectId && primaryAccount.currentStep === "open_launch_workspace"
      ? `/projects/${primaryAccount.firstProjectId}/launch`
      : primaryAccount?.projectCount
      ? "/projects"
      : "/getting-started";

  if (!primaryAccount) {
    return null;
  }

  return (
    <PortalPageFrame
      eyebrow="Workspace account"
      title="Account"
      description="This is the workspace layer above projects: identity, owner posture, onboarding state and the next clean route into the operational product."
      statusBand={
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Workspace" value={primaryAccount.name} emphasis="primary" />
          <OpsMetricCard label="Status" value={primaryAccount.status} />
          <OpsMetricCard label="Role" value={primaryAccount.role} />
          <OpsMetricCard label="Projects" value={primaryAccount.projectCount} />
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
          <OpsPriorityLink
            href={nextHref}
            title="Continue from the account rail"
            body="The account layer should never feel like a dead end. It exists to hand you into the next safe operator move."
            cta="Continue"
            emphasis
          />

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
