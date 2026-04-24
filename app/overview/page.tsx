"use client";

import type { ReactNode } from "react";
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
import { SupportOverviewPanel } from "@/components/support/SupportOverviewPanel";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminSupportOverview } from "@/types/entities/support";

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

const overviewModeCopy = {
  launch: {
    title: "Launch lane in focus",
    body: "Readiness, activation and workspace motion take priority when the next launch window is near.",
  },
  health: {
    title: "Health lane in focus",
    body: "Provider, queue, deploy and automation posture matter most when the platform itself starts to drift.",
  },
  escalations: {
    title: "Escalation lane in focus",
    body: "Cross-surface ownership and the next exact recovery move matter most when issues start bouncing between teams.",
  },
} as const;

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
  const [supportOverview, setSupportOverview] = useState<AdminSupportOverview | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

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

  useEffect(() => {
    if (role !== "super_admin") {
      setSupportOverview(null);
      setSupportLoading(false);
      setSupportError(null);
      return;
    }

    let active = true;

    async function loadSupportOverview() {
      try {
        setSupportLoading(true);
        const response = await fetch("/api/support/overview", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; overview?: AdminSupportOverview; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.overview) {
          throw new Error(payload?.error ?? "Failed to load support overview.");
        }

        if (!active) return;
        setSupportOverview(payload.overview);
        setSupportError(null);
      } catch (error) {
        if (!active) return;
        setSupportOverview(null);
        setSupportError(error instanceof Error ? error.message : "Failed to load support overview.");
      } finally {
        if (active) {
          setSupportLoading(false);
        }
      }
    }

    void loadSupportOverview();

    return () => {
      active = false;
    };
  }, [role]);

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

  const currentModeCopy = overviewModeCopy[overviewMode];
  const primaryPriority = controlPriorities[0];
  const watchSignals = [
    {
      label: "Queue pressure",
      value: queueBacklogCount > 0 ? `${queueBacklogCount}` : "Clear",
      tone: queueBacklogCount > 0 ? "warning" : "default",
    },
    {
      label: "Provider failures",
      value: providerFailureCount > 0 ? `${providerFailureCount}` : "Stable",
      tone: providerFailureCount > 0 ? "warning" : "default",
    },
    {
      label: "Open incidents",
      value: openIncidentCount > 0 ? `${openIncidentCount}` : "None",
      tone: openIncidentCount > 0 ? "warning" : "default",
    },
    {
      label: "Escalations",
      value: supportEscalationCount > 0 ? `${supportEscalationCount}` : "Low",
      tone: supportEscalationCount > 0 ? "warning" : "default",
    },
  ] as const;

  const nowSummary = useMemo(() => {
    if (overviewMode === "launch") {
      return {
        title: activeProject?.name || activeMembership?.projectName || "Launch posture",
        body:
          launchReadyProjects > 0
            ? `${launchReadyProjects} projects look launch-ready right now, with ${activationRate}% member activation across the latest snapshot.`
            : "No launch-ready projects are visible yet, so workspace setup and readiness still matter most.",
      };
    }

    if (overviewMode === "health") {
      return {
        title: "Platform health posture",
        body:
          providerFailureCount + queueBacklogCount + automationFailureCount > 0
            ? "Health pressure is visible across providers, queue backlog or automation drift. Use this lane to keep platform pressure contained."
            : "Platform posture looks stable right now, so operators can stay focused on launch motion instead of infra drift.",
      };
    }

    return {
      title: "Escalation routing posture",
      body:
        supportEscalationCount + openTrustCaseCount + openPayoutCaseCount + openOnchainCaseCount > 0
          ? "Cross-surface ownership matters right now. Route the next action into the right workspace before the pressure starts bouncing."
          : "Escalation volume is low right now, so the platform is not showing a heavy cross-team recovery pattern.",
    };
  }, [
    activeMembership?.projectName,
    activeProject?.name,
    activationRate,
    automationFailureCount,
    launchReadyProjects,
    openOnchainCaseCount,
    openPayoutCaseCount,
    openTrustCaseCount,
    overviewMode,
    providerFailureCount,
    queueBacklogCount,
    supportEscalationCount,
  ]);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Launch command center"
        title="Overview"
        description="Overview should feel like the premium operator entry point: current workspace state first, the most important next move second, and the pressure worth watching third."
        actions={
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Active workspace</p>
              <p className="mt-2 text-lg font-extrabold text-text">
                {activeMembership?.projectName || activeProject?.name || "Workspace"}
              </p>
            </div>
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
          <div className="grid gap-4 xl:grid-cols-[1.02fr_1fr_0.98fr]">
            <OverviewTopCard
              label="Now"
              title={nowSummary.title}
              body={nowSummary.body}
              tone="primary"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <OverviewState
                  label="Campaigns in motion"
                  value={workspaceCampaigns.length > 0 ? `${workspaceCampaigns.length}` : "None yet"}
                />
                <OverviewState
                  label="Claims in motion"
                  value={highPriorityClaims > 0 ? `${highPriorityClaims}` : "Low"}
                />
                <OverviewState
                  label="Pending invites"
                  value={pendingInvites > 0 ? `${pendingInvites}` : "Stable"}
                />
                <OverviewState
                  label="Launch-ready projects"
                  value={launchReadyProjects > 0 ? `${launchReadyProjects}` : "Not yet"}
                />
              </div>
            </OverviewTopCard>

            <OverviewTopCard
              label="Next"
              title={primaryPriority.title}
              body={primaryPriority.body}
            >
              <div className="grid gap-3">
                {controlPriorities.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`rounded-[22px] border px-4 py-4 transition hover:border-primary/28 ${
                      item.emphasis
                        ? "border-primary/18 bg-primary/[0.08]"
                        : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">{item.body}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{item.cta}</span>
                    </div>
                  </a>
                ))}
              </div>
            </OverviewTopCard>

            <OverviewTopCard
              label="Watch"
              title={currentModeCopy.title}
              body={currentModeCopy.body}
            >
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3">
                <SegmentToggle
                  value={overviewMode}
                  onChange={setOverviewMode}
                  options={[
                    { value: "launch", label: "Launch" },
                    { value: "health", label: "Health" },
                    { value: "escalations", label: "Escalations" },
                  ]}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {watchSignals.map((signal) => (
                  <OverviewWatchSignal
                    key={signal.label}
                    label={signal.label}
                    value={signal.value}
                    tone={signal.tone}
                  />
                ))}
              </div>
            </OverviewTopCard>
          </div>
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

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
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
                eyebrow="Next inside the workspace"
                title="Keep the active workspace moving"
                description="When launch posture is the focus, use the active workspace as the next exact place to push work forward."
                tone="accent"
              >
                <div className="grid gap-4">
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}/launch` : "/projects"}
                    title="Open launch workspace"
                    body="Check launch readiness, templates, setup pressure and the next builder handoff for the active project."
                    cta="Open launch"
                    emphasis
                  />
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}/community` : "/projects"}
                    title="Open community workspace"
                    body="If launch is moving, confirm captains, automations and community execution are moving with it."
                    cta="Open community"
                  />
                  <OpsPriorityLink
                    href={activeProjectId ? `/projects/${activeProjectId}` : "/projects"}
                    title="Open project overview"
                    body="Drop back into the project surface when this launch window becomes specific object work."
                    cta="Open project"
                  />
                </div>
              </OpsPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <OpsPanel
                eyebrow="Workspace state"
                title="Quick state on the active project"
                description="A calmer command center still needs one simple project snapshot in view."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <OverviewState label="Workspace" value={activeProject?.name || "Workspace"} />
                  <OverviewState label="Reward inventory" value={workspaceRewards.length > 0 ? `${workspaceRewards.length}` : "Low"} />
                  <OverviewState label="Team size" value={`${workspaceMembers.length}`} />
                  <OverviewState label="Pending invites" value={pendingInvites > 0 ? `${pendingInvites}` : "Stable"} />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="What to watch"
                title="Launch pressure should stay directional, not noisy"
                description="The goal is clarity: know the current workspace state, know the next action, and know whether launch readiness or activation is drifting."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <OverviewWatchSignal
                    label="Snapshot freshness"
                    value={healthSummary?.snapshotStale ? "Stale" : "Fresh"}
                    tone={healthSummary?.snapshotStale ? "warning" : "default"}
                  />
                  <OverviewWatchSignal
                    label="Claims pressure"
                    value={highPriorityClaims > 0 ? `${highPriorityClaims}` : "Low"}
                    tone={highPriorityClaims > 0 ? "warning" : "default"}
                  />
                  <OverviewWatchSignal
                    label="Member activation"
                    value={`${activationRate}%`}
                  />
                  <OverviewWatchSignal
                    label="Launch-ready projects"
                    value={launchReadyProjects > 0 ? `${launchReadyProjects}` : "Not yet"}
                    tone={launchReadyProjects > 0 ? "default" : "warning"}
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

            {role === "super_admin" ? (
              <SupportOverviewPanel
                overview={supportOverview}
                loading={supportLoading}
                error={supportError}
              />
            ) : null}
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Escalation routing"
                title="Route pressure into the exact workspace that should own it"
                description="The overview command center should keep named ownership visible before issues turn into circular handoffs."
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
                title="Keep the active workspace in sight while you route incidents"
                description="Escalations should still stay anchored to the workspace the operator is most likely to jump back into."
                tone="accent"
              >
                <div className="grid gap-3">
                  <OverviewState label="Campaigns in motion" value={`${workspaceCampaigns.length}`} />
                  <OverviewState label="Reward inventory" value={`${workspaceRewards.length}`} />
                  <OverviewState label="Claims in motion" value={highPriorityClaims > 0 ? `${highPriorityClaims}` : "Low"} />
                  <OverviewState label="Pending invites" value={pendingInvites > 0 ? `${pendingInvites}` : "Stable"} />
                  <OverviewState label="Team size" value={`${workspaceMembers.length}`} />
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

            {role === "super_admin" ? (
              <SupportOverviewPanel
                overview={supportOverview}
                loading={supportLoading}
                error={supportError}
              />
            ) : null}
          </div>
        )}
      </PortalPageFrame>
    </AdminShell>
  );
}

function OverviewTopCard({
  label,
  title,
  body,
  children,
  tone = "default",
}: {
  label: string;
  title: string;
  body: string;
  children: ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[32px] border p-5 shadow-[0_28px_90px_rgba(0,0,0,0.2)] ${
        tone === "primary"
          ? "border-primary/18 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.12),transparent_24%),linear-gradient(180deg,rgba(14,20,30,0.98),rgba(10,14,22,0.96))]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(15,21,32,0.96),rgba(10,14,22,0.94))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_34%)]" />
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{label}</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-text">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-sub">{body}</p>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function OverviewState({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function OverviewWatchSignal({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-4 ${
        tone === "warning"
          ? "border-amber-400/18 bg-amber-500/[0.08]"
          : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
