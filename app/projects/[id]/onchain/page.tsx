"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
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

  const project = getProjectById(params.id);
  const [wallets, setWallets] = useState<ProjectWallet[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [runningSync, setRunningSync] = useState(false);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      if (!project?.id) return;
      setLoading(true);
      setNotice("");

      const [walletResponse, assetResponse] = await Promise.all([
        fetch(`/api/projects/${project.id}/wallets`, { cache: "no-store" }),
        fetch(`/api/projects/${project.id}/assets`, { cache: "no-store" }),
      ]);
      const [walletPayload, assetPayload] = await Promise.all([
        walletResponse.json().catch(() => null),
        assetResponse.json().catch(() => null),
      ]);

      if (!cancelled) {
        if (walletResponse.ok && walletPayload?.ok && Array.isArray(walletPayload.wallets)) {
          setWallets(walletPayload.wallets);
        }
        if (assetResponse.ok && assetPayload?.ok && Array.isArray(assetPayload.assets)) {
          setAssets(assetPayload.assets);
        }
        if (!walletResponse.ok || !assetResponse.ok) {
          setNotice("Some on-chain configuration could not be loaded.");
        }
        setLoading(false);
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

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

  const hasProjectAccess =
    role === "super_admin" || memberships.some((item) => item.projectId === project.id);

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

  async function runProviderSync() {
    if (!project?.id) return;

    setRunningSync(true);
    setNotice("");

    const response = await fetch(`/api/projects/${project.id}/onchain-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 50, maxBlocks: 1500 }),
    });

    const payload = await response.json().catch(() => null);
    setRunningSync(false);

    if (!response.ok || !payload?.ok) {
      setNotice(payload?.error || "Could not run provider sync.");
      return;
    }

    setNotice(
      `Provider sync scanned ${payload.syncedAssets ?? 0} assets and generated ${payload.generatedEvents ?? 0} normalized events.`
    );
  }

  return (
    <AdminShell>
      <ProjectWorkspaceFrame
        projectId={project.id}
        projectName={project.name}
        projectChain={project.chain}
        healthPills={buildProjectWorkspaceHealthPills({
          project,
          campaignCount: campaigns.filter((campaign) => campaign.projectId === project.id).length,
          questCount: quests.filter((quest) => quest.projectId === project.id).length,
          rewardCount: rewards.filter((reward) => reward.projectId === project.id).length,
          operatorIncidentCount: notice ? 1 : 0,
        })}
      >
        <OpsPanel
          eyebrow="On-chain rail"
          title="Project on-chain posture"
          description="Scan the registered wallets and assets here, then run provider sync without digging through the full project page."
          action={
            <button
              type="button"
              onClick={() => void runProviderSync()}
              disabled={runningSync}
              className="rounded-[18px] bg-primary px-4 py-3 font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningSync ? "Running sync..." : "Run provider sync"}
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="Wallets" value={wallets.length} />
            <OpsMetricCard label="Assets" value={assets.length} />
            <OpsMetricCard
              label="Active wallets"
              value={wallets.filter((wallet) => wallet.is_active).length}
              emphasis="primary"
            />
            <OpsMetricCard
              label="Active assets"
              value={assets.filter((asset) => asset.is_active).length}
              emphasis="primary"
            />
          </div>
          {notice ? <p className="mt-4 text-sm text-primary">{notice}</p> : null}
        </OpsPanel>

        <div className="grid gap-6 xl:grid-cols-2">
          <OpsPanel eyebrow="Treasury and ops wallets" title="Registered wallets" description={loading ? "Loading wallet configuration..." : "Wallets that this project currently uses for treasury, staking or operator functions."}>
            <OpsTable
              columns={walletColumns}
              rows={wallets}
              getRowKey={(wallet) => wallet.id}
              emptyState="No wallets are registered for this project yet."
            />
          </OpsPanel>

          <OpsPanel eyebrow="Tracked contracts" title="Registered assets" description={loading ? "Loading asset configuration..." : "Assets that the on-chain scoring and intake layer can currently classify for this project."}>
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
