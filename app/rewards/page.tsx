"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Crown, Sparkles } from "lucide-react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  getRewardTreasuryConfig,
  getRewardTreasuryPosture,
} from "@/lib/rewards/reward-treasury";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminReward } from "@/types/entities/reward";

type RewardsView = "catalog" | "claims" | "passes";

type MemberPassTier = {
  id: "spark" | "surge" | "mythic";
  name: string;
  utility: string;
  price: string;
  image: string;
  description: string;
  shardLift: string;
  recommended?: boolean;
  tone: "teal" | "violet" | "gold";
  perks: Array<{ label: string; detail: string }>;
};

const MEMBER_PASS_TIERS: MemberPassTier[] = [
  {
    id: "spark",
    name: "Spark Pass",
    utility: "Entry utility",
    price: "$5",
    image: "/assets/member-passes/spark-pass.webp",
    description:
      "A focused pass for everyday players who want the first layer of utility without turning the economy into a paywall.",
    shardLift: "Small featured shard lift",
    tone: "teal",
    perks: [
      {
        label: "Featured shard lift",
        detail: "A light bonus for featured quests and raids once passes go live.",
      },
      {
        label: "Profile pass mark",
        detail: "A public member pass signal for profile and leaderboard identity.",
      },
      {
        label: "Common lane priority",
        detail: "A clearer route into common and rare lootbox chase loops.",
      },
    ],
  },
  {
    id: "surge",
    name: "Surge Pass",
    utility: "Hunter utility",
    price: "$10",
    image: "/assets/member-passes/surge-pass.webp",
    description:
      "The main hunter pass for members who keep returning to featured activity and need stronger progression pressure.",
    shardLift: "Medium featured shard lift",
    recommended: true,
    tone: "violet",
    perks: [
      {
        label: "Stronger shard lift",
        detail: "A bigger featured activity boost for users who hunt consistently.",
      },
      {
        label: "Epic access pressure",
        detail: "A pass layer designed around faster epic-tier readiness.",
      },
      {
        label: "Cosmetic lane",
        detail: "A stronger chance to make cosmetic rewards feel visible and collectible.",
      },
    ],
  },
  {
    id: "mythic",
    name: "Mythic Pass",
    utility: "Premium utility",
    price: "$15",
    image: "/assets/member-passes/mythic-pass.webp",
    description:
      "The premium pass for the highest-intent members, kept planned until reward funding and entitlement gates are mature.",
    shardLift: "Highest featured shard lift",
    tone: "gold",
    perks: [
      {
        label: "Mythic window support",
        detail: "A premium layer for users chasing the highest rarity box windows.",
      },
      {
        label: "Season identity",
        detail: "A stronger public signal for pass holders during active seasons.",
      },
      {
        label: "Reward readiness",
        detail: "A clearer path for future USDC, sponsored and premium reward lanes.",
      },
    ],
  },
];

export default function RewardsPage() {
  const rewards = useAdminPortalStore((s) => s.rewards);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rewardType, setRewardType] = useState("all");
  const [rewardsView, setRewardsView] = useState<RewardsView>("catalog");

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "passes") {
      setRewardsView("passes");
    }
  }, []);

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
  const viewPosture = {
    catalog: {
      title: "Read the reward inventory",
      description:
        "Use catalog mode when the goal is to understand the inventory itself: type mix, visibility, scarcity and campaign context.",
      nextRead: "Start with title, campaign and rarity, then judge cost and scarcity.",
      helper: "Catalog mode keeps the reward layer feeling curated instead of like a fulfillment spreadsheet.",
    },
    claims: {
      title: "Read claim and fulfillment pressure",
      description:
        "Use claims mode when the team needs to reason about which rewards can create manual work, claim load or stock stress.",
      nextRead:
        "Prioritize claimable and manual-fulfillment rewards before browsing the long tail.",
      helper:
        "Claims mode reduces the system to the incentives that can actually create operator demand, stock pressure or manual delivery.",
    },
    passes: {
      title: "Shape monthly member utility",
      description:
        "Use pass mode for the planned paid member layer: pricing, public identity, shard boost promises and future entitlement gates.",
      nextRead: "Keep pass perks here on Rewards; Lootboxes should only reference this layer as a shard sink.",
      helper:
        "Member passes are a rewards economy product, not a lootbox control. This view keeps the utility ladder visible without cluttering box operations.",
    },
  } satisfies Record<
    RewardsView,
    { title: string; description: string; nextRead: string; helper: string }
  >;
  const rewardFundingPostures = rewards.map((reward) => getFundingPosture(reward));
  const fundingReadyCount = rewardFundingPostures.filter(
    (posture) => !posture.requiresFunding || posture.ready
  ).length;
  const needsFundingCount = rewardFundingPostures.filter(
    (posture) => posture.requiresFunding && !posture.ready
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
            Create funded reward
          </Link>
        }
        statusBand={
          <div className="space-y-5">
            <div className="grid gap-4 xl:items-start xl:grid-cols-[1.12fr_0.88fr]">
              <OpsPanel
                eyebrow="View posture"
                title={viewPosture[rewardsView].title}
                description={viewPosture[rewardsView].description}
                tone="accent"
                action={
                  <SegmentToggle
                    value={rewardsView}
                    onChange={setRewardsView}
                    options={[
                      { value: "catalog", label: "Catalog" },
                      { value: "claims", label: "Claims" },
                      { value: "passes", label: "Passes" },
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
                    value={viewPosture[rewardsView].nextRead}
                  />
                </div>
              </OpsPanel>

              <div className="space-y-2.5 rounded-[16px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Signal rail
                </p>
                <RewardSignal label="Active" value={`${activeCount}`} />
                <RewardSignal label="Claimable" value={`${claimableCount}`} />
                <RewardSignal
                  label="Limited stock"
                  value={`${limitedStockCount}`}
                  tone={limitedStockCount > 0 ? "warning" : "default"}
                />
                <RewardSignal label="Funding ready" value={`${fundingReadyCount}`} />
                <RewardSignal label="Avg cost" value={`${avgCost}`} />
                <RewardSignal label="Pass tiers" value={`${MEMBER_PASS_TIERS.length}`} />
                <RewardSignal
                  label="Needs funding"
                  value={`${needsFundingCount}`}
                  tone={needsFundingCount > 0 ? "warning" : "default"}
                />
              </div>
            </div>

            {rewardsView === "passes" ? (
              <div className="grid gap-3 md:grid-cols-3">
                <OpsSnapshotRow
                  label="Pass posture"
                  value="Spark, Surge and Mythic stay planned until entitlement and checkout controls are ready."
                />
                <OpsSnapshotRow
                  label="Shard sink"
                  value="Passes create a second reason to hunt shards without making XP spendable."
                />
                <OpsSnapshotRow
                  label="Placement"
                  value="Rewards owns the pass ladder; Lootboxes keeps a compact reference only."
                />
              </div>
            ) : (
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
            )}

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {viewPosture[rewardsView].helper}
              </div>
              <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {rewardsView === "passes"
                  ? `${MEMBER_PASS_TIERS.length} planned pass tiers stay gated behind billing, entitlement and perk controls.`
                  : `${manualFulfillmentCount} manual reward flows still depend on explicit operator follow-through`}
              </div>
            </div>
          </div>
        }
      >
        {rewardsView === "passes" ? <MemberPassBlueprint tiers={MEMBER_PASS_TIERS} /> : null}

        {rewardsView === "catalog" ? (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
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
              <div className="grid gap-4 2xl:grid-cols-2">
                {catalogLeadRewards.map((reward) => {
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);
                  const fundingPosture = getFundingPosture(reward);

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
                        fundingPosture.label,
                        campaign?.title || null,
                      ]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Cost", value: reward.cost },
                        {
                          label: "Funding",
                          value: fundingPosture.ready ? "Safe" : "Needs proof",
                        },
                        {
                          label: "Stock",
                          value: reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-",
                        },
                      ]}
                    />
                  );
                })}

                {catalogLeadRewards.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
                    No rewards match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {rewardsView === "claims" ? (
          <div className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr] xl:items-start">
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
              <div className="grid gap-4 2xl:grid-cols-2">
                {claimFlowRewards.map((reward) => {
                  const project = projects.find((item) => item.id === reward.projectId);
                  const campaign = campaigns.find((item) => item.id === reward.campaignId);
                  const fundingPosture = getFundingPosture(reward);

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
                        fundingPosture.label,
                        campaign?.title || null,
                      ]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Cost", value: reward.cost },
                        {
                          label: "Funding",
                          value: fundingPosture.ready ? "Safe" : "Needs proof",
                        },
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
                  <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
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

function getFundingPosture(reward: AdminReward) {
  return getRewardTreasuryPosture(
    getRewardTreasuryConfig(reward.deliveryConfig, {
      rewardType: reward.rewardType,
      claimable: reward.claimable,
    }),
    reward.rewardType,
    reward.claimable
  );
}

function rewardStatusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "default";
}

function RewardSignal({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-[18px] border px-3.5 py-3 ${
        tone === "warning"
          ? "border-amber-400/16 bg-amber-500/[0.07]"
          : "border-white/[0.026] bg-white/[0.014]"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}

function MemberPassBlueprint({ tiers }: { tiers: MemberPassTier[] }) {
  return (
    <div id="member-passes" className="space-y-4">
      <OpsPanel
        eyebrow="Member pass blueprint"
        title="Monthly utility ladder"
        description="Passes live with Rewards because they shape paid member utility, public identity and a second shard sink beyond lootboxes."
        tone="accent"
        action={<OpsStatusPill tone="warning">Planned layer</OpsStatusPill>}
      >
        <div className="grid gap-4 2xl:grid-cols-3">
          {tiers.map((tier) => (
            <MemberPassTierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </OpsPanel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <OpsPanel
          eyebrow="Entitlement map"
          title="What Rewards should own"
          description="These controls stay away from the lootbox studio until billing and pass entitlements are real."
        >
          <div className="grid gap-3">
            <PassBlueprintRow
              icon={<Crown size={14} />}
              label="Pass identity"
              value="Profile marks, leaderboard signals and public member status belong to the rewards identity layer."
            />
            <PassBlueprintRow
              icon={<Sparkles size={14} />}
              label="Shard boost rules"
              value="The pass can boost featured activity earnings, but the actual quest and raid proof still controls shard issuance."
            />
            <PassBlueprintRow
              icon={<BadgeCheck size={14} />}
              label="Future billing gate"
              value="Checkout, renewal state and entitlement checks can be added later without touching lootbox reward pools."
            />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Lootbox connection"
          title="How this should reference boxes"
          description="Lootboxes should treat member passes as a planned demand driver, not as a place to configure subscription perks."
          action={
            <Link
              href="/lootboxes"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.04] bg-white/[0.018] px-3 py-2 text-[12px] font-black text-text transition hover:border-primary/24 hover:text-primary"
            >
              Open lootboxes
              <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            <OpsSnapshotRow
              label="Economy role"
              value="Passes make users more motivated to hunt shards."
            />
            <OpsSnapshotRow
              label="Lootbox role"
              value="Boxes remain the shard spend surface and reward-pool control room."
            />
            <OpsSnapshotRow
              label="Operator rule"
              value="Configure perks here; only reference the pass layer from lootbox ops."
            />
          </div>
        </OpsPanel>
      </div>
    </div>
  );
}

function MemberPassTierCard({ tier }: { tier: MemberPassTier }) {
  return (
    <article className={`overflow-hidden rounded-[24px] border shadow-[0_22px_60px_rgba(0,0,0,0.22)] ${getPassShellClass(tier.tone)}`}>
      <div className="relative aspect-[3/2] overflow-hidden bg-black">
        <Image
          src={tier.image}
          alt={`${tier.name} visual`}
          fill
          sizes="(min-width: 1536px) 32vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          priority={tier.recommended}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))] p-4">
          <div>
            <OpsStatusPill tone={tier.recommended ? "success" : "default"}>
              {tier.recommended ? "recommended" : "planned"}
            </OpsStatusPill>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-black/58 px-4 py-3 text-right backdrop-blur-md">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sub">Monthly</p>
            <p className="mt-1 text-[20px] font-black text-white">{tier.price}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sub">
              {tier.utility}
            </p>
            <h2 className="mt-1.5 break-words text-[20px] font-black tracking-[-0.02em] text-text [overflow-wrap:anywhere]">
              {tier.name}
            </h2>
          </div>
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getPassIconClass(tier.tone)}`}>
            <Crown size={17} />
          </span>
        </div>

        <p className="text-[13px] leading-6 text-sub">{tier.description}</p>

        <div className={`rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] ${getPassLiftClass(tier.tone)}`}>
          {tier.shardLift}
        </div>

        <div className="grid gap-2.5">
          {tier.perks.map((perk) => (
            <div
              key={`${tier.id}-${perk.label}`}
              className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3"
            >
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${getPassIconClass(tier.tone)}`}>
                  <BadgeCheck size={12} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.13em] text-text">
                    {perk.label}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-sub">{perk.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function PassBlueprintRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.07] text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-text">{label}</p>
          <p className="mt-1.5 text-[12px] leading-5 text-sub">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getPassShellClass(tone: MemberPassTier["tone"]) {
  switch (tone) {
    case "teal":
      return "border-cyan-300/18 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(14,23,28,0.98),rgba(8,12,16,0.96))]";
    case "violet":
      return "border-violet-300/18 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.17),transparent_34%),linear-gradient(180deg,rgba(19,16,32,0.98),rgba(9,8,16,0.96))]";
    case "gold":
    default:
      return "border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_34%),linear-gradient(180deg,rgba(31,22,12,0.98),rgba(12,9,7,0.96))]";
  }
}

function getPassIconClass(tone: MemberPassTier["tone"]) {
  switch (tone) {
    case "teal":
      return "border-cyan-300/22 bg-cyan-300/[0.08] text-cyan-100";
    case "violet":
      return "border-violet-300/24 bg-violet-300/[0.08] text-violet-100";
    case "gold":
    default:
      return "border-amber-300/24 bg-amber-300/[0.08] text-amber-100";
  }
}

function getPassLiftClass(tone: MemberPassTier["tone"]) {
  switch (tone) {
    case "teal":
      return "border-cyan-300/18 bg-cyan-300/[0.065] text-cyan-100";
    case "violet":
      return "border-violet-300/20 bg-violet-300/[0.07] text-violet-100";
    case "gold":
    default:
      return "border-amber-300/20 bg-amber-300/[0.075] text-amber-100";
  }
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
      className={`relative overflow-hidden rounded-[18px] border p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)] ${
        accent
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(18,24,35,0.96),rgba(10,14,22,0.94))]"
          : "border-white/[0.026] bg-[linear-gradient(180deg,rgba(14,18,26,0.96),rgba(9,12,18,0.94))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.92rem] font-semibold tracking-[-0.02em] text-text">{title}</p>
            {badges.filter(Boolean).map((badge, index) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={index === 0 ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-2 line-clamp-2 max-w-3xl text-[13px] leading-6 text-sub">{description}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[12px] border border-white/[0.026] bg-white/[0.014] px-3 py-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/[0.032] bg-white/[0.016] px-3.5 py-2 text-[12px] font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          View
        </Link>
      </div>
    </div>
  );
}
