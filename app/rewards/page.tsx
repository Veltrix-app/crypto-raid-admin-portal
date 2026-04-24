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
  OpsSnapshotRow,
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
      const project = projects.find((item) => item.id === reward.projectId);
      const campaign = campaigns.find((item) => item.id === reward.campaignId);
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
  const manualFulfillmentCount = rewards.filter(
    (reward) => reward.claimMethod === "manual_fulfillment"
  ).length;

  const claimFlowRewards = useMemo(
    () =>
      [...filteredRewards]
        .filter((reward) => reward.claimable || reward.claimMethod === "manual_fulfillment")
        .sort((a, b) => Number(b.claimable) - Number(a.claimable) || b.cost - a.cost),
    [filteredRewards]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Reward management"
        title="Rewards"
        description="Keep the reward system clear: one calmer inventory lane for what exists, and one claim lane for the rewards that can actually create operational demand."
        actions={
          <Link
            href="/rewards/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black"
          >
            New Reward
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Current lane"
                title={
                  rewardsView === "catalog"
                    ? "Read the reward inventory"
                    : "Read claim and fulfillment pressure"
                }
                description={
                  rewardsView === "catalog"
                    ? "Use this lane when the goal is to understand the inventory itself: type mix, scarcity, visibility and campaign coverage."
                    : "Use this lane when the team needs to reason about which rewards can create claim load, manual work or stock stress."
                }
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
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsSnapshotRow
                    label="In view"
                    value={`${filteredRewards.length} rewards match the current filters.`}
                  />
                  <OpsSnapshotRow
                    label="Visibility"
                    value={`${visibleCount} reward${visibleCount === 1 ? "" : "s"} are currently visible in the product surface.`}
                  />
                  <OpsSnapshotRow
                    label="Next read"
                    value={
                      rewardsView === "catalog"
                        ? "Start with title and campaign context, then check type, rarity and cost."
                        : "Prioritize claimable and manual-fulfillment rewards before browsing the long tail."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="grid gap-4 sm:grid-cols-2">
                <OpsMetricCard label="Active" value={activeCount} emphasis="primary" />
                <OpsMetricCard
                  label="Claimable"
                  value={claimableCount}
                  emphasis={claimableCount > 0 ? "primary" : "default"}
                />
                <OpsMetricCard
                  label="Limited stock"
                  value={limitedStockCount}
                  emphasis={limitedStockCount > 0 ? "warning" : "default"}
                />
                <OpsMetricCard label="Avg cost" value={avgCost} />
              </div>
            </div>

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
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <OpsPanel
              eyebrow="Reward posture"
              title="What the reward system is holding"
              description="Use this side to understand where scarcity, claim posture and manual work are starting to stack up."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Manual fulfillment"
                  value={`${manualFulfillmentCount} reward${manualFulfillmentCount === 1 ? "" : "s"} depend on operator delivery outside automatic claims.`}
                />
                <OpsSnapshotRow
                  label="Claimable"
                  value={`${claimableCount} reward${claimableCount === 1 ? "" : "s"} can be actively claimed by contributors.`}
                />
                <OpsSnapshotRow
                  label="Limited stock"
                  value={`${limitedStockCount} reward${limitedStockCount === 1 ? "" : "s"} need stock awareness instead of passive browsing.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Reward roster"
              title="Read the reward stream"
              description="Start with reward and campaign context, then check type, rarity and cost before opening detail."
            >
              <div className="overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.025]">
                <div className="grid grid-cols-8 border-b border-white/6 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
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
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);

                  return (
                    <div
                      key={reward.id}
                      className="grid grid-cols-8 items-center border-b border-white/6 px-5 py-4 text-sm text-text last:border-b-0"
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
                        <OpsStatusPill tone={rewardStatusTone(reward.status)}>{reward.status}</OpsStatusPill>
                      </div>
                      <div>
                        <Link
                          href={`/rewards/${reward.id}`}
                          className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-2 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
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
          </div>
        ) : null}

        {rewardsView === "claims" ? (
          <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
            <OpsPanel
              eyebrow="Claim pressure"
              title="What can create operator demand"
              description="This lane is about the rewards that can trigger real fulfillment work, not just visible catalog volume."
              tone="accent"
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Claimable"
                  value={`${claimableCount} reward${claimableCount === 1 ? "" : "s"} can trigger an active claim journey right now.`}
                />
                <OpsSnapshotRow
                  label="Manual"
                  value={`${manualFulfillmentCount} reward${manualFulfillmentCount === 1 ? "" : "s"} depend on manual fulfillment or operator follow-through.`}
                />
                <OpsSnapshotRow
                  label="What to open next"
                  value="Prioritize claimable rewards with manual fulfillment or limited stock because those create the sharpest operational edges."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Claim board"
              title="Open the rewards that shape fulfillment"
              description="These rewards matter most when you are thinking about real delivery load, not just catalog curation."
            >
              <div className="grid gap-3">
                {claimFlowRewards.map((reward) => {
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);
                  return (
                    <RewardClaimCard
                      key={reward.id}
                      title={reward.title}
                      description={reward.description}
                      href={`/rewards/${reward.id}`}
                      claimMethod={reward.claimMethod.replace(/_/g, " ")}
                      claimable={reward.claimable}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Campaign", value: campaign?.title || "-" },
                        { label: "Cost", value: reward.cost },
                        {
                          label: "Stock",
                          value: reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-",
                        },
                      ]}
                    />
                  );
                })}

                {claimFlowRewards.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
                    No claim-flow rewards match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function rewardStatusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "default";
}

function RewardClaimCard({
  title,
  description,
  href,
  claimMethod,
  claimable,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  claimMethod: string;
  claimable: boolean;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold text-text">{title}</p>
            <OpsStatusPill tone="default">{claimMethod}</OpsStatusPill>
            {claimable ? <OpsStatusPill tone="success">claimable</OpsStatusPill> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[20px] border border-white/6 bg-white/[0.02] px-4 py-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/6 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
