"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rewardType, setRewardType] = useState("all");

  const filteredRewards = useMemo(() => {
    return rewards.filter((reward) => {
      const project = projects.find((p) => p.id === reward.projectId);
      const campaign = campaigns.find((c) => c.id === reward.campaignId);

      const matchesSearch =
        reward.title.toLowerCase().includes(search.toLowerCase()) ||
        reward.description.toLowerCase().includes(search.toLowerCase()) ||
        (project?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (campaign?.title || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || reward.status === status;
      const matchesType = rewardType === "all" || reward.rewardType === rewardType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rewards, campaigns, projects, search, status, rewardType]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reward Management
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

        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rewards..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all statuses</option>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="archived">archived</option>
          </select>

          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all reward types</option>
            <option value="token">token</option>
            <option value="nft">nft</option>
            <option value="role">role</option>
            <option value="allowlist">allowlist</option>
            <option value="access">access</option>
            <option value="badge">badge</option>
            <option value="physical">physical</option>
            <option value="custom">custom</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
            <div>Reward</div>
            <div>Project</div>
            <div>Campaign</div>
            <div>Type</div>
            <div>Rarity</div>
            <div>Cost</div>
            <div>Status</div>
            <div>Open</div>
          </div>

          {filteredRewards.map((reward) => {
            const project = projects.find((p) => p.id === reward.projectId);
            const campaign = campaigns.find((c) => c.id === reward.campaignId);

            return (
              <div
                key={reward.id}
                className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{reward.title}</p>
                  <p className="mt-1 text-xs text-sub">{reward.rewardType}</p>
                </div>
                <div>{project?.name || "-"}</div>
                <div>{campaign?.title || "-"}</div>
                <div className="capitalize">{reward.rewardType}</div>
                <div className="capitalize">{reward.rarity}</div>
                <div>{reward.cost}</div>
                <div className="capitalize text-primary">{reward.status}</div>
                <div>
                  <Link
                    href={`/rewards/${reward.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredRewards.length === 0 ? (
            <div className="px-5 py-8 text-sm text-sub">
              No rewards match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}