"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function OverviewPage() {
  const { activeProjectId, memberships, role } = useAdminAuthStore();
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const claims = useAdminPortalStore((s) => s.claims);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [overviewMode, setOverviewMode] = useState<"network" | "workspace">("network");

  const totalUsers = projects.reduce((sum, project) => sum + project.members, 0);
  const pendingSubmissions = submissions.filter((submission) => submission.status === "pending").length;
  const openFlags = reviewFlags.filter((flag) => flag.status === "open").length;
  const highRiskFlags = reviewFlags.filter(
    (flag) => flag.severity === "high" && flag.status === "open"
  ).length;
  const openClaimFlags = reviewFlags.filter(
    (flag) => flag.status === "open" && flag.sourceTable === "reward_claims"
  ).length;
  const approvedProjects = projects.filter((project) => project.onboardingStatus === "approved").length;

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const workspaceCampaigns = campaigns.filter((campaign) => campaign.projectId === activeProjectId);
  const workspaceRewards = rewards.filter((reward) => reward.projectId === activeProjectId);
  const workspaceClaims = claims.filter((claim) => claim.projectId === activeProjectId);
  const workspaceMembers = teamMembers.filter((member) => member.projectId === activeProjectId);
  const highPriorityClaims = workspaceClaims.filter(
    (claim) => claim.status === "pending" || claim.status === "processing"
  ).length;
  const pendingInvites = workspaceMembers.filter((member) => member.status === "invited").length;
  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);

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
        tone: pendingSubmissions > 0 ? "warning" : "success",
      },
      {
        title: "Claim fulfillment",
        body:
          highPriorityClaims > 0
            ? `${highPriorityClaims} claims are waiting for fulfillment or processing.`
            : "Reward fulfillment pressure is low right now.",
        href: "/claims",
        cta: highPriorityClaims > 0 ? "Handle claims" : "Review claims",
        tone: highPriorityClaims > 0 ? "warning" : "success",
      },
      {
        title: "Workspace settings",
        body:
          activeProject?.website || activeProject?.contactEmail
            ? "Profile, links and billing are present. Keep refining the public-facing identity."
            : "This workspace still needs stronger branding, contact details and settings hygiene.",
        href: activeProjectId ? `/projects/${activeProjectId}/settings` : "/settings",
        cta: "Open settings",
        tone: !(activeProject?.website || activeProject?.contactEmail) ? "warning" : "default",
      },
    ],
    [activeProject?.contactEmail, activeProject?.website, activeProjectId, highPriorityClaims, pendingSubmissions]
  );

  const systemSignals = [
    { label: "Projects", value: projects.length, sub: `${approvedProjects} approved` },
    {
      label: "Campaigns",
      value: campaigns.length,
      sub: `${campaigns.filter((campaign) => campaign.status === "active").length} active`,
    },
    { label: "Quests", value: quests.length, sub: `${raids.length} raids live` },
    { label: "Rewards", value: rewards.length, sub: `${claims.length} claims tracked` },
  ];

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Control center"
        title="Overview"
        description="A cleaner executive read for platform posture and the active workspace that matters right now."
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
            description="Split the executive network read from the active workspace pulse instead of forcing both into one long mixed page."
            action={
              <SegmentToggle
                value={overviewMode}
                onChange={setOverviewMode}
                options={[
                  { value: "network", label: "Network" },
                  { value: "workspace", label: "Workspace" },
                ]}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Network</p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  Cross-project launch health, queues and portfolio pressure.
                </p>
              </div>
              <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Workspace</p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  The active workspace posture, priorities and immediate next actions.
                </p>
              </div>
            </div>
          </OpsPanel>
        }
      >
        {overviewMode === "network" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {systemSignals.map((signal) => (
                <OpsMetricCard key={signal.label} label={signal.label} value={signal.value} sub={signal.sub} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Network queues"
                title="Platform pressure"
                description="The queues and flags most likely to slow delivery, trust or campaign readiness."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <PressureTile
                    label="Pending reviews"
                    value={pendingSubmissions}
                    tone={pendingSubmissions > 0 ? "warning" : "success"}
                    description="Proof submissions still waiting for a reviewer decision."
                  />
                  <PressureTile
                    label="High-risk flags"
                    value={highRiskFlags}
                    tone={highRiskFlags > 0 ? "danger" : "success"}
                    description="Open high-severity trust alerts across the platform."
                  />
                  <PressureTile
                    label="Claim escalations"
                    value={openClaimFlags}
                    tone={openClaimFlags > 0 ? "warning" : "success"}
                    description="Open reward-claim incidents that still need handling."
                  />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Network posture"
                title="Launch health"
                description="A short read on the platform-wide state before you drop into a specific queue."
                tone="accent"
              >
                <div className="space-y-3">
                  <OpsSnapshotRow label="Tracked users" value={totalUsers.toLocaleString()} />
                  <OpsSnapshotRow label="Approved projects" value={String(approvedProjects)} />
                  <OpsSnapshotRow label="Open flags" value={String(openFlags)} />
                  <OpsSnapshotRow label="Live raids" value={String(raids.length)} />
                </div>
              </OpsPanel>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <OpsMetricCard label="Campaigns in motion" value={workspaceCampaigns.length} />
              <OpsMetricCard label="Reward inventory" value={workspaceRewards.length} />
              <OpsMetricCard
                label="Claims in motion"
                value={highPriorityClaims}
                emphasis={highPriorityClaims > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Pending invites"
                value={pendingInvites}
                emphasis={pendingInvites > 0 ? "warning" : "default"}
              />
              <OpsMetricCard label="Team size" value={workspaceMembers.length} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Priority rail"
                title="Next actions for operators"
                description="The workspace boards most likely to drag delivery or launch quality if ignored."
              >
                <div className="grid gap-4">
                  {controlPriorities.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="rounded-[24px] border border-line bg-card2 p-5 transition hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="max-w-2xl">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-text">{item.title}</p>
                            <OpsStatusPill
                              tone={
                                item.tone === "warning"
                                  ? "warning"
                                  : item.tone === "success"
                                    ? "success"
                                    : "default"
                              }
                            >
                              {item.tone === "warning"
                                ? "Attention"
                                : item.tone === "success"
                                  ? "Stable"
                                  : "Watch"}
                            </OpsStatusPill>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-sub">{item.body}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">{item.cta}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Workspace state"
                title="Current launch posture"
                description="The shortest read on whether this workspace is ready to move without friction."
                tone="accent"
              >
                <div className="space-y-3">
                  <OpsSnapshotRow
                    label="Brand posture"
                    value={
                      activeProject?.website || activeProject?.contactEmail
                        ? "Identity is present"
                        : "Identity still feels thin"
                    }
                  />
                  <OpsSnapshotRow
                    label="Team structure"
                    value={workspaceMembers.length > 1 ? "Distributed" : "Thin operator set"}
                  />
                  <OpsSnapshotRow
                    label="Claim pressure"
                    value={highPriorityClaims > 0 ? `${highPriorityClaims} active claims` : "Low"}
                  />
                  <OpsSnapshotRow
                    label="Invite pressure"
                    value={pendingInvites > 0 ? `${pendingInvites} invites pending` : "Stable"}
                  />
                </div>
              </OpsPanel>
            </div>
          </>
        )}
      </PortalPageFrame>
    </AdminShell>
  );
}

function PressureTile({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-300"
      : tone === "danger"
        ? "text-rose-300"
        : tone === "success"
          ? "text-emerald-300"
          : "text-primary";

  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
    </div>
  );
}
