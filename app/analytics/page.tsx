"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import RewardsChart from "@/components/charts/rewards/RewardsChart";

export default function AnalyticsPage() {
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);

  const totalUsers = projects.reduce((sum, project) => sum + project.members, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Performance Analytics
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Analytics</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/analytics/engagement"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Engagement
            </Link>
            <Link
              href="/analytics/rewards"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Rewards
            </Link>
            <Link
              href="/analytics/users"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Users
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card label="Tracked Users" value={totalUsers.toLocaleString()} />
          <Card label="Campaigns" value={campaigns.length} />
          <Card label="Rewards" value={rewards.length} />
          <Card label="Submissions" value={submissions.length} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Campaign Completion</h2>
            <div className="mt-5">
              <EngagementChart
                items={campaigns.map((campaign) => ({
                  label: campaign.title,
                  value: campaign.completionRate,
                }))}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Submission Outcomes</h2>
            <div className="mt-5">
              <RewardsChart
                items={[
                  {
                    label: "Pending",
                    value: submissions.filter((s) => s.status === "pending").length,
                  },
                  {
                    label: "Approved",
                    value: submissions.filter((s) => s.status === "approved").length,
                  },
                  {
                    label: "Rejected",
                    value: submissions.filter((s) => s.status === "rejected").length,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-text">{value}</p>
    </div>
  );
}