"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Gift,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import {
  getRewardTreasuryConfig,
  getRewardTreasuryPosture,
} from "@/lib/rewards/reward-treasury";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminReward } from "@/types/entities/reward";

type ProjectRewardCommandDeckProps = {
  projectId: string;
  projectName: string;
  rewardCount: number;
  claimableCount: number;
  visibleRewardCount: number;
  fundedRewardCount: number;
  needsFundingCount: number;
  pendingClaimCount: number;
  processingClaimCount: number;
  fulfilledClaimCount: number;
  campaignCount: number;
  questCount: number;
};

function ProjectRewardCommandDeck({
  projectId,
  projectName,
  rewardCount,
  claimableCount,
  visibleRewardCount,
  fundedRewardCount,
  needsFundingCount,
  pendingClaimCount,
  processingClaimCount,
  fulfilledClaimCount,
  campaignCount,
  questCount,
}: ProjectRewardCommandDeckProps) {
  const openClaimCount = pendingClaimCount + processingClaimCount;
  const nextDecision =
    rewardCount === 0
      ? "Create the first reward"
      : needsFundingCount > 0
        ? "Resolve reward funding"
        : openClaimCount > 0
          ? "Review payout pressure"
          : visibleRewardCount === 0
            ? "Make a reward visible"
            : "Keep reward rail live";
  const readinessScore = Math.min(
    100,
    [
      rewardCount > 0,
      claimableCount > 0,
      visibleRewardCount > 0,
      needsFundingCount === 0,
      openClaimCount === 0,
    ].filter(Boolean).length * 20
  );

  const routes = [
    {
      href: `/rewards/new?projectId=${projectId}`,
      label: "Reward Studio",
      title: "Create funded reward",
      body: "Define what members earn, how it is claimed, and whether it is safe to publish.",
      signal: `${rewardCount} rewards`,
      icon: Gift,
      primary: rewardCount === 0 || visibleRewardCount === 0,
    },
    {
      href: `/projects/${projectId}/payouts`,
      label: "Payout Control",
      title: "Review claim pressure",
      body: "Use this when pending claims, funding gaps or delivery cases need project action.",
      signal: `${openClaimCount} open claims`,
      icon: WalletCards,
      primary: needsFundingCount > 0 || openClaimCount > 0,
    },
    {
      href: "#reward-inventory",
      label: "Inventory",
      title: "Scan reward roster",
      body: "Check status, rarity, cost, funding posture and claim volume before changing routes.",
      signal: `${fundedRewardCount}/${rewardCount} safe`,
      icon: PackageCheck,
      primary: false,
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
              <Sparkles size={12} />
              Reward command
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              <BadgeCheck size={12} className="text-primary" />
              {projectName}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.35fr)] lg:items-end">
            <div className="min-w-0">
              <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Make rewards understandable before members claim.
              </h2>
              <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
                A project-safe reward surface for inventory, funding posture, claim pressure
                and the next operational move.
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
            <RewardBoardSignal
              icon={<Gift size={14} />}
              label="Claimable"
              value={`${claimableCount}/${rewardCount}`}
              sub="rewards"
            />
            <RewardBoardSignal
              icon={<ShieldCheck size={14} />}
              label="Funded safe"
              value={fundedRewardCount}
              sub={`${needsFundingCount} gaps`}
            />
            <RewardBoardSignal
              icon={<TicketCheck size={14} />}
              label="Open claims"
              value={openClaimCount}
              sub={`${fulfilledClaimCount} fulfilled`}
            />
            <RewardBoardSignal
              icon={<Layers3 size={14} />}
              label="Attached flow"
              value={campaignCount}
              sub={`${questCount} quests`}
            />
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Reward route
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                Choose the surface that matches the blocker.
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

function RewardBoardSignal({
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

export default function ProjectRewardsPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const claims = useAdminPortalStore((s) => s.claims);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);

  const project = getProjectById(params.id);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This reward workspace could not be resolved from the current project state."
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
          title="Reward access is project-scoped"
          description="Only members of this project can open this reward workspace."
        />
      </AdminShell>
    );
  }

  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);
  const projectClaims = claims.filter((claim) => claim.projectId === project.id);
  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const rewardFundingPostures = projectRewards.map((reward) =>
    getRewardTreasuryPosture(
      getRewardTreasuryConfig(reward.deliveryConfig, {
        rewardType: reward.rewardType,
        claimable: reward.claimable,
      }),
      reward.rewardType,
      reward.claimable
    )
  );
  const fundedRewardCount = rewardFundingPostures.filter(
    (posture) => !posture.requiresFunding || posture.ready
  ).length;
  const needsFundingCount = rewardFundingPostures.filter(
    (posture) => posture.requiresFunding && !posture.ready
  ).length;
  const visibleRewardCount = projectRewards.filter((reward) => reward.visible).length;
  const claimableRewardCount = projectRewards.filter((reward) => reward.claimable).length;
  const pendingClaimCount = projectClaims.filter((claim) => claim.status === "pending").length;
  const processingClaimCount = projectClaims.filter(
    (claim) => claim.status === "processing"
  ).length;
  const fulfilledClaimCount = projectClaims.filter((claim) => claim.status === "fulfilled").length;

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

  const rewardColumns: OpsTableColumn<AdminReward>[] = [
    {
      key: "title",
      label: "Reward",
      render: (reward) => (
        <div>
          <p className="font-semibold text-text">{reward.title}</p>
          <p className="mt-1 text-xs text-sub">{reward.rewardType} · {reward.rarity}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (reward) => (
        <OpsStatusPill tone={reward.status === "active" ? "success" : "default"}>
          {reward.status}
        </OpsStatusPill>
      ),
    },
    {
      key: "funding",
      label: "Funding",
      render: (reward) => {
        const posture = getFundingPosture(reward);

        return <OpsStatusPill tone={posture.tone}>{posture.label}</OpsStatusPill>;
      },
    },
    {
      key: "cost",
      label: "Cost",
      render: (reward) => reward.cost.toLocaleString(),
    },
    {
      key: "claims",
      label: "Claims",
      render: (reward) =>
        projectClaims.filter((claim) => claim.rewardId === reward.id).length.toLocaleString(),
    },
    {
      key: "open",
      label: "Open",
      render: (reward) => (
        <Link href={`/rewards/${reward.id}`} className="font-semibold text-primary">
          View
        </Link>
      ),
    },
  ];

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
          operatorIncidentCount: projectClaims.filter((claim) => claim.status !== "fulfilled").length,
        })}
      >
        <ProjectRewardCommandDeck
          projectId={project.id}
          projectName={project.name}
          rewardCount={projectRewards.length}
          claimableCount={claimableRewardCount}
          visibleRewardCount={visibleRewardCount}
          fundedRewardCount={fundedRewardCount}
          needsFundingCount={needsFundingCount}
          pendingClaimCount={pendingClaimCount}
          processingClaimCount={processingClaimCount}
          fulfilledClaimCount={fulfilledClaimCount}
          campaignCount={projectCampaigns.length}
          questCount={projectQuests.length}
        />

        <OpsPanel
          eyebrow="Reward snapshot"
          title="Inventory posture"
          description="Compact counts for claimability, funding safety and reward gaps after the command route."
        >
          <div className="grid gap-2.5 md:grid-cols-4">
            <OpsMetricCard label="Rewards" value={projectRewards.length} />
            <OpsMetricCard
              label="Claimable"
              value={projectRewards.filter((reward) => reward.claimable).length}
              emphasis="primary"
            />
            <OpsMetricCard
              label="Funded / safe"
              value={fundedRewardCount}
              emphasis="primary"
            />
            <OpsMetricCard
              label="Needs funding"
              value={needsFundingCount}
              emphasis={needsFundingCount > 0 ? "warning" : "default"}
            />
          </div>
        </OpsPanel>

        <div id="reward-inventory">
          <OpsPanel
            eyebrow="Reward roster"
            title="Reward inventory"
            description="A focused list of reward surfaces tied to this project."
          >
            <OpsTable
              columns={rewardColumns}
              rows={projectRewards}
              getRowKey={(reward) => reward.id}
              emptyState="No rewards exist for this project yet."
            />
          </OpsPanel>
        </div>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
