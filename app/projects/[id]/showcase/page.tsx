"use client";

import { useEffect } from "react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import {
  OpsCommandCanvas,
  OpsCommandRead,
  OpsMetricCard,
  OpsPanel,
  OpsRouteCard,
  OpsRouteGrid,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import {
  buildAdminProjectShowcase,
  type AdminShowcaseControl,
  type AdminShowcaseControlGroup,
  type AdminShowcasePremiumModule,
  type AdminShowcaseProjectAsset,
  type AdminShowcaseScanSeverity,
  type AdminShowcaseStatus,
} from "@/lib/projects/project-showcase";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

function getStatusTone(status: AdminShowcaseStatus) {
  if (status === "live") return "success" as const;
  if (status === "ready") return "default" as const;
  return "warning" as const;
}

function getStatusLabel(status: AdminShowcaseStatus) {
  if (status === "live") return "Live";
  if (status === "ready") return "Ready";
  return "Missing";
}

function getControlGroupTitle(group: AdminShowcaseControlGroup) {
  return group === "market" ? "Market and safety" : "Public profile";
}

function getScanSeverityTone(severity: AdminShowcaseScanSeverity) {
  if (severity === "positive") return "success" as const;
  if (severity === "info") return "default" as const;
  return "warning" as const;
}

function getScanSeverityLabel(severity: AdminShowcaseScanSeverity) {
  if (severity === "positive") return "Pass";
  if (severity === "info") return "Info";
  if (severity === "danger") return "Risk";
  return "Watch";
}

function getScanRiskLabel(riskLevel: string) {
  if (riskLevel === "low") return "Low risk";
  if (riskLevel === "medium") return "Medium risk";
  if (riskLevel === "high") return "High risk";
  return "Unknown";
}

export default function ProjectShowcasePage() {
  const params = useParams<{ id: string }>();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [registryAssets, setRegistryAssets] = useState<AdminShowcaseProjectAsset[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryNotice, setRegistryNotice] = useState<string | null>(null);
  const memberships = useAdminAuthStore((s) => s.memberships);
  const role = useAdminAuthStore((s) => s.role);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const raids = useAdminPortalStore((s) => s.raids);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const project = getProjectById(params.id);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  useEffect(() => {
    if (!project?.id) {
      setRegistryAssets([]);
      return;
    }

    const currentProjectId = project.id;
    let cancelled = false;

    async function loadRegistryAssets() {
      setRegistryLoading(true);
      const response = await fetch(`/api/projects/${currentProjectId}/assets`);
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            assets?: AdminShowcaseProjectAsset[];
            error?: string;
          }
        | null;

      if (cancelled) return;
      setRegistryLoading(false);

      if (!response.ok || !payload?.ok || !Array.isArray(payload.assets)) {
        setRegistryNotice(payload?.error ?? "Could not load project token registry assets.");
        return;
      }

      setRegistryAssets(payload.assets);
    }

    void loadRegistryAssets().catch((error) => {
      if (!cancelled) {
        setRegistryLoading(false);
        setRegistryNotice(error instanceof Error ? error.message : "Could not load registry assets.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This showcase workspace could not be resolved from the current project state."
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
          title="Showcase access is project-scoped"
          description="Only members of this project can manage the public showcase."
        />
      </AdminShell>
    );
  }

  const showcase = buildAdminProjectShowcase({
    project,
    campaigns,
    quests,
    raids,
    rewards,
    assets: registryAssets,
  });
  const profileControls = showcase.controls.filter((control) => control.group === "profile");
  const marketControls = showcase.controls.filter((control) => control.group === "market");

  async function handleControlSubmit(
    control: AdminShowcaseControl,
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (!project) return;

    const formData = new FormData(event.currentTarget);
    const nextValue = String(formData.get(control.key) ?? "").trim();
    const projectInput = Object.fromEntries(
      Object.entries(project).filter(([key]) => key !== "id")
    ) as Omit<typeof project, "id">;

    setSavingKey(control.key);
    setSavedKey(null);
    setSaveError(null);

    try {
      await updateProject(project.id, {
        ...projectInput,
        [control.key]: nextValue,
      });
      setSavedKey(control.key);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save showcase field.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRegistrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;

    const formData = new FormData(event.currentTarget);
    const contractAddress = String(formData.get("contractAddress") ?? "").trim();
    const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
    const decimals = Number.parseInt(String(formData.get("decimals") ?? "18"), 10);
    const chain = String(formData.get("chain") ?? "base").trim().toLowerCase() || "base";
    const swapEnabled = formData.get("swapEnabled") === "on";
    const explorerSourceUrl =
      chain.includes("base") && contractAddress
        ? `https://basescan.org/address/${contractAddress}#code`
        : "";

    setSavingKey("registry");
    setSavedKey(null);
    setRegistryNotice(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chain,
          contractAddress,
          assetType: "token",
          symbol,
          decimals: Number.isInteger(decimals) ? decimals : 18,
          isActive: true,
          metadata: {
            label: `${project.name} Token`,
            swapEnabled,
            showcaseSwapEnabled: swapEnabled,
            priceSource: "dexscreener",
            priceId: `dexscreener:${chain}:${contractAddress.toLowerCase()}`,
            contractScan: {
              sourceVerified: formData.get("sourceVerified") === "on",
              abiAvailable: formData.get("abiAvailable") === "on",
              proxyDetected: formData.get("proxyDetected") === "on",
              ownerRenounced: formData.get("ownerRenounced") === "on",
              auditUrl: String(formData.get("auditUrl") ?? "").trim(),
              explorerSourceUrl,
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            asset?: AdminShowcaseProjectAsset;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.asset) {
        setRegistryNotice(payload?.error ?? "Could not save project token registry asset.");
        return;
      }

      setRegistryAssets((current) => [
        payload.asset!,
        ...current.filter((asset) => asset.id !== payload.asset!.id),
      ]);
      setSavedKey("registry");
      setRegistryNotice(`${payload.asset.symbol} registry asset saved.`);
    } catch (error) {
      setRegistryNotice(error instanceof Error ? error.message : "Could not save registry asset.");
    } finally {
      setSavingKey(null);
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
          campaignCount: showcase.counts.campaigns,
          questCount: showcase.counts.quests,
          rewardCount: showcase.counts.rewards,
          operatorIncidentCount: 0,
        })}
      >
        <OpsCommandRead
          eyebrow="Showcase Studio"
          title="Prepare the public premium project page"
          description="This is the source-of-truth read for the webapp project showcase: profile, token, scan, swap, daily activation and reward trust."
          now={`${showcase.score}% showcase-ready`}
          next={showcase.nextAction}
          watch="Missing fields stay here; public users should only see the polished output."
          action={
            <a
              href={showcase.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-[14px] bg-primary px-3.5 py-2 text-[11px] font-bold text-black transition hover:opacity-90"
            >
              Open public page
            </a>
          }
        />

        <OpsCommandCanvas
          rail={
            <>
              <OpsPanel
                eyebrow="Readiness"
                title="Launch checklist"
                description="The public page should feel automatic, but the premium modules need these fields to be clean."
              >
                <div className="space-y-2.5">
                  {showcase.readiness.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[14px] border border-white/[0.016] bg-white/[0.01] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-semibold text-text">{item.label}</p>
                        <OpsStatusPill tone={getStatusTone(item.status)}>
                          {getStatusLabel(item.status)}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-2 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Public URL"
                title="Live webapp route"
                description="This stays on the current Vercel domain until launch domains are swapped."
              >
                <a
                  href={showcase.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[14px] border border-primary/12 bg-primary/[0.025] px-3 py-2.5 text-[11px] font-semibold leading-5 text-primary [overflow-wrap:anywhere]"
                >
                  {showcase.publicUrl}
                </a>
              </OpsPanel>
            </>
          }
        >
          <OpsPanel
            eyebrow="Command read"
            title="Showcase posture"
            description="A project should not need to guess what is missing. This board says what is public, what is automated and what still blocks premium quality."
          >
            <div className="grid gap-2.5 md:grid-cols-4">
              <OpsMetricCard label="Score" value={`${showcase.score}%`} sub="public readiness" emphasis="primary" />
              <OpsMetricCard label="Campaigns" value={showcase.counts.campaigns} sub="activation lanes" />
              <OpsMetricCard label="Quests" value={showcase.counts.quests} sub="daily actions" />
              <OpsMetricCard label="Rewards" value={showcase.counts.rewards} sub="trust surfaces" />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Public modules"
            title="What the webapp can show"
            description="Every module should either be live, clearly ready, or have one obvious next action."
          >
            <OpsRouteGrid>
              {showcase.modules.map((module) => (
                <div
                  key={module.key}
                  className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
                        {module.label}
                      </p>
                      <h3 className="mt-2 text-[0.94rem] font-semibold tracking-[-0.025em] text-text">
                        {module.title}
                      </h3>
                    </div>
                    <OpsStatusPill tone={getStatusTone(module.status)}>
                      {getStatusLabel(module.status)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-sub">{module.description}</p>
                  <div className="mt-3 grid gap-2">
                    <OpsSnapshotRow label="Source" value={module.source} />
                    <OpsSnapshotRow label="Next" value={module.nextAction} />
                  </div>
                </div>
              ))}
            </OpsRouteGrid>
          </OpsPanel>

          <OpsPanel
            eyebrow="Premium page modules"
            title="What the public page can turn into"
            description="These are the richer public modules that combine market, contract, activation and reward signals."
          >
            <OpsRouteGrid>
              {showcase.premiumModules.map((module) => (
                <PremiumModulePreview key={module.key} module={module} />
              ))}
            </OpsRouteGrid>
          </OpsPanel>

          <OpsPanel
            eyebrow="Showcase controls"
            title="Edit the fields that shape the public page"
            description="These controls write back to Project Settings, so the portal stays the source of truth while this page becomes the fast premium editor."
          >
            <div className="grid gap-3 xl:grid-cols-2">
              <ShowcaseControlGroup
                controls={profileControls}
                group="profile"
                onSubmit={handleControlSubmit}
                savedKey={savedKey}
                savingKey={savingKey}
              />
              <ShowcaseControlGroup
                controls={marketControls}
                group="market"
                onSubmit={handleControlSubmit}
                savedKey={savedKey}
                savingKey={savingKey}
              />
            </div>
            {saveError ? (
              <p className="mt-3 rounded-[14px] border border-red-400/15 bg-red-500/[0.06] px-3 py-2 text-[11px] font-semibold leading-5 text-red-200">
                {saveError}
              </p>
            ) : null}
          </OpsPanel>

          <OpsPanel
            eyebrow="Project token registry"
            title="Publish the swap and price source"
            description="This writes a token asset into the on-chain registry, which the webapp can read for swap prefill and live price snapshots."
          >
            <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/90">
                      Registry status
                    </p>
                    <h3 className="mt-2 text-[0.94rem] font-semibold tracking-[-0.025em] text-text">
                      {showcase.registry.tokenSymbol}
                    </h3>
                  </div>
                  <OpsStatusPill tone={getStatusTone(showcase.registry.status)}>
                    {registryLoading ? "Loading" : getStatusLabel(showcase.registry.status)}
                  </OpsStatusPill>
                </div>
                <div className="mt-3 grid gap-2">
                  <OpsSnapshotRow label="Contract" value={showcase.registry.tokenContractAddress} />
                  <OpsSnapshotRow label="Decimals" value={showcase.registry.decimalsLabel} />
                  <OpsSnapshotRow
                    label="Swap"
                    value={showcase.registry.swapEnabled ? "Enabled" : "Disabled"}
                  />
                  <OpsSnapshotRow label="Price" value={showcase.registry.priceSource} />
                  <OpsSnapshotRow
                    label="Source"
                    value={showcase.scan.enrichment.sourceVerified ? "Verified" : "Pending"}
                  />
                  <OpsSnapshotRow
                    label="ABI"
                    value={showcase.scan.enrichment.abiAvailable ? "Available" : "Pending"}
                  />
                  <OpsSnapshotRow
                    label="Audit"
                    value={showcase.scan.enrichment.auditUrl ? "Attached" : "Missing"}
                  />
                  <OpsSnapshotRow label="Next" value={showcase.registry.nextAction} />
                </div>
              </div>

              <form
                key={`${showcase.registry.tokenContractAddress}-${showcase.registry.tokenSymbol}`}
                onSubmit={handleRegistrySubmit}
                className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] font-semibold text-text">
                    Token contract
                    <input
                      name="contractAddress"
                      defaultValue={
                        showcase.registry.tokenContractAddress === "Missing"
                          ? project.tokenContractAddress ?? ""
                          : showcase.registry.tokenContractAddress
                      }
                      placeholder="0x..."
                      className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-text">
                    Symbol
                    <input
                      name="symbol"
                      defaultValue={showcase.registry.tokenSymbol === "Missing" ? "" : showcase.registry.tokenSymbol}
                      placeholder="VYN"
                      className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-text">
                    Chain
                    <input
                      name="chain"
                      defaultValue="base"
                      className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-text">
                    Decimals
                    <input
                      name="decimals"
                      defaultValue={showcase.registry.decimalsLabel === "Missing" ? "18" : showcase.registry.decimalsLabel.replace(/\D/g, "") || "18"}
                      inputMode="numeric"
                      className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
                    />
                  </label>
                </div>
                <label className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.018] bg-black/20 px-3 py-2.5 text-[11px] font-semibold text-text">
                  Enable public swap route
                  <input
                    name="swapEnabled"
                    type="checkbox"
                    defaultChecked={showcase.registry.swapEnabled || showcase.registry.status === "missing"}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.018] bg-black/20 px-3 py-2.5 text-[11px] font-semibold text-text">
                    Source verified
                    <input
                      name="sourceVerified"
                      type="checkbox"
                      defaultChecked={showcase.scan.enrichment.sourceVerified === true}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.018] bg-black/20 px-3 py-2.5 text-[11px] font-semibold text-text">
                    ABI available
                    <input
                      name="abiAvailable"
                      type="checkbox"
                      defaultChecked={showcase.scan.enrichment.abiAvailable === true}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.018] bg-black/20 px-3 py-2.5 text-[11px] font-semibold text-text">
                    Ownership constrained
                    <input
                      name="ownerRenounced"
                      type="checkbox"
                      defaultChecked={showcase.scan.enrichment.ownerRenounced === true}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.018] bg-black/20 px-3 py-2.5 text-[11px] font-semibold text-text">
                    Proxy detected
                    <input
                      name="proxyDetected"
                      type="checkbox"
                      defaultChecked={showcase.scan.enrichment.proxyDetected === true}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-[11px] font-semibold text-text">
                  Audit URL
                  <input
                    name="auditUrl"
                    defaultValue={showcase.scan.enrichment.auditUrl ?? ""}
                    placeholder="https://audit.example.com/report"
                    className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="max-w-[30rem] text-[11px] leading-5 text-sub">
                    Price source defaults to DexScreener; scan fields enrich the public AI contract read.
                  </p>
                  <button
                    type="submit"
                    disabled={savingKey === "registry"}
                    className="rounded-[12px] border border-primary/14 bg-primary/[0.055] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary transition hover:bg-primary/[0.09] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {savingKey === "registry" ? "Saving" : savedKey === "registry" ? "Saved" : "Save registry"}
                  </button>
                </div>
                {registryNotice ? (
                  <p className="mt-3 rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2 text-[11px] font-semibold leading-5 text-sub">
                    {registryNotice}
                  </p>
                ) : null}
              </form>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="AI contract scan"
            title="Preview the public safety read"
            description="This scan weighs contract, registry, price source and wallet context before deeper source-code analysis is attached."
          >
            <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/90">
                      Scan score
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-text">
                      {showcase.scan.score}%
                    </h3>
                  </div>
                  <OpsStatusPill tone={getStatusTone(showcase.scan.status)}>
                    {getScanRiskLabel(showcase.scan.riskLevel)}
                  </OpsStatusPill>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-sub">{showcase.scan.summary}</p>
                <div className="mt-3 grid gap-2">
                  <OpsSnapshotRow label="Status" value={getStatusLabel(showcase.scan.status)} />
                  <OpsSnapshotRow label="Risk" value={getScanRiskLabel(showcase.scan.riskLevel)} />
                  <OpsSnapshotRow label="Next" value={showcase.scan.nextAction} />
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                {showcase.scan.findings.map((finding) => (
                  <div
                    key={`${finding.label}-${finding.evidence}`}
                    className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-semibold text-text">{finding.label}</p>
                      <OpsStatusPill tone={getScanSeverityTone(finding.severity)}>
                        {getScanSeverityLabel(finding.severity)}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-sub">{finding.detail}</p>
                    <p className="mt-3 break-words text-[9px] font-bold uppercase tracking-[0.16em] text-sub/70 [overflow-wrap:anywhere]">
                      {finding.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Auto-filled profile"
            title="Fields already feeding the public page"
            description="These come from Project Settings today, so teams can improve the showcase without learning a second builder."
          >
            <div className="grid gap-2.5 md:grid-cols-3">
              {showcase.autoFilledFields.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[14px] border border-white/[0.016] bg-white/[0.01] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
                      {item.label}
                    </p>
                    <OpsStatusPill tone={getStatusTone(item.status)}>
                      {getStatusLabel(item.status)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-2 break-words text-[12px] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Builder routes"
            title="Where to fix missing showcase inputs"
            description="Keep this page as the command read; use the dedicated builders for actual content changes."
          >
            <OpsRouteGrid>
              <OpsRouteCard
                href={`/projects/${project.id}/settings`}
                eyebrow="Identity"
                title="Edit profile and links"
                description="Logo, banner, narrative, website, socials, docs and token fields."
                cta="Open"
              />
              <OpsRouteCard
                href={`/projects/${project.id}/onchain`}
                eyebrow="Contracts"
                title="Register assets"
                description="Wallets, token contracts and tracked assets for scan and proof layers."
                cta="Open"
              />
              <OpsRouteCard
                href={`/projects/${project.id}/rewards`}
                eyebrow="Assurance"
                title="Fund visible rewards"
                description="Create rewards and make funding posture clear before users start grinding."
                cta="Open"
              />
            </OpsRouteGrid>
          </OpsPanel>
        </OpsCommandCanvas>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}

function PremiumModulePreview({ module }: { module: AdminShowcasePremiumModule }) {
  return (
    <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
            {module.eyebrow}
          </p>
          <h3 className="mt-2 text-[0.94rem] font-semibold tracking-[-0.025em] text-text">
            {module.title}
          </h3>
        </div>
        <OpsStatusPill tone={getStatusTone(module.status)}>
          {getStatusLabel(module.status)}
        </OpsStatusPill>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-sub">{module.description}</p>
      <div className="mt-3 grid gap-2 border-y border-white/[0.026] py-2 sm:grid-cols-2">
        <OpsSnapshotRow label="Signal" value={module.primaryMetric} />
        <OpsSnapshotRow label="Posture" value={module.secondaryMetric} />
      </div>
      <div className="mt-3 space-y-1.5">
        {module.highlights.map((highlight) => (
          <p key={highlight} className="text-[11px] font-semibold leading-5 text-sub">
            {highlight}
          </p>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        <OpsSnapshotRow label="Source" value={module.source} />
        <OpsSnapshotRow label="Next" value={module.nextAction} />
      </div>
    </div>
  );
}

function ShowcaseControlGroup({
  controls,
  group,
  onSubmit,
  savedKey,
  savingKey,
}: {
  controls: AdminShowcaseControl[];
  group: AdminShowcaseControlGroup;
  onSubmit: (control: AdminShowcaseControl, event: FormEvent<HTMLFormElement>) => void;
  savedKey: string | null;
  savingKey: string | null;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.018] bg-white/[0.01] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/90">
        {getControlGroupTitle(group)}
      </p>
      <div className="mt-3 space-y-3">
        {controls.map((control) => (
          <form key={control.key} onSubmit={(event) => onSubmit(control, event)}>
            <div className="flex items-start justify-between gap-3">
              <label htmlFor={control.key} className="text-[11px] font-semibold text-text">
                {control.label}
              </label>
              <OpsStatusPill tone={getStatusTone(control.status)}>
                {getStatusLabel(control.status)}
              </OpsStatusPill>
            </div>
            {control.control === "textarea" ? (
              <textarea
                id={control.key}
                name={control.key}
                defaultValue={control.value}
                placeholder={control.placeholder}
                rows={4}
                className="mt-2 w-full resize-none rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
              />
            ) : (
              <input
                id={control.key}
                name={control.key}
                defaultValue={control.value}
                placeholder={control.placeholder}
                className="mt-2 w-full rounded-[14px] border border-white/[0.026] bg-black/20 px-3 py-2.5 text-[12px] text-text outline-none transition placeholder:text-sub/55 focus:border-primary/24"
              />
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-[28rem] text-[11px] leading-5 text-sub">{control.helper}</p>
              <button
                type="submit"
                disabled={savingKey === control.key}
                className="rounded-[12px] border border-primary/14 bg-primary/[0.055] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary transition hover:bg-primary/[0.09] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {savingKey === control.key ? "Saving" : savedKey === control.key ? "Saved" : "Save"}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
