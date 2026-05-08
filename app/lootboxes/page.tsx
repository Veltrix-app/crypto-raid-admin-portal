"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  Copy,
  Crown,
  FileText,
  Gift,
  History,
  Lock,
  PackageOpen,
  PauseCircle,
  RadioTower,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Send,
  Target,
  ToggleLeft,
  ToggleRight,
  UserCheck,
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
  type LootboxInventoryCommandRow,
  type LootboxInventoryCommandFilter,
} from "@/lib/lootboxes/lootbox-activity";
import {
  buildLootboxFulfillmentRunway,
  getLootboxFulfillmentPolicyForRow,
  type LootboxFulfillmentLaneId,
  type LootboxFulfillmentPolicy,
  type LootboxFulfillmentPolicyInput,
  type LootboxFulfillmentRisk,
} from "@/lib/lootboxes/lootbox-fulfillment-policy";
import {
  getLootboxInventoryStatusActionLabel,
  type LootboxInventoryStatus,
} from "@/lib/lootboxes/lootbox-inventory-actions";
import {
  LOOTBOX_REWARD_OPS_LANES,
  buildLootboxRewardOpsSummary,
  getRecommendedLootboxRewardOpsLane,
  type LootboxRewardOpsLane,
  type LootboxRewardOpsLaneRisk,
} from "@/lib/lootboxes/lootbox-reward-ops-catalog";
import {
  buildLootboxSponsoredRewardSetupRead,
  type LootboxSponsoredRewardSetupLane,
  type LootboxSponsoredRewardSetupReadiness,
  type LootboxSponsoredRewardSetupRow,
} from "@/lib/lootboxes/lootbox-sponsored-reward-setup";
import {
  buildLootboxSponsoredPackageBriefs,
  type LootboxSponsoredPackageBrief,
  type LootboxSponsoredPackageStatus,
  type LootboxSponsoredPackageTier,
} from "@/lib/lootboxes/lootbox-sponsored-package-briefs";
import {
  buildLootboxSponsoredPackageActionDesk,
  type LootboxSponsoredPackageActionPack,
  type LootboxSponsoredPackageActionState,
  type LootboxSponsoredPackageOperatorAction,
} from "@/lib/lootboxes/lootbox-sponsored-package-actions";
import {
  buildLootboxSponsoredPackageStatusBoard,
  type LootboxSponsoredPackageStatusBoardColumn,
  type LootboxSponsoredPackageStatusBoardColumnId,
  type LootboxSponsoredPackageStatusBoardItem,
} from "@/lib/lootboxes/lootbox-sponsored-package-status-board";
import {
  buildLootboxSponsorActivationHandoffRead,
  buildLootboxSponsorPackageCreateRequest,
  buildLootboxSponsorPackageCrmRead,
  type LootboxSponsorPackageDetailRead,
  type LootboxSponsorPackageTimelineItem,
} from "@/lib/lootboxes/lootbox-sponsored-package-operator";
import {
  buildLootboxSponsoredPackagePersistenceReadiness,
  lootboxSponsorPackageNoteTypes,
  type LootboxSponsoredPackagePersistenceTable,
  type LootboxSponsorPackageNoteType,
  type LootboxSponsorPackageStatus,
} from "@/lib/lootboxes/lootbox-sponsored-package-persistence";
import type { LootboxStockSafetyRead } from "@/lib/lootboxes/lootbox-stock-safety";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
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
type SponsorPackageApiRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  package_tier: LootboxSponsoredPackageTier | string | null;
  status: LootboxSponsorPackageStatus | string | null;
  sponsor_name: string | null;
  sponsor_contact: string | null;
  sponsor_budget: number | null;
  currency: string | null;
  owner_auth_user_id: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  package_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_by_auth_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type SponsorPackagePatchInput = Partial<{
  status: LootboxSponsorPackageStatus;
  sponsorName: string | null;
  sponsorContact: string | null;
  sponsorBudget: number;
  currency: string;
  ownerAuthUserId: string | null;
  followUpAt: string | null;
  lastContactedAt: string | null;
}>;
type SponsorActivationRunApiPayload = {
  ok?: boolean;
  error?: string;
  blockedBy?: string[];
  activationRun?: {
    runId: string;
    title: string;
  };
  metadataUpdated?: boolean;
  warning?: string | null;
};
type SponsorActivationRunStepState = "done" | "blocked";
type SponsorActivationRunStepApiPayload = {
  ok?: boolean;
  error?: string;
  step?: {
    id: string;
    label: string;
    state: SponsorActivationRunStepState;
    noteId?: string;
  };
  metadataUpdated?: boolean;
  warning?: string | null;
};
type SponsorActivationRunSignoffOutcome = "completed" | "needs_follow_up" | "paused";
type SponsorActivationRunSignoffApiPayload = {
  ok?: boolean;
  error?: string;
  signoff?: {
    runId: string;
    outcome: SponsorActivationRunSignoffOutcome;
    label: string;
    noteId?: string;
  };
  metadataUpdated?: boolean;
  warning?: string | null;
};
const sponsorPackageStatusControls: LootboxSponsorPackageStatus[] = [
  "ready_to_pitch",
  "pitched",
  "negotiating",
  "won",
  "lost",
  "blocked",
];
type LootboxDeskId = "overview" | "economy" | "sponsors" | "fulfillment";

async function fetchSponsorPackagesRead() {
  const response = await fetch("/api/lootboxes/sponsor-packages", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; sponsorPackages?: SponsorPackageApiRow[] }
    | null;

  if (!response.ok || !payload?.ok || !Array.isArray(payload.sponsorPackages)) {
    throw new Error(payload?.error ?? "Sponsor package read failed.");
  }

  return payload.sponsorPackages;
}

async function fetchSponsorPackageDetailRead(id: string) {
  const response = await fetch(`/api/lootboxes/sponsor-packages/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; detail?: LootboxSponsorPackageDetailRead }
    | null;

  if (!response.ok || !payload?.ok || !payload.detail) {
    throw new Error(payload?.error ?? "Sponsor package detail read failed.");
  }

  return payload.detail;
}

export default function LootboxesPage() {
  const authUserId = useAdminAuthStore((s) => s.authUserId);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);
  const featuredShardPools = useAdminPortalStore((s) => s.featuredShardPools);
  const [selectedTierId, setSelectedTierId] = useState<LootboxStudioTierId>("common");
  const [activeDesk, setActiveDesk] = useState<LootboxDeskId>("overview");
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
  const [inventoryNoteSavingId, setInventoryNoteSavingId] = useState<string | null>(null);
  const [inventoryNoteMessage, setInventoryNoteMessage] = useState<PoolSaveMessage>(null);
  const [inventoryFilter, setInventoryFilter] = useState<LootboxInventoryCommandFilter>("all");
  const [inventorySearch, setInventorySearch] = useState("");
  const [packageActionCopyId, setPackageActionCopyId] = useState<string | null>(null);
  const [packageActionMessage, setPackageActionMessage] = useState<PoolSaveMessage>(null);
  const [sponsorPackages, setSponsorPackages] = useState<SponsorPackageApiRow[]>([]);
  const [sponsorPackageLoading, setSponsorPackageLoading] = useState(true);
  const [sponsorPackageSavingId, setSponsorPackageSavingId] = useState<string | null>(null);
  const [sponsorPackageMutatingId, setSponsorPackageMutatingId] = useState<string | null>(null);
  const [sponsorPackageNoteSavingId, setSponsorPackageNoteSavingId] = useState<string | null>(null);
  const [sponsorActivationRunSavingId, setSponsorActivationRunSavingId] = useState<string | null>(null);
  const [sponsorActivationRunStepSavingKey, setSponsorActivationRunStepSavingKey] =
    useState<string | null>(null);
  const [sponsorActivationRunSignoffSavingKey, setSponsorActivationRunSignoffSavingKey] =
    useState<string | null>(null);
  const [selectedSponsorPackageId, setSelectedSponsorPackageId] = useState<string | null>(null);
  const [sponsorPackageDetail, setSponsorPackageDetail] =
    useState<LootboxSponsorPackageDetailRead | null>(null);
  const [sponsorPackageDetailLoading, setSponsorPackageDetailLoading] = useState(false);
  const [sponsorPackageOpsMessage, setSponsorPackageOpsMessage] =
    useState<PoolSaveMessage>(null);

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
  const rewardOpsSummary = useMemo(() => buildLootboxRewardOpsSummary(), []);
  const sponsoredRewardSetup = useMemo(
    () =>
      buildLootboxSponsoredRewardSetupRead({
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          projectId: campaign.projectId,
          projectName:
            projects.find((project) => project.id === campaign.projectId)?.name ?? "Workspace",
          title: campaign.title,
          status: campaign.status,
          visibility: campaign.visibility,
          featured: campaign.featured,
          rewardType: campaign.rewardType,
          rewardPoolAmount: campaign.rewardPoolAmount,
          participants: campaign.participants,
          completionRate: campaign.completionRate,
          xpBudget: campaign.xpBudget,
        })),
        shardPools: featuredShardPools.map((pool) => ({
          id: pool.id,
          campaignId: pool.campaignId,
          status: pool.status,
          poolSize: pool.poolSize,
          remainingShards: pool.remainingShards,
        })),
      }),
    [campaigns, featuredShardPools, projects]
  );
  const sponsoredPackageBriefs = useMemo(
    () => buildLootboxSponsoredPackageBriefs(sponsoredRewardSetup.rows),
    [sponsoredRewardSetup.rows]
  );
  const sponsoredPackageActionDesk = useMemo(
    () => buildLootboxSponsoredPackageActionDesk(sponsoredPackageBriefs.briefs),
    [sponsoredPackageBriefs.briefs]
  );
  const sponsoredPackageStatusBoard = useMemo(
    () => buildLootboxSponsoredPackageStatusBoard(sponsoredPackageActionDesk.packs),
    [sponsoredPackageActionDesk.packs]
  );
  const sponsoredPackagePersistence = useMemo(
    () =>
      buildLootboxSponsoredPackagePersistenceReadiness({
        totalPackages: sponsoredPackageStatusBoard.summary.total,
        readyToPitch: sponsoredPackageStatusBoard.summary.readyToPitch,
        setupQueue: sponsoredPackageStatusBoard.summary.setupQueue,
        blocked: sponsoredPackageStatusBoard.summary.blocked,
        apiState: "live",
      }),
    [
      sponsoredPackageStatusBoard.summary.blocked,
      sponsoredPackageStatusBoard.summary.readyToPitch,
      sponsoredPackageStatusBoard.summary.setupQueue,
      sponsoredPackageStatusBoard.summary.total,
    ]
  );
  const sponsorActivationHandoff = useMemo(
    () =>
      buildLootboxSponsorActivationHandoffRead({
        packages: sponsorPackages,
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          projectId: campaign.projectId,
          title: campaign.title,
          status: campaign.status,
          visibility: campaign.visibility,
          rewardPoolAmount: campaign.rewardPoolAmount,
          participants: campaign.participants,
          completionRate: campaign.completionRate,
        })),
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
        })),
        shardPools: featuredShardPools.map((pool) => ({
          id: pool.id,
          campaignId: pool.campaignId,
          status: pool.status,
          poolSize: pool.poolSize,
          remainingShards: pool.remainingShards,
        })),
      }),
    [campaigns, featuredShardPools, projects, sponsorPackages]
  );
  const recommendedRewardLane = useMemo(
    () =>
      getRecommendedLootboxRewardOpsLane({
        pendingReviewInventory: lootboxActivity?.summary.pendingReviewInventory ?? 0,
        activeShardPools: activePools.length,
      }),
    [activePools.length, lootboxActivity?.summary.pendingReviewInventory]
  );

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

  useEffect(() => {
    let cancelled = false;

    async function loadSponsorPackages() {
      setSponsorPackageLoading(true);

      try {
        const rows = await fetchSponsorPackagesRead();
        if (!cancelled) {
          setSponsorPackages(rows);
          const firstPackage = rows[0];
          setSelectedSponsorPackageId(firstPackage?.id ?? null);

          if (firstPackage) {
            setSponsorPackageDetailLoading(true);
            try {
              const detail = await fetchSponsorPackageDetailRead(firstPackage.id);
              if (!cancelled) {
                setSponsorPackageDetail(detail);
              }
            } finally {
              if (!cancelled) {
                setSponsorPackageDetailLoading(false);
              }
            }
          } else {
            setSponsorPackageDetail(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSponsorPackageOpsMessage({
            tone: "error",
            text: error instanceof Error ? error.message : "Sponsor package read failed.",
          });
        }
      } finally {
        if (!cancelled) {
          setSponsorPackageLoading(false);
        }
      }
    }

    loadSponsorPackages();

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

  async function addInventoryNote(id: string, note: string, reference: string) {
    if (inventoryNoteSavingId) {
      return false;
    }

    setInventoryNoteSavingId(id);
    setInventoryNoteMessage({ tone: "default", text: "Saving fulfillment note..." });

    try {
      const response = await fetch(`/api/lootboxes/inventory/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note, reference }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Fulfillment note save failed.");
      }

      setLootboxActivity(await fetchLootboxActivityRead());
      setInventoryNoteMessage({
        tone: "success",
        text: "Fulfillment note saved to the audit trail.",
      });
      return true;
    } catch (error) {
      setInventoryNoteMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Fulfillment note save failed.",
      });
      return false;
    } finally {
      setInventoryNoteSavingId(null);
    }
  }

  async function copyPackageActionText(id: string, text: string, successText: string) {
    if (packageActionCopyId) {
      return;
    }

    setPackageActionCopyId(id);
    setPackageActionMessage({ tone: "default", text: "Copying sponsor package text..." });

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available in this browser.");
      }

      await navigator.clipboard.writeText(text);
      setPackageActionMessage({ tone: "success", text: successText });
    } catch (error) {
      setPackageActionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Copy action failed.",
      });
    } finally {
      setPackageActionCopyId(null);
    }
  }

  async function refreshSponsorPackages() {
    const rows = await fetchSponsorPackagesRead();
    setSponsorPackages(rows);
    return rows;
  }

  async function loadSponsorPackageDetail(id: string) {
    setSelectedSponsorPackageId(id);
    setSponsorPackageDetailLoading(true);

    try {
      const detail = await fetchSponsorPackageDetailRead(id);
      setSponsorPackageDetail(detail);
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor package detail read failed.",
      });
    } finally {
      setSponsorPackageDetailLoading(false);
    }
  }

  async function saveSponsorPackage(pack: LootboxSponsoredPackageActionPack) {
    if (sponsorPackageSavingId) {
      return;
    }

    const campaign = campaigns.find((item) => item.id === pack.campaignId);
    const project = campaign ? projects.find((item) => item.id === campaign.projectId) : null;
    const request = buildLootboxSponsorPackageCreateRequest({
      pack,
      campaign: campaign
        ? {
            id: campaign.id,
            projectId: campaign.projectId,
            title: campaign.title,
            status: campaign.status,
            visibility: campaign.visibility,
            rewardPoolAmount: campaign.rewardPoolAmount,
            participants: campaign.participants,
            completionRate: campaign.completionRate,
          }
        : null,
      project: project
        ? {
            id: project.id,
            name: project.name,
            slug: project.slug,
          }
        : null,
    });

    if (!request.ok) {
      setSponsorPackageOpsMessage({ tone: "error", text: request.error });
      return;
    }

    setSponsorPackageSavingId(pack.campaignId);
    setSponsorPackageOpsMessage({ tone: "default", text: "Saving sponsor package..." });

    try {
      const response = await fetch("/api/lootboxes/sponsor-packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request.payload),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Sponsor package save failed.");
      }

      const rows = await refreshSponsorPackages();
      const savedPackage = rows.find(
        (row) => row.campaign_id === pack.campaignId && row.package_tier === pack.packageTier
      );
      if (savedPackage) {
        await loadSponsorPackageDetail(savedPackage.id);
      }
      setSponsorPackageOpsMessage({
        tone: "success",
        text: "Sponsor package saved to the operator board.",
      });
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor package save failed.",
      });
    } finally {
      setSponsorPackageSavingId(null);
    }
  }

  async function patchSponsorPackage(
    id: string,
    patch: SponsorPackagePatchInput,
    successText: string
  ) {
    if (sponsorPackageMutatingId) {
      return;
    }

    setSponsorPackageMutatingId(id);
    setSponsorPackageOpsMessage({ tone: "default", text: "Updating sponsor package..." });

    try {
      const response = await fetch(`/api/lootboxes/sponsor-packages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Sponsor package update failed.");
      }

      await refreshSponsorPackages();
      await loadSponsorPackageDetail(id);
      setSponsorPackageOpsMessage({ tone: "success", text: successText });
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor package update failed.",
      });
    } finally {
      setSponsorPackageMutatingId(null);
    }
  }

  async function claimSponsorPackageOwner(id: string) {
    if (!authUserId) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: "Current admin session is missing an auth user id.",
      });
      return;
    }

    await patchSponsorPackage(
      id,
      { ownerAuthUserId: authUserId },
      "Sponsor package owner claimed."
    );
  }

  async function updateSponsorPackageFollowUp(id: string, value: string | null) {
    const date = value ? new Date(value) : null;
    if (date && Number.isNaN(date.getTime())) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: "Follow-up date is invalid.",
      });
      return;
    }

    const followUpAt = date ? date.toISOString() : null;
    await patchSponsorPackage(
      id,
      { followUpAt },
      followUpAt ? "Sponsor package follow-up saved." : "Sponsor package follow-up cleared."
    );
  }

  async function updateSponsorPackageDeal(id: string, patch: SponsorPackagePatchInput) {
    await patchSponsorPackage(id, patch, "Sponsor package CRM fields saved.");
  }

  async function progressSponsorPackageDeal(id: string, status: LootboxSponsorPackageStatus) {
    const contactStatuses = new Set<LootboxSponsorPackageStatus>(["pitched", "negotiating"]);
    await patchSponsorPackage(
      id,
      {
        status,
        ...(contactStatuses.has(status) ? { lastContactedAt: new Date().toISOString() } : {}),
      },
      `Sponsor package moved to ${status.replace(/_/g, " ")}.`
    );
  }

  async function addSponsorPackageNote(
    id: string,
    note: string,
    noteType: LootboxSponsorPackageNoteType,
    followUpAt: string | null
  ) {
    if (sponsorPackageNoteSavingId) {
      return false;
    }

    setSponsorPackageNoteSavingId(id);
    setSponsorPackageOpsMessage({ tone: "default", text: "Saving sponsor package note..." });

    try {
      const date = followUpAt ? new Date(followUpAt) : null;
      if (date && Number.isNaN(date.getTime())) {
        throw new Error("Follow-up date is invalid.");
      }

      const response = await fetch(`/api/lootboxes/sponsor-packages/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note,
          noteType,
          followUpAt: date ? date.toISOString() : null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Sponsor package note failed.");
      }

      setSponsorPackageOpsMessage({
        tone: "success",
        text: "Sponsor package note saved.",
      });
      await loadSponsorPackageDetail(id);
      return true;
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor package note failed.",
      });
      return false;
    } finally {
      setSponsorPackageNoteSavingId(null);
    }
  }

  async function stageSponsorActivationRun(id: string) {
    if (sponsorActivationRunSavingId) {
      return;
    }

    setSponsorActivationRunSavingId(id);
    setSponsorPackageOpsMessage({ tone: "default", text: "Staging sponsor activation run..." });

    try {
      const response = await fetch(`/api/lootboxes/sponsor-packages/${id}/activation-run`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as
        | SponsorActivationRunApiPayload
        | null;

      if (!response.ok || !payload?.ok || !payload.activationRun) {
        const blockerText = payload?.blockedBy?.length
          ? ` Blocking: ${payload.blockedBy.join(", ")}.`
          : "";
        throw new Error(`${payload?.error ?? "Sponsor activation run failed."}${blockerText}`);
      }

      await refreshSponsorPackages();
      await loadSponsorPackageDetail(id);
      setSponsorPackageOpsMessage({
        tone: payload.metadataUpdated === false ? "default" : "success",
        text:
          payload.warning ??
          `${payload.activationRun.title} staged as an auditable manual run.`,
      });
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor activation run failed.",
      });
    } finally {
      setSponsorActivationRunSavingId(null);
    }
  }

  async function updateSponsorActivationRunStep(
    id: string,
    stepId: string,
    state: SponsorActivationRunStepState
  ) {
    const savingKey = `${id}:${stepId}:${state}`;
    if (sponsorActivationRunStepSavingKey) {
      return;
    }

    setSponsorActivationRunStepSavingKey(savingKey);
    setSponsorPackageOpsMessage({
      tone: "default",
      text: `Marking activation step ${state}...`,
    });

    try {
      const response = await fetch(
        `/api/lootboxes/sponsor-packages/${id}/activation-run/steps`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ stepId, state }),
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | SponsorActivationRunStepApiPayload
        | null;

      if (!response.ok || !payload?.ok || !payload.step) {
        throw new Error(payload?.error ?? "Sponsor activation run step failed.");
      }

      await refreshSponsorPackages();
      await loadSponsorPackageDetail(id);
      setSponsorPackageOpsMessage({
        tone: payload.metadataUpdated === false ? "default" : "success",
        text:
          payload.warning ??
          `${payload.step.label} marked ${payload.step.state} for the manual run.`,
      });
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor activation run step failed.",
      });
    } finally {
      setSponsorActivationRunStepSavingKey(null);
    }
  }

  async function signOffSponsorActivationRun(
    id: string,
    outcome: SponsorActivationRunSignoffOutcome,
    note: string,
    followUpAt: string | null
  ) {
    const savingKey = `${id}:${outcome}`;
    if (sponsorActivationRunSignoffSavingKey) {
      return false;
    }

    setSponsorActivationRunSignoffSavingKey(savingKey);
    setSponsorPackageOpsMessage({
      tone: "default",
      text: "Saving activation run signoff...",
    });

    try {
      const response = await fetch(
        `/api/lootboxes/sponsor-packages/${id}/activation-run/signoff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ outcome, note, followUpAt }),
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | SponsorActivationRunSignoffApiPayload
        | null;

      if (!response.ok || !payload?.ok || !payload.signoff) {
        throw new Error(payload?.error ?? "Sponsor activation run signoff failed.");
      }

      await refreshSponsorPackages();
      await loadSponsorPackageDetail(id);
      setSponsorPackageOpsMessage({
        tone: payload.metadataUpdated === false ? "default" : "success",
        text:
          payload.warning ??
          `Activation run signed off as ${payload.signoff.label.toLowerCase()}.`,
      });
      return true;
    } catch (error) {
      setSponsorPackageOpsMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sponsor activation run signoff failed.",
      });
      return false;
    } finally {
      setSponsorActivationRunSignoffSavingKey(null);
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

  const pendingReviewInventory = lootboxActivity?.summary.pendingReviewInventory ?? 0;
  const sponsorNowCount = sponsorActivationHandoff.followUpTimeline.summary.now;
  const readySponsorCount = sponsorActivationHandoff.summary.ready;
  const deskItems = [
    {
      id: "overview" as const,
      label: "Overview",
      kicker: "Command",
      title: "Launch posture",
      detail: "One read for economy, sponsor and fulfillment pressure.",
      metric: `${activePools.length} boosts`,
      tone: "primary" as const,
    },
    {
      id: "economy" as const,
      label: "Economy",
      kicker: "Tune",
      title: "Tiers and pools",
      detail: "Prices, odds, stock safety and sponsored shard pools.",
      metric: `${LOOTBOX_STUDIO_TIERS.length} tiers`,
      tone: "default" as const,
    },
    {
      id: "sponsors" as const,
      label: "Sponsors",
      kicker: "Revenue",
      title: "Sponsor packages",
      detail: "Briefs, CRM, activation handoff and follow-up timeline.",
      metric: `${readySponsorCount}/${sponsorNowCount} now`,
      tone: sponsorNowCount > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      id: "fulfillment" as const,
      label: "Fulfillment",
      kicker: "Ops",
      title: "Inventory queue",
      detail: "Claims, review states, notes and reward delivery lanes.",
      metric: `${pendingReviewInventory} review`,
      tone: pendingReviewInventory > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  const featuredPoolsPanel = (
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
                projects.find((project) => project.id === pool.projectId)?.name ?? "Workspace"
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
  );
  const activityPanel = (
    <LootboxActivityPanel
      activity={lootboxActivity}
      loading={lootboxActivityLoading}
      actionSavingId={inventoryActionId}
      message={inventoryActionMessage}
      onInventoryStatusChange={updateInventoryStatus}
    />
  );
  const rewardOpsPanel = (
    <RewardOpsLanePanel
      lanes={LOOTBOX_REWARD_OPS_LANES}
      summary={rewardOpsSummary}
      recommendedLane={recommendedRewardLane}
    />
  );
  const nextOperatorPanel = (
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
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Shard economy"
        title="Lootbox Control Room"
        description="Operate the hunt layer from one clean command view: economy, sponsor pressure and reward fulfillment stay visible without turning the page into one long checklist."
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
              description="Launch cutover view: shard supply, live boosts, sponsor pressure and fulfillment risk stay visible before operators open deeper workbenches."
              tone="accent"
              action={<ShardToken value={remainingShards} label="remaining" />}
            >
              <div className="grid gap-3 md:grid-cols-5">
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
                <OpsMetricCard
                  label="Reward lanes"
                  value={`${rewardOpsSummary.live}/${rewardOpsSummary.total}`}
                  sub={`${rewardOpsSummary.planned} planned surfaces stay gated.`}
                  emphasis={rewardOpsSummary.highRisk > 0 ? "warning" : "default"}
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
        <div className="space-y-3">
          <LootboxDeskSwitch
            items={deskItems}
            activeDesk={activeDesk}
            onChange={setActiveDesk}
          />

          {activeDesk === "overview" ? (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <div className="space-y-3">
                <OpsPanel
                  eyebrow="Command overview"
                  title="Launch-ready operating map"
                  description="Start with the lane that matters right now. Each workbench keeps a focused job on screen instead of hiding important actions below a long scroll."
                >
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    <LootboxOverviewActionCard
                      eyebrow="Economy"
                      title="Tune tier pricing"
                      detail="Inspect costs, odds, stock safety and the sponsored pool builder."
                      metric={`${LOOTBOX_STUDIO_TIERS.length} mapped tiers`}
                      icon={<PackageOpen size={17} />}
                      onClick={() => setActiveDesk("economy")}
                    />
                    <LootboxOverviewActionCard
                      eyebrow="Sponsor revenue"
                      title="Move paid packages"
                      detail="Brief the offer, manage CRM follow-ups and stage activation runs."
                      metric={`${readySponsorCount} ready packages`}
                      icon={<RadioTower size={17} />}
                      tone={sponsorNowCount > 0 ? "warning" : "default"}
                      onClick={() => setActiveDesk("sponsors")}
                    />
                    <LootboxOverviewActionCard
                      eyebrow="Fulfillment"
                      title="Clear reward queue"
                      detail="Review lootbox claims, route notes and keep delivery lanes clean."
                      metric={`${pendingReviewInventory} pending review`}
                      icon={<ClipboardCheck size={17} />}
                      tone={pendingReviewInventory > 0 ? "warning" : "default"}
                      onClick={() => setActiveDesk("fulfillment")}
                    />
                    <LootboxOverviewActionCard
                      eyebrow="Growth"
                      title="Create boost campaign"
                      detail="Open the campaign studio with shard demand already in mind."
                      metric={`${activePools.length} live boosts`}
                      icon={<Sparkles size={17} />}
                      href="/campaigns/new"
                    />
                  </div>
                </OpsPanel>

                <div className="grid gap-3 2xl:grid-cols-2">
                  {activityPanel}
                  {rewardOpsPanel}
                </div>
              </div>

              <aside className="space-y-3">
                {featuredPoolsPanel}
                {nextOperatorPanel}
              </aside>
            </div>
          ) : null}

          {activeDesk === "economy" ? (
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

            <SponsoredRewardSetupPanel read={sponsoredRewardSetup} />
          </div>

          <aside className="space-y-3">
            {featuredPoolsPanel}
            {rewardOpsPanel}
            {nextOperatorPanel}
          </aside>
        </div>
          ) : null}

          {activeDesk === "sponsors" ? (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <div className="space-y-3">
                <SponsoredPackageBriefsPanel read={sponsoredPackageBriefs} />
                <SponsoredPackageActionDeskPanel
                  read={sponsoredPackageActionDesk}
                  copyingId={packageActionCopyId}
                  message={packageActionMessage}
                  sponsorPackages={sponsorPackages}
                  savingId={sponsorPackageSavingId}
                  onCopy={copyPackageActionText}
                  onSavePackage={saveSponsorPackage}
                />
                <SponsoredPackageOpsPanel
                  packages={sponsorPackages}
                  loading={sponsorPackageLoading}
                  message={sponsorPackageOpsMessage}
                  selectedPackageId={selectedSponsorPackageId}
                  detail={sponsorPackageDetail}
                  detailLoading={sponsorPackageDetailLoading}
                  currentAuthUserId={authUserId}
                  mutatingId={sponsorPackageMutatingId}
                  noteSavingId={sponsorPackageNoteSavingId}
                  activationRunStepSavingKey={sponsorActivationRunStepSavingKey}
                  activationRunSignoffSavingKey={sponsorActivationRunSignoffSavingKey}
                  onSelectPackage={loadSponsorPackageDetail}
                  onStatusChange={(id, status) =>
                    patchSponsorPackage(id, { status }, "Sponsor package status updated.")
                  }
                  onOwnerClaim={claimSponsorPackageOwner}
                  onFollowUpChange={updateSponsorPackageFollowUp}
                  onDealSave={updateSponsorPackageDeal}
                  onDealProgress={progressSponsorPackageDeal}
                  onNoteAdd={addSponsorPackageNote}
                  onActivationRunStepUpdate={updateSponsorActivationRunStep}
                  onActivationRunSignoff={signOffSponsorActivationRun}
                />
                <SponsorActivationHandoffPanel
                  read={sponsorActivationHandoff}
                  copyingId={packageActionCopyId}
                  activationRunSavingId={sponsorActivationRunSavingId}
                  onCopy={copyPackageActionText}
                  onStageRun={stageSponsorActivationRun}
                />
              </div>

              <aside className="space-y-3">
                <SponsoredPackageStatusBoardPanel read={sponsoredPackageStatusBoard} />
                <SponsoredPackagePersistencePanel read={sponsoredPackagePersistence} />
                {featuredPoolsPanel}
              </aside>
            </div>
          ) : null}

          {activeDesk === "fulfillment" ? (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              <div className="space-y-3">
                <InventoryCommandTable
                  activity={lootboxActivity}
                  loading={lootboxActivityLoading}
                  actionSavingId={inventoryActionId}
                  message={inventoryActionMessage}
                  noteSavingId={inventoryNoteSavingId}
                  noteMessage={inventoryNoteMessage}
                  filter={inventoryFilter}
                  search={inventorySearch}
                  onFilterChange={setInventoryFilter}
                  onSearchChange={setInventorySearch}
                  onInventoryStatusChange={updateInventoryStatus}
                  onInventoryNoteAdd={addInventoryNote}
                />
              </div>

              <aside className="space-y-3">
                {activityPanel}
                {rewardOpsPanel}
                {nextOperatorPanel}
              </aside>
            </div>
          ) : null}
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}

type LootboxDeskItem = {
  id: LootboxDeskId;
  label: string;
  kicker: string;
  title: string;
  detail: string;
  metric: string;
  tone: "primary" | "warning" | "default";
};

function LootboxDeskSwitch({
  items,
  activeDesk,
  onChange,
}: {
  items: LootboxDeskItem[];
  activeDesk: LootboxDeskId;
  onChange: (desk: LootboxDeskId) => void;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(14,17,24,0.96),rgba(6,8,12,0.98))] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
      <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
        {items.map((item) => {
          const active = item.id === activeDesk;
          const pillTone =
            item.tone === "primary" ? "success" : item.tone === "warning" ? "warning" : "default";

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={`group min-h-[154px] rounded-[18px] border p-4 text-left transition duration-200 ${
                active
                  ? "border-primary/32 bg-[radial-gradient(circle_at_20%_0%,rgba(186,255,59,0.18),rgba(18,23,18,0.9)_48%,rgba(6,8,12,0.96))] shadow-[0_18px_48px_rgba(186,255,59,0.08)]"
                  : "border-white/[0.026] bg-white/[0.018] hover:border-primary/20 hover:bg-white/[0.028]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? "border-primary/30 bg-primary/[0.12] text-primary"
                      : "border-white/[0.035] bg-black/20 text-sub group-hover:text-primary"
                  }`}
                >
                  {getLootboxDeskIcon(item.id)}
                </span>
                <OpsStatusPill tone={pillTone}>{item.metric}</OpsStatusPill>
              </div>

              <p
                className={`mt-4 text-[9px] font-black uppercase tracking-[0.18em] ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                {item.kicker}
              </p>
              <h2 className="mt-1.5 break-words text-[15px] font-black text-text [overflow-wrap:anywhere]">
                {item.title}
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-sub">{item.detail}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LootboxOverviewActionCard({
  eyebrow,
  title,
  detail,
  metric,
  icon,
  tone = "default",
  href,
  onClick,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  metric: string;
  icon: ReactNode;
  tone?: "warning" | "default";
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "group flex min-h-[168px] flex-col justify-between rounded-[20px] border border-white/[0.03] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.012))] p-4 text-left transition duration-200 hover:border-primary/24 hover:bg-white/[0.032]";
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
            tone === "warning"
              ? "border-amber-300/22 bg-amber-300/[0.08] text-amber-200"
              : "border-primary/18 bg-primary/[0.07] text-primary"
          }`}
        >
          {icon}
        </span>
        <ArrowRight
          size={15}
          className="mt-1 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-1.5 break-words text-[15px] font-black text-text [overflow-wrap:anywhere]">
          {title}
        </h3>
        <p className="mt-2 text-[12px] leading-5 text-sub">{detail}</p>
      </div>

      <OpsStatusPill tone={tone === "warning" ? "warning" : "default"}>{metric}</OpsStatusPill>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

function getLootboxDeskIcon(id: LootboxDeskId) {
  switch (id) {
    case "economy":
      return <PackageOpen size={17} />;
    case "sponsors":
      return <RadioTower size={17} />;
    case "fulfillment":
      return <ClipboardCheck size={17} />;
    case "overview":
    default:
      return <Target size={17} />;
  }
}

function RewardOpsLanePanel({
  lanes,
  summary,
  recommendedLane,
}: {
  lanes: LootboxRewardOpsLane[];
  summary: ReturnType<typeof buildLootboxRewardOpsSummary>;
  recommendedLane: LootboxRewardOpsLane;
}) {
  return (
    <OpsPanel
      eyebrow="Reward operations"
      title="Lootbox reward lanes"
      description="Keep live rewards, planned paid passes, sponsored lanes and future USDC outcomes visible before any deeper entitlement or payout mutation ships."
      action={
        <OpsStatusPill tone={summary.highRisk > 0 ? "warning" : "success"}>
          {summary.live} live / {summary.planned} planned
        </OpsStatusPill>
      }
    >
      <div className="grid gap-2.5">
        <div className="grid grid-cols-3 gap-2">
          <MiniRead label="Live" value={`${summary.live}`} />
          <MiniRead label="Planned" value={`${summary.planned}`} />
          <MiniRead label="High risk" value={`${summary.highRisk}`} />
        </div>

        <div className="rounded-[16px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.055),rgba(8,10,15,0.82))] p-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
              <Target size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Recommended operator focus
              </p>
              <h3 className="mt-1.5 break-words text-[13px] font-black text-text [overflow-wrap:anywhere]">
                {recommendedLane.label}
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-sub">
                {recommendedLane.operatorAction}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {lanes.map((lane) => (
            <RewardOpsLaneCard
              key={lane.id}
              lane={lane}
              recommended={lane.id === recommendedLane.id}
            />
          ))}
        </div>
      </div>
    </OpsPanel>
  );
}

function RewardOpsLaneCard({
  lane,
  recommended,
}: {
  lane: LootboxRewardOpsLane;
  recommended: boolean;
}) {
  return (
    <article
      className={`rounded-[15px] border p-3 ${
        recommended
          ? "border-primary/18 bg-primary/[0.045]"
          : "border-white/[0.018] bg-white/[0.012]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
              {getRewardLaneIcon(lane.id)}
            </span>
            <OpsStatusPill tone={lane.status === "live" ? "success" : "default"}>
              {lane.status}
            </OpsStatusPill>
            <OpsStatusPill tone={getRewardRiskTone(lane.risk)}>{lane.risk} risk</OpsStatusPill>
          </div>
          <h3 className="mt-2 break-words text-[12px] font-black text-text [overflow-wrap:anywhere]">
            {lane.label}
          </h3>
          <p className="mt-1.5 text-[11px] leading-5 text-sub">{lane.memberPromise}</p>
        </div>
        {recommended ? (
          <span className="shrink-0 rounded-full border border-primary/18 bg-primary/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
            Focus
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2">
        <OpsSnapshotRow label="Control" value={lane.controlSurface} />
        <OpsSnapshotRow label="Gate" value={lane.deliveryGate} />
      </div>
    </article>
  );
}

function SponsoredRewardSetupPanel({
  read,
}: {
  read: ReturnType<typeof buildLootboxSponsoredRewardSetupRead>;
}) {
  return (
    <OpsPanel
      eyebrow="Phase 2E-H"
      title="Sponsored reward setup"
      description="Package project-funded reward pressure before it enters lootboxes: sponsor budget, campaign route, shard boost and fulfillment owner stay visible as separate gates."
      action={
        <OpsStatusPill tone={read.summary.setupNeeded > 0 ? "warning" : "success"}>
          {read.summary.ready} ready / {read.summary.setupNeeded} setup
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <MiniRead label="Campaigns" value={`${read.summary.total}`} />
          <MiniRead label="Ready" value={`${read.summary.ready}`} />
          <MiniRead label="Setup" value={`${read.summary.setupNeeded}`} />
          <MiniRead label="Locked" value={`${read.summary.locked}`} />
          <MiniRead label="Need budget" value={`${read.summary.needsBudget}`} />
          <MiniRead label="Need pool" value={`${read.summary.needsShardPool}`} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.055),rgba(8,10,15,0.86))] p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
                <Target size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  Recommended sponsor setup
                </p>
                {read.recommendedSetup ? (
                  <>
                    <h3 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                      {read.recommendedSetup.title}
                    </h3>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
                      {read.recommendedSetup.projectName}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-sub">
                      {read.recommendedSetup.operatorStep}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-sub">
                    No campaigns are available yet. Create a public campaign before sponsor
                    reward setup starts.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <SponsorGuardrailCard
              icon={<Gift size={14} />}
              label="Sponsor budget"
              value={`${read.summary.needsBudget} missing`}
              detail="No partner promise ships without visible project-funded budget."
              tone={read.summary.needsBudget > 0 ? "warning" : "success"}
            />
            <SponsorGuardrailCard
              icon={<RadioTower size={14} />}
              label="Shard boost"
              value={`${read.summary.needsShardPool} missing`}
              detail="A finite pool creates the hunt rush projects pay for."
              tone={read.summary.needsShardPool > 0 ? "warning" : "success"}
            />
            <SponsorGuardrailCard
              icon={<ShieldCheck size={14} />}
              label="Locked routes"
              value={`${read.summary.locked} locked`}
              detail="Private, draft or paused routes stay out of sponsor packaging."
              tone={read.summary.locked > 0 ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="grid gap-2 xl:grid-cols-3">
          {read.rows.length ? (
            read.rows.slice(0, 6).map((row) => (
              <SponsoredRewardSetupCard key={row.campaignId} row={row} />
            ))
          ) : (
            <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub xl:col-span-3">
              Sponsored reward candidates appear here once campaigns exist.
            </div>
          )}
        </div>
      </div>
    </OpsPanel>
  );
}

function SponsorGuardrailCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[16px] border p-3 ${
        tone === "success"
          ? "border-emerald-300/14 bg-emerald-300/[0.035]"
          : "border-amber-300/14 bg-amber-300/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">{label}</p>
          <p className="mt-1 truncate text-[12px] font-black text-text">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-sub">{detail}</p>
    </div>
  );
}

function SponsoredRewardSetupCard({ row }: { row: LootboxSponsoredRewardSetupRow }) {
  return (
    <Link
      href={`/campaigns/${row.campaignId}`}
      className={`group block rounded-[18px] border p-3 transition hover:border-primary/22 ${
        row.readiness === "ready"
          ? "border-emerald-300/14 bg-emerald-300/[0.032]"
          : row.readiness === "locked"
            ? "border-white/[0.018] bg-white/[0.012]"
            : "border-primary/16 bg-primary/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
              {getSponsoredSetupLaneIcon(row.lane)}
            </span>
            <OpsStatusPill tone={getSponsoredSetupTone(row.readiness)}>
              {row.readiness.replace(/_/g, " ")}
            </OpsStatusPill>
            {row.featured ? <OpsStatusPill tone="success">featured</OpsStatusPill> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-[13px] font-black text-text">{row.title}</h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
            {row.projectName}
          </p>
        </div>
        <ArrowRight
          size={15}
          className="mt-1 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniRead label="Budget" value={row.rewardBudget.toLocaleString("en-US")} />
        <MiniRead label="Pool" value={`${row.activePoolCount}/${row.linkedPoolCount}`} />
        <MiniRead label="Left" value={row.remainingShards.toLocaleString("en-US")} />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-sub">{row.operatorStep}</p>

      <div className="mt-3 grid gap-1.5">
        {row.guardrails.map((guardrail) => (
          <div
            key={guardrail.label}
            className="flex items-start gap-2 rounded-[12px] border border-white/[0.014] bg-black/15 px-2.5 py-2"
          >
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                guardrail.status === "ready"
                  ? "bg-emerald-300"
                  : guardrail.status === "locked"
                    ? "bg-white/35"
                    : "bg-amber-300"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-text">
                {guardrail.label}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-sub">{guardrail.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function SponsoredPackageBriefsPanel({
  read,
}: {
  read: ReturnType<typeof buildLootboxSponsoredPackageBriefs>;
}) {
  return (
    <OpsPanel
      eyebrow="Phase 2E-I"
      title="Sponsor package briefs"
      description="Turn ready campaign pressure into operator-ready sponsor packages without auto-delivery: tier, pitch, deliverables and the next safe setup step stay visible."
      action={
        <OpsStatusPill tone={read.summary.pitchReady > 0 ? "success" : "warning"}>
          {read.summary.pitchReady} pitch ready
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MiniRead label="Briefs" value={`${read.summary.total}`} />
          <MiniRead label="Pitch ready" value={`${read.summary.pitchReady}`} />
          <MiniRead label="Prep needed" value={`${read.summary.needsSetup}`} />
          <MiniRead label="Locked" value={`${read.summary.locked}`} />
          <MiniRead label="Premium" value={`${read.summary.premium}`} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.052),rgba(8,10,15,0.88))] p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
                <FileText size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  Recommended brief
                </p>
                {read.recommendedBrief ? (
                  <>
                    <h3 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                      {read.recommendedBrief.campaignTitle}
                    </h3>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
                      {read.recommendedBrief.projectName} / {read.recommendedBrief.packageTier}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-sub">
                      {read.recommendedBrief.operatorPitch}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-sub">
                    No package can be pitched yet. Unlock a campaign route, budget and shard
                    pressure first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-3">
            <PackageBriefMetric
              icon={<Sparkles size={14} />}
              label="Pitch"
              value={`${read.summary.pitchReady} ready`}
              detail="Ready packages can be used in sponsor conversations."
            />
            <PackageBriefMetric
              icon={<SlidersHorizontal size={14} />}
              label="Prep"
              value={`${read.summary.needsSetup} open`}
              detail="Needs budget or shard pressure before a clean pitch."
            />
            <PackageBriefMetric
              icon={<ShieldCheck size={14} />}
              label="No auto delivery"
              value="Locked"
              detail="Briefs do not grant rewards or charge projects."
            />
          </div>
        </div>

        <div className="grid gap-2 xl:grid-cols-3">
          {read.briefs.length ? (
            read.briefs.slice(0, 6).map((brief) => (
              <SponsoredPackageBriefCard key={brief.campaignId} brief={brief} />
            ))
          ) : (
            <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub xl:col-span-3">
              Package briefs appear after sponsor reward candidates exist.
            </div>
          )}
        </div>
      </div>
    </OpsPanel>
  );
}

function PackageBriefMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">{label}</p>
          <p className="mt-1 truncate text-[12px] font-black text-text">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-sub">{detail}</p>
    </div>
  );
}

function SponsoredPackageBriefCard({ brief }: { brief: LootboxSponsoredPackageBrief }) {
  return (
    <Link
      href={`/campaigns/${brief.campaignId}`}
      className={`group block rounded-[18px] border p-3 transition hover:border-primary/22 ${
        brief.status === "pitch_ready"
          ? "border-emerald-300/14 bg-emerald-300/[0.032]"
          : brief.status === "prep_needed"
            ? "border-primary/16 bg-primary/[0.04]"
            : "border-white/[0.018] bg-white/[0.012]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
              {getPackageBriefIcon(brief.status)}
            </span>
            <OpsStatusPill tone={getPackageBriefStatusTone(brief.status)}>
              {brief.status.replace(/_/g, " ")}
            </OpsStatusPill>
            <OpsStatusPill tone={getPackageTierTone(brief.packageTier)}>
              {brief.packageTier}
            </OpsStatusPill>
          </div>
          <h3 className="mt-2 line-clamp-2 text-[13px] font-black text-text">
            {brief.campaignTitle}
          </h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
            {brief.projectName}
          </p>
        </div>
        <ArrowRight
          size={15}
          className="mt-1 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniRead label="Budget" value={brief.budgetLabel} />
        <MiniRead label="Pressure" value={brief.pressureLabel} />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-sub">{brief.operatorPitch}</p>

      <div className="mt-3 grid gap-1.5">
        {brief.deliverables.map((deliverable) => (
          <div
            key={deliverable.label}
            className="rounded-[12px] border border-white/[0.014] bg-black/15 px-2.5 py-2"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-text">
              {deliverable.label}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">{deliverable.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[12px] border border-primary/14 bg-primary/[0.04] px-2.5 py-2">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary">
          Next operator step
        </p>
        <p className="mt-1 text-[10px] leading-4 text-sub">{brief.nextOperatorStep}</p>
      </div>
    </Link>
  );
}

function SponsoredPackageActionDeskPanel({
  read,
  copyingId,
  message,
  sponsorPackages,
  savingId,
  onCopy,
  onSavePackage,
}: {
  read: ReturnType<typeof buildLootboxSponsoredPackageActionDesk>;
  copyingId: string | null;
  message: PoolSaveMessage;
  sponsorPackages: SponsorPackageApiRow[];
  savingId: string | null;
  onCopy: (id: string, text: string, successText: string) => void;
  onSavePackage: (pack: LootboxSponsoredPackageActionPack) => void;
}) {
  const recommendedPack = read.recommendedPack;

  return (
    <OpsPanel
      eyebrow="Phase 2E-J"
      title="Sponsor action desk"
      description="Move package briefs into a real operator workflow: copy sponsor copy, stage an internal note and route into the campaign without reward, payment or fulfillment automation."
      action={
        <OpsStatusPill tone={read.summary.readyToShare > 0 ? "success" : "warning"}>
          {read.summary.readyToShare} share ready
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MiniRead label="Packages" value={`${read.summary.total}`} />
          <MiniRead label="Share ready" value={`${read.summary.readyToShare}`} />
          <MiniRead label="Needs setup" value={`${read.summary.needsSetup}`} />
          <MiniRead label="Copy actions" value={`${read.summary.copyReady}`} />
          <MiniRead label="Locked" value={`${read.summary.locked}`} />
        </div>

        {message ? (
          <div
            className={`rounded-[14px] border px-3 py-2 text-[11px] font-semibold ${
              message.tone === "success"
                ? "border-emerald-300/16 bg-emerald-300/[0.045] text-emerald-100"
                : message.tone === "error"
                  ? "border-rose-300/16 bg-rose-300/[0.055] text-rose-100"
                  : "border-white/[0.018] bg-white/[0.012] text-sub"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          {recommendedPack ? (
            <SponsorPackageCommandCard
              pack={recommendedPack}
              savedPackage={getSponsorPackageForPack(sponsorPackages, recommendedPack)}
              saving={savingId === recommendedPack.campaignId}
              copyingId={copyingId}
              onCopy={onCopy}
              onSavePackage={onSavePackage}
            />
          ) : (
            <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
              No sponsor package action is ready yet. Unlock campaign visibility, budget and shard
              pressure before an operator can package it.
            </div>
          )}

          <div className="grid gap-2">
            {read.packs.length ? (
              read.packs.slice(0, 5).map((pack) => (
                <SponsorPackageActionRow
                  key={pack.campaignId}
                  pack={pack}
                  savedPackage={getSponsorPackageForPack(sponsorPackages, pack)}
                  saving={savingId === pack.campaignId}
                  onSavePackage={onSavePackage}
                />
              ))
            ) : (
              <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
                Action packets appear after sponsor package briefs exist.
              </div>
            )}
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function SponsorPackageCommandCard({
  pack,
  savedPackage,
  saving,
  copyingId,
  onCopy,
  onSavePackage,
}: {
  pack: LootboxSponsoredPackageActionPack;
  savedPackage: SponsorPackageApiRow | null;
  saving: boolean;
  copyingId: string | null;
  onCopy: (id: string, text: string, successText: string) => void;
  onSavePackage: (pack: LootboxSponsoredPackageActionPack) => void;
}) {
  const sponsorCopyAction = pack.actions.find((action) => action.id === "copy_sponsor_brief");
  const auditNoteAction = pack.actions.find((action) => action.id === "copy_audit_note");
  const sponsorCopyId = `${pack.campaignId}:sponsor-copy`;
  const auditCopyId = `${pack.campaignId}:audit-note`;

  return (
    <article className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.048),rgba(8,10,15,0.9))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
              <Send size={15} />
            </span>
            <OpsStatusPill tone={getPackageActionStateTone(pack.actionState)}>
              {pack.actionState}
            </OpsStatusPill>
            <OpsStatusPill tone={getPackageTierTone(pack.packageTier)}>
              {pack.packageTier}
            </OpsStatusPill>
          </div>
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Recommended action pack
          </p>
          <h3 className="mt-2 break-words text-[15px] font-black text-text [overflow-wrap:anywhere]">
            {pack.exportTitle}
          </h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
            {pack.campaignTitle}
          </p>
        </div>
        <Link
          href={`/campaigns/${pack.campaignId}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.026] bg-white/[0.014] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="mt-3 rounded-[14px] border border-white/[0.018] bg-black/18 p-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
          Sponsor brief preview
        </p>
        <p className="mt-2 line-clamp-4 text-[11px] leading-5 text-sub">
          {pack.sponsorBriefText}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SponsorPackageCopyButton
          icon={<Copy size={13} />}
          label="Copy brief"
          disabled={sponsorCopyAction?.state !== "ready"}
          loading={copyingId === sponsorCopyId}
          detail={sponsorCopyAction?.detail ?? "Sponsor brief unavailable."}
          onClick={() =>
            onCopy(sponsorCopyId, pack.sponsorBriefText, "Sponsor brief copied.")
          }
        />
        <SponsorPackageCopyButton
          icon={<ClipboardCheck size={13} />}
          label="Copy note"
          disabled={auditNoteAction?.state !== "ready"}
          loading={copyingId === auditCopyId}
          detail={auditNoteAction?.detail ?? "Operator note unavailable."}
          onClick={() =>
            onCopy(auditCopyId, pack.auditNoteTemplate, "Operator note copied.")
          }
        />
      </div>

      <button
        type="button"
        disabled={Boolean(savedPackage) || saving}
        onClick={() => onSavePackage(pack)}
        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
          savedPackage
            ? "cursor-default border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-100"
            : saving
              ? "cursor-wait border-white/[0.018] bg-white/[0.012] text-sub"
              : "border-primary/22 bg-primary text-black shadow-[0_18px_42px_rgba(186,255,59,0.14)] hover:brightness-110"
        }`}
      >
        <Save size={14} />
        {savedPackage ? `Saved as ${savedPackage.status?.replace(/_/g, " ") ?? "package"}` : saving ? "Saving package" : "Save package"}
      </button>
    </article>
  );
}

function SponsorPackageCopyButton({
  icon,
  label,
  detail,
  disabled,
  loading,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="group rounded-[14px] border border-white/[0.018] bg-white/[0.012] p-3 text-left transition enabled:hover:border-primary/24 enabled:hover:bg-primary/[0.035] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-text">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
          {icon}
        </span>
        {loading ? "Copying" : label}
      </span>
      <span className="mt-2 block text-[10px] leading-4 text-sub">{detail}</span>
    </button>
  );
}

function SponsorPackageActionRow({
  pack,
  savedPackage,
  saving,
  onSavePackage,
}: {
  pack: LootboxSponsoredPackageActionPack;
  savedPackage: SponsorPackageApiRow | null;
  saving: boolean;
  onSavePackage: (pack: LootboxSponsoredPackageActionPack) => void;
}) {
  return (
    <article
      className={`rounded-[18px] border p-3 ${getPackageActionBorderClass(pack.actionState)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            {pack.projectName}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-[13px] font-black text-text">
            {pack.campaignTitle}
          </h3>
        </div>
        <OpsStatusPill tone={getPackageActionStateTone(pack.actionState)}>
          {pack.actionState}
        </OpsStatusPill>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[13px] border border-white/[0.014] bg-black/15 px-2.5 py-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
            Persistence
          </p>
          <p className="mt-1 text-[10px] leading-4 text-sub">
            {savedPackage
              ? `Saved as ${savedPackage.status?.replace(/_/g, " ") ?? "package"}`
              : "Ready to persist into sponsor ops."}
          </p>
        </div>
        <button
          type="button"
          disabled={Boolean(savedPackage) || saving}
          onClick={() => onSavePackage(pack)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition ${
            savedPackage
              ? "cursor-default border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-100"
              : saving
                ? "cursor-wait border-white/[0.018] bg-white/[0.012] text-sub"
                : "border-primary/20 bg-primary/[0.08] text-primary hover:border-primary/34 hover:bg-primary/[0.13]"
          }`}
        >
          <Save size={12} />
          {savedPackage ? "Saved" : saving ? "Saving" : "Save"}
        </button>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {pack.actions.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-2 rounded-[12px] border border-white/[0.014] bg-black/15 px-2.5 py-2"
          >
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                action.state === "ready"
                  ? "border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-200"
                  : action.state === "prep"
                    ? "border-amber-300/16 bg-amber-300/[0.055] text-amber-200"
                    : "border-white/[0.022] bg-white/[0.012] text-white/45"
              }`}
            >
              {getPackageActionIcon(action)}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-text">
                {action.label}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-sub">{action.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SponsoredPackageOpsPanel({
  packages,
  loading,
  message,
  selectedPackageId,
  detail,
  detailLoading,
  currentAuthUserId,
  mutatingId,
  noteSavingId,
  activationRunStepSavingKey,
  activationRunSignoffSavingKey,
  onSelectPackage,
  onStatusChange,
  onOwnerClaim,
  onFollowUpChange,
  onDealSave,
  onDealProgress,
  onNoteAdd,
  onActivationRunStepUpdate,
  onActivationRunSignoff,
}: {
  packages: SponsorPackageApiRow[];
  loading: boolean;
  message: PoolSaveMessage;
  selectedPackageId: string | null;
  detail: LootboxSponsorPackageDetailRead | null;
  detailLoading: boolean;
  currentAuthUserId: string | null;
  mutatingId: string | null;
  noteSavingId: string | null;
  activationRunStepSavingKey: string | null;
  activationRunSignoffSavingKey: string | null;
  onSelectPackage: (id: string) => void;
  onStatusChange: (id: string, status: LootboxSponsorPackageStatus) => void;
  onOwnerClaim: (id: string) => void;
  onFollowUpChange: (id: string, followUpAt: string | null) => void;
  onDealSave: (id: string, patch: SponsorPackagePatchInput) => void;
  onDealProgress: (id: string, status: LootboxSponsorPackageStatus) => void;
  onNoteAdd: (
    id: string,
    note: string,
    noteType: LootboxSponsorPackageNoteType,
    followUpAt: string | null
  ) => Promise<boolean>;
  onActivationRunStepUpdate: (
    id: string,
    stepId: string,
    state: SponsorActivationRunStepState
  ) => void;
  onActivationRunSignoff: (
    id: string,
    outcome: SponsorActivationRunSignoffOutcome,
    note: string,
    followUpAt: string | null
  ) => Promise<boolean>;
}) {
  const activePackages = packages.filter(
    (row) => row.status !== "won" && row.status !== "lost" && row.status !== "archived"
  );
  const ownedByYou = packages.filter((row) => row.owner_auth_user_id === currentAuthUserId).length;
  const followUps = activePackages.filter((row) => Boolean(row.follow_up_at)).length;

  return (
    <OpsPanel
      eyebrow="Phase 2E-N"
      title="Sponsor package ops"
      description="Persisted sponsor packages can now be owned, followed up, moved through sponsor status and annotated from the lootbox control room."
      action={
        <OpsStatusPill tone={packages.length > 0 ? "success" : "warning"}>
          {packages.length} saved
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MiniRead label="Saved" value={`${packages.length}`} />
          <MiniRead label="Active" value={`${activePackages.length}`} />
          <MiniRead label="Owned by you" value={`${ownedByYou}`} />
          <MiniRead label="Follow-ups" value={`${followUps}`} />
          <MiniRead label="Scope" value="Sponsor only" />
        </div>

        {message ? <PoolSaveNotice message={message} /> : null}

        {loading ? (
          <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
            <ActivitySkeleton />
            <ActivitySkeleton />
          </div>
        ) : packages.length ? (
          <div className="grid gap-3 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
            <div className="grid gap-3">
              {packages.slice(0, 6).map((row) => (
                <SponsorPackageOpsRow
                  key={row.id}
                  row={row}
                  selected={row.id === selectedPackageId}
                  currentAuthUserId={currentAuthUserId}
                  mutating={mutatingId === row.id}
                  noteSaving={noteSavingId === row.id}
                  onSelect={onSelectPackage}
                  onStatusChange={onStatusChange}
                  onOwnerClaim={onOwnerClaim}
                  onFollowUpChange={onFollowUpChange}
                  onNoteAdd={onNoteAdd}
                />
              ))}
            </div>
            <SponsorPackageDetailPanel
              detail={detail}
              loading={detailLoading}
              currentAuthUserId={currentAuthUserId}
              mutating={Boolean(detail?.package.id && mutatingId === detail.package.id)}
              activationRunStepSavingKey={activationRunStepSavingKey}
              activationRunSignoffSavingKey={activationRunSignoffSavingKey}
              onOwnerClaim={onOwnerClaim}
              onDealSave={onDealSave}
              onDealProgress={onDealProgress}
              onActivationRunStepUpdate={onActivationRunStepUpdate}
              onActivationRunSignoff={onActivationRunSignoff}
            />
          </div>
        ) : (
          <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
            Save a sponsor package from the action desk to start the operator lane.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}

function SponsorPackageOpsRow({
  row,
  selected,
  currentAuthUserId,
  mutating,
  noteSaving,
  onSelect,
  onStatusChange,
  onOwnerClaim,
  onFollowUpChange,
  onNoteAdd,
}: {
  row: SponsorPackageApiRow;
  selected: boolean;
  currentAuthUserId: string | null;
  mutating: boolean;
  noteSaving: boolean;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: LootboxSponsorPackageStatus) => void;
  onOwnerClaim: (id: string) => void;
  onFollowUpChange: (id: string, followUpAt: string | null) => void;
  onNoteAdd: (
    id: string,
    note: string,
    noteType: LootboxSponsorPackageNoteType,
    followUpAt: string | null
  ) => Promise<boolean>;
}) {
  const [followUpInput, setFollowUpInput] = useState(toDateTimeLocalValue(row.follow_up_at));
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<LootboxSponsorPackageNoteType>("operator_note");
  const campaignTitle = getSponsorPackageSnapshotText(row, "campaignTitle", row.campaign_id ?? "Campaign");
  const projectName = getSponsorPackageSnapshotText(row, "projectName", "Workspace");
  const ownerIsCurrentAdmin =
    Boolean(currentAuthUserId) && row.owner_auth_user_id === currentAuthUserId;

  useEffect(() => {
    setFollowUpInput(toDateTimeLocalValue(row.follow_up_at));
  }, [row.follow_up_at]);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onNoteAdd(row.id, note, noteType, followUpInput || null);

    if (saved) {
      setNote("");
    }
  }

  return (
    <article
      className={`rounded-[18px] border bg-[linear-gradient(180deg,rgba(12,15,21,0.92),rgba(7,9,14,0.94))] p-3 ${
        selected ? "border-primary/24 shadow-[0_18px_48px_rgba(186,255,59,0.065)]" : "border-white/[0.018]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone={getSponsorPackageStatusTone(row.status)}>
              {(row.status ?? "draft").replace(/_/g, " ")}
            </OpsStatusPill>
            <OpsStatusPill tone={getPackageTierTone((row.package_tier ?? "starter") as LootboxSponsoredPackageTier)}>
              {row.package_tier ?? "package"}
            </OpsStatusPill>
          </div>
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            {projectName}
          </p>
          <h3 className="mt-1.5 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            {campaignTitle}
          </h3>
          <p className="mt-1 text-[10px] leading-4 text-sub">
            Updated {formatSponsorPackageDate(row.updated_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(row.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              selected
                ? "border-primary/24 bg-primary/[0.08] text-primary"
                : "border-white/[0.024] bg-white/[0.014] text-text hover:border-primary/24 hover:text-primary"
            }`}
          >
            <History size={12} />
            Timeline
          </button>
          <button
            type="button"
            disabled={!currentAuthUserId || ownerIsCurrentAdmin || mutating}
            onClick={() => onOwnerClaim(row.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              ownerIsCurrentAdmin
                ? "cursor-default border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-100"
                : "border-primary/18 bg-primary/[0.055] text-primary enabled:hover:border-primary/32 enabled:hover:bg-primary/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            <UserCheck size={12} />
            {ownerIsCurrentAdmin ? "Owned" : "Claim"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
        {sponsorPackageStatusControls.map((status) => {
          const disabled = mutating || row.status === status;

          return (
            <button
              key={status}
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange(row.id, status)}
              className={`rounded-full border px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] transition ${
                disabled
                  ? "cursor-not-allowed border-white/[0.014] bg-white/[0.01] text-sub/45"
                  : "border-white/[0.024] bg-white/[0.014] text-text hover:border-primary/28 hover:text-primary"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onFollowUpChange(row.id, followUpInput || null);
        }}
        className="mt-3 rounded-[14px] border border-white/[0.014] bg-black/15 p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
            <CalendarClock size={12} />
            Follow-up
          </span>
          <span className="text-[9px] text-sub">
            {row.follow_up_at ? formatSponsorPackageDate(row.follow_up_at) : "No date"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="datetime-local"
            value={followUpInput}
            onChange={(event) => setFollowUpInput(event.target.value)}
            className="min-w-[210px] flex-1 rounded-full border border-white/[0.018] bg-white/[0.012] px-3 py-2 text-[11px] font-semibold text-text outline-none focus:border-primary/22"
            aria-label="Sponsor package follow-up date"
          />
          <button
            type="submit"
            disabled={mutating}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/18 bg-primary/[0.07] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-primary transition enabled:hover:border-primary/34 enabled:hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={12} />
            {mutating ? "Saving" : "Set"}
          </button>
        </div>
      </form>

      <form
        onSubmit={submitNote}
        className="mt-3 rounded-[14px] border border-white/[0.014] bg-black/15 p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
            <ClipboardCheck size={12} />
            Note
          </span>
          <select
            value={noteType}
            onChange={(event) => setNoteType(event.target.value as LootboxSponsorPackageNoteType)}
            className="rounded-full border border-white/[0.018] bg-white/[0.012] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-text outline-none focus:border-primary/22"
            aria-label="Sponsor package note type"
          >
            {lootboxSponsorPackageNoteTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Add sponsor follow-up context"
          className="mt-2 min-h-[78px] w-full resize-none rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2 text-[11px] leading-5 text-text outline-none placeholder:text-sub/55 focus:border-primary/22"
          aria-label="Sponsor package note"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9px] text-sub">{note.length}/2000</span>
          <button
            type="submit"
            disabled={noteSaving || !note.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/18 bg-primary text-black px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:border-white/[0.014] disabled:bg-white/[0.012] disabled:text-sub/45"
          >
            <Save size={12} />
            {noteSaving ? "Saving" : "Save note"}
          </button>
        </div>
      </form>
    </article>
  );
}

function SponsorPackageDetailPanel({
  detail,
  loading,
  currentAuthUserId,
  mutating,
  activationRunStepSavingKey,
  activationRunSignoffSavingKey,
  onOwnerClaim,
  onDealSave,
  onDealProgress,
  onActivationRunStepUpdate,
  onActivationRunSignoff,
}: {
  detail: LootboxSponsorPackageDetailRead | null;
  loading: boolean;
  currentAuthUserId: string | null;
  mutating: boolean;
  activationRunStepSavingKey: string | null;
  activationRunSignoffSavingKey: string | null;
  onOwnerClaim: (id: string) => void;
  onDealSave: (id: string, patch: SponsorPackagePatchInput) => void;
  onDealProgress: (id: string, status: LootboxSponsorPackageStatus) => void;
  onActivationRunStepUpdate: (
    id: string,
    stepId: string,
    state: SponsorActivationRunStepState
  ) => void;
  onActivationRunSignoff: (
    id: string,
    outcome: SponsorActivationRunSignoffOutcome,
    note: string,
    followUpAt: string | null
  ) => Promise<boolean>;
}) {
  if (loading) {
    return (
      <section className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3">
        <ActivitySkeleton />
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
        Select a sponsor package to inspect notes, audit events and the next operator move.
      </section>
    );
  }

  const row = detail.package;
  const projectName = getSponsorPackageSnapshotText(row, "projectName", "Workspace");
  const campaignTitle = getSponsorPackageSnapshotText(row, "campaignTitle", row.campaign_id ?? "Campaign");
  const crm = buildLootboxSponsorPackageCrmRead(row);

  return (
    <section className="rounded-[18px] border border-primary/16 bg-[linear-gradient(180deg,rgba(186,255,59,0.045),rgba(8,10,15,0.94))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Package detail
          </p>
          <h3 className="mt-2 break-words text-[15px] font-black text-text [overflow-wrap:anywhere]">
            {campaignTitle}
          </h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
            {projectName}
          </p>
        </div>
        <OpsStatusPill tone={getSponsorPackageStatusTone(row.status)}>
          {(row.status ?? "draft").replace(/_/g, " ")}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniRead label="Next action" value={detail.summary.nextAction} />
        <MiniRead label="Notes" value={`${detail.summary.notes}`} />
        <MiniRead label="Activation runs" value={`${detail.summary.activationRuns}`} />
      </div>

      <SponsorPackageDealCockpit
        row={row}
        crm={crm}
        currentAuthUserId={currentAuthUserId}
        mutating={mutating}
        onOwnerClaim={onOwnerClaim}
        onDealSave={onDealSave}
        onDealProgress={onDealProgress}
      />

      <SponsorPackageActivationRunHistory
        detail={detail}
        stepSavingKey={activationRunStepSavingKey}
        signoffSavingKey={activationRunSignoffSavingKey}
        onStepUpdate={onActivationRunStepUpdate}
        onSignoff={onActivationRunSignoff}
      />

      <div className="mt-3 rounded-[14px] border border-white/[0.016] bg-black/18 p-3">
        <div className="flex items-center gap-2">
          <History size={13} className="text-primary" />
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            Timeline
          </p>
        </div>
        <div className="mt-3 grid gap-2">
          {detail.timeline.length ? (
            detail.timeline.slice(0, 8).map((item) => (
              <SponsorPackageTimelineItemRow key={`${item.kind}:${item.id}`} item={item} />
            ))
          ) : (
            <p className="rounded-[12px] border border-white/[0.014] bg-white/[0.012] px-2.5 py-3 text-[10px] leading-4 text-sub">
              No notes or audit events recorded yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SponsorPackageActivationRunHistory({
  detail,
  stepSavingKey,
  signoffSavingKey,
  onStepUpdate,
  onSignoff,
}: {
  detail: LootboxSponsorPackageDetailRead;
  stepSavingKey: string | null;
  signoffSavingKey: string | null;
  onStepUpdate: (id: string, stepId: string, state: SponsorActivationRunStepState) => void;
  onSignoff: (
    id: string,
    outcome: SponsorActivationRunSignoffOutcome,
    note: string,
    followUpAt: string | null
  ) => Promise<boolean>;
}) {
  const latest = detail.activationRuns[0] ?? null;
  const [signoffOutcome, setSignoffOutcome] =
    useState<SponsorActivationRunSignoffOutcome>("completed");
  const [signoffNote, setSignoffNote] = useState("");
  const [signoffFollowUp, setSignoffFollowUp] = useState("");

  async function submitSignoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!latest || latest.signoff) {
      return;
    }

    const followUpDate = signoffFollowUp ? new Date(signoffFollowUp) : null;
    const saved = await onSignoff(
      detail.package.id,
      signoffOutcome,
      signoffNote,
      followUpDate && !Number.isNaN(followUpDate.getTime())
        ? followUpDate.toISOString()
        : null
    );

    if (saved) {
      setSignoffNote("");
      setSignoffFollowUp("");
      setSignoffOutcome("completed");
    }
  }

  return (
    <div className="mt-3 rounded-[16px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.042),rgba(255,255,255,0.01))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Activation run history
          </p>
          <h4 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            {latest ? latest.title : "No run staged yet"}
          </h4>
          <p className="mt-1 text-[10px] leading-4 text-sub">
            {latest?.nextOperatorMove ??
              "Stage a ready handoff to write the decision note and audit trail first."}
          </p>
        </div>
        <OpsStatusPill tone={latest ? "success" : "warning"}>
          {latest ? "Run staged" : "Not staged"}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniRead
          label="Last staged"
          value={formatSponsorPackageDate(detail.summary.latestActivationRunAt)}
        />
        <MiniRead
          label="Actor"
          value={latest?.stagedByAuthUserId ? shortAuthUser(latest.stagedByAuthUserId) : "None"}
        />
        <MiniRead label="Next move" value={detail.summary.nextActivationRunMove ?? "No run"} />
      </div>

      {latest ? (
        <div className="mt-3 rounded-[14px] border border-white/[0.018] bg-black/20 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Manual checklist
              </p>
              <p className="mt-1 text-[10px] leading-4 text-sub">
                Track execution proof without triggering launch, billing or reward actions.
              </p>
            </div>
            <OpsStatusPill
              tone={latest.steps.every((step) => step.state === "done") ? "success" : "default"}
            >
              {latest.steps.filter((step) => step.state === "done").length}/{latest.steps.length} done
            </OpsStatusPill>
          </div>

          <div className="mt-2 grid gap-2">
            {latest.steps.map((step) => {
              const doneKey = `${detail.package.id}:${step.id}:done`;
              const blockedKey = `${detail.package.id}:${step.id}:blocked`;

              return (
                <div
                  key={step.id}
                  className="grid gap-2 rounded-[12px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-[10px] font-black text-text [overflow-wrap:anywhere]">
                        {step.label}
                      </p>
                      <OpsStatusPill tone={getActivationRunStepTone(step.state)}>
                        {step.state}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-1 break-words text-[9px] leading-4 text-sub [overflow-wrap:anywhere]">
                      {step.note ?? step.detail}
                    </p>
                    {step.updatedAt ? (
                      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-sub/80">
                        {formatSponsorPackageDate(step.updatedAt)} by{" "}
                        {step.updatedByAuthUserId
                          ? shortAuthUser(step.updatedByAuthUserId)
                          : "operator"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                    <button
                      type="button"
                      disabled={Boolean(stepSavingKey) || step.state === "done"}
                      onClick={() => onStepUpdate(detail.package.id, step.id, "done")}
                      className={getActivationRunStepButtonClass(step.state === "done")}
                    >
                      {stepSavingKey === doneKey ? "Saving" : "Done"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(stepSavingKey) || step.state === "blocked"}
                      onClick={() => onStepUpdate(detail.package.id, step.id, "blocked")}
                      className={getActivationRunStepButtonClass(step.state === "blocked", true)}
                    >
                      {stepSavingKey === blockedKey ? "Saving" : "Blocked"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {latest ? (
        latest.signoff ? (
          <div className="mt-3 rounded-[14px] border border-emerald-300/14 bg-emerald-500/[0.035] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Final signoff
                </p>
                <h5 className="mt-2 break-words text-[13px] font-black text-text [overflow-wrap:anywhere]">
                  {latest.signoff.label}
                </h5>
                <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                  {latest.signoff.note}
                </p>
              </div>
              <OpsStatusPill tone={getActivationRunSignoffTone(latest.signoff.outcome)}>
                Signed off
              </OpsStatusPill>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <MiniRead label="Outcome" value={latest.signoff.label} />
              <MiniRead
                label="Signed"
                value={formatSponsorPackageDate(latest.signoff.signedOffAt)}
              />
              <MiniRead
                label="Follow-up"
                value={formatSponsorPackageDate(latest.signoff.followUpAt)}
              />
            </div>
          </div>
        ) : (
          <form
            onSubmit={submitSignoff}
            className="mt-3 rounded-[14px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.035),rgba(255,255,255,0.008))] p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Final signoff
                </p>
                <p className="mt-1 text-[10px] leading-4 text-sub">
                  Close the manual run with an operator outcome and short learning note.
                </p>
              </div>
              <OpsStatusPill tone="warning">Open</OpsStatusPill>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(["completed", "needs_follow_up", "paused"] as const).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setSignoffOutcome(outcome)}
                  className={getActivationRunSignoffChoiceClass(signoffOutcome === outcome)}
                >
                  {getActivationRunSignoffLabel(outcome)}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <textarea
                value={signoffNote}
                onChange={(event) => setSignoffNote(event.target.value)}
                rows={3}
                maxLength={1200}
                placeholder="Outcome note"
                className="min-h-[88px] resize-none rounded-[13px] border border-white/[0.024] bg-black/22 px-3 py-2 text-[11px] leading-5 text-text outline-none transition placeholder:text-sub/55 focus:border-primary/28"
              />
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <input
                  type="datetime-local"
                  value={signoffFollowUp}
                  onChange={(event) => setSignoffFollowUp(event.target.value)}
                  className="h-9 min-w-0 rounded-full border border-white/[0.024] bg-black/22 px-3 text-[10px] font-bold text-text outline-none transition focus:border-primary/28"
                />
                <button
                  type="submit"
                  disabled={Boolean(signoffSavingKey) || !signoffNote.trim()}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-primary/22 bg-primary px-4 text-[9px] font-black uppercase tracking-[0.12em] text-black transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {signoffSavingKey === `${detail.package.id}:${signoffOutcome}`
                    ? "Saving"
                    : "Sign off run"}
                </button>
              </div>
            </div>
          </form>
        )
      ) : null}

      {detail.activationRuns.length ? (
        <div className="mt-3 grid gap-2">
          {detail.activationRuns.slice(0, 3).map((run) => (
            <div
              key={run.runId}
              className="rounded-[13px] border border-white/[0.016] bg-black/18 px-2.5 py-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-[10px] font-black text-text [overflow-wrap:anywhere]">
                    {run.title}
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-sub">
                    {formatSponsorPackageDate(run.stagedAt)} by{" "}
                    {run.stagedByAuthUserId ? shortAuthUser(run.stagedByAuthUserId) : "unknown"}
                  </p>
                </div>
                {run.routeHref ? (
                  <Link
                    href={run.routeHref}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-white/[0.014] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-text transition hover:border-primary/28 hover:text-primary"
                  >
                    <ArrowRight size={11} />
                    Route
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                <MiniRead label="Decision note" value={run.noteId ? "Saved" : "Missing"} />
                <MiniRead label="Audit event" value={run.auditId ? "Saved" : "Missing"} />
                <MiniRead label="Guardrails" value={`${run.guardrailCount}`} />
              </div>
              {run.nextOperatorMove ? (
                <p className="mt-2 rounded-[11px] border border-primary/12 bg-primary/[0.035] px-2.5 py-2 text-[10px] leading-4 text-primary">
                  Next manual step: {run.nextOperatorMove}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-[12px] border border-white/[0.014] bg-white/[0.012] px-2.5 py-3 text-[10px] leading-4 text-sub">
          No activation run has been staged for this package yet.
        </p>
      )}
    </div>
  );
}

function getActivationRunStepTone(state: string) {
  if (state === "done") {
    return "success" as const;
  }

  if (state === "blocked") {
    return "danger" as const;
  }

  return "default" as const;
}

function getActivationRunStepButtonClass(active: boolean, danger = false) {
  const base =
    "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[8px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-45";

  if (active) {
    return `${base} ${
      danger
        ? "border-rose-300/28 bg-rose-500/16 text-rose-200"
        : "border-primary/28 bg-primary/14 text-primary"
    }`;
  }

  return `${base} border-white/[0.024] bg-white/[0.014] text-sub hover:border-primary/24 hover:text-primary`;
}

function getActivationRunSignoffTone(outcome: SponsorActivationRunSignoffOutcome) {
  if (outcome === "completed") {
    return "success" as const;
  }

  if (outcome === "paused") {
    return "danger" as const;
  }

  return "warning" as const;
}

function getActivationRunSignoffLabel(outcome: SponsorActivationRunSignoffOutcome) {
  switch (outcome) {
    case "completed":
      return "Completed";
    case "needs_follow_up":
      return "Needs follow-up";
    case "paused":
      return "Paused";
    default:
      return outcome;
  }
}

function getActivationRunSignoffChoiceClass(active: boolean) {
  const base =
    "inline-flex h-9 items-center justify-center rounded-full border px-3 text-[8px] font-black uppercase tracking-[0.12em] transition";

  return active
    ? `${base} border-primary/30 bg-primary/14 text-primary shadow-[0_0_20px_rgba(186,255,59,0.08)]`
    : `${base} border-white/[0.024] bg-white/[0.012] text-sub hover:border-primary/22 hover:text-primary`;
}

function SponsorPackageDealCockpit({
  row,
  crm,
  currentAuthUserId,
  mutating,
  onOwnerClaim,
  onDealSave,
  onDealProgress,
}: {
  row: LootboxSponsorPackageDetailRead["package"];
  crm: ReturnType<typeof buildLootboxSponsorPackageCrmRead>;
  currentAuthUserId: string | null;
  mutating: boolean;
  onOwnerClaim: (id: string) => void;
  onDealSave: (id: string, patch: SponsorPackagePatchInput) => void;
  onDealProgress: (id: string, status: LootboxSponsorPackageStatus) => void;
}) {
  const [sponsorName, setSponsorName] = useState(row.sponsor_name ?? "");
  const [sponsorContact, setSponsorContact] = useState(row.sponsor_contact ?? "");
  const [sponsorBudget, setSponsorBudget] = useState(
    row.sponsor_budget ? String(row.sponsor_budget) : ""
  );
  const [currency, setCurrency] = useState(row.currency ?? "USD");
  const [followUpInput, setFollowUpInput] = useState(toDateTimeLocalValue(row.follow_up_at));
  const ownerIsCurrentAdmin =
    Boolean(currentAuthUserId) && row.owner_auth_user_id === currentAuthUserId;

  useEffect(() => {
    setSponsorName(row.sponsor_name ?? "");
    setSponsorContact(row.sponsor_contact ?? "");
    setSponsorBudget(row.sponsor_budget ? String(row.sponsor_budget) : "");
    setCurrency(row.currency ?? "USD");
    setFollowUpInput(toDateTimeLocalValue(row.follow_up_at));
  }, [
    row.currency,
    row.follow_up_at,
    row.id,
    row.sponsor_budget,
    row.sponsor_contact,
    row.sponsor_name,
  ]);

  function submitDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budget = sponsorBudget.trim() ? Number(sponsorBudget) : 0;
    const followUpDate = followUpInput ? new Date(followUpInput) : null;

    onDealSave(row.id, {
      sponsorName: sponsorName.trim() || null,
      sponsorContact: sponsorContact.trim() || null,
      sponsorBudget: Number.isFinite(budget) && budget > 0 ? budget : 0,
      currency: currency.trim() || "USD",
      followUpAt:
        followUpDate && !Number.isNaN(followUpDate.getTime())
          ? followUpDate.toISOString()
          : null,
    });
  }

  return (
    <div className="mt-3 rounded-[16px] border border-white/[0.018] bg-black/18 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Deal cockpit
          </p>
          <h4 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            {crm.identity.sponsorName}
          </h4>
          <p className="mt-1 text-[10px] leading-4 text-sub">{crm.primaryAction}</p>
        </div>
        <OpsStatusPill tone={crm.stage.tone}>{crm.stage.label}</OpsStatusPill>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {crm.stage.stages.map((stage) => {
          const stageStatus = stage.id as LootboxSponsorPackageStatus;
          const disabled =
            mutating ||
            row.status === stage.id ||
            !canUseSponsorCrmStageControl({
              stageStatus,
              currentStatus: row.status,
              controls: crm.controls,
            });

          return (
            <button
              key={stage.id}
              type="button"
              disabled={disabled}
              onClick={() => onDealProgress(row.id, stageStatus)}
              className={`min-h-16 rounded-[13px] border px-2 py-2 text-left transition ${
                getSponsorCrmStageClass(stage.state)
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <span className="block text-[8px] font-black uppercase tracking-[0.12em]">
                {stage.state}
              </span>
              <span className="mt-1 block text-[10px] font-black text-text">{stage.label}</span>
            </button>
          );
        })}
      </div>

      <SponsorPackageControlPanel
        controls={crm.controls}
        mutating={mutating}
        onProgress={() => {
          if (crm.controls.nextStatus) {
            onDealProgress(row.id, crm.controls.nextStatus);
          }
        }}
      />

      <form onSubmit={submitDeal} className="mt-3 grid gap-2">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
              Sponsor
            </span>
            <input
              value={sponsorName}
              onChange={(event) => setSponsorName(event.target.value)}
              placeholder="Sponsor name"
              maxLength={160}
              className="mt-1 w-full bg-transparent text-[12px] font-semibold text-text outline-none placeholder:text-sub/45"
              aria-label="Sponsor name"
            />
          </label>
          <label className="rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
              Contact
            </span>
            <input
              value={sponsorContact}
              onChange={(event) => setSponsorContact(event.target.value)}
              placeholder="Email, Telegram or CRM route"
              maxLength={220}
              className="mt-1 w-full bg-transparent text-[12px] font-semibold text-text outline-none placeholder:text-sub/45"
              aria-label="Sponsor contact"
            />
          </label>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_82px]">
          <label className="rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
              Deal value
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={sponsorBudget}
              onChange={(event) => setSponsorBudget(event.target.value)}
              placeholder="0"
              className="mt-1 w-full bg-transparent text-[12px] font-semibold text-text outline-none placeholder:text-sub/45"
              aria-label="Sponsor package budget"
            />
          </label>
          <label className="rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
              Currency
            </span>
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={12}
              className="mt-1 w-full bg-transparent text-[12px] font-semibold text-text outline-none"
              aria-label="Sponsor package currency"
            />
          </label>
        </div>

        <label className="rounded-[13px] border border-white/[0.018] bg-white/[0.012] px-3 py-2">
          <span className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
            Next follow-up
          </span>
          <input
            type="datetime-local"
            value={followUpInput}
            onChange={(event) => setFollowUpInput(event.target.value)}
            className="mt-1 w-full bg-transparent text-[12px] font-semibold text-text outline-none"
            aria-label="Sponsor package next follow-up"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-3">
          {crm.checklist.map((item) => (
            <div
              key={item.id}
              className={`rounded-[12px] border px-2.5 py-2 ${getSponsorCrmChecklistClass(
                item.state
              )}`}
            >
              <p className="text-[8px] font-black uppercase tracking-[0.12em]">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={!currentAuthUserId || ownerIsCurrentAdmin || mutating}
            onClick={() => onOwnerClaim(row.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.024] bg-white/[0.014] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-text transition enabled:hover:border-primary/28 enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck size={12} />
            {ownerIsCurrentAdmin ? "Owned" : "Claim"}
          </button>
          <button
            type="button"
            disabled={mutating}
            onClick={() => onDealProgress(row.id, "lost")}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-300/16 bg-rose-300/[0.045] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-rose-100 transition enabled:hover:border-rose-300/28 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={12} />
            Lost
          </button>
          <button
            type="submit"
            disabled={mutating}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-black transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={12} />
            {mutating ? "Saving" : "Save CRM"}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <MiniRead label="Deal value" value={crm.identity.budgetLabel} />
          <MiniRead
            label="Last contacted"
            value={formatSponsorPackageDate(crm.identity.lastContactedAt)}
          />
        </div>
      </form>
    </div>
  );
}

function SponsorPackageControlPanel({
  controls,
  mutating,
  onProgress,
}: {
  controls: ReturnType<typeof buildLootboxSponsorPackageCrmRead>["controls"];
  mutating: boolean;
  onProgress: () => void;
}) {
  return (
    <div
      className={`mt-3 rounded-[14px] border px-3 py-3 ${
        controls.canProgress
          ? "border-emerald-300/16 bg-emerald-300/[0.045]"
          : "border-amber-300/16 bg-amber-300/[0.045]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[8px] font-black uppercase tracking-[0.16em] ${
              controls.canProgress ? "text-emerald-100" : "text-amber-100"
            }`}
          >
            Next safe control
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-text">
            {controls.reason}
          </p>
        </div>
        <button
          type="button"
          disabled={!controls.canProgress || !controls.nextStatus || mutating}
          onClick={onProgress}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary px-3 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-black transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:border-white/[0.02] disabled:bg-white/[0.02] disabled:text-sub/45"
        >
          <ArrowRight size={12} />
          {controls.nextActionLabel}
        </button>
      </div>
      {controls.blockingFields.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {controls.blockingFields.map((field) => (
            <span
              key={field}
              className="rounded-full border border-amber-300/18 bg-black/16 px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-amber-100"
            >
              {field}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SponsorPackageTimelineItemRow({ item }: { item: LootboxSponsorPackageTimelineItem }) {
  return (
    <div className="rounded-[13px] border border-white/[0.014] bg-white/[0.012] px-2.5 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${getTimelineToneClass(item.tone)}`}
            >
              {item.kind}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-sub">
              {item.title}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-sub">{item.detail}</p>
          {item.followUpAt ? (
            <p className="mt-1 text-[9px] font-semibold text-primary">
              Follow-up {formatSponsorPackageDate(item.followUpAt)}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-[9px] text-sub">
          {formatSponsorPackageDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}

type SponsorActivationHandoffRead = ReturnType<typeof buildLootboxSponsorActivationHandoffRead>;
type SponsorActivationHandoff = SponsorActivationHandoffRead["handoffs"][number];
type SponsorBusinessCockpit = SponsorActivationHandoffRead["businessCockpit"];
type SponsorBusinessCockpitItem = SponsorBusinessCockpit["lanes"][number]["items"][number];
type SponsorBillingReadiness = SponsorActivationHandoffRead["billingReadiness"];
type SponsorBillingReadinessItem = SponsorBillingReadiness["lanes"][number]["items"][number];
type SponsorDealClosePack = SponsorActivationHandoffRead["dealClosePack"];
type SponsorDealClosePackItem = SponsorDealClosePack["packs"][number];
type SponsorDealCloseBlock = SponsorDealClosePackItem["blocks"][number];
type SponsorRevenueCommand = SponsorActivationHandoffRead["revenueCommand"];
type SponsorRevenueCommandLane = SponsorRevenueCommand["lanes"][number];
type SponsorFollowUpTimeline = SponsorActivationHandoffRead["followUpTimeline"];
type SponsorFollowUpTimelineItem = SponsorFollowUpTimeline["lanes"][number]["items"][number];

function SponsorActivationHandoffPanel({
  read,
  copyingId,
  activationRunSavingId,
  onCopy,
  onStageRun,
}: {
  read: SponsorActivationHandoffRead;
  copyingId: string | null;
  activationRunSavingId: string | null;
  onCopy: (id: string, text: string, successText: string) => void;
  onStageRun: (id: string) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Phase 2F-I-A"
      title="Sponsor activation handoff"
      description="Turn a won sponsor package into a clean staged activation run: campaign route, shard pool, reward budget, performance proof and next sponsor follow-up stay visible before public delivery."
      action={
        <OpsStatusPill tone={read.summary.ready > 0 ? "success" : "warning"}>
          {read.summary.ready} ready
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-8">
          <MiniRead label="Packages" value={`${read.summary.total}`} />
          <MiniRead label="Ready" value={`${read.summary.ready}`} />
          <MiniRead label="Setup needed" value={`${read.summary.setupNeeded}`} />
          <MiniRead label="Locked" value={`${read.summary.locked}`} />
          <MiniRead label="Renewal ready" value={`${read.summary.renewalReady}`} />
          <MiniRead label="Staged runs" value={`${read.summary.stagedRuns}`} />
          <MiniRead label="Signed off" value={`${read.summary.signedOffRuns}`} />
          <MiniRead label="Mode" value={read.summary.manualOnly ? "Manual" : "Auto"} />
        </div>

        <SponsorRevenueCommandCenterPanel
          revenueCommand={read.revenueCommand}
          closePack={read.dealClosePack}
          copyingId={copyingId}
          onCopy={onCopy}
        />

        <SponsorFollowUpTimelinePanel timeline={read.followUpTimeline} />

        <details className="group rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.16em] text-sub transition hover:text-primary">
            Advanced sponsor views
            <span className="rounded-full border border-white/[0.02] bg-black/24 px-2 py-1 text-[8px] text-primary">
              expand
            </span>
          </summary>
          <div className="mt-3 grid gap-3">
            <SponsorBusinessCockpitPanel cockpit={read.businessCockpit} />
            <SponsorBillingReadinessPanel readiness={read.billingReadiness} />
            <SponsorDealClosePackPanel
              closePack={read.dealClosePack}
              copyingId={copyingId}
              onCopy={onCopy}
            />
          </div>
        </details>

        {read.focus ? <SponsorActivationFocusCard handoff={read.focus} /> : null}

        {read.handoffs.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {read.handoffs.slice(0, 4).map((handoff) => (
              <SponsorActivationHandoffCard
                key={handoff.packageId}
                handoff={handoff}
                activationCopying={copyingId === `activation-${handoff.packageId}`}
                performanceCopying={copyingId === `performance-${handoff.packageId}`}
                renewalCopying={copyingId === `renewal-${handoff.packageId}`}
                activationRunSaving={activationRunSavingId === handoff.packageId}
                onCopy={onCopy}
                onStageRun={onStageRun}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3 text-[12px] leading-5 text-sub">
            Win or save a sponsor package first. Activation handoffs appear here without creating billing, payouts or inventory.
          </div>
        )}

        <div className="grid gap-2 md:grid-cols-3">
          {read.guardrails.map((guardrail) => (
            <div
              key={guardrail}
              className="rounded-[14px] border border-white/[0.016] bg-black/18 p-3 text-[10px] font-semibold leading-4 text-sub"
            >
              {guardrail}
            </div>
          ))}
        </div>
      </div>
    </OpsPanel>
  );
}

function SponsorRevenueCommandCenterPanel({
  revenueCommand,
  closePack,
  copyingId,
  onCopy,
}: {
  revenueCommand: SponsorRevenueCommand;
  closePack: SponsorDealClosePack;
  copyingId: string | null;
  onCopy: (id: string, text: string, successText: string) => void;
}) {
  const focusPack = revenueCommand.focus
    ? closePack.packs.find((pack) => pack.packageId === revenueCommand.focus?.packageId)
    : closePack.focus;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-primary/14 bg-[radial-gradient(circle_at_10%_0%,rgba(186,255,59,0.12),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(74,217,255,0.085),transparent_25%),linear-gradient(180deg,rgba(14,18,22,0.96),rgba(7,9,14,0.94))] p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/32 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Sponsor revenue command
          </p>
          <h3 className="mt-2 break-words text-[17px] font-black text-text [overflow-wrap:anywhere]">
            One screen for money, readiness and close copy
          </h3>
          <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
            {revenueCommand.summary.topNextAction}
          </p>
        </div>
        <OpsStatusPill tone={revenueCommand.summary.closeReady > 0 ? "success" : "warning"}>
          {revenueCommand.summary.manualOnly ? "manual only" : "live"}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-6">
        <MiniRead label="Pipeline" value={formatSponsorBusinessValue(revenueCommand.summary.pipelineValue)} />
        <MiniRead label="Invoice ready" value={formatSponsorBusinessValue(revenueCommand.summary.invoiceReadyValue)} />
        <MiniRead label="Priority" value={`${revenueCommand.summary.highPriority}`} />
        <MiniRead label="Invoices" value={`${revenueCommand.summary.invoiceReady}`} />
        <MiniRead label="Close ready" value={`${revenueCommand.summary.closeReady}`} />
        <MiniRead label="Copy blocks" value={`${revenueCommand.summary.copyBlocks}`} />
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[16px] border border-primary/16 bg-[linear-gradient(180deg,rgba(186,255,59,0.06),rgba(255,255,255,0.012))] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                Focus
              </p>
              <p className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                {revenueCommand.focus?.sponsorName ?? "No sponsor package yet"}
              </p>
              <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                {revenueCommand.focus?.nextAction ?? "Save a sponsor package to open the revenue command center."}
              </p>
            </div>
            {revenueCommand.focus ? (
              <Link
                href={revenueCommand.focus.routeHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-black/24 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition hover:border-primary/28 hover:bg-primary/[0.07]"
              >
                <ArrowRight size={12} />
                Open
              </Link>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {focusPack?.blocks.map((block) => (
              <SponsorDealCloseCopyBlock
                key={block.id}
                packageId={focusPack.packageId}
                block={block}
                copying={copyingId === `close-${focusPack.packageId}-${block.id}`}
                onCopy={onCopy}
              />
            )) ?? (
              <p className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub">
                Close copy appears after a package has a sponsor win, contact, value and delivery signoff.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          {revenueCommand.lanes.map((lane) => (
            <SponsorRevenueCommandLaneCard key={lane.id} lane={lane} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SponsorRevenueCommandLaneCard({ lane }: { lane: SponsorRevenueCommandLane }) {
  return (
    <Link
      href={lane.routeHref}
      className="group block rounded-[16px] border border-white/[0.018] bg-black/22 p-3 transition hover:border-primary/24 hover:bg-primary/[0.035]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
            {lane.label}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-sub">
            {lane.detail}
          </p>
        </div>
        <OpsStatusPill tone={lane.tone}>{lane.count}</OpsStatusPill>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate text-[13px] font-black text-text">
          {formatSponsorRevenueLaneValue(lane)}
        </span>
        <ArrowRight size={14} className="shrink-0 text-primary transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function SponsorFollowUpTimelinePanel({ timeline }: { timeline: SponsorFollowUpTimeline }) {
  const focus = timeline.focus;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-sky-300/12 bg-[radial-gradient(circle_at_8%_0%,rgba(74,217,255,0.1),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(186,255,59,0.08),transparent_24%),linear-gradient(180deg,rgba(12,16,22,0.96),rgba(7,9,14,0.94))] p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/24 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Sponsor follow-up timeline
          </p>
          <h3 className="mt-2 break-words text-[16px] font-black text-text [overflow-wrap:anywhere]">
            Next sponsor touches without hidden work
          </h3>
          <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
            {timeline.summary.topNextAction}
          </p>
        </div>
        <OpsStatusPill tone={timeline.summary.overdue > 0 ? "danger" : "success"}>
          {timeline.summary.manualOnly ? "manual only" : "live"}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <MiniRead label="Touches" value={`${timeline.summary.total}`} />
        <MiniRead label="Now" value={`${timeline.summary.now}`} />
        <MiniRead label="Next" value={`${timeline.summary.next}`} />
        <MiniRead label="Proof" value={`${timeline.summary.proof}`} />
        <MiniRead label="Overdue" value={`${timeline.summary.overdue}`} />
      </div>

      {focus ? (
        <Link
          href={focus.routeHref}
          className={`group mt-3 block rounded-[16px] border p-3 transition hover:border-primary/30 ${getSponsorFollowUpTimelineClass(focus.state)}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <OpsStatusPill tone={getSponsorFollowUpTimelineTone(focus.state)}>
                  {focus.state.replace(/_/g, " ")}
                </OpsStatusPill>
                <OpsStatusPill tone="default">{focus.valueLabel}</OpsStatusPill>
              </div>
              <p className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                {focus.label}
              </p>
              <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                {focus.sponsorName} - {focus.campaignTitle}
              </p>
              <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-sub">
                {focus.nextAction}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-black/24 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
              Open
              <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ) : (
        <p className="mt-3 rounded-[14px] border border-white/[0.014] bg-white/[0.01] px-3 py-2 text-[10px] leading-4 text-sub">
          Save sponsor packages first. Follow-up timing appears here without sending anything automatically.
        </p>
      )}

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {timeline.lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-[16px] border border-white/[0.018] bg-black/22 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                  {lane.label}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-sub">
                  {lane.detail}
                </p>
              </div>
              <span className="rounded-full border border-white/[0.02] bg-white/[0.012] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-text">
                {lane.count}
              </span>
            </div>

            <div className="mt-3 grid gap-1.5">
              {lane.items.slice(0, 3).map((item) => (
                <SponsorFollowUpTimelineItemLink key={item.id} item={item} />
              ))}
              {lane.items.length === 0 ? (
                <p className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub">
                  No sponsor touches in this lane.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {timeline.guardrails.map((guardrail) => (
          <p
            key={guardrail}
            className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 text-[10px] font-semibold leading-4 text-sub"
          >
            {guardrail}
          </p>
        ))}
      </div>
    </div>
  );
}

function SponsorFollowUpTimelineItemLink({ item }: { item: SponsorFollowUpTimelineItem }) {
  return (
    <Link
      href={item.routeHref}
      className={`group block rounded-[13px] border px-2.5 py-2 transition hover:border-primary/28 ${getSponsorFollowUpTimelineClass(item.state)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black text-text">{item.label}</p>
          <p className="mt-0.5 line-clamp-1 text-[9px] text-sub">
            {item.sponsorName}
          </p>
        </div>
        <OpsStatusPill tone={getSponsorFollowUpTimelineTone(item.state)}>
          {item.state.replace(/_/g, " ")}
        </OpsStatusPill>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.12em]">
        <span className="text-primary">{formatSponsorPackageDate(item.eventAt)}</span>
        <span className="text-sub">{item.valueLabel}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-sub">{item.detail}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
        Open
        <ArrowRight size={11} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SponsorDealClosePackPanel({
  closePack,
  copyingId,
  onCopy,
}: {
  closePack: SponsorDealClosePack;
  copyingId: string | null;
  onCopy: (id: string, text: string, successText: string) => void;
}) {
  const focus = closePack.focus;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-primary/12 bg-[radial-gradient(circle_at_8%_0%,rgba(186,255,59,0.1),transparent_26%),radial-gradient(circle_at_90%_12%,rgba(255,255,255,0.045),transparent_24%),linear-gradient(180deg,rgba(15,17,22,0.95),rgba(7,9,14,0.94))] p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/24 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Deal close pack
          </p>
          <h3 className="mt-2 break-words text-[16px] font-black text-text [overflow-wrap:anywhere]">
            Sponsor closing copy
          </h3>
          <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
            {closePack.summary.topNextAction}
          </p>
        </div>
        <OpsStatusPill tone={closePack.summary.ready > 0 ? "success" : "warning"}>
          {closePack.summary.copyBlocks} copy blocks
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <MiniRead label="Packages" value={`${closePack.summary.total}`} />
        <MiniRead label="Ready" value={`${closePack.summary.ready}`} />
        <MiniRead label="Setup" value={`${closePack.summary.needsSetup}`} />
        <MiniRead label="Watch" value={`${closePack.summary.watch}`} />
        <MiniRead label="Mode" value={closePack.summary.manualOnly ? "Manual" : "Live"} />
      </div>

      {focus ? (
        <div className={`mt-3 rounded-[16px] border p-3 ${getSponsorDealCloseStateClass(focus.state)}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <OpsStatusPill tone={getSponsorDealCloseStateTone(focus.state)}>
                  {focus.state.replace(/_/g, " ")}
                </OpsStatusPill>
                <OpsStatusPill tone={getPackageTierTone(focus.packageTier as LootboxSponsoredPackageTier)}>
                  {focus.packageTier}
                </OpsStatusPill>
              </div>
              <p className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                {focus.sponsorName}
              </p>
              <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                {focus.nextAction}
              </p>
            </div>
            <Link
              href={focus.routeHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-black/24 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition hover:border-primary/28 hover:bg-primary/[0.07]"
            >
              <ClipboardCheck size={12} />
              Open
            </Link>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MiniRead label="Value" value={focus.valueLabel} />
            <MiniRead label="Signoff" value={focus.signoffLabel} />
            <MiniRead label="Blocks" value={`${focus.blocks.filter((block) => block.enabled).length}/3`} />
            <MiniRead label="Blockers" value={focus.blockers.length ? `${focus.blockers.length}` : "0"} />
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {focus.blocks.map((block) => (
              <SponsorDealCloseCopyBlock
                key={block.id}
                packageId={focus.packageId}
                block={block}
                copying={copyingId === `close-${focus.packageId}-${block.id}`}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {closePack.packs.slice(0, 3).map((pack) => (
          <Link
            key={pack.packageId}
            href={pack.routeHref}
            className={`group block rounded-[14px] border px-3 py-2.5 transition hover:border-primary/24 ${getSponsorDealCloseStateClass(pack.state)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black text-text">{pack.sponsorName}</p>
                <p className="mt-1 line-clamp-1 text-[9px] text-sub">{pack.campaignTitle}</p>
              </div>
              <OpsStatusPill tone={getSponsorDealCloseStateTone(pack.state)}>
                {pack.state.replace(/_/g, " ")}
              </OpsStatusPill>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.12em]">
              <span className="text-primary">{pack.valueLabel}</span>
              <span className="text-sub">{pack.signoffLabel}</span>
            </div>
            {pack.blockers.length ? (
              <p className="mt-2 line-clamp-1 text-[9px] leading-4 text-sub">
                Blocking: {pack.blockers.join(", ")}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {closePack.guardrails.map((guardrail) => (
          <div
            key={guardrail}
            className="rounded-[13px] border border-white/[0.016] bg-white/[0.012] px-2.5 py-2 text-[10px] font-semibold leading-4 text-sub"
          >
            {guardrail}
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorDealCloseCopyBlock({
  packageId,
  block,
  copying,
  onCopy,
}: {
  packageId: string;
  block: SponsorDealCloseBlock;
  copying: boolean;
  onCopy: (id: string, text: string, successText: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.018] bg-black/22 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
            {block.label}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-sub">
            {block.enabled ? block.title : `Blocked: ${block.blockers.join(", ")}`}
          </p>
        </div>
        <OpsStatusPill tone={block.enabled ? "success" : "warning"}>
          {block.enabled ? "ready" : "locked"}
        </OpsStatusPill>
      </div>
      <button
        type="button"
        disabled={!block.enabled || copying}
        onClick={() =>
          onCopy(
            `close-${packageId}-${block.id}`,
            `${block.title}\n\n${block.body}`,
            `${block.label} copied.`
          )
        }
        className="mt-3 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full border border-primary/18 bg-primary/[0.07] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition enabled:hover:border-primary/34 enabled:hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:border-white/[0.018] disabled:bg-white/[0.012] disabled:text-sub"
      >
        <Copy size={12} />
        {copying ? "Copying" : "Copy"}
      </button>
    </div>
  );
}

function SponsorBillingReadinessPanel({ readiness }: { readiness: SponsorBillingReadiness }) {
  const focus = readiness.focus;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/[0.02] bg-[radial-gradient(circle_at_10%_0%,rgba(74,217,255,0.1),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(186,255,59,0.08),transparent_24%),linear-gradient(180deg,rgba(12,16,23,0.94),rgba(7,9,14,0.94))] p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/22 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-200">
            Finance readiness
          </p>
          <h3 className="mt-2 break-words text-[16px] font-black text-text [overflow-wrap:anywhere]">
            Manual billing lane
          </h3>
          <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
            {readiness.summary.topNextAction}
          </p>
        </div>
        <OpsStatusPill tone={readiness.summary.invoiceReady > 0 ? "success" : "warning"}>
          {readiness.summary.manualOnly ? "manual only" : "live"}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <MiniRead label="Invoice value" value={formatSponsorBusinessValue(readiness.summary.invoiceReadyValue)} />
        <MiniRead label="Pipeline" value={formatSponsorBusinessValue(readiness.summary.totalValue)} />
        <MiniRead label="Invoice ready" value={`${readiness.summary.invoiceReady}`} />
        <MiniRead label="Setup" value={`${readiness.summary.needsFinanceSetup}`} />
        <MiniRead label="Watch" value={`${readiness.summary.paymentWatch}`} />
      </div>

      {focus ? (
        <div className="mt-3 rounded-[16px] border border-sky-300/14 bg-[linear-gradient(180deg,rgba(74,217,255,0.055),rgba(255,255,255,0.012))] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <OpsStatusPill tone={getSponsorBillingReadinessTone(focus.readiness)}>
                  {focus.readiness.replace(/_/g, " ")}
                </OpsStatusPill>
                <OpsStatusPill tone={getSponsorBillingPriorityTone(focus.priority)}>
                  {focus.priority}
                </OpsStatusPill>
              </div>
              <p className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                {focus.sponsorName}
              </p>
              <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                {focus.nextAction}
              </p>
            </div>
            <Link
              href={focus.routeHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-black/24 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-sky-100 transition hover:border-sky-300/24 hover:text-primary"
            >
              <FileText size={12} />
              Package
            </Link>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MiniRead label="Value" value={focus.valueLabel} />
            <MiniRead label="Contact" value={focus.sponsorContact} />
            <MiniRead label="Signoff" value={focus.signoffLabel} />
            <MiniRead label="Blockers" value={focus.blockers.length ? `${focus.blockers.length}` : "0"} />
          </div>
          {focus.blockers.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {focus.blockers.map((blocker) => (
                <span
                  key={blocker}
                  className="rounded-full border border-amber-300/14 bg-amber-300/[0.045] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-100"
                >
                  {blocker}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {readiness.lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-[16px] border border-white/[0.018] bg-black/22 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-200">
                  {lane.label}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-sub">{lane.detail}</p>
              </div>
              <span className="rounded-full border border-white/[0.02] bg-white/[0.012] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-text">
                {lane.count}
              </span>
            </div>

            <div className="mt-3 grid gap-1.5">
              {lane.items.slice(0, 3).map((item) => (
                <Link
                  key={`${lane.id}-${item.packageId}`}
                  href={item.routeHref}
                  className={`group block rounded-[13px] border px-2.5 py-2 transition hover:border-sky-300/24 ${getSponsorBillingReadinessClass(item.readiness)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black text-text">
                        {item.sponsorName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[9px] text-sub">
                        {item.nextAction}
                      </p>
                    </div>
                    <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
                      {item.valueLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <OpsStatusPill tone={getSponsorBillingReadinessTone(item.readiness)}>
                      {item.readiness.replace(/_/g, " ")}
                    </OpsStatusPill>
                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-sub">
                      {item.signoffLabel}
                    </span>
                  </div>
                </Link>
              ))}
              {lane.items.length === 0 ? (
                <p className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub">
                  No packages in this lane.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {readiness.guardrails.map((guardrail) => (
          <div
            key={guardrail}
            className="rounded-[13px] border border-white/[0.016] bg-white/[0.012] px-2.5 py-2 text-[10px] font-semibold leading-4 text-sub"
          >
            {guardrail}
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorBusinessCockpitPanel({ cockpit }: { cockpit: SponsorBusinessCockpit }) {
  const focus = cockpit.focus;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-primary/14 bg-[radial-gradient(circle_at_12%_0%,rgba(186,255,59,0.11),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(74,217,255,0.07),transparent_24%),linear-gradient(180deg,rgba(15,20,18,0.94),rgba(7,9,14,0.94))] p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Business cockpit
          </p>
          <h3 className="mt-2 break-words text-[16px] font-black text-text [overflow-wrap:anywhere]">
            Sponsor revenue queue
          </h3>
          <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
            {cockpit.summary.topNextAction}
          </p>
        </div>
        <OpsStatusPill tone={cockpit.summary.highPriority > 0 ? "warning" : "success"}>
          {cockpit.summary.highPriority} priority
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <MiniRead label="Pipeline" value={formatSponsorBusinessValue(cockpit.summary.totalValue)} />
        <MiniRead label="Priority" value={`${cockpit.summary.highPriority}`} />
        <MiniRead label="Overdue" value={`${cockpit.summary.overdueFollowUps}`} />
        <MiniRead label="Renewal" value={`${cockpit.summary.renewalReady}`} />
        <MiniRead label="Signed off" value={`${cockpit.summary.signedOffRuns}`} />
      </div>

      {focus ? (
        <Link
          href={focus.routeHref}
          className="group mt-3 block rounded-[16px] border border-primary/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.065),rgba(255,255,255,0.012))] p-3 transition hover:border-primary/34 hover:bg-primary/[0.08]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <OpsStatusPill tone={getSponsorBusinessPriorityTone(focus.priority)}>
                  {focus.priority}
                </OpsStatusPill>
                <OpsStatusPill tone={getSponsorRenewalTone(focus.renewalState)}>
                  {focus.renewalLabel}
                </OpsStatusPill>
                {focus.signedOff ? <OpsStatusPill tone="success">signed off</OpsStatusPill> : null}
              </div>
              <p className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                {focus.sponsorName}
              </p>
              <p className="mt-1 break-words text-[10px] leading-4 text-sub [overflow-wrap:anywhere]">
                {focus.nextAction}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.022] bg-black/24 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
              Open
              <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MiniRead label="Value" value={focus.valueLabel} />
            <MiniRead label="Tier" value={focus.packageTier} />
            <MiniRead label="Follow-up" value={focus.followUpUrgency.replace(/_/g, " ")} />
            <MiniRead label="Score" value={`${focus.score}`} />
          </div>
        </Link>
      ) : null}

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {cockpit.lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-[16px] border border-white/[0.018] bg-black/22 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                  {lane.label}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-sub">{lane.detail}</p>
              </div>
              <span className="rounded-full border border-white/[0.02] bg-white/[0.012] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-text">
                {lane.count}
              </span>
            </div>

            <div className="mt-3 grid gap-1.5">
              {lane.items.slice(0, 3).map((item) => (
                <Link
                  key={`${lane.id}-${item.packageId}`}
                  href={item.routeHref}
                  className={`group block rounded-[13px] border px-2.5 py-2 transition hover:border-primary/28 ${getSponsorBusinessPriorityClass(item.priority)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black text-text">
                        {item.sponsorName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[9px] text-sub">
                        {item.campaignTitle}
                      </p>
                    </div>
                    <OpsStatusPill tone={getSponsorBusinessPriorityTone(item.priority)}>
                      {item.priority}
                    </OpsStatusPill>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.12em]">
                    <span className="text-primary">{item.valueLabel}</span>
                    <span className="text-sub">{item.followUpUrgency.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-sub">
                    {item.nextAction}
                  </p>
                </Link>
              ))}
              {lane.items.length === 0 ? (
                <p className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub">
                  No packages in this lane.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorActivationFocusCard({ handoff }: { handoff: SponsorActivationHandoff }) {
  return (
    <div className="rounded-[18px] border border-primary/18 bg-[radial-gradient(circle_at_92%_8%,rgba(186,255,59,0.14),transparent_28%),linear-gradient(180deg,rgba(186,255,59,0.045),rgba(8,10,15,0.94))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Recommended handoff
          </p>
          <h3 className="mt-2 break-words text-[15px] font-black text-text [overflow-wrap:anywhere]">
            {handoff.brief.title}
          </h3>
          <p className="mt-1 text-[11px] leading-5 text-sub">{handoff.nextAction}</p>
        </div>
        <OpsStatusPill tone={handoff.tone}>{handoff.activationState.replace(/_/g, " ")}</OpsStatusPill>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <MiniRead label="Shard pool" value={handoff.metrics.poolSize.toLocaleString("en-US")} />
        <MiniRead label="Remaining" value={handoff.metrics.remainingShards.toLocaleString("en-US")} />
        <MiniRead label="Reward budget" value={handoff.metrics.rewardBudget.toLocaleString("en-US")} />
        <MiniRead label="Run" value={handoff.activationRun.label} />
        <MiniRead label="Outcome" value={handoff.activationRun.signoff?.label ?? "Open"} />
      </div>
      <div className="mt-3 rounded-[14px] border border-white/[0.016] bg-black/18 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
            Execution
          </p>
          <OpsStatusPill tone={handoff.execution.canLaunch ? "success" : "warning"}>
            {handoff.execution.label}
          </OpsStatusPill>
        </div>
        {handoff.execution.blockedBy.length ? (
          <p className="mt-2 text-[10px] leading-4 text-sub">
            Blocking: {handoff.execution.blockedBy.join(", ")}
          </p>
        ) : (
          <p className="mt-2 text-[10px] leading-4 text-sub">
            {handoff.activationRun.state === "staged"
              ? handoff.activationRun.detail
              : "Manual launch can start once the activation brief is staged."}
          </p>
        )}
      </div>
    </div>
  );
}

function SponsorActivationHandoffCard({
  handoff,
  activationCopying,
  performanceCopying,
  renewalCopying,
  activationRunSaving,
  onCopy,
  onStageRun,
}: {
  handoff: SponsorActivationHandoff;
  activationCopying: boolean;
  performanceCopying: boolean;
  renewalCopying: boolean;
  activationRunSaving: boolean;
  onCopy: (id: string, text: string, successText: string) => void;
  onStageRun: (id: string) => void;
}) {
  const copyText = `${handoff.brief.title}\n\n${handoff.brief.body}`;
  const performanceCopyText = `${handoff.performance.sponsorUpdate.title}\n\n${handoff.performance.sponsorUpdate.body}`;
  const renewalCopyText = `${handoff.renewal.renewalCopy.title}\n\n${handoff.renewal.renewalCopy.body}`;

  return (
    <article className="rounded-[18px] border border-white/[0.018] bg-[linear-gradient(180deg,rgba(12,15,21,0.92),rgba(7,9,14,0.94))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <OpsStatusPill tone={handoff.tone}>{handoff.activationState.replace(/_/g, " ")}</OpsStatusPill>
            <OpsStatusPill tone={handoff.activationRun.tone}>{handoff.activationRun.label}</OpsStatusPill>
            {handoff.activationRun.signoff ? (
              <OpsStatusPill tone={getActivationRunSignoffTone(handoff.activationRun.signoff.outcome)}>
                {handoff.activationRun.signoff.label}
              </OpsStatusPill>
            ) : null}
            <OpsStatusPill tone={getPackageTierTone(handoff.packageTier as LootboxSponsoredPackageTier)}>
              {handoff.packageTier}
            </OpsStatusPill>
          </div>
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            {handoff.projectName}
          </p>
          <h3 className="mt-1.5 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            {handoff.sponsorName}
          </h3>
          <p className="mt-1 text-[10px] leading-4 text-sub">{handoff.campaignTitle}</p>
        </div>
        <Link
          href={handoff.routeHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.024] bg-white/[0.014] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-text transition hover:border-primary/28 hover:text-primary"
        >
          <ArrowRight size={12} />
          Campaign
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniRead label="Deal" value={handoff.budgetLabel} />
        <MiniRead label="Pools" value={`${handoff.metrics.activePools}/${handoff.metrics.linkedPools}`} />
        <MiniRead label="Remaining" value={handoff.metrics.remainingShards.toLocaleString("en-US")} />
      </div>

      <div className="mt-3 rounded-[14px] border border-primary/12 bg-[linear-gradient(180deg,rgba(186,255,59,0.04),rgba(255,255,255,0.01))] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
              Activation run state
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">{handoff.activationRun.detail}</p>
          </div>
          <OpsStatusPill tone={handoff.activationRun.tone}>
            {handoff.activationRun.label}
          </OpsStatusPill>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <MiniRead
            label="Last staged"
            value={
              handoff.activationRun.stagedAt
                ? formatSponsorPackageDate(handoff.activationRun.stagedAt)
                : "Not yet"
            }
          />
          <MiniRead label="Signoff" value={handoff.activationRun.signoff?.label ?? "Open"} />
          <MiniRead
            label="Run note"
            value={handoff.activationRun.noteId ? "Decision saved" : "No note"}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-1.5">
        {handoff.checklist.map((item) => (
          <div
            key={item.id}
            className={`rounded-[13px] border px-2.5 py-2 ${getSponsorActivationChecklistClass(item.state)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                {item.label}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                {item.state}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-4">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[14px] border border-white/[0.014] bg-black/18 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
            Execution checklist
          </p>
          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-sub">
            {handoff.execution.primaryStepId.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mt-3 grid gap-1.5">
          {handoff.execution.steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-[12px] border px-2.5 py-2 ${getSponsorActivationExecutionStepClass(step.state)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                  {step.label}
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                  {step.state.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-1.5">
          {handoff.execution.runbook.map((item) => (
            <p
              key={item}
              className="rounded-[11px] border border-white/[0.012] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub"
            >
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className={`mt-3 rounded-[14px] border p-3 ${getSponsorRenewalShellClass(handoff.renewal.state)}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
              Renewal pipeline
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">
              {handoff.renewal.nextAction}
            </p>
          </div>
          <OpsStatusPill tone={getSponsorRenewalTone(handoff.renewal.state)}>
            {handoff.renewal.label}
          </OpsStatusPill>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <MiniRead label="Proposal" value={`${handoff.renewal.nextPackageTier} renewal`} />
          <MiniRead label="Follow-up" value={handoff.renewal.followUpUrgency.replace(/_/g, " ")} />
          <MiniRead label="Outcome" value={handoff.renewal.signoff.label} />
          <MiniRead
            label="Blockers"
            value={handoff.renewal.blockedBy.length ? `${handoff.renewal.blockedBy.length}` : "0"}
          />
        </div>
        {handoff.renewal.signoff.state === "signed_off" ? (
          <p className="mt-3 rounded-[12px] border border-primary/12 bg-primary/[0.035] px-2.5 py-2 text-[10px] leading-4 text-primary">
            Signed-off move: {handoff.renewal.signoff.nextSponsorMove}
          </p>
        ) : null}
        {handoff.renewal.blockedBy.length ? (
          <p className="mt-3 rounded-[12px] border border-amber-300/12 bg-amber-300/[0.035] px-2.5 py-2 text-[10px] leading-4 text-amber-100">
            Blocking: {handoff.renewal.blockedBy.join(", ")}
          </p>
        ) : null}
        <div className="mt-3 grid gap-1.5">
          {handoff.renewal.playbook.map((step) => (
            <div
              key={step.id}
              className={`rounded-[12px] border px-2.5 py-2 ${getSponsorRenewalPlaybookClass(step.state)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                  {step.label}
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.12em]">
                  {step.state.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-white/[0.012] bg-white/[0.01] px-2.5 py-2">
          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-sub">
            Manual renewal, no billing action
          </span>
          <button
            type="button"
            disabled={renewalCopying}
            onClick={() =>
              onCopy(
                `renewal-${handoff.packageId}`,
                renewalCopyText,
                "Renewal follow-up copied."
              )
            }
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/18 bg-primary/[0.07] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition enabled:hover:border-primary/34 enabled:hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={12} />
            {renewalCopying ? "Copying" : "Copy renewal"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-[14px] border border-white/[0.014] bg-black/18 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
              Performance snapshot
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">
              {handoff.performance.nextAction}
            </p>
          </div>
          <OpsStatusPill tone={getSponsorPerformanceTone(handoff.performance.state)}>
            {handoff.performance.label}
          </OpsStatusPill>
        </div>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {handoff.performance.kpis.map((kpi) => (
            <div
              key={kpi.id}
              className={`rounded-[12px] border px-2.5 py-2 ${getSponsorPerformanceKpiClass(kpi.tone)}`}
            >
              <p className="text-[8px] font-black uppercase tracking-[0.12em]">
                {kpi.label}
              </p>
              <p className="mt-1 text-[13px] font-black">{kpi.value}</p>
              <p className="mt-1 text-[10px] leading-4">{kpi.detail}</p>
            </div>
          ))}
        </div>
        {handoff.performance.signoff.state === "signed_off" ? (
          <div className="mt-3 rounded-[12px] border border-primary/12 bg-primary/[0.035] px-2.5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.12em] text-primary">
                {handoff.performance.signoff.label} signoff
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.12em] text-sub">
                {formatSponsorPackageDate(handoff.performance.signoff.signedOffAt)}
              </span>
            </div>
            <p className="mt-1 break-words text-[10px] leading-4 text-primary [overflow-wrap:anywhere]">
              {handoff.performance.signoff.note}
            </p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-white/[0.012] bg-white/[0.01] px-2.5 py-2">
          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-sub">
            Renewal signal: {handoff.performance.renewalSignal} / {handoff.performance.signoff.label}
          </span>
          <button
            type="button"
            disabled={performanceCopying}
            onClick={() =>
              onCopy(
                `performance-${handoff.packageId}`,
                performanceCopyText,
                "Sponsor performance update copied."
              )
            }
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/18 bg-primary/[0.07] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition enabled:hover:border-primary/34 enabled:hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={12} />
            {performanceCopying ? "Copying" : "Copy update"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-[14px] border border-white/[0.014] bg-black/18 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
              Activation brief
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">{handoff.nextAction}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!handoff.activationRun.canStage || activationRunSaving}
              onClick={() => onStageRun(handoff.packageId)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/24 bg-primary px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-black shadow-[0_14px_28px_rgba(186,255,59,0.16)] transition enabled:hover:shadow-[0_18px_36px_rgba(186,255,59,0.22)] disabled:cursor-not-allowed disabled:border-white/[0.018] disabled:bg-white/[0.04] disabled:text-sub disabled:shadow-none"
            >
              <Send size={12} />
              {activationRunSaving
                ? "Staging"
                : handoff.activationRun.state === "staged"
                  ? "Run staged"
                  : "Stage run"}
            </button>
            <button
              type="button"
              disabled={activationCopying}
              onClick={() =>
                onCopy(
                  `activation-${handoff.packageId}`,
                  copyText,
                  "Activation handoff copied."
                )
              }
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/18 bg-primary/[0.07] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary transition enabled:hover:border-primary/34 enabled:hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={12} />
              {activationCopying ? "Copying" : "Copy"}
            </button>
          </div>
        </div>
        <p className="mt-2 rounded-[11px] border border-white/[0.012] bg-white/[0.01] px-2.5 py-2 text-[10px] leading-4 text-sub">
          {handoff.activationRun.state === "staged"
            ? "Run state is saved on this sponsor package. Continue manually from the decision note and audit trail."
            : "Stage run writes a decision note and audit event only. It does not trigger billing, payouts, reward inventory or public launch."}
        </p>
      </div>
    </article>
  );
}

function SponsoredPackageStatusBoardPanel({
  read,
}: {
  read: ReturnType<typeof buildLootboxSponsoredPackageStatusBoard>;
}) {
  return (
    <OpsPanel
      eyebrow="Phase 2E-K"
      title="Sponsor intake board"
      description="A compact operator board for sponsor package status: ready packages, setup queue and blocked routes stay visible before any status write, billing or reward delivery exists."
      action={
        <OpsStatusPill tone={read.summary.readyToPitch > 0 ? "success" : "warning"}>
          {read.summary.readyToPitch} ready
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MiniRead label="Intake" value={`${read.summary.total}`} />
          <MiniRead label="Ready" value={`${read.summary.readyToPitch}`} />
          <MiniRead label="Setup" value={`${read.summary.setupQueue}`} />
          <MiniRead label="Blocked" value={`${read.summary.blocked}`} />
          <MiniRead label="Writes" value={read.summary.manualOnly ? "Manual only" : "Live"} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.052),rgba(8,10,15,0.9))] p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
                <Target size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  Next board focus
                </p>
                {read.focus ? (
                  <>
                    <h3 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                      {read.focus.title}
                    </h3>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sub">
                      {read.focus.columnId.replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-sub">{read.focus.detail}</p>
                  </>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-sub">
                    No sponsor package intake exists yet. Create a package brief first.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-1.5">
              {read.guardrails.map((guardrail) => (
                <div
                  key={guardrail}
                  className="flex items-start gap-2 rounded-[12px] border border-white/[0.014] bg-black/15 px-2.5 py-2"
                >
                  <ShieldCheck size={12} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-[10px] leading-4 text-sub">{guardrail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 xl:grid-cols-3">
            {read.columns.map((column) => (
              <SponsorStatusBoardColumn key={column.id} column={column} />
            ))}
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function SponsorStatusBoardColumn({
  column,
}: {
  column: LootboxSponsoredPackageStatusBoardColumn;
}) {
  return (
    <section className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${getStatusBoardColumnIconClass(
              column.id
            )}`}
          >
            {getStatusBoardColumnIcon(column.id)}
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              {column.label}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-sub">{column.detail}</p>
          </div>
        </div>
        <OpsStatusPill tone={getStatusBoardColumnTone(column.id)}>
          {column.items.length}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2">
        {column.items.length ? (
          column.items.slice(0, 4).map((item) => (
            <SponsorStatusBoardItem key={item.campaignId} item={item} />
          ))
        ) : (
          <div className="rounded-[14px] border border-white/[0.014] bg-black/15 px-2.5 py-3 text-[10px] leading-4 text-sub">
            No packages in this lane.
          </div>
        )}
      </div>
    </section>
  );
}

function SponsorStatusBoardItem({ item }: { item: LootboxSponsoredPackageStatusBoardItem }) {
  return (
    <Link
      href={item.routeHref}
      className="group block rounded-[14px] border border-white/[0.014] bg-black/15 px-2.5 py-2.5 transition hover:border-primary/22 hover:bg-primary/[0.025]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-sub">
            {item.projectName} / {item.packageTier}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[12px] font-black text-text">
            {item.campaignTitle}
          </h3>
        </div>
        <ArrowRight
          size={13}
          className="mt-0.5 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>
      <div className="mt-2 rounded-[10px] border border-white/[0.012] bg-white/[0.01] px-2 py-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-primary">
          {item.primaryAction}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-sub">{item.detail}</p>
      </div>
    </Link>
  );
}

function SponsoredPackagePersistencePanel({
  read,
}: {
  read: ReturnType<typeof buildLootboxSponsoredPackagePersistenceReadiness>;
}) {
  return (
    <OpsPanel
      eyebrow="Phase 2E-L"
      title="Sponsor persistence runway"
      description="The database foundation and API layer for sponsor package status, owner, notes and follow-up are now live behind super-admin controls."
      action={
        <OpsStatusPill tone={read.summary.liveWrites ? "success" : "warning"}>
          {read.summary.liveWrites ? "writes live" : "writes planned"}
        </OpsStatusPill>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <MiniRead label="Tables" value={`${read.summary.requiredTables}`} />
          <MiniRead label="Packages" value={`${read.summary.totalPackages}`} />
          <MiniRead label="Ready" value={`${read.summary.readyToPitch}`} />
          <MiniRead label="Setup pressure" value={`${read.summary.needsOperatorSetup}`} />
          <MiniRead label="Live writes" value={read.summary.liveWrites ? "On" : "Off"} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.052),rgba(8,10,15,0.9))] p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/[0.08] text-primary">
                <Save size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  Next persistence step
                </p>
                <h3 className="mt-2 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
                  APIs live, UI controls next
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-sub">{read.nextStep}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-1.5">
              {read.guardrails.map((guardrail) => (
                <div
                  key={guardrail}
                  className="flex items-start gap-2 rounded-[12px] border border-white/[0.014] bg-black/15 px-2.5 py-2"
                >
                  <ShieldCheck size={12} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-[10px] leading-4 text-sub">{guardrail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="grid gap-2 lg:grid-cols-2">
              {read.tables.map((table) => (
                <SponsorPersistenceTableCard key={table.name} table={table} />
              ))}
            </div>

            <div className="grid gap-2 lg:grid-cols-3">
              {read.writeGates.map((gate) => (
                <div
                  key={gate.label}
                  className="rounded-[16px] border border-white/[0.018] bg-white/[0.012] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                      {gate.label}
                    </p>
                    <OpsStatusPill tone="default">{gate.state}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-sub">{gate.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[16px] border border-white/[0.018] bg-black/15 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Persistence fields
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...read.fields.status, ...read.fields.noteTypes].map((field) => (
                  <span
                    key={field}
                    className="rounded-full border border-white/[0.018] bg-white/[0.012] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-sub"
                  >
                    {field.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function SponsorPersistenceTableCard({
  table,
}: {
  table: LootboxSponsoredPackagePersistenceTable;
}) {
  return (
    <article className="rounded-[18px] border border-white/[0.018] bg-white/[0.012] p-3">
      <div className="flex items-start gap-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
          <FileText size={13} />
        </span>
        <div className="min-w-0">
          <p className="break-words text-[12px] font-black text-text [overflow-wrap:anywhere]">
            {table.name}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-sub">{table.purpose}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {table.primaryFields.map((field) => (
          <span
            key={field}
            className="rounded-full border border-primary/12 bg-primary/[0.035] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-primary/90"
          >
            {field}
          </span>
        ))}
      </div>
    </article>
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
  noteSavingId,
  noteMessage,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onInventoryStatusChange,
  onInventoryNoteAdd,
}: {
  activity: LootboxActivityRead | null;
  loading: boolean;
  actionSavingId: string | null;
  message: PoolSaveMessage;
  noteSavingId: string | null;
  noteMessage: PoolSaveMessage;
  filter: LootboxInventoryCommandFilter;
  search: string;
  onFilterChange: (filter: LootboxInventoryCommandFilter) => void;
  onSearchChange: (search: string) => void;
  onInventoryStatusChange: (id: string, status: LootboxInventoryStatus) => void;
  onInventoryNoteAdd: (id: string, note: string, reference: string) => Promise<boolean>;
}) {
  const rows = useMemo(() => activity?.inventoryTable ?? [], [activity?.inventoryTable]);
  const counts = useMemo(() => buildLootboxInventoryCommandCounts(rows), [rows]);
  const fulfillmentRunway = useMemo(
    () => buildLootboxFulfillmentRunway(rows.map(toFulfillmentPolicyInput)),
    [rows]
  );
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

        <FulfillmentRunwayPanel runway={fulfillmentRunway} />

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
            noteSaving={selectedInventoryRow ? noteSavingId === selectedInventoryRow.id : false}
            noteMessage={noteMessage}
            onStatusChange={onInventoryStatusChange}
            onNoteAdd={onInventoryNoteAdd}
          />
        </div>

        {message ? <PoolSaveNotice message={message} /> : null}
      </div>
    </OpsPanel>
  );
}

function FulfillmentRunwayPanel({
  runway,
}: {
  runway: ReturnType<typeof buildLootboxFulfillmentRunway>;
}) {
  return (
    <div className="rounded-[18px] border border-primary/14 bg-[linear-gradient(180deg,rgba(186,255,59,0.045),rgba(8,10,15,0.76))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Fulfillment runway
          </p>
          <h3 className="mt-1.5 break-words text-[14px] font-black text-text [overflow-wrap:anywhere]">
            Reward delivery stays gated before money-like outcomes move
          </h3>
          <p className="mt-2 max-w-3xl text-[11px] leading-5 text-sub">
            Operators can separate platform perks, season access, sponsored rewards and treasury
            rewards before choosing the next manual action.
          </p>
        </div>
        <OpsStatusPill tone={runway.summary.locked > 0 ? "warning" : "success"}>
          {runway.summary.claimable} claimable
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MiniRead label="Review queue" value={`${runway.summary.pendingReview}`} />
        <MiniRead label="Locked" value={`${runway.summary.locked}`} />
        <MiniRead label="High risk" value={`${runway.summary.highRisk}`} />
        <MiniRead label="Focus" value={runway.recommendedFocus.shortLabel} />
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-4">
        {runway.lanes.map((lane) => (
          <FulfillmentLaneCard
            key={lane.id}
            lane={lane}
            focused={lane.id === runway.recommendedFocus.id}
          />
        ))}
      </div>
    </div>
  );
}

function FulfillmentLaneCard({
  lane,
  focused,
}: {
  lane: ReturnType<typeof buildLootboxFulfillmentRunway>["lanes"][number];
  focused: boolean;
}) {
  return (
    <article
      className={`rounded-[15px] border p-3 ${
        focused
          ? "border-primary/18 bg-primary/[0.055]"
          : "border-white/[0.018] bg-black/15"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.026] bg-black/20 text-primary">
          {getFulfillmentLaneIcon(lane.id)}
        </span>
        <OpsStatusPill tone={getFulfillmentRiskTone(lane.risk)}>
          {lane.risk} risk
        </OpsStatusPill>
      </div>
      <h3 className="mt-3 break-words text-[12px] font-black text-text [overflow-wrap:anywhere]">
        {lane.label}
      </h3>
      <p className="mt-1.5 text-[10px] leading-4 text-sub">{lane.gateLabel}</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <MiniRead label="Items" value={`${lane.count}`} />
        <MiniRead label="Review" value={`${lane.pendingReview}`} />
        <MiniRead label="Locked" value={`${lane.locked}`} />
      </div>
    </article>
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
  const policy = getLootboxFulfillmentPolicyForRow(toFulfillmentPolicyInput(row));

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
          <span
            className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${getFulfillmentPolicyPillClass(policy)}`}
          >
            {policy.shortLabel}
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
          lockedClaim={policy.deliveryMode === "locked"}
        />
      </div>
    </div>
  );
}

function InventoryFulfillmentDetail({
  row,
  saving,
  noteSaving,
  noteMessage,
  onStatusChange,
  onNoteAdd,
}: {
  row: LootboxActivityRead["inventoryTable"][number] | null;
  saving: boolean;
  noteSaving: boolean;
  noteMessage: PoolSaveMessage;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
  onNoteAdd: (id: string, note: string, reference: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const policy = row ? getLootboxFulfillmentPolicyForRow(toFulfillmentPolicyInput(row)) : null;

  useEffect(() => {
    setNote("");
    setReference("");
  }, [row?.id]);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row || noteSaving || !note.trim()) {
      return;
    }

    const saved = await onNoteAdd(row.id, note, reference);
    if (saved) {
      setNote("");
      setReference("");
    }
  }

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
        <MiniRead label="Audit events" value={`${row.auditCount}`} />
        <MiniRead label="Created" value={formatActivityDate(row.createdAt)} />
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

      {policy ? <FulfillmentPolicyCard policy={policy} /> : null}

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History size={14} className="text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Audit trail
            </p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
            {row.auditCount} events
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {row.auditTrail.length ? (
            row.auditTrail.map((event) => (
              <div
                key={event.id}
                className="rounded-[13px] border border-white/[0.014] bg-white/[0.01] px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-words text-[11px] font-semibold text-text [overflow-wrap:anywhere]">
                    {event.summary}
                  </p>
                  <span className="text-[9px] text-sub">
                    {formatActivityDate(event.createdAt)}
                  </span>
                </div>
                {event.note ? (
                  <p className="mt-2 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
                    {event.note}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/[0.018] bg-white/[0.012] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-sub">
                    {event.actorLabel}
                  </span>
                  {event.previousStatus !== "unknown" || event.nextStatus !== "unknown" ? (
                    <span className="rounded-full border border-white/[0.018] bg-black/20 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-sub">
                      {event.previousStatus} to {event.nextStatus}
                    </span>
                  ) : null}
                  {event.reference ? (
                    <span className="break-words rounded-full border border-primary/16 bg-primary/[0.045] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-primary [overflow-wrap:anywhere]">
                      Ref {event.reference}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] leading-5 text-sub">
              No audit events recorded for this reward yet. The next status action will create
              the first visible audit entry.
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={submitNote}
        className="mt-3 rounded-[16px] border border-white/[0.018] bg-black/15 p-3"
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck size={14} className="text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            Operator note
          </p>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={700}
          rows={4}
          placeholder="Add a fulfillment note for this reward"
          className="mt-3 min-h-[92px] w-full resize-none rounded-[14px] border border-white/[0.018] bg-white/[0.012] px-3 py-2 text-[11px] leading-5 text-text outline-none placeholder:text-sub/55 focus:border-primary/22"
          aria-label="Fulfillment note"
        />
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={140}
          placeholder="Optional reference"
          className="mt-2 w-full rounded-full border border-white/[0.018] bg-white/[0.012] px-3 py-2 text-[11px] font-semibold text-text outline-none placeholder:text-sub/55 focus:border-primary/22"
          aria-label="Fulfillment reference"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] text-sub">{note.length}/700</p>
          <button
            type="submit"
            disabled={noteSaving || !note.trim()}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              noteSaving || !note.trim()
                ? "cursor-not-allowed border border-white/[0.018] bg-white/[0.008] text-sub/45"
                : "border border-primary/24 bg-primary text-black shadow-[0_16px_34px_rgba(186,255,59,0.14)] hover:brightness-110"
            }`}
          >
            <Save size={13} />
            {noteSaving ? "Saving" : "Save note"}
          </button>
        </div>
        {noteMessage ? <div className="mt-3"><PoolSaveNotice message={noteMessage} /></div> : null}
      </form>

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
          lockedClaim={policy?.deliveryMode === "locked"}
        />
      </div>
    </div>
  );
}

function FulfillmentPolicyCard({ policy }: { policy: LootboxFulfillmentPolicy }) {
  return (
    <div className="mt-3 rounded-[16px] border border-white/[0.018] bg-black/15 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.026] bg-white/[0.018] text-primary">
            {getFulfillmentLaneIcon(policy.laneId)}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Lane policy
            </p>
            <h3 className="mt-1.5 break-words text-[12px] font-black text-text [overflow-wrap:anywhere]">
              {policy.label}
            </h3>
          </div>
        </div>
        <OpsStatusPill tone={getFulfillmentRiskTone(policy.risk)}>
          {policy.deliveryMode}
        </OpsStatusPill>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniRead label="Gate" value={policy.gateLabel} />
        <MiniRead label="Recommend" value={policy.recommendedStatus.replace(/_/g, " ")} />
      </div>

      <div className="mt-3 space-y-2">
        <OpsSnapshotRow label="Next step" value={policy.nextOperatorStep} />
        <OpsSnapshotRow label="Audit" value={policy.auditRequirement} />
      </div>

      {policy.deliveryMode === "locked" ? (
        <div className="mt-3 rounded-[13px] border border-amber-400/18 bg-amber-400/[0.055] px-3 py-2 text-[10px] font-semibold leading-5 text-amber-100">
          Claimed status is blocked from this console until treasury approval and payout controls
          are live.
        </div>
      ) : null}
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
  const policy = getLootboxFulfillmentPolicyForRow({
    id: item.id,
    itemType: item.itemType,
    rarity: item.rarity,
    status: item.status,
    label: item.label,
    payloadSummary: item.label,
  });

  return (
    <div className="rounded-[13px] border border-white/[0.016] bg-black/15 px-2.5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Crown size={13} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-sub">
              {item.itemType.replace(/_/g, " ")}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${getFulfillmentPolicyPillClass(policy)}`}
            >
              {policy.shortLabel}
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
        lockedClaim={policy.deliveryMode === "locked"}
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
  lockedClaim = false,
  compact = false,
}: {
  id: string;
  currentStatus: string;
  statuses: LootboxInventoryStatus[];
  saving: boolean;
  onStatusChange: (id: string, status: LootboxInventoryStatus) => void;
  lockedClaim?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-2" : ""}`}>
      {statuses.map((status) => {
        const disabled = saving || currentStatus === status || (lockedClaim && status === "claimed");

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange(id, status)}
            className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] transition ${
              disabled
                ? "cursor-not-allowed border-white/[0.012] bg-white/[0.008] text-sub/40"
                : "border-primary/16 bg-primary/[0.045] text-primary hover:border-primary/32 hover:bg-primary/[0.08]"
            }`}
          >
            {saving ? "Saving" : getShortInventoryActionLabel(status)}
          </button>
        );
      })}
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

function getSponsorPackageForPack(
  packages: SponsorPackageApiRow[],
  pack: LootboxSponsoredPackageActionPack
) {
  return (
    packages.find(
      (row) => row.campaign_id === pack.campaignId && row.package_tier === pack.packageTier
    ) ?? null
  );
}

function getSponsorPackageSnapshotText(
  row: { package_snapshot: Record<string, unknown> | null },
  key: string,
  fallback: string
) {
  const value = row.package_snapshot?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatSponsorPackageDate(value: string | null) {
  if (!value) {
    return "not set";
  }

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

function shortAuthUser(value: string) {
  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function toFulfillmentPolicyInput(
  row: LootboxInventoryCommandRow
): LootboxFulfillmentPolicyInput {
  return {
    id: row.id,
    itemType: row.itemType,
    rarity: row.rarity,
    status: row.status,
    label: row.label,
    payloadSummary: row.payloadSummary,
  };
}

function getFulfillmentLaneIcon(id: LootboxFulfillmentLaneId) {
  switch (id) {
    case "treasury_reward":
      return <ShieldCheck size={13} />;
    case "sponsored_reward":
      return <Gift size={13} />;
    case "season_access":
      return <Crown size={13} />;
    case "platform_utility":
    default:
      return <PackageOpen size={13} />;
  }
}

function getFulfillmentRiskTone(risk: LootboxFulfillmentRisk) {
  switch (risk) {
    case "low":
      return "success" as const;
    case "high":
      return "danger" as const;
    case "medium":
    default:
      return "warning" as const;
  }
}

function getFulfillmentPolicyPillClass(policy: LootboxFulfillmentPolicy) {
  switch (policy.risk) {
    case "low":
      return "border-emerald-300/18 bg-emerald-300/[0.055] text-emerald-100";
    case "high":
      return "border-rose-300/18 bg-rose-300/[0.055] text-rose-100";
    case "medium":
    default:
      return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  }
}

function getSponsoredSetupLaneIcon(lane: LootboxSponsoredRewardSetupLane) {
  switch (lane) {
    case "boosted_ready":
      return <BadgeCheck size={13} />;
    case "needs_budget":
      return <Gift size={13} />;
    case "needs_shard_pool":
      return <RadioTower size={13} />;
    case "locked_visibility":
    default:
      return <PauseCircle size={13} />;
  }
}

function getSponsoredSetupTone(readiness: LootboxSponsoredRewardSetupReadiness) {
  switch (readiness) {
    case "ready":
      return "success" as const;
    case "locked":
      return "default" as const;
    case "setup_needed":
    default:
      return "warning" as const;
  }
}

function getPackageBriefIcon(status: LootboxSponsoredPackageStatus) {
  switch (status) {
    case "pitch_ready":
      return <Sparkles size={13} />;
    case "prep_needed":
      return <SlidersHorizontal size={13} />;
    case "locked":
    default:
      return <ShieldCheck size={13} />;
  }
}

function getPackageBriefStatusTone(status: LootboxSponsoredPackageStatus) {
  switch (status) {
    case "pitch_ready":
      return "success" as const;
    case "locked":
      return "default" as const;
    case "prep_needed":
    default:
      return "warning" as const;
  }
}

function getPackageTierTone(tier: LootboxSponsoredPackageTier) {
  switch (tier) {
    case "premium":
      return "success" as const;
    case "standard":
      return "warning" as const;
    case "starter":
    default:
      return "default" as const;
  }
}

function getPackageActionStateTone(state: LootboxSponsoredPackageActionState) {
  switch (state) {
    case "ready":
      return "success" as const;
    case "prep":
      return "warning" as const;
    case "locked":
    default:
      return "default" as const;
  }
}

function getSponsorPackageStatusTone(status: string | null) {
  switch (status) {
    case "ready_to_pitch":
    case "won":
      return "success" as const;
    case "pitched":
    case "negotiating":
      return "warning" as const;
    case "lost":
    case "blocked":
      return "danger" as const;
    case "archived":
    case "draft":
    default:
      return "default" as const;
  }
}

function getTimelineToneClass(tone: LootboxSponsorPackageTimelineItem["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-100";
    case "warning":
      return "border-amber-300/16 bg-amber-300/[0.055] text-amber-100";
    case "danger":
      return "border-rose-300/16 bg-rose-300/[0.055] text-rose-100";
    case "default":
    default:
      return "border-white/[0.018] bg-white/[0.012] text-sub";
  }
}

function getSponsorCrmStageClass(state: "complete" | "current" | "upcoming") {
  switch (state) {
    case "complete":
      return "border-emerald-300/18 bg-emerald-300/[0.055] text-emerald-100";
    case "current":
      return "border-primary/24 bg-primary/[0.08] text-primary shadow-[0_14px_34px_rgba(186,255,59,0.08)]";
    case "upcoming":
    default:
      return "border-white/[0.018] bg-white/[0.012] text-sub";
  }
}

function getSponsorCrmChecklistClass(state: "ready" | "missing") {
  switch (state) {
    case "ready":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "missing":
    default:
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
  }
}

function getSponsorActivationChecklistClass(state: "ready" | "missing" | "locked") {
  switch (state) {
    case "ready":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "locked":
      return "border-white/[0.018] bg-white/[0.012] text-sub";
    case "missing":
    default:
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
  }
}

function getSponsorActivationExecutionStepClass(
  state: SponsorActivationHandoff["execution"]["steps"][number]["state"]
) {
  switch (state) {
    case "ready":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "blocked":
      return "border-white/[0.018] bg-white/[0.012] text-sub";
    case "action_needed":
    default:
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
  }
}

function getSponsorPerformanceTone(state: SponsorActivationHandoff["performance"]["state"]) {
  switch (state) {
    case "report_ready":
      return "success" as const;
    case "warming_up":
    case "setup_needed":
      return "warning" as const;
    case "closed":
    default:
      return "default" as const;
  }
}

function getSponsorPerformanceKpiClass(
  tone: SponsorActivationHandoff["performance"]["kpis"][number]["tone"]
) {
  switch (tone) {
    case "success":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "warning":
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
    case "default":
    default:
      return "border-white/[0.018] bg-white/[0.012] text-sub";
  }
}

function getSponsorRenewalTone(state: SponsorActivationHandoff["renewal"]["state"]) {
  switch (state) {
    case "ready":
      return "success" as const;
    case "watch":
    case "not_ready":
      return "warning" as const;
    case "closed":
    default:
      return "default" as const;
  }
}

function getSponsorBusinessPriorityTone(priority: SponsorBusinessCockpitItem["priority"]) {
  switch (priority) {
    case "high":
      return "warning" as const;
    case "medium":
      return "success" as const;
    case "watch":
    default:
      return "default" as const;
  }
}

function getSponsorBusinessPriorityClass(priority: SponsorBusinessCockpitItem["priority"]) {
  switch (priority) {
    case "high":
      return "border-primary/18 bg-primary/[0.055] text-primary";
    case "medium":
      return "border-emerald-300/14 bg-emerald-300/[0.045] text-emerald-100";
    case "watch":
    default:
      return "border-white/[0.016] bg-white/[0.012] text-sub";
  }
}

function formatSponsorBusinessValue(value: number) {
  return `USD ${Math.max(0, value).toLocaleString("en-US")}`;
}

function formatSponsorRevenueLaneValue(lane: SponsorRevenueCommandLane) {
  if (lane.id === "close_pack") {
    return `${lane.value.toLocaleString("en-US")} blocks`;
  }

  return formatSponsorBusinessValue(lane.value);
}

function getSponsorBillingReadinessTone(readiness: SponsorBillingReadinessItem["readiness"]) {
  switch (readiness) {
    case "invoice_ready":
      return "success" as const;
    case "needs_setup":
      return "warning" as const;
    case "closed":
    case "payment_watch":
    default:
      return "default" as const;
  }
}

function getSponsorBillingPriorityTone(priority: SponsorBillingReadinessItem["priority"]) {
  switch (priority) {
    case "high":
      return "success" as const;
    case "medium":
      return "warning" as const;
    case "watch":
    default:
      return "default" as const;
  }
}

function getSponsorBillingReadinessClass(readiness: SponsorBillingReadinessItem["readiness"]) {
  switch (readiness) {
    case "invoice_ready":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "needs_setup":
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
    case "closed":
      return "border-white/[0.014] bg-white/[0.008] text-sub";
    case "payment_watch":
    default:
      return "border-sky-300/12 bg-sky-300/[0.035] text-sky-100";
  }
}

function getSponsorDealCloseStateTone(state: SponsorDealClosePackItem["state"]) {
  switch (state) {
    case "ready":
      return "success" as const;
    case "needs_setup":
      return "warning" as const;
    case "closed":
    case "watch":
    default:
      return "default" as const;
  }
}

function getSponsorDealCloseStateClass(state: SponsorDealClosePackItem["state"]) {
  switch (state) {
    case "ready":
      return "border-primary/18 bg-primary/[0.055] text-primary";
    case "needs_setup":
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
    case "closed":
      return "border-white/[0.014] bg-white/[0.008] text-sub";
    case "watch":
    default:
      return "border-sky-300/12 bg-sky-300/[0.035] text-sky-100";
  }
}

function getSponsorFollowUpTimelineTone(state: SponsorFollowUpTimelineItem["state"]) {
  switch (state) {
    case "ready":
    case "proof":
      return "success" as const;
    case "overdue":
      return "danger" as const;
    case "due_soon":
    case "setup_needed":
      return "warning" as const;
    case "scheduled":
    default:
      return "default" as const;
  }
}

function getSponsorFollowUpTimelineClass(state: SponsorFollowUpTimelineItem["state"]) {
  switch (state) {
    case "ready":
      return "border-primary/18 bg-primary/[0.055] text-primary";
    case "proof":
      return "border-emerald-300/16 bg-emerald-300/[0.045] text-emerald-100";
    case "overdue":
      return "border-rose-300/16 bg-rose-300/[0.045] text-rose-100";
    case "due_soon":
    case "setup_needed":
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
    case "scheduled":
    default:
      return "border-sky-300/12 bg-sky-300/[0.035] text-sky-100";
  }
}

function getSponsorRenewalShellClass(state: SponsorActivationHandoff["renewal"]["state"]) {
  switch (state) {
    case "ready":
      return "border-primary/18 bg-[radial-gradient(circle_at_92%_8%,rgba(186,255,59,0.12),transparent_26%),rgba(186,255,59,0.035)]";
    case "watch":
      return "border-sky-300/12 bg-sky-300/[0.035]";
    case "not_ready":
      return "border-amber-300/12 bg-amber-300/[0.025]";
    case "closed":
    default:
      return "border-white/[0.014] bg-black/18";
  }
}

function getSponsorRenewalPlaybookClass(
  state: SponsorActivationHandoff["renewal"]["playbook"][number]["state"]
) {
  switch (state) {
    case "ready":
      return "border-emerald-300/16 bg-emerald-300/[0.05] text-emerald-100";
    case "action_needed":
      return "border-amber-300/16 bg-amber-300/[0.045] text-amber-100";
    case "blocked":
    default:
      return "border-white/[0.018] bg-white/[0.012] text-sub";
  }
}

function canUseSponsorCrmStageControl({
  stageStatus,
  currentStatus,
  controls,
}: {
  stageStatus: LootboxSponsorPackageStatus;
  currentStatus: string | null;
  controls: ReturnType<typeof buildLootboxSponsorPackageCrmRead>["controls"];
}) {
  if (stageStatus === currentStatus) {
    return false;
  }

  if (stageStatus === "lost") {
    return true;
  }

  return controls.canProgress && controls.nextStatus === stageStatus;
}

function getPackageActionIcon(action: LootboxSponsoredPackageOperatorAction) {
  switch (action.id) {
    case "copy_sponsor_brief":
      return <Copy size={12} />;
    case "copy_audit_note":
      return <ClipboardCheck size={12} />;
    case "share_packet":
      return <Send size={12} />;
    case "open_campaign":
      return action.state === "locked" ? <Lock size={12} /> : <ArrowRight size={12} />;
    default:
      return <FileText size={12} />;
  }
}

function getPackageActionBorderClass(state: LootboxSponsoredPackageActionState) {
  switch (state) {
    case "ready":
      return "border-emerald-300/14 bg-emerald-300/[0.032]";
    case "prep":
      return "border-primary/16 bg-primary/[0.04]";
    case "locked":
    default:
      return "border-white/[0.018] bg-white/[0.012]";
  }
}

function getStatusBoardColumnTone(id: LootboxSponsoredPackageStatusBoardColumnId) {
  switch (id) {
    case "ready_to_pitch":
      return "success" as const;
    case "setup_queue":
      return "warning" as const;
    case "blocked":
    default:
      return "default" as const;
  }
}

function getStatusBoardColumnIcon(id: LootboxSponsoredPackageStatusBoardColumnId) {
  switch (id) {
    case "ready_to_pitch":
      return <Send size={13} />;
    case "setup_queue":
      return <SlidersHorizontal size={13} />;
    case "blocked":
    default:
      return <Lock size={13} />;
  }
}

function getStatusBoardColumnIconClass(id: LootboxSponsoredPackageStatusBoardColumnId) {
  switch (id) {
    case "ready_to_pitch":
      return "border-emerald-300/16 bg-emerald-300/[0.055] text-emerald-200";
    case "setup_queue":
      return "border-amber-300/16 bg-amber-300/[0.055] text-amber-200";
    case "blocked":
    default:
      return "border-white/[0.022] bg-white/[0.012] text-white/45";
  }
}

function getRewardLaneIcon(id: LootboxRewardOpsLane["id"]) {
  switch (id) {
    case "season_access":
      return <ShieldCheck size={13} />;
    case "member_pass":
      return <Crown size={13} />;
    case "sponsored_reward":
      return <Gift size={13} />;
    case "usdc_reward":
    default:
      return <BadgeCheck size={13} />;
  }
}

function getRewardRiskTone(risk: LootboxRewardOpsLaneRisk) {
  switch (risk) {
    case "low":
      return "success" as const;
    case "high":
      return "danger" as const;
    case "medium":
    default:
      return "warning" as const;
  }
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
