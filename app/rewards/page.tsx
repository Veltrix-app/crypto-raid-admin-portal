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

  const catalogLeadRewards = useMemo(
    () =>
      [...filteredRewards]
        .sort((a, b) => Number(b.claimable) - Number(a.claimable) || b.cost - a.cost)
        .slice(0, 6),
    [filteredRewards]
  );

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
        description="Run the incentive layer like a premium reward catalog: one calm inventory lane for what exists and one claim lane for the items that create actual delivery pressure."
        actions={
          <Link
            href="/rewards/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(186,255,59,0.22)]"
          >
            New Reward
          </Link>
        }
        statusBand={
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
              <OpsPanel
                eyebrow="View posture"
                title={
                  rewardsView === "catalog"
                    ? "Read the reward inventory"
                    : "Read claim and fulfillment pressure"
                }
                description={
                  rewardsView === "catalog"
                    ? "Use catalog mode when the goal is to understand the inventory itself: type mix, visibility, scarcity and campaign context."
                    : "Use claims mode when the team needs to reason about which rewards can create manual work, claim load or stock stress."
                }
                tone="accent"
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
                        ? "Start with title, campaign and rarity, then judge cost and scarcity."
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

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-sub">
                {rewardsView === "catalog"
                  ? "Catalog mode keeps the reward layer feeling curated instead of like a fulfillment spreadsheet."
                  : "Claims mode reduces the system to the incentives that can actually create operator demand, stock pressure or manual delivery."}
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-sub">
                {manualFulfillmentCount} manual reward flows still depend on explicit operator follow-through
              </div>
            </div>
          </div>
        }
      >
        {rewardsView === "catalog" ? (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <OpsPanel
              eyebrow="Reward posture"
              title="What the reward system is carrying"
              description="Use this rail to understand where scarcity, claim posture and manual fulfillment are starting to stack up."
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
                <OpsSnapshotRow
                  label="Visibility"
                  value={`${visibleCount} reward${visibleCount === 1 ? "" : "s"} are visible in the public product surface.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Lead rewards"
              title="Open the rewards shaping demand"
              description="This rail replaces the denser roster with cards so you can read value, claim posture and campaign context in one glance."
            >
              <div className="grid gap-4">
                {catalogLeadRewards.map((reward) => {
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);

                  return (
                    <RewardSurfaceCard
                      key={reward.id}
                      title={reward.title}
                      description={reward.description}
                      href={`/rewards/${reward.id}`}
                      badgeTone={rewardStatusTone(reward.status)}
                      badges={[
                        reward.status,
                        reward.rewardType,
                        campaign?.title || null,
                      ]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Cost", value: reward.cost },
                        {
                          label: "Stock",
                          value: reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-",
                        },
                      ]}
                    />
                  );
                })}

                {catalogLeadRewards.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
                    No rewards match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {rewardsView === "claims" ? (
          <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
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
              eyebrow="Claim rail"
              title="Open the rewards that shape fulfillment"
              description="These rewards matter most when you are thinking about real delivery load, not just catalog curation."
            >
              <div className="grid gap-4">
                {claimFlowRewards.map((reward) => {
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);

                  return (
                    <RewardSurfaceCard
                      key={reward.id}
                      title={reward.title}
                      description={reward.description}
                      href={`/rewards/${reward.id}`}
                      badgeTone="default"
                      badges={[
                        reward.claimMethod.replace(/_/g, " "),
                        reward.claimable ? "claimable" : null,
                        campaign?.title || null,
                      ]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Cost", value: reward.cost },
                        {
                          label: "Stock",
                          value: reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-",
                        },
                      ]}
                      accent={reward.claimable || reward.claimMethod === "manual_fulfillment"}
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

function RewardSurfaceCard({
  title,
  description,
  href,
  badges,
  stats,
  badgeTone,
  accent = false,
}: {
  title: string;
  description: string;
  href: string;
  badges: Array<string | null>;
  stats: Array<{ label: string; value: string | number }>;
  badgeTone: "default" | "success" | "warning";
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${
        accent
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(18,24,35,0.96),rgba(10,14,22,0.94))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(18,24,35,0.94),rgba(11,15,23,0.92))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-extrabold tracking-[-0.03em] text-text">{title}</p>
            {badges.filter(Boolean).map((badge, index) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={index === 0 ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sub">{description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[20px] border border-white/6 bg-white/[0.025] px-4 py-3"
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
          className="rounded-full border border-white/8 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
