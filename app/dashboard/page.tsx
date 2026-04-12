"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import StatCard from "@/components/cards/stats/StatCard";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function DashboardPage() {
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

  const totalUsers = projects.reduce((sum, project) => sum + project.members, 0);
  const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
  const openFlags = reviewFlags.filter((flag) => flag.status === "open").length;
  const openClaimFlags = reviewFlags.filter(
    (flag) => flag.status === "open" && flag.sourceTable === "reward_claims"
  ).length;
  const approvedProjects = projects.filter((p) => p.onboardingStatus === "approved").length;

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

  const controlPriorities = [
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
      href: "/settings",
      cta: "Open settings",
      emphasis: !(activeProject?.website || activeProject?.contactEmail),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Control Room
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Dashboard</h1>
            <p className="mt-2 text-sm text-sub">
              Overview of onboarding, campaign execution and moderation load.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
              Active workspace
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {activeMembership?.projectName || activeProject?.name || "Workspace"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary">
              {role === "super_admin" ? "Super admin" : activeMembership?.role || "Project operator"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Projects" value={projects.length} />
          <StatCard label="Approved Projects" value={approvedProjects} />
          <StatCard label="Campaigns" value={campaigns.length} />
          <StatCard label="Raids" value={raids.length} />
          <StatCard label="Quests" value={quests.length} />
          <StatCard label="Rewards" value={rewards.length} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Tracked Users" value={totalUsers.toLocaleString()} />
          <StatCard
            label="Active Campaigns"
            value={campaigns.filter((c) => c.status === "active").length}
          />
          <StatCard label="Pending Reviews" value={pendingSubmissions} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Open Review Flags" value={openFlags} />
          <StatCard
            label="High Risk Flags"
            value={reviewFlags.filter((flag) => flag.severity === "high" && flag.status === "open").length}
          />
          <StatCard label="Claim Escalations" value={openClaimFlags} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Control Priorities
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-text">
                  What deserves attention next
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Workspace load</p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {workspaceCampaigns.length + workspaceRewards.length}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {controlPriorities.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`rounded-2xl border p-5 transition hover:border-primary/40 ${
                    item.emphasis ? "border-primary/35 bg-primary/10" : "border-line bg-card2"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="font-bold text-text">{item.title}</p>
                      <p className="mt-3 text-sm leading-6 text-sub">{item.body}</p>
                    </div>

                    <span className="text-sm font-semibold text-primary">{item.cta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Workspace Snapshot</h2>

            <div className="mt-5 space-y-3">
              <SnapshotRow label="Active campaigns" value={String(workspaceCampaigns.length)} />
              <SnapshotRow label="Reward inventory" value={String(workspaceRewards.length)} />
              <SnapshotRow label="Claims in motion" value={String(highPriorityClaims)} />
              <SnapshotRow label="Pending invites" value={String(pendingInvites)} />
              <SnapshotRow
                label="Public profile"
                value={activeProject?.isPublic ? "Public" : "Private"}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Onboarding Pipeline</h2>
            <div className="mt-5 space-y-4">
              {["draft", "pending", "approved"].map((status) => {
                const count = projects.filter((p) => p.onboardingStatus === status).length;
                const percent = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;

                return (
                  <div key={status}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="capitalize text-text">{status}</span>
                      <span className="text-sub">{count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-card2">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Moderation Snapshot</h2>
            <div className="mt-5 space-y-4">
              {["pending", "approved", "rejected"].map((status) => {
                const count = submissions.filter((s) => s.status === status).length;
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-4"
                  >
                    <span className="capitalize text-text">{status}</span>
                    <span className="font-bold text-primary">{count}</span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-4">
                <span className="text-text">Open review flags</span>
                <span className="font-bold text-primary">{openFlags}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-4">
                <span className="text-text">Claim escalations</span>
                <span className="font-bold text-primary">{openClaimFlags}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-base font-bold text-text">{value}</p>
    </div>
  );
}
