"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { FolderPlus, Swords, Target } from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import ProjectTemplateLibrary from "@/components/projects/templates/ProjectTemplateLibrary";
import { buildProjectBuilderLibrary } from "@/lib/templates/project-builder-library";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminCampaign } from "@/types/entities/campaign";

export default function ProjectCampaignsPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const raids = useAdminPortalStore((s) => s.raids);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const projectBuilderTemplates = useAdminPortalStore((s) => s.projectBuilderTemplates);

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
          description="This campaign workspace could not be resolved from the current project state."
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
          title="Campaign access is project-scoped"
          description="Only members of this project can open this campaign workspace."
        />
      </AdminShell>
    );
  }

  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const projectRaids = raids.filter((raid) => raid.projectId === project.id);
  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);
  const primaryCampaignId =
    projectCampaigns.find((campaign) => campaign.status === "active")?.id ??
    projectCampaigns[0]?.id ??
    null;
  const templateLibrarySections = buildProjectBuilderLibrary({
    project: {
      id: project.id,
      name: project.name,
    },
    campaignId: primaryCampaignId,
    savedTemplates: projectBuilderTemplates.filter(
      (template) => template.projectId === project.id
    ),
  });

  const columns: OpsTableColumn<AdminCampaign>[] = [
    {
      key: "title",
      label: "Campaign",
      render: (campaign) => (
        <div>
          <p className="font-semibold text-text">{campaign.title}</p>
          <p className="mt-1 text-xs text-sub">{campaign.shortDescription || "No short description yet."}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (campaign) => (
        <OpsStatusPill tone={campaign.status === "active" ? "success" : "default"}>
          {campaign.status}
        </OpsStatusPill>
      ),
    },
    {
      key: "participants",
      label: "Participants",
      render: (campaign) => campaign.participants.toLocaleString(),
    },
    {
      key: "budget",
      label: "XP budget",
      render: (campaign) => campaign.xpBudget.toLocaleString(),
    },
    {
      key: "open",
      label: "Open",
      render: (campaign) => (
        <Link href={`/campaigns/${campaign.id}`} className="font-semibold text-primary">
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
          operatorIncidentCount: 0,
        })}
      >
        <OpsPanel
          eyebrow="Campaign board"
          title="Project campaigns"
          description="Scan the campaign roster, then jump straight into Campaign Studio, Quest Studio or the next raid builder without losing project context."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/campaigns/new?projectId=${project.id}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 font-bold text-black"
              >
                <FolderPlus size={16} />
                Open Campaign Studio
              </Link>
              <Link
                href={`/quests/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[18px] border border-white/[0.04] bg-white/[0.025] px-4 py-3 font-bold text-text transition hover:border-primary/35"
              >
                <Target size={16} />
                Open Quest Studio
              </Link>
              <Link
                href={`/raids/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[18px] border border-white/[0.04] bg-white/[0.025] px-4 py-3 font-bold text-text transition hover:border-primary/35"
              >
                <Swords size={16} />
                Open Raid Builder
              </Link>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="Campaigns" value={projectCampaigns.length} />
            <OpsMetricCard
              label="Active"
              value={projectCampaigns.filter((campaign) => campaign.status === "active").length}
              emphasis="primary"
            />
            <OpsMetricCard label="Quests" value={projectQuests.length} />
            <OpsMetricCard label="Raids" value={projectRaids.length} />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Campaign roster"
          title="Current campaign lanes"
          description="Use this route to scan project momentum first, then move into campaign detail or open the next studio from the same workspace."
        >
          <OpsTable
            columns={columns}
            rows={projectCampaigns}
            getRowKey={(campaign) => campaign.id}
            emptyState="No campaigns exist for this project yet."
          />
        </OpsPanel>

        <OpsPanel
          eyebrow="Starter library"
          title="Campaign packs, quest kits and raid starters"
          description="Start from saved project variants or intent-first starters instead of jumping straight into blank creation flows."
        >
          <ProjectTemplateLibrary sections={templateLibrarySections} />
        </OpsPanel>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
