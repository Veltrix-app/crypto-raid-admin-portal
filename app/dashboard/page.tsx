"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsHero,
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
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
  const highRiskFlags = reviewFlags.filter((flag) => flag.severity === "high" && flag.status === "open").length;
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
      href: "/settings",
      cta: "Open settings",
      tone: !(activeProject?.website || activeProject?.contactEmail) ? "warning" : "default",
    },
  ] as const;

  const systemSignals = [
    { label: "Projects", value: projects.length, sub: `${approvedProjects} approved` },
    { label: "Campaigns", value: campaigns.length, sub: `${campaigns.filter((c) => c.status === "active").length} active` },
    { label: "Quests", value: quests.length, sub: `${raids.length} raids live` },
    { label: "Rewards", value: rewards.length, sub: `${claims.length} claims tracked` },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Control Board"
          title="Dashboard"
          description="Live operator board for trust pressure, fulfillment load and workspace launch health."
          aside={
            <>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Active workspace</p>
              <p className="mt-2 text-lg font-extrabold text-text">
                {activeMembership?.projectName || activeProject?.name || "Workspace"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <OpsStatusPill tone={role === "super_admin" ? "success" : "default"}>
                  {role === "super_admin" ? "Super admin" : activeMembership?.role || "Project operator"}
                </OpsStatusPill>
                <OpsStatusPill tone={activeProject?.isPublic ? "success" : "warning"}>
                  {activeProject?.isPublic ? "Public" : "Private"}
                </OpsStatusPill>
              </div>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(186,255,59,0.12),transparent_30%),linear-gradient(180deg,rgba(12,18,30,0.98),rgba(8,12,20,0.98))] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.38)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">System pulse</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">
                  Network and workspace telemetry
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-sub">
                  The platform-wide readout plus the active workspace load that matters right now.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right">
                <SignalChip label="Tracked users" value={totalUsers.toLocaleString()} />
                <SignalChip label="Open flags" value={String(openFlags)} tone={openFlags > 0 ? "warning" : "success"} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {systemSignals.map((signal) => (
                <OpsMetricCard key={signal.label} label={signal.label} value={signal.value} sub={signal.sub} />
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <TelemetryStrip label="Pending reviews" value={pendingSubmissions} tone={pendingSubmissions > 0 ? "warning" : "success"} />
              <TelemetryStrip label="High risk flags" value={highRiskFlags} tone={highRiskFlags > 0 ? "danger" : "success"} />
              <TelemetryStrip label="Claim escalations" value={openClaimFlags} tone={openClaimFlags > 0 ? "warning" : "success"} />
            </div>
          </section>

          <OpsPanel
            eyebrow="Workspace state"
            title="Launch health"
            description="The shortest possible read on the current workspace posture."
          >
            <div className="space-y-3">
              <OpsSnapshotRow label="Campaigns in motion" value={String(workspaceCampaigns.length)} />
              <OpsSnapshotRow label="Reward inventory" value={String(workspaceRewards.length)} />
              <OpsSnapshotRow label="Claims in motion" value={String(highPriorityClaims)} />
              <OpsSnapshotRow label="Pending invites" value={String(pendingInvites)} />
              <OpsSnapshotRow label="Team size" value={String(workspaceMembers.length)} />
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Priority rail"
            title="Next actions for operators"
            description="These boards represent the highest-likelihood drag on delivery, trust and launch quality."
            tone="accent"
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
                        <OpsStatusPill tone={item.tone === "warning" ? "warning" : item.tone === "success" ? "success" : "default"}>
                          {item.tone === "warning" ? "Attention" : item.tone === "success" ? "Stable" : "Watch"}
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
            eyebrow="Signal board"
            title="Trust and delivery posture"
            description="Keep an eye on moderation risk, fulfillment pressure and workspace readiness."
          >
            <div className="grid gap-4">
              <BoardStat
                label="Moderation pressure"
                value={`${pendingSubmissions} pending`}
                description="Proof submissions still waiting for a reviewer decision."
                tone={pendingSubmissions > 0 ? "warning" : "success"}
              />
              <BoardStat
                label="Fraud pressure"
                value={`${highRiskFlags} high-risk`}
                description="Open high-severity trust alerts across platform and workspace queues."
                tone={highRiskFlags > 0 ? "danger" : "success"}
              />
              <BoardStat
                label="Fulfillment pressure"
                value={`${highPriorityClaims} claims`}
                description="Pending or processing claims that still need handling."
                tone={highPriorityClaims > 0 ? "warning" : "success"}
              />
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <OpsPanel
            eyebrow="Onboarding radar"
            title="Project setup pipeline"
            description="A slim pipeline read across draft, pending and approved workspaces."
          >
            <div className="space-y-4">
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
          </OpsPanel>

          <OpsPanel
            eyebrow="Queue health"
            title="Moderation snapshot"
            description="A compact monitor for approval flow and open trust issues."
          >
            <div className="space-y-4">
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
          </OpsPanel>
        </div>
      </div>
    </AdminShell>
  );
}

function SignalChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : tone === "danger"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
        : tone === "success"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-text";

  return (
    <div className={`rounded-[20px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function TelemetryStrip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const barClass =
    tone === "warning"
      ? "bg-amber-300"
      : tone === "danger"
        ? "bg-rose-300"
        : tone === "success"
          ? "bg-emerald-300"
          : "bg-cyan-300";

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
        <p className="text-lg font-extrabold text-text">{value}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, Math.max(12, value * 8))}%` }} />
      </div>
    </div>
  );
}

function BoardStat({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string;
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
      <p className={`mt-3 text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
    </div>
  );
}
