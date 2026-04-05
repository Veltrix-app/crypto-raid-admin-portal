"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import RewardsChart from "@/components/charts/rewards/RewardsChart";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function AnalyticsRewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Reward Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Rewards</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Reward Catalog Overview</h2>
          <div className="mt-5">
            <RewardsChart
              items={rewards.map((reward) => ({
                label: reward.title,
                value: reward.stock,
              }))}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}