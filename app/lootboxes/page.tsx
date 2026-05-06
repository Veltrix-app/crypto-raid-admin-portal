"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  PackageOpen,
  PauseCircle,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  LOOTBOX_STUDIO_TIERS,
  SHARD_STUDIO_ASSET_PATH,
  buildLootboxStudioReadiness,
  formatOdds,
  getLootboxPoolItemsForTier,
  getLootboxRarityTone,
  type LootboxStudioRarity,
  type LootboxStudioTierId,
  type LootboxTierReadiness,
} from "@/lib/lootboxes/lootbox-studio-catalog";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminFeaturedShardPool } from "@/types/entities/featured-shard-pool";

const rarityOrder: LootboxStudioRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export default function LootboxesPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);
  const featuredShardPools = useAdminPortalStore((s) => s.featuredShardPools);
  const [selectedTierId, setSelectedTierId] = useState<LootboxStudioTierId>("common");

  const readiness = useMemo(() => buildLootboxStudioReadiness(), []);
  const selectedReadiness =
    readiness.find((item) => item.tier.id === selectedTierId) ?? readiness[0]!;
  const selectedOutcomes = getLootboxPoolItemsForTier(selectedReadiness.tier.id);
  const activePools = featuredShardPools.filter((pool) => pool.status === "active");
  const pausedPools = featuredShardPools.filter((pool) => pool.status === "paused");
  const totalPoolSize = featuredShardPools.reduce((sum, pool) => sum + pool.poolSize, 0);
  const remainingShards = featuredShardPools.reduce(
    (sum, pool) => sum + pool.remainingShards,
    0
  );
  const issuedShards = Math.max(0, totalPoolSize - remainingShards);
  const depletionRate =
    totalPoolSize > 0 ? Math.round((issuedShards / totalPoolSize) * 100) : 0;
  const boostedCampaignCount = new Set(
    featuredShardPools
      .map((pool) => pool.campaignId)
      .filter((campaignId): campaignId is string => Boolean(campaignId))
  ).size;

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Shard economy"
        title="Lootbox Control Room"
        description="Tune the hunt layer from one command view: tier economics, outcome posture and live shard boosts stay visible before campaign demand moves."
        actions={
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] font-black text-black shadow-[0_18px_40px_rgba(186,255,59,0.18)]"
          >
            <Sparkles size={14} />
            Create boost campaign
          </Link>
        }
        statusBand={
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <OpsPanel
              eyebrow="Economy posture"
              title="Shard demand is now tied to featured campaign pressure"
              description="Phase 2B starts with a safe control-room layer: no new schema, no mutation risk, but operators can see what boxes cost and where sponsored shard pools are creating urgency."
              tone="accent"
              action={<ShardToken value={remainingShards} label="remaining" />}
            >
              <div className="grid gap-3 md:grid-cols-4">
                <OpsMetricCard
                  label="Active boosts"
                  value={activePools.length}
                  sub="Live pools currently adding bonus shards."
                  emphasis={activePools.length > 0 ? "primary" : "default"}
                />
                <OpsMetricCard
                  label="Boosted campaigns"
                  value={boostedCampaignCount}
                  sub="Campaigns carrying at least one shard pool."
                />
                <OpsMetricCard
                  label="Issued shards"
                  value={issuedShards.toLocaleString("en-US")}
                  sub={`${depletionRate}% of sponsored pool inventory has been consumed.`}
                  emphasis={depletionRate > 70 ? "warning" : "default"}
                />
                <OpsMetricCard
                  label="Tier catalog"
                  value={LOOTBOX_STUDIO_TIERS.length}
                  sub="Common through Mythic lanes are mapped."
                />
              </div>
            </OpsPanel>

            <div className="space-y-2.5 rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(12,15,21,0.98),rgba(7,9,14,0.98))] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  Guardrails
                </p>
                <ShieldCheck size={15} className="text-primary" />
              </div>
              <GuardrailRow
                icon={<BadgeCheck size={14} />}
                label="XP remains separate"
                value="Users hunt shards; XP is not spent."
              />
              <GuardrailRow
                icon={<RadioTower size={14} />}
                label="Boosts are finite"
                value="Pools deplete only after verified quest or raid activity."
              />
              <GuardrailRow
                icon={<PauseCircle size={14} />}
                label="Campaign-safe controls"
                value="Pause shard pools from campaign detail when pressure needs a brake."
              />
            </div>
          </div>
        }
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="space-y-3">
            <OpsPanel
              eyebrow="Tier architecture"
              title="Lootbox tiers"
              description="Pick a tier to inspect price, unlock posture, odds and the exact reward pool members can hit."
            >
              <div className="grid gap-3 lg:grid-cols-5">
                {readiness.map((item) => (
                  <TierCard
                    key={item.tier.id}
                    readiness={item}
                    selected={item.tier.id === selectedTierId}
                    onSelect={() => setSelectedTierId(item.tier.id)}
                  />
                ))}
              </div>
            </OpsPanel>

            <div className="grid gap-3 2xl:grid-cols-[0.95fr_1.05fr]">
              <TierInspector readiness={selectedReadiness} />
              <OpsPanel
                eyebrow="Outcome matrix"
                title={`${selectedReadiness.tier.label} reward pool`}
                description="This is the currently seeded outcome mix for the selected tier."
              >
                <div className="grid gap-2">
                  {selectedOutcomes.map((item) => (
                    <OutcomeRow
                      key={`${item.tierId}-${item.label}-${item.itemType}`}
                      rarity={item.rarity}
                      label={item.label}
                      itemType={item.itemType}
                      weight={item.weight}
                      payloadLabel={item.payloadLabel}
                    />
                  ))}
                </div>
              </OpsPanel>
            </div>
          </div>

          <aside className="space-y-3">
            <OpsPanel
              eyebrow="Live pressure"
              title="Featured shard pools"
              description="Active and paused boosts determine where members have a reason to hunt."
              action={
                <OpsStatusPill tone={activePools.length > 0 ? "success" : "default"}>
                  {activePools.length} active
                </OpsStatusPill>
              }
            >
              <div className="space-y-2.5">
                {featuredShardPools.length > 0 ? (
                  featuredShardPools.slice(0, 6).map((pool) => (
                    <PoolPressureCard
                      key={pool.id}
                      pool={pool}
                      campaignTitle={
                        campaigns.find((campaign) => campaign.id === pool.campaignId)?.title ??
                        "Campaign boost"
                      }
                      projectName={
                        projects.find((project) => project.id === pool.projectId)?.name ??
                        "Workspace"
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
                    No shard boost pools are attached yet. Create a campaign with a boost preset
                    to start the hunt layer.
                  </div>
                )}
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Next operator read"
              title="What to tune first"
              description="Keep the economy readable before opening deeper mutation controls."
            >
              <div className="grid gap-2.5">
                <OpsSnapshotRow
                  label="Budget"
                  value={`${remainingShards.toLocaleString("en-US")} shards remain across ${featuredShardPools.length} pool${featuredShardPools.length === 1 ? "" : "s"}.`}
                />
                <OpsSnapshotRow
                  label="Paused pressure"
                  value={`${pausedPools.length} pool${pausedPools.length === 1 ? "" : "s"} can be resumed from campaign detail.`}
                />
                <OpsSnapshotRow
                  label="High-price tier"
                  value="Mythic stays season-gated until the reward pool can support the risk."
                />
              </div>
            </OpsPanel>
          </aside>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}

function ShardToken({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
      <Image
        src={SHARD_STUDIO_ASSET_PATH}
        alt=""
        width={22}
        height={22}
        className="h-5 w-5 object-contain"
      />
      {value.toLocaleString("en-US")}
      <span className="text-primary/58">{label}</span>
    </span>
  );
}

function GuardrailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[15px] border border-white/[0.018] bg-white/[0.012] p-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.055] text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-text">{label}</p>
        <p className="mt-1 text-[11px] leading-5 text-sub">{value}</p>
      </div>
    </div>
  );
}

function TierCard({
  readiness,
  selected,
  onSelect,
}: {
  readiness: LootboxTierReadiness;
  selected: boolean;
  onSelect: () => void;
}) {
  const { tier } = readiness;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative min-h-[250px] overflow-hidden rounded-[18px] border p-3 text-left transition ${
        selected
          ? "border-primary/30 bg-primary/[0.07] shadow-[0_0_34px_rgba(186,255,59,0.11)]"
          : "border-white/[0.022] bg-[linear-gradient(180deg,rgba(15,18,25,0.86),rgba(8,10,15,0.9))] hover:border-white/[0.07]"
      }`}
    >
      <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary/80">
            {tier.id}
          </p>
          <h3 className="mt-1 truncate text-[13px] font-semibold text-text">{tier.label}</h3>
        </div>
        {selected ? <BadgeCheck size={15} className="text-primary" /> : <PackageOpen size={15} className="text-sub" />}
      </div>

      <div className="relative mt-3 flex h-24 items-center justify-center">
        <div className="absolute inset-x-7 bottom-2 h-8 rounded-full bg-black/40 blur-xl" />
        <Image
          src={tier.assetPath}
          alt={tier.label}
          width={170}
          height={170}
          className="relative h-24 w-24 object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.45)] transition duration-300 group-hover:scale-[1.04]"
          sizes="96px"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <ShardToken value={tier.priceShards} label="cost" />
      </div>
      <p className="mt-3 text-[10px] leading-4 text-sub">
        {readiness.outcomeCount} outcomes, top lane {readiness.dominantRarity}.
      </p>
    </button>
  );
}

function TierInspector({ readiness }: { readiness: LootboxTierReadiness }) {
  const { tier } = readiness;

  return (
    <OpsPanel
      eyebrow="Selected tier"
      title={tier.label}
      description="Price, access posture and odds distribution stay visible before operators tune the pool."
      action={<ShardToken value={tier.priceShards} label="open cost" />}
    >
      <div className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-2">
          <OpsSnapshotRow
            label="Access"
            value={readiness.lockedBy.length ? readiness.lockedBy.join(" / ") : "Open to all members"}
          />
          <OpsSnapshotRow
            label="Pool weight"
            value={`${readiness.totalWeight} total outcome weight across ${readiness.outcomeCount} outcomes.`}
          />
        </div>
        <div className="space-y-2">
          {rarityOrder.map((rarity) => {
            const odds = tier.odds[rarity] ?? 0;
            return <OddsRail key={rarity} rarity={rarity} value={odds} />;
          })}
        </div>
      </div>
    </OpsPanel>
  );
}

function OddsRail({ rarity, value }: { rarity: LootboxStudioRarity; value: number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.018] bg-white/[0.012] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getLootboxRarityTone(rarity)}`}>
          {rarity}
        </span>
        <span className="text-[11px] font-semibold text-text">{formatOdds(value)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.035]">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.28)]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function OutcomeRow({
  rarity,
  label,
  itemType,
  weight,
  payloadLabel,
}: {
  rarity: LootboxStudioRarity;
  label: string;
  itemType: string;
  weight: number;
  payloadLabel: string;
}) {
  return (
    <div className="grid gap-3 rounded-[15px] border border-white/[0.018] bg-white/[0.012] p-3 md:grid-cols-[1fr_160px] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getLootboxRarityTone(rarity)}`}>
            {rarity}
          </span>
          <span className="rounded-full border border-white/[0.026] bg-white/[0.018] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-sub">
            {itemType.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-text">{label}</p>
        <p className="mt-1 text-[11px] leading-5 text-sub">{payloadLabel}</p>
      </div>
      <div className="rounded-[13px] border border-white/[0.018] bg-black/15 px-3 py-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-sub">Weight</p>
        <p className="mt-1 text-[13px] font-semibold text-text">{weight}</p>
      </div>
    </div>
  );
}

function PoolPressureCard({
  pool,
  campaignTitle,
  projectName,
}: {
  pool: AdminFeaturedShardPool;
  campaignTitle: string;
  projectName: string;
}) {
  const used = Math.max(0, pool.poolSize - pool.remainingShards);
  const remainingRate =
    pool.poolSize > 0 ? Math.round((pool.remainingShards / pool.poolSize) * 100) : 0;

  return (
    <Link
      href={pool.campaignId ? `/campaigns/${pool.campaignId}` : "/campaigns"}
      className="group block rounded-[16px] border border-white/[0.018] bg-[linear-gradient(180deg,rgba(15,18,25,0.86),rgba(8,10,15,0.9))] p-3 transition hover:border-primary/22 hover:bg-primary/[0.045]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone={pool.status === "active" ? "success" : pool.status === "paused" ? "warning" : "default"}>
              {pool.status}
            </OpsStatusPill>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-sub">
              {projectName}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-[12px] font-semibold text-text">
            {campaignTitle}
          </p>
        </div>
        <ArrowRight size={15} className="mt-1 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniRead label="Left" value={pool.remainingShards.toLocaleString("en-US")} />
        <MiniRead label="Issued" value={used.toLocaleString("en-US")} />
        <MiniRead label="Boost" value={`+${pool.bonusMin}-${pool.bonusMax}`} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.035]">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.24)]"
          style={{ width: `${remainingRate}%` }}
        />
      </div>
    </Link>
  );
}

function MiniRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/[0.016] bg-white/[0.012] px-2.5 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-text">{value}</p>
    </div>
  );
}
