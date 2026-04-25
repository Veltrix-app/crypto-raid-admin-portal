"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowUpRight, FolderPlus, Swords, Target } from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import ProjectTemplateLibrary from "@/components/projects/templates/ProjectTemplateLibrary";
import { buildProjectBuilderLibrary } from "@/lib/templates/project-builder-library";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

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

  const activeCampaigns = projectCampaigns.filter((campaign) => campaign.status === "active");
  const totalParticipants = projectCampaigns.reduce(
    (sum, campaign) => sum + campaign.participants,
    0
  );
  const totalXpBudget = projectCampaigns.reduce((sum, campaign) => sum + campaign.xpBudget, 0);

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
          description="Scan the campaign lanes first, then jump into Campaign Studio, Quest Studio or Raid Builder without losing project context."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/campaigns/new?projectId=${project.id}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-3.5 py-2.5 text-[12px] font-bold text-black"
              >
                <FolderPlus size={15} />
                Campaign Studio
              </Link>
              <Link
                href={`/quests/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[14px] bg-white/[0.018] px-3.5 py-2.5 text-[12px] font-bold text-text transition hover:bg-white/[0.035]"
              >
                <Target size={15} />
                Quest Studio
              </Link>
              <Link
                href={`/raids/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`}
                className="inline-flex items-center gap-2 rounded-[14px] bg-white/[0.018] px-3.5 py-2.5 text-[12px] font-bold text-text transition hover:bg-white/[0.035]"
              >
                <Swords size={15} />
                Raid Builder
              </Link>
            </div>
          }
        >
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <OpsMetricCard label="Campaigns" value={projectCampaigns.length} />
            <OpsMetricCard label="Active" value={activeCampaigns.length} emphasis="primary" />
            <OpsMetricCard label="Participants" value={totalParticipants.toLocaleString()} />
            <OpsMetricCard label="XP budget" value={totalXpBudget.toLocaleString()} />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Campaign lanes"
          title="Current campaigns"
          description="A clean project-level roster: status, reach and next edit action in one scan."
        >
          {projectCampaigns.length > 0 ? (
            <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
              {projectCampaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="group rounded-[16px] bg-white/[0.014] p-3.5 transition-colors duration-200 hover:bg-white/[0.028]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <OpsStatusPill tone={campaign.status === "active" ? "success" : "default"}>
                          {campaign.status}
                        </OpsStatusPill>
                        <span className="rounded-full bg-white/[0.02] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-sub">
                          {campaign.campaignType.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h3 className="mt-3 break-words text-[0.98rem] font-semibold tracking-[-0.02em] text-text [overflow-wrap:anywhere]">
                        {campaign.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
                        {campaign.shortDescription || "No short description yet."}
                      </p>
                    </div>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="rounded-full bg-white/[0.026] p-2 text-sub transition group-hover:bg-primary/15 group-hover:text-primary"
                      aria-label={`Open ${campaign.title}`}
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[12px] bg-black/20 px-3 py-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-sub">
                        Participants
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-text">
                        {campaign.participants.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-black/20 px-3 py-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-sub">
                        Completion
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-text">
                        {campaign.completionRate}%
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-black/20 px-3 py-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-sub">
                        XP budget
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-text">
                        {campaign.xpBudget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-sub">
                    <span>{campaign.visibility}</span>
                    <Link href={`/campaigns/${campaign.id}`} className="text-primary">
                      Open campaign
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] bg-white/[0.014] px-4 py-5 text-sm text-sub">
              No campaigns exist for this project yet. Start with Campaign Studio or use a route below.
            </div>
          )}
        </OpsPanel>

        <OpsPanel
          eyebrow="Starter routes"
          title="Campaign packs and quest kits"
          description="Use proven routes after the roster, not as a side rail that steals the page layout."
        >
          <ProjectTemplateLibrary sections={templateLibrarySections} layout="wide" />
        </OpsPanel>

      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
