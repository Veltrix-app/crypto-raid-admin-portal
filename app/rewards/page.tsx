"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reward Catalog
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Rewards</h1>
          </div>

          <Link
            href="/rewards/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Reward
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="rounded-[24px] border border-line bg-card p-5">
              <h2 className="text-xl font-extrabold text-text">{reward.title}</h2>
              <p className="mt-2 text-sm capitalize text-sub">
                {reward.type} • {reward.rarity}
              </p>
              <p className="mt-2 text-sm text-sub">
                Cost: {reward.cost} XP • Stock: {reward.stock}
              </p>
              <Link
                href={`/rewards/${reward.id}`}
                className="mt-4 inline-block rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}