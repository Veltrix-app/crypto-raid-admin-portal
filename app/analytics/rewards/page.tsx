"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import RewardsChart from "@/components/charts/rewards/RewardsChart";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function AnalyticsRewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);
  const claims = useAdminPortalStore((s) => s.claims);

  const claimableRewards = rewards.filter((reward) => reward.claimable);
  const rewardClaims = rewards.map((reward) => ({
    label: reward.title,
    value: claims.filter((claim) => claim.rewardId === reward.id).length,
  }));
  const rewardCostBands = [
    {
      label: "Low Value",
      value: rewards.filter((reward) => reward.cost < 250).length,
    },
    {
      label: "Mid Value",
      value: rewards.filter((reward) => reward.cost >= 250 && reward.cost < 1000).length,
    },
    {
      label: "High Value",
      value: rewards.filter((reward) => reward.cost >= 1000).length,
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Reward Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Rewards</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sub">
            Reward analytics show whether your incentive loop is shallow, healthy or creating too
            much fulfillment pressure.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <MetricCard
            label="Rewards"
            value={rewards.length}
            hint="Total rewards available across scoped projects."
          />
          <MetricCard
            label="Claimable"
            value={claimableRewards.length}
            hint="Rewards users can actively move toward or claim."
          />
          <MetricCard
            label="Claims"
            value={claims.length}
            hint="Total reward claim attempts processed so far."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Reward Demand</h2>
            <div className="mt-5">
              <RewardsChart items={rewardClaims} />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Value Bands</h2>
            <div className="mt-5">
              <RewardsChart items={rewardCostBands} />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Fulfillment Pressure</h2>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-line bg-card2">
            <div className="grid grid-cols-5 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
              <div>Reward</div>
              <div>Type</div>
              <div>Claims</div>
              <div>Method</div>
              <div>Value</div>
            </div>

            {rewards
              .slice()
              .sort(
                (a, b) =>
                  claims.filter((claim) => claim.rewardId === b.id).length -
                  claims.filter((claim) => claim.rewardId === a.id).length
              )
              .slice(0, 8)
              .map((reward) => (
                <div
                  key={reward.id}
                  className="grid grid-cols-5 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                >
                  <div className="font-semibold">{reward.title}</div>
                  <div className="capitalize">{reward.rewardType}</div>
                  <div>{claims.filter((claim) => claim.rewardId === reward.id).length}</div>
                  <div className="capitalize">{reward.claimMethod.replace(/_/g, " ")}</div>
                  <div>{reward.cost}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}
