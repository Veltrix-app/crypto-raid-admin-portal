"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import StatCard from "@/components/cards/stats/StatCard";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function DashboardPage() {
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);

  const totalUsers = projects.reduce((sum, project) => sum + project.members, 0);
  const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
  const openFlags = reviewFlags.filter((flag) => flag.status === "open").length;
  const openClaimFlags = reviewFlags.filter(
    (flag) => flag.status === "open" && flag.sourceTable === "reward_claims"
  ).length;
  const approvedProjects = projects.filter((p) => p.onboardingStatus === "approved").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Control Room
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Dashboard</h1>
          <p className="mt-2 text-sm text-sub">
            Overview of onboarding, campaign execution and moderation load.
          </p>
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
          <StatCard
            label="Claim Escalations"
            value={openClaimFlags}
          />
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
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
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
