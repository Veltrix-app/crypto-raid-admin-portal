"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rewardType, setRewardType] = useState("all");
  const [rewardsView, setRewardsView] = useState<"catalog" | "claims">("catalog");

  const filteredRewards = useMemo(() => {
    return rewards.filter((reward) => {
      const project = projects.find((p) => p.id === reward.projectId);
      const campaign = campaigns.find((c) => c.id === reward.campaignId);
      const term = search.toLowerCase();

      const matchesSearch =
        reward.title.toLowerCase().includes(term) ||
        reward.description.toLowerCase().includes(term) ||
        (project?.name || "").toLowerCase().includes(term) ||
        (campaign?.title || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || reward.status === status;
      const matchesType = rewardType === "all" || reward.rewardType === rewardType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, projects, rewardType, rewards, search, status]);

  const activeCount = rewards.filter((reward) => reward.status === "active").length;
  const claimableCount = rewards.filter((reward) => reward.claimable).length;
  const visibleCount = rewards.filter((reward) => reward.visible).length;
  const avgCost = rewards.length
    ? Math.round(rewards.reduce((sum, reward) => sum + reward.cost, 0) / rewards.length)
    : 0;
  const limitedStockCount = rewards.filter((reward) => !reward.unlimitedStock).length;

  const claimFlowRewards = useMemo(
    () =>
      [...filteredRewards]
        .filter((reward) => reward.claimable || reward.claimMethod === "manual_fulfillment")
        .sort((a, b) => Number(b.claimable) - Number(a.claimable) || b.cost - a.cost)
        .slice(0, 8),
    [filteredRewards]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Reward management"
        title="Rewards"
        description="Split reward inventory from claim-flow operations so the team can reason about scarcity, visibility and fulfillment more clearly."
        actions={
          <Link
            href="/rewards/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Reward
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <OpsMetricCard label="Total rewards" value={rewards.length} />
              <OpsMetricCard
                label="Active"
                value={activeCount}
                emphasis={activeCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Claimable"
                value={claimableCount}
                emphasis={claimableCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Visible"
                value={visibleCount}
                emphasis={visibleCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard label="Avg cost" value={avgCost} />
              <OpsMetricCard
                label="Limited stock"
                value={limitedStockCount}
                emphasis={limitedStockCount > 0 ? "warning" : "default"}
              />
            </div>

            <OpsPanel
              title="Reward work modes"
              description="Use catalog mode for the full reward inventory and claims mode when you want to focus on reward flows that create operational demand."
              action={
                <SegmentToggle
                  value={rewardsView}
                  onChange={setRewardsView}
                  options={[
                    { value: "catalog", label: "Catalog" },
                    { value: "claims", label: "Claims" },
                  ]}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Catalog
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Scan the reward inventory by campaign, type, rarity and scarcity.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Claims
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Pull claimable and fulfillment-heavy rewards into a separate operational lane.
                  </p>
                </div>
              </div>
            </OpsPanel>

            <OpsFilterBar>
              <OpsSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search rewards..."
                ariaLabel="Search rewards"
                name="reward-search"
              />
              <OpsSelect
                value={status}
                onChange={setStatus}
                ariaLabel="Filter rewards by status"
                name="reward-status"
              >
                <option value="all">all statuses</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="archived">archived</option>
              </OpsSelect>
              <OpsSelect
                value={rewardType}
                onChange={setRewardType}
                ariaLabel="Filter rewards by type"
                name="reward-type"
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
              </OpsSelect>
            </OpsFilterBar>
          </div>
        }
      >
        {rewardsView === "catalog" ? (
          <OpsPanel
            eyebrow="Reward catalog"
            title="Reward stream"
            description="The current reward list with project context, type, rarity, cost and a fast route into detail."
          >
            <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
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
                    <div>
                      <OpsStatusPill
                        tone={
                          reward.status === "active"
                            ? "success"
                            : reward.status === "draft"
                              ? "warning"
                              : "default"
                        }
                      >
                        {reward.status}
                      </OpsStatusPill>
                    </div>
                    <div>
                      <Link
                        href={`/rewards/${reward.id}`}
                        className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}

              {filteredRewards.length === 0 ? (
                <div className="px-5 py-8 text-sm text-sub">No rewards match your filters.</div>
              ) : null}
            </div>
          </OpsPanel>
        ) : null}

        {rewardsView === "claims" ? (
          <OpsPanel
            eyebrow="Claim flow"
            title="Claimable and fulfillment-heavy rewards"
            description="This lane highlights rewards where claim posture, delivery method and scarcity create the most operator pressure."
            tone="accent"
          >
            <div className="grid gap-4">
              {claimFlowRewards.map((reward) => {
                const project = projects.find((p) => p.id === reward.projectId);
                const campaign = campaigns.find((c) => c.id === reward.campaignId);
                return (
                  <div key={reward.id} className="rounded-[24px] border border-line bg-card2 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-extrabold text-text">{reward.title}</p>
                          <OpsStatusPill tone="default">{reward.claimMethod.replace(/_/g, " ")}</OpsStatusPill>
                          {reward.claimable ? <OpsStatusPill tone="success">claimable</OpsStatusPill> : null}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-sub">{reward.description}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <RewardStat label="Project" value={project?.name || "-"} />
                          <RewardStat label="Campaign" value={campaign?.title || "-"} />
                          <RewardStat label="Cost" value={reward.cost} />
                          <RewardStat
                            label="Stock"
                            value={reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-"}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/rewards/${reward.id}`}
                        className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}

              {claimFlowRewards.length === 0 ? (
                <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                  No claim-flow rewards match the current filters.
                </div>
              ) : null}
            </div>
          </OpsPanel>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function RewardStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
