"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminReward } from "@/types/entities/reward";

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
        <OpsPanel
          eyebrow="Reward rail"
          title="Project rewards"
          description="Track reward inventory, claim pressure and the items that shape this workspace’s payout posture."
        >
          <div className="grid gap-2.5 md:grid-cols-4">
            <OpsMetricCard label="Rewards" value={projectRewards.length} />
            <OpsMetricCard
              label="Claimable"
              value={projectRewards.filter((reward) => reward.claimable).length}
              emphasis="primary"
            />
            <OpsMetricCard
              label="Pending claims"
              value={projectClaims.filter((claim) => claim.status === "pending").length}
              emphasis="warning"
            />
            <OpsMetricCard label="Claims total" value={projectClaims.length} />
          </div>
        </OpsPanel>

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
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
