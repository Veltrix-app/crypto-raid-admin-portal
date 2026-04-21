"use client";

import { useEffect, useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import LaunchHealthBoard from "@/components/observability/LaunchHealthBoard";
import ProviderHealthPanel from "@/components/observability/ProviderHealthPanel";
import QueueBacklogPanel from "@/components/observability/QueueBacklogPanel";
import SupportEscalationPanel from "@/components/observability/SupportEscalationPanel";
import DeployCheckPanel from "@/components/observability/DeployCheckPanel";
import RunbookRail from "@/components/observability/RunbookRail";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type OpsHealthSummary = {
  latestMetricValues?: Record<string, number>;
  latestPlatformSnapshotDate?: string | null;
  latestProjectSnapshotDate?: string | null;
  snapshotStale?: boolean;
  providerFailureCount?: number;
  queueBacklogCount?: number;
  supportEscalationCount?: number;
  automationFailureCount?: number;
  openTrustCaseCount?: number;
  openPayoutCaseCount?: number;
  openOnchainCaseCount?: number;
  openIncidentCount?: number;
  activeOverrideCount?: number;
};

export default function OverviewPage() {
  const { activeProjectId, memberships, role } = useAdminAuthStore();
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const claims = useAdminPortalStore((s) => s.claims);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [overviewMode, setOverviewMode] = useState<"launch" | "health" | "escalations">("launch");
  const [healthSummary, setHealthSummary] = useState<OpsHealthSummary | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const workspaceCampaigns = campaigns.filter((campaign) => campaign.projectId === activeProjectId);
  const workspaceRewards = rewards.filter((reward) => reward.projectId === activeProjectId);
  const workspaceClaims = claims.filter((claim) => claim.projectId === activeProjectId);
  const workspaceMembers = teamMembers.filter((member) => member.projectId === activeProjectId);
  const pendingSubmissions = submissions.filter((submission) => submission.status === "pending").length;
  const highPriorityClaims = workspaceClaims.filter(
    (claim) => claim.status === "pending" || claim.status === "processing"
  ).length;
  const pendingInvites = workspaceMembers.filter((member) => member.status === "invited").length;
  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const response = await fetch("/api/ops/health", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; summary?: OpsHealthSummary; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.summary) {
          throw new Error(
            payload && typeof payload.error === "string"
              ? payload.error
              : "Failed to load ops health."
          );
        }

        if (!active) return;
        setHealthSummary(payload.summary);
        setHealthError(null);
      } catch (error) {
        if (!active) return;
        setHealthSummary(null);
        setHealthError(error instanceof Error ? error.message : "Failed to load ops health.");
      }
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, []);

  const controlPriorities = useMemo(
    () => [
      {
        title: "Moderation queue",
        body:
          pendingSubmissions > 0
            ? `${pendingSubmissions} submissions still need a decision.`
            : "Submission review load is currently clear.",
        href: "/moderation",
        cta: pendingSubmissions > 0 ? "Open moderation" : "Review moderation",
        emphasis: pendingSubmissions > 0,
      },
      {
        title: "Claim fulfillment",
        body:
          highPriorityClaims > 0
            ? `${highPriorityClaims} claims are waiting for fulfillment or processing.`
            : "Reward fulfillment pressure is low right now.",
        href: "/claims",
        cta: highPriorityClaims > 0 ? "Handle claims" : "Review claims",
        emphasis: highPriorityClaims > 0,
      },
      {
        title: "Workspace settings",
        body:
          activeProject?.website || activeProject?.contactEmail
            ? "Profile, links and billing are present. Keep refining the public-facing identity."
            : "This workspace still needs stronger branding, contact details and settings hygiene.",
        href: activeProjectId ? `/projects/${activeProjectId}/settings` : "/settings",
        cta: "Open settings",
        emphasis: !(activeProject?.website || activeProject?.contactEmail),
      },
    ],
    [activeProject?.contactEmail, activeProject?.website, activeProjectId, highPriorityClaims, pendingSubmissions]
  );

  const latestMetrics = healthSummary?.latestMetricValues ?? {};
  const activeProjects = Number(latestMetrics.active_projects ?? 0);
  const launchReadyProjects = Number(latestMetrics.launch_ready_projects ?? 0);
  const activationRate = Number(latestMetrics.member_activation_rate ?? 0);
  const linkedReadinessRate = Number(latestMetrics.linked_readiness_rate ?? 0);
  const providerFailureCount = Number(healthSummary?.providerFailureCount ?? 0);
  const queueBacklogCount = Number(healthSummary?.queueBacklogCount ?? 0);
  const supportEscalationCount = Number(healthSummary?.supportEscalationCount ?? 0);
  const automationFailureCount = Number(healthSummary?.automationFailureCount ?? 0);
  const openTrustCaseCount = Number(healthSummary?.openTrustCaseCount ?? 0);
  const openPayoutCaseCount = Number(healthSummary?.openPayoutCaseCount ?? 0);
  const openOnchainCaseCount = Number(healthSummary?.openOnchainCaseCount ?? 0);
  const openIncidentCount = Number(healthSummary?.openIncidentCount ?? 0);
  const activeOverrideCount = Number(healthSummary?.activeOverrideCount ?? 0);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Command center"
        title="Overview"
        description="Use Overview as the operator command center: launch posture first, live health second, and escalation routing when the platform starts to drift."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
              Active workspace
            </p>
            <p className="text-lg font-extrabold text-text">
              {activeMembership?.projectName || activeProject?.name || "Workspace"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone={role === "super_admin" ? "success" : "default"}>
                {role === "super_admin" ? "Super admin" : activeMembership?.role || "Project operator"}
              </OpsStatusPill>
              <OpsStatusPill tone={activeProject?.isPublic ? "success" : "warning"}>
                {activeProject?.isPublic ? "Public" : "Private"}
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <OpsPanel
            title="Overview modes"
            description="Separate launch posture, live health, and escalation routing so operators can scan the right layer without mixing every concern together."
            action={
              <SegmentToggle
                value={overviewMode}
                onChange={setOverviewMode}
                options={[
                  { value: "launch", label: "Launch" },
                  { value: "health", label: "Health" },
                  { value: "escalations", label: "Escalations" },
                ]}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModeCard
                label="Launch"
                body="Readiness, activation and snapshot freshness before a launch push."
              />
              <ModeCard
                label="Health"
                body="Provider, queue, automation and override pressure in one scan."
              />
              <ModeCard
                label="Escalations"
                body="Route current pressure into the exact workspace that should own the next action."
              />
            </div>
          </OpsPanel>
        }
      >
        {healthError ? (
          <OpsPanel eyebrow="Health error" title="Ops health could not load" description={healthError}>
            <div className="grid gap-4 md:grid-cols-2">
              <OpsPriorityLink
                href="/analytics"
                title="Open analytics"
                body="The trend board is still available while the live health route is being checked."
                cta="Open analytics"
                emphasis
              />
              <OpsPriorityLink
                href="/onchain"
                title="Open on-chain ops"
                    body="If this feels like runtime drift, start with the execution workflows and confirm cases are still landing."
                cta="Open on-chain"
              />
            </div>
          </OpsPanel>
        ) : overviewMode === "launch" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OpsMetricCard label="Active projects" value={activeProjects} />
              <OpsMetricCard
                label="Launch-ready"
                value={launchReadyProjects}
                emphasis={launchReadyProjects > 0 ? "primary" : "default"}
              />
              <OpsMetricCard label="Member activation" value={`${activationRate}%`} />
              <OpsMetricCard label="Linked readiness" value={`${linkedReadinessRate}%`} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <LaunchHealthBoard
                activeProjects={activeProjects}
                launchReadyProjects={launchReadyProjects}
                activationRate={activationRate}
                linkedReadinessRate={linkedReadinessRate}
                snapshotStale={Boolean(healthSummary?.snapshotStale)}
                latestPlatformSnapshotDate={healthSummary?.latestPlatformSnapshotDate ?? null}
                latestProjectSnapshotDate={healthSummary?.latestProjectSnapshotDate ?? null}
              />

              <OpsPanel
                eyebrow="Workspace launch board"
                title="Active workspace posture"
                description="Keep the current workspace visible while Overview stays platform-first."
              >
                <div className="grid gap-4">
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}/launch` : "/projects"}
                    title="Open launch workspace"
                    body="Check launch readiness, templates and the next builder handoff for the active project."
                    cta="Open launch"
                    emphasis
                  />
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}/community` : "/projects"}
                    title="Open community workspace"
                    body="If launch is moving, confirm captains, automations and command surfaces are ready too."
                    cta="Open community"
                  />
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}` : "/projects"}
                    title="Open project overview"
                    body="Use the project workspace when this launch window turns into specific object work."
                    cta="Open project"
                  />
                </div>
              </OpsPanel>
            </div>
          </>
        ) : overviewMode === "health" ? (
          <>
            <div className="grid gap-4 md:grid-cols-6">
              <OpsMetricCard
                label="Provider failures"
                value={providerFailureCount}
                emphasis={providerFailureCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Queue backlog"
                value={queueBacklogCount}
                emphasis={queueBacklogCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Escalations"
                value={supportEscalationCount}
                emphasis={supportEscalationCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Automation failures"
                value={automationFailureCount}
                emphasis={automationFailureCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard label="Open incidents" value={openIncidentCount} />
              <OpsMetricCard label="Active overrides" value={activeOverrideCount} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <ProviderHealthPanel
                providerFailureCount={providerFailureCount}
                automationFailureCount={automationFailureCount}
                activeOverrideCount={activeOverrideCount}
                snapshotStale={Boolean(healthSummary?.snapshotStale)}
              />

              <QueueBacklogPanel
                queueBacklogCount={queueBacklogCount}
                supportEscalationCount={supportEscalationCount}
                openTrustCaseCount={openTrustCaseCount}
                openPayoutCaseCount={openPayoutCaseCount}
                openOnchainCaseCount={openOnchainCaseCount}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
              <DeployCheckPanel />
              <RunbookRail
                surface="deploy"
                title="Deploy and recovery playbooks"
                description="Keep deploy hygiene and launch-day recovery steps one click away while health pressure is active."
              />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Escalation routing"
                title="What needs named ownership"
                description="Route platform pressure into the exact workspace that should own the next action."
              >
                <div className="grid gap-4">
                  <OpsPriorityLink
                    href="/claims"
                    title="Claims and payout incidents"
                    body={`${openPayoutCaseCount} payout cases plus ${highPriorityClaims} claims in motion. Use this workspace when delivery, finalization or reward pressure drifts.`}
                    cta="Open claims"
                    emphasis={openPayoutCaseCount > 0 || highPriorityClaims > 0}
                  />
                  <OpsPriorityLink
                    href="/moderation"
                    title="Trust and moderation queue"
                    body={`${openTrustCaseCount} trust cases and ${pendingSubmissions} pending submissions. Use this workspace when fraud, proof review or pipeline uncertainty is the blocker.`}
                    cta="Open moderation"
                    emphasis={openTrustCaseCount > 0 || pendingSubmissions > 0}
                  />
                  <OpsPriorityLink
                    href="/onchain"
                    title="On-chain failures and recovery"
                    body={`${openOnchainCaseCount} on-chain cases and ${providerFailureCount} provider failures. Use this workspace when ingress, enrichment or sync recovery is needed.`}
                    cta="Open on-chain"
                    emphasis={openOnchainCaseCount > 0 || providerFailureCount > 0}
                  />
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}/community` : "/projects"}
                    title="Community and captain operations"
                    body={`${supportEscalationCount} active escalations across the platform. Use this workspace when the pressure is in automations, commands or community execution.`}
                    cta="Open community"
                    emphasis={supportEscalationCount > 0}
                  />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Workspace context"
                title="Active workspace support posture"
                description="Keep the current workspace visible while escalation routing stays platform-first."
                tone="accent"
              >
                <div className="grid gap-3">
                  <InlineState label="Campaigns in motion" value={String(workspaceCampaigns.length)} />
                  <InlineState label="Reward inventory" value={String(workspaceRewards.length)} />
                  <InlineState
                    label="Claims in motion"
                    value={highPriorityClaims > 0 ? `${highPriorityClaims} active` : "Low"}
                  />
                  <InlineState
                    label="Pending invites"
                    value={pendingInvites > 0 ? `${pendingInvites} pending` : "Stable"}
                  />
                  <InlineState label="Team size" value={String(workspaceMembers.length)} />
                </div>
              </OpsPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <SupportEscalationPanel
                title="Cross-surface support escalations"
                description="Keep named ownership, waiting state and the next action visible whenever a failure crosses queue boundaries or repeats."
                includeResolved={false}
                emptyTitle="No active escalations"
                emptyDescription="Platform-wide escalations are currently clear."
              />
              <RunbookRail
                title="Escalation playbooks"
                description="Jump into the exact recovery playbook that matches the surface currently carrying the pressure."
              />
            </div>
          </div>
        )}

        <OpsPanel
          eyebrow="Operator next actions"
          title="Priority board"
          description="The boards most likely to drag delivery or launch quality if ignored."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {controlPriorities.map((item) => (
              <OpsPriorityLink
                key={item.title}
                href={item.href}
                title={item.title}
                body={item.body}
                cta={item.cta}
                emphasis={item.emphasis}
              />
            ))}
          </div>
        </OpsPanel>
      </PortalPageFrame>
    </AdminShell>
  );
}

function ModeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{body}</p>
    </div>
  );
}

function InlineState({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
