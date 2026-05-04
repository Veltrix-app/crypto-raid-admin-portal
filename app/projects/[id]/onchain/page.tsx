"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  FileWarning,
  KeyRound,
  Layers3,
  ScanLine,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import OnchainCaseTimeline from "@/components/onchain/OnchainCaseTimeline";
import OnchainHealthPanel from "@/components/onchain/OnchainHealthPanel";
import ProjectOnchainCaseDetailPanel from "@/components/onchain/ProjectOnchainCaseDetailPanel";
import ProjectOnchainCasesPanel from "@/components/onchain/ProjectOnchainCasesPanel";
import ProjectOnchainPermissionsPanel from "@/components/onchain/ProjectOnchainPermissionsPanel";
import type {
  OnchainCaseDetailRecord,
  OnchainCaseListRow,
  OnchainCaseTimelineEventRecord,
  ProjectOnchainAccessSummary,
} from "@/components/onchain/types";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import type { OnchainCaseAction } from "@/lib/onchain/onchain-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ProjectWallet = {
  id: string;
  chain: string;
  wallet_address: string;
  label: string;
  wallet_type: string;
  is_active: boolean;
};

type ProjectAsset = {
  id: string;
  chain: string;
  contract_address: string;
  asset_type: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

type ProjectOnchainCaseDetailPayload = OnchainCaseDetailRecord & {
  events: OnchainCaseTimelineEventRecord[];
};

type ProjectOnchainCommandDeckProps = {
  projectName: string;
  loadingConfig: boolean;
  loadingCases: boolean;
  caseCount: number;
  openCaseCount: number;
  criticalCaseCount: number;
  signalCaseCount: number;
  retryQueuedCount: number;
  walletCount: number;
  activeWalletCount: number;
  assetCount: number;
  activeAssetCount: number;
  summaryOnly: boolean;
  canManagePermissions: boolean;
  canTriggerRescan: boolean;
  visibilityPermissionCount: number;
  actionPermissionCount: number;
};

function ProjectOnchainCommandDeck({
  projectName,
  loadingConfig,
  loadingCases,
  caseCount,
  openCaseCount,
  criticalCaseCount,
  signalCaseCount,
  retryQueuedCount,
  walletCount,
  activeWalletCount,
  assetCount,
  activeAssetCount,
  summaryOnly,
  canManagePermissions,
  canTriggerRescan,
  visibilityPermissionCount,
  actionPermissionCount,
}: ProjectOnchainCommandDeckProps) {
  const loading = loadingConfig || loadingCases;
  const nextDecision = loading
    ? "Loading on-chain posture"
    : summaryOnly
      ? "Ask owner for on-chain access"
      : criticalCaseCount > 0
        ? "Review high-risk on-chain case"
        : signalCaseCount > 0
          ? "Classify signal cases"
          : walletCount === 0 || assetCount === 0
            ? "Register wallets and assets"
            : retryQueuedCount > 0
              ? "Review retry queue"
              : openCaseCount > 0
                ? "Work open on-chain queue"
                : "On-chain rail is ready";
  const readinessScore = Math.min(
    100,
    [
      !loading,
      !summaryOnly,
      activeWalletCount > 0,
      activeAssetCount > 0,
      criticalCaseCount === 0,
    ].filter(Boolean).length * 20
  );

  const routes = [
    {
      href: "#onchain-queue",
      label: "Case queue",
      title: "Inspect blockers",
      body: "Use this when wallets, contracts or enrichment signals need project follow-through.",
      signal: `${openCaseCount} open / ${caseCount} total`,
      icon: FileWarning,
      primary: !summaryOnly && openCaseCount > 0,
    },
    {
      href: "#onchain-registry",
      label: "Registry",
      title: "Check wallets and assets",
      body: "Confirm the tracked wallets and contracts before running project-safe sync actions.",
      signal: `${activeWalletCount} wallets / ${activeAssetCount} assets`,
      icon: WalletCards,
      primary: !summaryOnly && (walletCount === 0 || assetCount === 0),
    },
    {
      href: "#onchain-access",
      label: "Owner grants",
      title: "Set on-chain visibility",
      body: "Owners can grant case visibility and safe recovery actions to trusted teammates.",
      signal: canManagePermissions ? "owner controls" : "view access",
      icon: KeyRound,
      primary: summaryOnly || canManagePermissions,
    },
    {
      href: "#onchain-sync",
      label: "Provider sync",
      title: "Rerun safe sync",
      body: "Use this after the registry is readable and a granted role may refresh provider data.",
      signal: canTriggerRescan ? "sync allowed" : "view only",
      icon: Layers3,
      primary: !summaryOnly && (retryQueuedCount > 0 || canTriggerRescan),
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(186,255,59,0.074),transparent_28%),radial-gradient(circle_at_86%_8%,rgba(74,217,255,0.05),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(6,8,13,0.96))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.011)_1px,transparent_1px)] bg-[length:58px_58px] opacity-[0.25]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div className="min-w-0 rounded-[18px] border border-white/[0.022] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/[0.16] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              <ScanLine size={12} />
              On-chain command
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              <BadgeCheck size={12} className="text-primary" />
              {projectName}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.35fr)] lg:items-end">
            <div className="min-w-0">
              <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Keep wallets, assets and recovery actions readable.
              </h2>
              <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
                One project-safe surface for tracked wallets, contract registry, signal cases
                and bounded on-chain recovery actions.
              </p>
            </div>

            <div className="rounded-[16px] border border-primary/[0.1] bg-primary/[0.035] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                    Next decision
                  </p>
                  <p className="mt-1.5 text-[0.9rem] font-semibold tracking-[-0.02em] text-text">
                    {nextDecision}
                  </p>
                </div>
                <ShieldCheck size={17} className="shrink-0 text-primary" />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.35)]"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <OnchainBoardSignal
              icon={<FileWarning size={14} />}
              label="Open cases"
              value={openCaseCount}
              sub={`${criticalCaseCount} high`}
            />
            <OnchainBoardSignal
              icon={<WalletCards size={14} />}
              label="Wallets"
              value={`${activeWalletCount}/${walletCount}`}
              sub="active"
            />
            <OnchainBoardSignal
              icon={<Layers3 size={14} />}
              label="Assets"
              value={`${activeAssetCount}/${assetCount}`}
              sub={`${signalCaseCount} signals`}
            />
            <OnchainBoardSignal
              icon={<KeyRound size={14} />}
              label="Actions"
              value={actionPermissionCount}
              sub={`${visibilityPermissionCount} views`}
            />
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                On-chain route
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                Choose the surface that matches the on-chain blocker.
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-primary" />
          </div>

          <div className="grid gap-2">
            {routes.map((route) => {
              const Icon = route.icon;

              return (
                <Link
                  key={route.label}
                  href={route.href}
                  className={`group rounded-[15px] border p-3 transition-all duration-200 hover:-translate-y-0.5 ${
                    route.primary
                      ? "border-primary/[0.16] bg-primary/[0.055]"
                      : "border-white/[0.022] bg-black/20 hover:border-white/[0.06] hover:bg-white/[0.026]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.025] bg-white/[0.025] text-primary">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-primary">
                        {route.label}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-text">{route.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-sub">
                        {route.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sub">
                        <span>{route.signal}</span>
                        <span className="text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                          Open
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function OnchainBoardSignal({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-white/[0.012] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-sub">
          {label}
        </p>
        <span className="shrink-0 text-primary">{icon}</span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
          {value}
        </p>
        <p className="truncate text-[10px] font-semibold text-sub">{sub}</p>
      </div>
    </div>
  );
}

function mapProjectActionPermissionsToActions(permissions: string[]): OnchainCaseAction[] {
  const actions: OnchainCaseAction[] = [];
  if (permissions.includes("annotate_case")) actions.push("annotate");
  if (permissions.includes("escalate_case")) actions.push("escalate");
  if (permissions.includes("retry_project_case")) actions.push("retry");
  if (permissions.includes("rerun_project_enrichment")) actions.push("rerun_enrichment");
  if (permissions.includes("rescan_project_assets")) actions.push("rescan_assets");
  if (permissions.includes("resolve_project_blocker")) actions.push("resolve");
  return actions;
}

export default function ProjectOnchainPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const project = getProjectById(params.id);

  const [wallets, setWallets] = useState<ProjectWallet[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [notice, setNotice] = useState("");
  const [runningSync, setRunningSync] = useState(false);

  const [onchainCases, setOnchainCases] = useState<OnchainCaseListRow[]>([]);
  const [onchainAccess, setOnchainAccess] = useState<ProjectOnchainAccessSummary | null>(null);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [onchainCaseDetail, setOnchainCaseDetail] = useState<ProjectOnchainCaseDetailPayload | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  const hasProjectAccess =
    role === "super_admin" || memberships.some((item) => item.projectId === project?.id);

  async function loadConfig() {
    if (!project?.id) {
      return;
    }

    try {
      setLoadingConfig(true);
      setNotice("");
      const [walletResponse, assetResponse] = await Promise.all([
        fetch(`/api/projects/${project.id}/wallets`, { cache: "no-store" }),
        fetch(`/api/projects/${project.id}/assets`, { cache: "no-store" }),
      ]);
      const [walletPayload, assetPayload] = await Promise.all([
        walletResponse.json().catch(() => null),
        assetResponse.json().catch(() => null),
      ]);

      if (walletResponse.ok && walletPayload?.ok && Array.isArray(walletPayload.wallets)) {
        setWallets(walletPayload.wallets);
      }
      if (assetResponse.ok && assetPayload?.ok && Array.isArray(assetPayload.assets)) {
        setAssets(assetPayload.assets);
      }
      if (!walletResponse.ok || !assetResponse.ok) {
        setNotice("Some on-chain configuration could not be loaded.");
      }
    } finally {
      setLoadingConfig(false);
    }
  }

  async function loadOnchainCases(preserveSelection = true) {
    if (!project?.id) {
      return;
    }

    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch(`/api/projects/${project.id}/onchain-cases`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load project on-chain cases.");
      }

      const rows = (payload.cases ?? []) as OnchainCaseListRow[];
      setOnchainCases(rows);
      setOnchainAccess((payload.access ?? null) as ProjectOnchainAccessSummary | null);
      setSummaryOnly(Boolean(payload.summaryOnly));
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setOnchainCases([]);
      setSelectedCaseId(null);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load project on-chain cases."
      );
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadConfig(), loadOnchainCases(false)]);
  }, [project?.id]);

  useEffect(() => {
    let active = true;

    async function loadOnchainCaseDetail() {
      if (!project?.id || !selectedCaseId || summaryOnly) {
        setOnchainCaseDetail(null);
        return;
      }

      try {
        setLoadingDetail(true);
        const response = await fetch(
          `/api/projects/${project.id}/onchain-cases/${selectedCaseId}`,
          { cache: "no-store" }
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load project on-chain case detail.");
        }

        if (!active) {
          return;
        }

        setOnchainCaseDetail((payload.onchainCase ?? null) as ProjectOnchainCaseDetailPayload | null);
      } catch (error) {
        if (!active) {
          return;
        }

        setOnchainCaseDetail(null);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load project on-chain case detail."
        );
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadOnchainCaseDetail();

    return () => {
      active = false;
    };
  }, [project?.id, selectedCaseId, summaryOnly]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This on-chain workspace could not be resolved from the current project state."
        />
      </AdminShell>
    );
  }

  if (!hasProjectAccess) {
    return (
      <AdminShell>
        <NotFoundState
          title="On-chain access is project-scoped"
          description="Only members of this project can open this on-chain workspace."
        />
      </AdminShell>
    );
  }

  const walletColumns: OpsTableColumn<ProjectWallet>[] = [
    {
      key: "wallet",
      label: "Wallet",
      render: (wallet) => (
        <div>
          <p className="font-semibold text-text">{wallet.label || wallet.wallet_type}</p>
          <p className="mt-1 break-all text-xs text-sub">{wallet.wallet_address}</p>
        </div>
      ),
    },
    {
      key: "chain",
      label: "Chain",
      render: (wallet) => wallet.chain,
    },
    {
      key: "type",
      label: "Type",
      render: (wallet) => wallet.wallet_type,
    },
    {
      key: "status",
      label: "Status",
      render: (wallet) => (
        <OpsStatusPill tone={wallet.is_active ? "success" : "warning"}>
          {wallet.is_active ? "active" : "paused"}
        </OpsStatusPill>
      ),
    },
  ];

  const assetColumns: OpsTableColumn<ProjectAsset>[] = [
    {
      key: "asset",
      label: "Asset",
      render: (asset) => (
        <div>
          <p className="font-semibold text-text">{asset.symbol || asset.asset_type}</p>
          <p className="mt-1 break-all text-xs text-sub">{asset.contract_address}</p>
        </div>
      ),
    },
    {
      key: "chain",
      label: "Chain",
      render: (asset) => asset.chain,
    },
    {
      key: "type",
      label: "Type",
      render: (asset) => asset.asset_type,
    },
    {
      key: "status",
      label: "Status",
      render: (asset) => (
        <OpsStatusPill tone={asset.is_active ? "success" : "warning"}>
          {asset.is_active ? "active" : "paused"}
        </OpsStatusPill>
      ),
    },
  ];

  const openCases = onchainCases.filter(
    (onchainCase) =>
      onchainCase.status === "open" ||
      onchainCase.status === "triaging" ||
      onchainCase.status === "blocked"
  );
  const criticalCases = onchainCases.filter(
    (onchainCase) => onchainCase.severity === "critical" || onchainCase.severity === "high"
  );
  const signalCases = onchainCases.filter((onchainCase) =>
    [
      "unmatched_project_asset",
      "unlinked_wallet_activity",
      "suspicious_onchain_pattern",
    ].includes(onchainCase.caseType)
  );
  const retryQueuedCases = onchainCases.filter(
    (onchainCase) => onchainCase.status === "retry_queued"
  );
  const canManagePermissions = Boolean(
    onchainAccess && (onchainAccess.isSuperAdmin || onchainAccess.membershipRole === "owner")
  );
  const availableProjectActions = mapProjectActionPermissionsToActions(
    onchainAccess?.actionPermissions ?? []
  );
  const canTriggerRescan = availableProjectActions.includes("rescan_assets");
  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);
  const activeWalletCount = wallets.filter((wallet) => wallet.is_active).length;
  const activeAssetCount = assets.filter((asset) => asset.is_active).length;

  async function handleProjectAction(action: OnchainCaseAction, notes: string) {
    if (!project?.id || !selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");
      const response = await fetch(
        `/api/projects/${project.id}/onchain-cases/${selectedCaseId}/actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, notes }),
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to apply project on-chain action.");
      }

      setOnchainCaseDetail((payload.onchainCase ?? null) as ProjectOnchainCaseDetailPayload | null);
      await loadOnchainCases();
      if (action === "rescan_assets") {
        await loadConfig();
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to apply project on-chain action."
      );
    } finally {
      setActionBusy(null);
    }
  }

  async function runProviderSync() {
    if (!project?.id || !canTriggerRescan) {
      return;
    }

    setRunningSync(true);
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${project.id}/onchain-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50, maxBlocks: 1500 }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not run provider sync.");
      }

      setNotice(
        `Provider sync scanned ${payload.syncedAssets ?? 0} assets and generated ${payload.generatedEvents ?? 0} normalized events.`
      );
      await Promise.all([loadConfig(), loadOnchainCases()]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not run provider sync.");
    } finally {
      setRunningSync(false);
    }
  }

  return (
    <AdminShell>
      <ProjectWorkspaceFrame
        projectId={project.id}
        projectName={project.name}
        projectChain={project.chain}
        healthPills={buildProjectWorkspaceHealthPills({
          project,
          campaignCount: projectCampaigns.length,
          questCount: projectQuests.length,
          rewardCount: projectRewards.length,
          operatorIncidentCount: openCases.length,
        })}
      >
        <ProjectOnchainCommandDeck
          projectName={project.name}
          loadingConfig={loadingConfig}
          loadingCases={loadingCases}
          caseCount={onchainCases.length}
          openCaseCount={openCases.length}
          criticalCaseCount={criticalCases.length}
          signalCaseCount={signalCases.length}
          retryQueuedCount={retryQueuedCases.length}
          walletCount={wallets.length}
          activeWalletCount={activeWalletCount}
          assetCount={assets.length}
          activeAssetCount={activeAssetCount}
          summaryOnly={summaryOnly}
          canManagePermissions={canManagePermissions}
          canTriggerRescan={canTriggerRescan}
          visibilityPermissionCount={onchainAccess?.visibilityPermissions.length ?? 1}
          actionPermissionCount={onchainAccess?.actionPermissions.length ?? 0}
        />

        <OnchainHealthPanel
          eyebrow="On-chain snapshot"
          title="Current posture"
          description="Compact counts for cases, signals and tracked assets after the command route."
          metrics={[
            { label: "Cases", value: onchainCases.length },
            {
              label: "Open",
              value: openCases.length,
              emphasis: openCases.length > 0 ? "warning" : "default",
            },
            {
              label: "Signal cases",
              value: signalCases.length,
              emphasis: signalCases.length > 0 ? "warning" : "default",
            },
            {
              label: "Tracked assets",
              value: activeAssetCount,
              emphasis: activeAssetCount > 0 ? "primary" : "default",
            },
          ]}
        />

        <div
          id="onchain-access"
          className="scroll-mt-24 grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start"
        >
          <OpsPanel
            eyebrow="Access posture"
            title="Current on-chain visibility"
            description="Owners decide what teammates can inspect and which recovery actions they may run."
          >
            <div className="flex flex-wrap gap-2">
              {(onchainAccess?.visibilityPermissions ?? ["onchain_summary"]).map((permission) => (
                <OpsStatusPill key={permission}>{permission.replace(/_/g, " ")}</OpsStatusPill>
              ))}
              {(onchainAccess?.actionPermissions ?? []).map((permission) => (
                <OpsStatusPill key={permission} tone="warning">
                  {permission.replace(/_/g, " ")}
                </OpsStatusPill>
              ))}
            </div>
            {summaryOnly ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                Summary-only mode is active. The owner can grant case visibility or project-safe on-chain actions when this teammate should help with recovery.
              </p>
            ) : null}
          </OpsPanel>

          <ProjectOnchainPermissionsPanel
            projectId={project.id}
            teamMembers={teamMembers}
            canManage={canManagePermissions}
          />
        </div>

        {loadError ? (
          <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/[0.055] px-5 py-5 text-sm text-rose-300">
            {loadError}
          </div>
        ) : null}

        <div
          id="onchain-queue"
          className="scroll-mt-24 grid gap-3 xl:items-start xl:grid-cols-[1.08fr_0.92fr]"
        >
          <ProjectOnchainCasesPanel
            rows={onchainCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={summaryOnly ? undefined : setSelectedCaseId}
            emptyState={
              summaryOnly
                ? "This role currently has summary-only on-chain access."
                : "No project-specific on-chain cases are active right now."
            }
          />

          <div className="grid gap-3">
            <ProjectOnchainCaseDetailPanel
              onchainCase={summaryOnly ? null : onchainCaseDetail}
              loading={loadingDetail}
              availableActions={availableProjectActions}
              actionBusy={actionBusy}
              onAction={handleProjectAction}
            />
            <OnchainCaseTimeline
              events={onchainCaseDetail?.events ?? []}
              loading={loadingDetail}
              emptyState={
                summaryOnly
                  ? "Resolution history is hidden until the owner grants that on-chain visibility."
                  : "No project-visible timeline events were recorded for this case yet."
              }
            />
          </div>
        </div>

        <div id="onchain-sync" className="scroll-mt-24">
          <OpsPanel
            eyebrow="Project-safe recovery"
            title="Wallets, assets and provider sync"
            description="Keep the registered wallets and tracked assets visible here, and let granted teammates rerun project-safe provider sync without leaving the project workspace."
            action={
              canTriggerRescan ? (
                <button
                  type="button"
                  onClick={() => void runProviderSync()}
                  disabled={runningSync}
                  className="rounded-[18px] bg-primary px-4 py-3 font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningSync ? "Running sync..." : "Run provider sync"}
                </button>
              ) : null
            }
          >
            <div className="grid gap-2.5 md:grid-cols-4">
              <OpsMetricCard label="Wallets" value={wallets.length} />
              <OpsMetricCard label="Assets" value={assets.length} />
              <OpsMetricCard label="Active wallets" value={activeWalletCount} emphasis="primary" />
              <OpsMetricCard
                label="Retry queued"
                value={retryQueuedCases.length}
                emphasis={retryQueuedCases.length > 0 ? "warning" : "default"}
              />
            </div>
            {notice ? <p className="mt-4 text-sm text-primary">{notice}</p> : null}
          </OpsPanel>
        </div>

        <div id="onchain-registry" className="scroll-mt-24 grid gap-3 xl:items-start xl:grid-cols-2">
          <OpsPanel
            eyebrow="Treasury and ops wallets"
            title="Registered wallets"
            description={
              loadingConfig
                ? "Loading wallet configuration..."
                : "Wallets that this project currently uses for treasury, staking or operator functions."
            }
          >
            <OpsTable
              columns={walletColumns}
              rows={wallets}
              getRowKey={(wallet) => wallet.id}
              emptyState="No wallets are registered for this project yet."
            />
          </OpsPanel>

          <OpsPanel
            eyebrow="Tracked contracts"
            title="Registered assets"
            description={
              loadingConfig
                ? "Loading asset configuration..."
                : "Assets that the on-chain scoring and intake layer can currently classify for this project."
            }
          >
            <OpsTable
              columns={assetColumns}
              rows={assets}
              getRowKey={(asset) => asset.id}
              emptyState="No on-chain assets are registered for this project yet."
            />
          </OpsPanel>
        </div>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
