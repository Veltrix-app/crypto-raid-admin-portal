"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Crown,
  FileText,
  Gift,
  History,
  PackageOpen,
  PauseCircle,
  RadioTower,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  ToggleLeft,
  ToggleRight,
  X,
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
import {
  buildLootboxPoolDraft,
  type LootboxPoolDraftOverride,
  type LootboxPoolDraftRow,
  type LootboxPoolDraftSummary,
} from "@/lib/lootboxes/lootbox-pool-draft";
import {
  buildLootboxInventoryCommandCounts,
  filterLootboxInventoryCommandRows,
  type LootboxActivityRead,
  type LootboxInventoryCommandFilter,
} from "@/lib/lootboxes/lootbox-activity";
import {
  getLootboxInventoryStatusActionLabel,
  type LootboxInventoryStatus,
} from "@/lib/lootboxes/lootbox-inventory-actions";
import type { LootboxStockSafetyRead } from "@/lib/lootboxes/lootbox-stock-safety";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminFeaturedShardPool } from "@/types/entities/featured-shard-pool";

const rarityOrder: LootboxStudioRarity[] = ["common", "rare", "epic", "legendary", "mythic"];
const inventoryCommandStatuses: LootboxInventoryStatus[] = [
  "pending_review",
  "claimed",
  "expired",
];
const inventoryFilterOptions: Array<{ id: LootboxInventoryCommandFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending_review", label: "Review" },
  { id: "owned", label: "Owned" },
  { id: "claimed", label: "Claimed" },
  { id: "expired", label: "Expired" },
  { id: "high_rarity", label: "High rarity" },
];
type PoolSaveMessage = { tone: "success" | "error" | "default"; text: string } | null;

export default function LootboxesPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);
  const featuredShardPools = useAdminPortalStore((s) => s.featuredShardPools);
  const [selectedTierId, setSelectedTierId] = useState<LootboxStudioTierId>("common");
  const [poolDraftOverrides, setPoolDraftOverrides] = useState<
    Partial<Record<LootboxStudioTierId, LootboxPoolDraftOverride[]>>
  >({});
  const [stagedTierId, setStagedTierId] = useState<LootboxStudioTierId | null>(null);
  const [poolSaving, setPoolSaving] = useState(false);
  const [poolSaveMessage, setPoolSaveMessage] = useState<PoolSaveMessage>(null);
  const [stockSafety, setStockSafety] = useState<LootboxStockSafetyRead | null>(null);
  const [stockSafetyLoading, setStockSafetyLoading] = useState(true);
  const [lootboxActivity, setLootboxActivity] = useState<LootboxActivityRead | null>(null);
  const [lootboxActivityLoading, setLootboxActivityLoading] = useState(true);
  const [inventoryActionId, setInventoryActionId] = useState<string | null>(null);
  const [inventoryActionMessage, setInventoryActionMessage] = useState<PoolSaveMessage>(null);
  const [inventoryFilter, setInventoryFilter] = useState<LootboxInventoryCommandFilter>("all");
  const [inventorySearch, setInventorySearch] = useState("");

  const readiness = useMemo(() => buildLootboxStudioReadiness(), []);
  const selectedReadiness =
    readiness.find((item) => item.tier.id === selectedTierId) ?? readiness[0]!;
  const selectedOutcomes = useMemo(
    () => getLootboxPoolItemsForTier(selectedReadiness.tier.id),
    [selectedReadiness.tier.id]
  );
  const selectedDraft = useMemo(
    () => buildLootboxPoolDraft(selectedOutcomes, poolDraftOverrides[selectedTierId] ?? []),
    [poolDraftOverrides, selectedOutcomes, selectedTierId]
  );
  const selectedDraftIsStaged =
    stagedTierId === selectedTierId && selectedDraft.summary.readiness === "ready";
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

  useEffect(() => {
    let cancelled = false;

    async function loadStockSafety() {
      setStockSafetyLoading(true);

      try {
        const response = await fetch("/api/lootboxes/pool-draft", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; stockSafety?: LootboxStockSafetyRead }
          | null;

        if (!cancelled && response.ok && payload?.ok && payload.stockSafety) {
          setStockSafety(payload.stockSafety);
        }
      } finally {
        if (!cancelled) {
          setStockSafetyLoading(false);
        }
      }
    }

    loadStockSafety();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLootboxActivity() {
      setLootboxActivityLoading(true);

      try {
        const activity = await fetchLootboxActivityRead();
        if (!cancelled) {
          setLootboxActivity(activity);
        }
      } finally {
        if (!cancelled) {
          setLootboxActivityLoading(false);
        }
      }
    }

    loadLootboxActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  function updatePoolDraftOverride(
    key: string,
    patch: Omit<LootboxPoolDraftOverride, "key">
  ) {
    setPoolDraftOverrides((current) => {
      const tierOverrides = current[selectedTierId] ?? [];
      const existing = tierOverrides.find((override) => override.key === key);
      const nextOverride = { ...existing, key, ...patch };

      return {
        ...current,
        [selectedTierId]: [
          ...tierOverrides.filter((override) => override.key !== key),
          nextOverride,
        ],
      };
    });
    setStagedTierId(null);
    setPoolSaveMessage(null);
  }

  function resetSelectedPoolDraft() {
    setPoolDraftOverrides((current) => ({
      ...current,
      [selectedTierId]: [],
    }));
    setStagedTierId(null);
    setPoolSaveMessage(null);
  }

  async function fetchLootboxActivityRead() {
    const response = await fetch("/api/lootboxes/activity", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; activity?: LootboxActivityRead }
      | null;

    if (!response.ok || !payload?.ok || !payload.activity) {
      throw new Error("Lootbox activity read failed.");
    }

    return payload.activity;
  }

  async function updateInventoryStatus(id: string, status: LootboxInventoryStatus) {
    if (inventoryActionId) {
      return;
    }

    setInventoryActionId(id);
    setInventoryActionMessage({ tone: "default", text: "Updating inventory status..." });

    try {
      const response = await fetch(`/api/lootboxes/inventory/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Inventory status update failed.");
      }

      setLootboxActivity(await fetchLootboxActivityRead());
      setInventoryActionMessage({
        tone: "success",
        text: `${getLootboxInventoryStatusActionLabel(status)} applied.`,
      });
    } catch (error) {
      setInventoryActionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Inventory status update failed.",
      });
    } finally {
      setInventoryActionId(null);
    }
  }

  async function saveSelectedPoolDraft() {
    if (selectedDraft.summary.readiness !== "ready" || poolSaving) {
      return;
    }

    setPoolSaving(true);
    setPoolSaveMessage({ tone: "default", text: "Saving pool controls..." });

    try {
      const response = await fetch("/api/lootboxes/pool-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierId: selectedTierId,
          rows: selectedDraft.rows,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; updatedRows?: number }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Lootbox pool save failed.");
      }

      setStagedTierId(selectedTierId);
      setPoolSaveMessage({
        tone: "success",
        text: `${payload.updatedRows ?? selectedDraft.rows.length} reward outcomes saved to Supabase.`,
      });
    } catch (error) {
      setStagedTierId(null);
      setPoolSaveMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Lootbox pool save failed.",
      });
    } finally {
      setPoolSaving(false);
    }
  }

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

            <div className="grid gap-3 2xl:grid-cols-[0.78fr_1.22fr]">
              <TierInspector readiness={selectedReadiness} />
              <PoolBuilder
                readiness={selectedReadiness}
                draftRows={selectedDraft.rows}
                draftSummary={selectedDraft.summary}
                staged={selectedDraftIsStaged}
                saving={poolSaving}
                message={poolSaveMessage}
                stockSafety={stockSafety}
                stockSafetyLoading={stockSafetyLoading}
                onRowChange={updatePoolDraftOverride}
                onReset={resetSelectedPoolDraft}
                onSave={saveSelectedPoolDraft}
              />
            </div>

            <InventoryCommandTable
              activity={lootboxActivity}
              loading={lootboxActivityLoading}
              actionSavingId={inventoryActionId}
              message={inventoryActionMessage}
              filter={inventoryFilter}
              search={inventorySearch}
              onFilterChange={setInventoryFilter}
              onSearchChange={setInventorySearch}
              onInventoryStatusChange={updateInventoryStatus}
            />
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

            <LootboxActivityPanel
              activity={lootboxActivity}
              loading={lootboxActivityLoading}
              actionSavingId={inventoryActionId}
              message={inventoryActionMessage}
              onInventoryStatusChange={updateInventoryStatus}
            />

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

function PoolBuilder({
  readiness,
  draftRows,
  draftSummary,
  staged,
  saving,
  message,
  stockSafety,
  stockSafetyLoading,
  onRowChange,
  onReset,
  onSave,
}: {
  readiness: LootboxTierReadiness;
  draftRows: LootboxPoolDraftRow[];
  draftSummary: LootboxPoolDraftSummary;
  staged: boolean;
  saving: boolean;
  message: PoolSaveMessage;
  stockSafety: LootboxStockSafetyRead | null;
  stockSafetyLoading: boolean;
  onRowChange: (key: string, patch: Omit<LootboxPoolDraftOverride, "key">) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const saveDisabled = draftSummary.readiness !== "ready" || saving;

  return (
    <OpsPanel
      eyebrow="Pool builder"
      title={`${readiness.tier.label} reward controls`}
      description="Adjust weights, stock posture and active outcomes in a local operator draft before we wire persistent mutation controls into the backend."
      action={
        <OpsStatusPill
          tone={staged ? "success" : draftSummary.readiness === "ready" ? "warning" : "danger"}
        >
          {staged ? "saved" : draftSummary.readiness === "ready" ? "draft ready" : "fix draft"}
        </OpsStatusPill>
      }
      tone="accent"
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className="space-y-2.5">
          {draftRows.map((row) => (
            <PoolDraftOutcomeRow key={row.key} row={row} onChange={onRowChange} />
          ))}
        </div>

        <div className="space-y-2.5">
          <div className="rounded-[16px] border border-primary/12 bg-primary/[0.035] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Draft read
              </p>
              <SlidersHorizontal size={14} className="text-primary" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <BuilderStat label="Weight" value={draftSummary.totalWeight.toLocaleString("en-US")} />
              <BuilderStat label="Enabled" value={draftSummary.enabledCount} />
              <BuilderStat label="Finite" value={draftSummary.finiteStockCount} />
              <BuilderStat
                label="Top odds"
                value={
                  draftSummary.strongestOutcome
                    ? formatOdds(draftSummary.strongestOutcome.oddsPercent)
                    : "0%"
                }
              />
            </div>
          </div>

          <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-primary" />
              <p className="text-[10px] font-semibold text-text">
                {draftSummary.strongestOutcome?.label ?? "No dominant outcome yet"}
              </p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-sub">
              {draftSummary.warnings[0] ??
                "The pool has a valid mix and can be saved into the live Supabase reward pool."}
            </p>
          </div>

          <StockSafetyCard
            safety={stockSafety}
            loading={stockSafetyLoading}
            draftSummary={draftSummary}
          />

          {message ? <PoolSaveNotice message={message} /> : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-sub transition hover:border-white/10 hover:text-text"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                saveDisabled
                  ? "cursor-not-allowed border border-white/[0.018] bg-white/[0.008] text-sub/45"
                  : "border border-primary/24 bg-primary px-3 text-black shadow-[0_16px_34px_rgba(186,255,59,0.16)] hover:brightness-110"
              }`}
            >
              <Save size={13} />
              {saving ? "Saving" : staged ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function StockSafetyCard({
  safety,
  loading,
  draftSummary,
}: {
  safety: LootboxStockSafetyRead | null;
  loading: boolean;
  draftSummary: LootboxPoolDraftSummary;
}) {
  const ready = safety?.status === "ready";
  const label = loading ? "Checking stock RPC" : safety?.label ?? "Stock read unavailable";
  const summary = loading
    ? "Checking whether limited outcomes are protected before shard spend."
    : safety?.summary ?? "Could not read stock safety yet; keep finite-stock edits conservative.";

  return (
    <div
      className={`rounded-[16px] border p-3 ${
        ready
          ? "border-emerald-300/18 bg-emerald-300/[0.055]"
          : "border-amber-300/18 bg-amber-300/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            Stock safety
          </p>
          <p className="mt-1 truncate text-[12px] font-semibold text-text">{label}</p>
        </div>
        <OpsStatusPill tone={ready ? "success" : "warning"}>
          {loading ? "checking" : ready ? "guarded" : "watch"}
        </OpsStatusPill>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-sub">{summary}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <BuilderStat label="Draft finite" value={draftSummary.finiteStockCount} />
        <BuilderStat label="Live finite" value={safety?.finiteActiveOutcomes ?? "-"} />
        <BuilderStat label="RPC pair" value={ready ? "Ready" : loading ? "..." : "Check"} />
        <BuilderStat label="Guard" value={ready ? "Before spend" : "Pending"} />
      </div>
    </div>
  );
}

function PoolSaveNotice({ message }: { message: NonNullable<PoolSaveMessage> }) {
  return (
    <div
      className={`rounded-[16px] border p-3 text-[11px] leading-5 ${
        message.tone === "success"
          ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"
          : message.tone === "error"
            ? "border-rose-300/20 bg-rose-500/[0.07] text-rose-100"
            : "border-white/[0.024] bg-white/[0.012] text-sub"
      }`}
    >
      {message.text}
    </div>
  );
}

function PoolDraftOutcomeRow({
  row,
  onChange,
}: {
  row: LootboxPoolDraftRow;
  onChange: (key: string, patch: Omit<LootboxPoolDraftOverride, "key">) => void;
}) {
  return (
    <div
      className={`grid gap-3 rounded-[15px] border p-3 transition md:grid-cols-[minmax(0,1fr)_128px_142px_112px] md:items-center ${
        row.enabled
          ? "border-white/[0.022] bg-[linear-gradient(180deg,rgba(14,17,24,0.9),rgba(8,10,15,0.9))]"
          : "border-white/[0.012] bg-white/[0.006] opacity-70"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getLootboxRarityTone(row.rarity)}`}
          >
            {row.rarity}
          </span>
          <span className="rounded-full border border-white/[0.026] bg-white/[0.018] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-sub">
            {row.itemType.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-2 break-words text-[12px] font-semibold text-text [overflow-wrap:anywhere]">
          {row.label}
        </p>
        <p className="mt-1 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
          {row.payloadLabel}
        </p>
      </div>

      <label className="rounded-[13px] border border-white/[0.018] bg-black/15 px-3 py-2">
        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
          Weight
        </span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={row.draftWeight}
          disabled={!row.enabled}
          onChange={(event) => onChange(row.key, { weight: Number(event.target.value) })}
          className="mt-1 w-full bg-transparent text-[13px] font-semibold text-text outline-none disabled:text-sub/45"
          aria-label={`${row.label} weight`}
        />
      </label>

      <div className="rounded-[13px] border border-white/[0.018] bg-black/15 px-3 py-2">
        <button
          type="button"
          onClick={() => onChange(row.key, { stockLimit: row.stockLimit === null ? 100 : null })}
          className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-sub transition hover:text-text"
        >
          {row.stockLimit === null ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
          {row.stockLimit === null ? "Unlimited" : "Finite stock"}
        </button>
        <input
          type="number"
          min="1"
          step="1"
          value={row.stockLimit ?? ""}
          disabled={row.stockLimit === null}
          placeholder="No cap"
          onChange={(event) =>
            onChange(row.key, {
              stockLimit: event.target.value.trim() ? Number(event.target.value) : null,
            })
          }
          className="mt-1 w-full bg-transparent text-[13px] font-semibold text-text outline-none placeholder:text-sub/50 disabled:text-sub/40"
          aria-label={`${row.label} stock limit`}
        />
      </div>

      <div className="rounded-[13px] border border-white/[0.018] bg-black/15 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onChange(row.key, { enabled: !row.enabled })}
            className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-sub transition hover:text-text"
          >
            {row.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {row.enabled ? "Live" : "Off"}
          </button>
          <span className="text-[12px] font-semibold text-text">{formatOdds(row.oddsPercent)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.035]">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.28)]"
            style={{ width: `${Math.min(100, Math.max(0, row.oddsPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function BuilderStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] border border-white/[0.018] bg-black/15 px-2.5 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function LootboxActivityPanel({
  activity,
  loading,
  actionSavingId,
  message,
  onInventoryStatusChange,
}: {
  activity: LootboxActivityRead | null;
  loading: boolean;
  actionSavingId: string | null;
  message: PoolSaveMessage;
  onInventoryStatusChange: (id: string, status: LootboxInventoryStatus) => void;
}) {
  const summary = activity?.summary;

  return (
    <OpsPanel
      eyebrow="Phase 2C"
      title="Open history and inventory"
      description="Read-only operator view for the last lootbox opens and reward inventory state."
      action={
        <OpsStatusPill tone={summary && summary.pendingReviewInventory > 0 ? "warning" : "success"}>
          {loading ? "loading" : `${summary?.totalOpens ?? 0} opens`}
        </OpsStatusPill>
      }
    >
      <div className="grid gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <MiniRead label="Members" value={`${summary?.uniqueMembers ?? 0}`} />
          <MiniRead label="Shards spent" value={`${summary?.totalShardSpend ?? 0}`} />
          <MiniRead label="High rarity" value={`${summary?.highRarityWins ?? 0}`} />
          <MiniRead label="Review" value={`${summary?.pendingReviewInventory ?? 0}`} />
        </div>

        <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                Recent opens
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
              Last 12
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {loading ? (
              <ActivitySkeleton />
            ) : activity?.recentOpens.length ? (
              activity.recentOpens.slice(0, 4).map((item) => (
                <LootboxOpenActivityRow key={item.id} item={item} />
              ))
            ) : (
              <p className="text-[11px] leading-5 text-sub">
                No lootbox opens have been recorded yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3">
          <div className="flex items-center gap-2">
            <Gift size={14} className="text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Inventory queue
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {loading ? (
              <ActivitySkeleton />
            ) : activity?.inventoryQueue.length ? (
              activity.inventoryQueue.slice(0, 4).map((item) => (
                <LootboxInventoryActivityRow
                  key={item.id}
                  item={item}
                  saving={actionSavingId === item.id}
                  onStatusChange={onInventoryStatusChange}
                />
              ))
            ) : (
              <p className="text-[11px] leading-5 text-sub">
                Inventory rewards will appear here after the first opens.
              </p>
            )}
          </div>
        </div>

        {message ? <PoolSaveNotice message={message} /> : null}
      </div>
    </OpsPanel>
  );
}

function InventoryCommandTable({
  activity,
  loading,
  actionSavingId,
  message,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onInventoryStatusChange,
}: {
  activity: LootboxActivityRead | null;
  loading: boolean;
  actionSavingId: string | null;
  message: PoolSaveMessage;
  filter: LootboxInventoryCommandFilter;
  search: string;
  onFilterChange: (filter: LootboxInventoryCommandFilter) => void;
  onSearchChange: (search: string) => void;
  onInventoryStatusChange: (id: string, status: LootboxInventoryStatus) => void;
}) {
  const rows = useMemo(() => activity?.inventoryTable ?? [], [activity?.inventoryTable]);
  const counts = useMemo(() => buildLootboxInventoryCommandCounts(rows), [rows]);
  const filteredRows = useMemo(
    () => filterLootboxInventoryCommandRows(rows, { filter, query: search }),
    [filter, rows, search]
  );
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const selectedInventoryRow = useMemo(
    () => filteredRows.find((row) => row.id === selectedInventoryId) ?? filteredRows[0] ?? null,
    [filteredRows, selectedInventoryId]
  );
  const summary = activity?.summary;

  useEffect(() => {
    if (filteredRows.some((row) => row.id === selectedInventoryId)) {
      return;
    }

    setSelectedInventoryId(filteredRows[0]?.id ?? null);
  }, [filteredRows, selectedInventoryId]);

  return (
    <OpsPanel
      eyebrow="Inventory ops"
      title="Reward command table"
      description="A wider operator surface for reviewing lootbox rewards, member ownership and reward payloads before fulfillment."
      action={
        <OpsStatusPill tone={summary && summary.pendingReviewInventory > 0 ? "warning" : "success"}>
          {loading ? "loading" : `${filteredRows.length}/${rows.length} shown`}
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MiniRead label="Open inventory" value={`${summary?.openInventory ?? 0}`} />
          <MiniRead label="Pending review" value={`${summary?.pendingReviewInventory ?? 0}`} />
          <MiniRead label="High rarity" value={`${summary?.highRarityWins ?? 0}`} />
          <MiniRead label="Filtered rows" value={`${filteredRows.length}/${rows.length}`} />
        </div>

        <div className="grid gap-2 rounded-[18px] border border-white/[0.018] bg-black/15 p-2.5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div className="flex flex-wrap gap-1.5">
            {inventoryFilterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onFilterChange(option.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition ${
                  filter === option.id
                    ? "border-primary/28 bg-primary text-black shadow-[0_12px_26px_rgba(186,255,59,0.12)]"
                    : "border-white/[0.02] bg-white/[0.012] text-sub hover:border-white/[0.08] hover:text-text"
                }`}
              >
                {option.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] ${
                    filter === option.id ? "bg-black/15 text-black" : "bg-white/[0.035] text-sub"
                  }`}
                >
                  {counts[option.id]}
                </span>
              </button>
            ))}
          </div>

          <label className="flex min-w-0 items-center gap-2 rounded-full border border-white/[0.024] bg-white/[0.018] px-3 py-2">
            <Search size={14} className="shrink-0 text-sub" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search reward, member, payload"
              className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-text outline-none placeholder:text-sub/55"
              aria-label="Search inventory rewards"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.02] bg-black/20 text-sub transition hover:text-text"
                aria-label="Clear inventory search"
              >
                <X size={11} />
              </button>
            ) : null}
          </label>
        </div>

        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
          <div className="overflow-hidden rounded-[18px] border border-white/[0.018] bg-white/[0.012]">
            <div className="hidden border-b border-white/[0.018] bg-black/20 px-3 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-sub xl:grid xl:grid-cols-[minmax(0,1.25fr)_126px_minmax(0,0.86fr)_112px_238px] xl:gap-3">
              <span>Reward</span>
              <span>Member</span>
              <span>Payload</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-white/[0.018]">
              {loading ? (
                <InventoryTableSkeleton />
              ) : filteredRows.length ? (
                filteredRows.map((row) => (
                  <InventoryCommandRow
                    key={row.id}
                    row={row}
                    selected={selectedInventoryRow?.id === row.id}
                    saving={actionSavingId === row.id}
                    onSelect={() => setSelectedInventoryId(row.id)}
                    onStatusChange={onInventoryStatusChange}
                  />
                ))
              ) : (
                <div className="p-4 text-[12px] leading-5 text-sub">
                  {rows.length
                    ? "No inventory rewards match the current filter."
                    : "Inventory rewards will appear here once members start opening lootboxes."}
                </div>
              )}
            </div>
          </div>

          <InventoryFulfillmentDetail
            row={selectedInventoryRow}
            saving={selectedInventoryRow ? actionSavingId === selectedInventoryRow.id : false}
            onStatusChange={onInventoryStatusChange}
          />
        </div>

        {message ? <PoolSaveNotice message={message} /> : null}
      </div>
    </OpsPanel>
  );
}

function InventoryCommandRow({
  row,
  selected,
  saving,
  onSelect,
  onStatusChange,
}: {
  row: LootboxActivityRead["inventoryTable"][number];
  selected: boolean;
  saving: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
}) {
  return (
    <div
      className={`grid gap-3 p-3 transition xl:grid-cols-[minmax(0,1.25fr)_126px_minmax(0,0.86fr)_112px_238px] xl:items-center ${
        selected ? "bg-primary/[0.035]" : "hover:bg-white/[0.01]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getLootboxRarityTone(row.rarity as LootboxStudioRarity)}`}
          >
            {row.rarity}
          </span>
          <span className="rounded-full border border-white/[0.018] bg-white/[0.012] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-sub">
            {row.itemType.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-2 break-words text-[12px] font-semibold text-text [overflow-wrap:anywhere]">
          {row.label}
        </p>
      </div>

      <InventoryTableCell label="Member" value={row.memberLabel} />
      <InventoryTableCell label="Payload" value={row.payloadSummary} />

      <div className="min-w-0">
        <p className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-sub xl:hidden">
          Status
        </p>
        <OpsStatusPill tone={row.statusTone}>{row.status}</OpsStatusPill>
        <p className="mt-2 text-[9px] text-sub">{formatActivityDate(row.updatedAt ?? row.createdAt)}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] transition ${
            selected
              ? "border-primary/28 bg-primary text-black"
              : "border-white/[0.026] bg-white/[0.012] text-sub hover:border-white/10 hover:text-text"
          }`}
        >
          Details
        </button>
        <InventoryStatusButtons
          id={row.id}
          currentStatus={row.status}
          statuses={row.actionStatuses}
          saving={saving}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

function InventoryFulfillmentDetail({
  row,
  saving,
  onStatusChange,
}: {
  row: LootboxActivityRead["inventoryTable"][number] | null;
  saving: boolean;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
}) {
  if (!row) {
    return (
      <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.024] bg-black/20 text-sub">
          <FileText size={16} />
        </div>
        <p className="mt-3 text-[12px] font-semibold text-text">No reward selected</p>
        <p className="mt-2 text-[11px] leading-5 text-sub">
          Select a visible inventory reward to inspect fulfillment context and manual status
          actions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.055),rgba(8,10,15,0.94))] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Fulfillment detail
          </p>
          <h3 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            {row.label}
          </h3>
        </div>
        <OpsStatusPill tone={row.statusTone}>{row.status}</OpsStatusPill>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniRead label="Member" value={row.memberLabel} />
        <MiniRead label="Open" value={row.lootboxOpenId ?? "No link"} />
        <MiniRead label="Type" value={row.itemType.replace(/_/g, " ")} />
        <MiniRead label="Updated" value={formatActivityDate(row.updatedAt ?? row.createdAt)} />
      </div>

      <div className="mt-3 rounded-[16px] border border-primary/14 bg-primary/[0.045] p-3">
        <div className="flex items-start gap-2">
          <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[11px] font-black text-text">{row.fulfillment.label}</p>
            <p className="mt-2 text-[11px] leading-5 text-sub">{row.fulfillment.nextStep}</p>
            <p className="mt-2 text-[10px] leading-4 text-primary/78">
              {row.fulfillment.auditHint}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[16px] border border-white/[0.018] bg-black/15 p-3">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            Payload
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {row.payloadEntries.map((entry) => (
            <div
              key={entry.label}
              className="grid gap-1 rounded-[12px] border border-white/[0.014] bg-white/[0.01] px-3 py-2"
            >
              <p className="break-words text-[8px] font-black uppercase tracking-[0.14em] text-sub [overflow-wrap:anywhere]">
                {entry.label}
              </p>
              <p className="break-words text-[11px] font-semibold text-text [overflow-wrap:anywhere]">
                {entry.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[16px] border border-white/[0.018] bg-black/15 p-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
          Status actions
        </p>
        <InventoryStatusButtons
          id={row.id}
          currentStatus={row.status}
          statuses={row.actionStatuses}
          saving={saving}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

function InventoryTableCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[13px] border border-white/[0.014] bg-black/10 px-3 py-2 xl:border-transparent xl:bg-transparent xl:p-0">
      <p className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-sub xl:hidden">
        {label}
      </p>
      <p className="break-words text-[11px] font-semibold text-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function LootboxOpenActivityRow({
  item,
}: {
  item: LootboxActivityRead["recentOpens"][number];
}) {
  return (
    <div className="rounded-[13px] border border-white/[0.016] bg-black/15 px-2.5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getLootboxRarityTone(item.rarity as LootboxStudioRarity)}`}
            >
              {item.rarity}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
              {item.tierId}
            </span>
          </div>
          <p className="mt-2 truncate text-[11px] font-semibold text-text">
            {item.rewardLabel}
          </p>
          <p className="mt-1 text-[10px] text-sub">{item.memberLabel}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold text-primary">{item.shardSpend}</p>
          <p className="mt-1 text-[9px] text-sub">{formatActivityDate(item.openedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function LootboxInventoryActivityRow({
  item,
  saving,
  onStatusChange,
}: {
  item: LootboxActivityRead["inventoryQueue"][number];
  saving: boolean;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
}) {
  return (
    <div className="rounded-[13px] border border-white/[0.016] bg-black/15 px-2.5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Crown size={13} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
              {item.itemType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-2 truncate text-[11px] font-semibold text-text">{item.label}</p>
          <p className="mt-1 text-[10px] text-sub">{item.memberLabel}</p>
        </div>
        <div className="shrink-0 text-right">
          <OpsStatusPill tone={item.statusTone}>{item.status}</OpsStatusPill>
          <p className="mt-1 text-[9px] text-sub">{formatActivityDate(item.createdAt)}</p>
        </div>
      </div>
      <InventoryStatusButtons
        id={item.id}
        currentStatus={item.status}
        statuses={inventoryCommandStatuses}
        saving={saving}
        onStatusChange={onStatusChange}
        compact
      />
    </div>
  );
}

function InventoryStatusButtons({
  id,
  currentStatus,
  statuses,
  saving,
  onStatusChange,
  compact = false,
}: {
  id: string;
  currentStatus: string;
  statuses: LootboxInventoryStatus[];
  saving: boolean;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-2" : ""}`}>
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          disabled={saving || currentStatus === status}
          onClick={() => onStatusChange(id, status)}
          className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] transition ${
            saving || currentStatus === status
              ? "cursor-not-allowed border-white/[0.012] bg-white/[0.008] text-sub/40"
              : "border-primary/16 bg-primary/[0.045] text-primary hover:border-primary/32 hover:bg-primary/[0.08]"
          }`}
        >
          {saving ? "Saving" : getShortInventoryActionLabel(status)}
        </button>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-14 rounded-[13px] border border-white/[0.012] bg-white/[0.018]" />
      <div className="h-14 rounded-[13px] border border-white/[0.012] bg-white/[0.012]" />
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <div className="space-y-0">
      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1.35fr)_128px_minmax(0,0.9fr)_118px_200px]">
        <div className="h-16 rounded-[13px] bg-white/[0.018]" />
        <div className="h-16 rounded-[13px] bg-white/[0.012]" />
        <div className="h-16 rounded-[13px] bg-white/[0.012]" />
        <div className="h-16 rounded-[13px] bg-white/[0.012]" />
        <div className="h-16 rounded-[13px] bg-white/[0.012]" />
      </div>
      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1.35fr)_128px_minmax(0,0.9fr)_118px_200px]">
        <div className="h-16 rounded-[13px] bg-white/[0.012]" />
        <div className="h-16 rounded-[13px] bg-white/[0.01]" />
        <div className="h-16 rounded-[13px] bg-white/[0.01]" />
        <div className="h-16 rounded-[13px] bg-white/[0.01]" />
        <div className="h-16 rounded-[13px] bg-white/[0.01]" />
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

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortInventoryActionLabel(status: LootboxInventoryStatus) {
  switch (status) {
    case "pending_review":
      return "Review";
    case "claimed":
      return "Claimed";
    case "expired":
      return "Expire";
    case "owned":
    default:
      return "Owned";
  }
}
