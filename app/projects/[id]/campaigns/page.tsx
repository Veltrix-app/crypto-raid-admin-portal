"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Gauge,
  Layers3,
  Megaphone,
  Route,
  Swords,
  Target,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { XpValue, isXpDisplay } from "@/components/ui/XpBadge";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import ProjectTemplateLibrary from "@/components/projects/templates/ProjectTemplateLibrary";
import { buildProjectBuilderLibrary } from "@/lib/templates/project-builder-library";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ProjectCampaignCommandDeckProps = {
  projectId: string;
  projectName: string;
  primaryCampaignId: string | null;
  campaignCount: number;
  activeCampaignCount: number;
  questCount: number;
  activeQuestCount: number;
  raidCount: number;
  activeRaidCount: number;
  participantCount: number;
  xpBudget: number;
};

function ProjectCampaignCommandDeck({
  projectId,
  projectName,
  primaryCampaignId,
  campaignCount,
  activeCampaignCount,
  questCount,
  activeQuestCount,
  raidCount,
  activeRaidCount,
  participantCount,
  xpBudget,
}: ProjectCampaignCommandDeckProps) {
  const campaignHref = `/campaigns/new?projectId=${projectId}&source=campaign-board`;
  const questHref = `/quests/new?projectId=${projectId}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`;
  const raidHref = `/raids/new?projectId=${projectId}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=campaign-board`;
  const nextDecision =
    campaignCount === 0
      ? "Create the first campaign lane"
      : activeQuestCount === 0
        ? "Add a member action quest"
        : activeRaidCount === 0
          ? "Add the first coordinated raid"
          : "Review live delivery";
  const readinessScore = Math.min(
    100,
    [campaignCount > 0, activeCampaignCount > 0, activeQuestCount > 0, activeRaidCount > 0].filter(
      Boolean
    ).length * 25
  );

  const routeCards = [
    {
      href: campaignHref,
      label: "Campaign Studio",
      title: "Create the lane",
      body: "Use this when the project needs the public story, objective, budget and launch container.",
      signal: `${campaignCount} total / ${activeCampaignCount} active`,
      icon: Megaphone,
      primary: campaignCount === 0,
    },
    {
      href: questHref,
      label: "Quest Studio",
      title: "Give members tasks",
      body: "Use this for concrete contributor actions: join, prove, claim and move through the lane.",
      signal: `${questCount} total / ${activeQuestCount} active`,
      icon: Target,
      primary: campaignCount > 0 && activeQuestCount === 0,
    },
    {
      href: raidHref,
      label: "Raid Builder",
      title: "Coordinate the push",
      body: "Use this when a post, thread or launch moment needs a timed community push.",
      signal: `${raidCount} total / ${activeRaidCount} active`,
      icon: Swords,
      primary: activeQuestCount > 0 && activeRaidCount === 0,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(186,255,59,0.078),transparent_27%),radial-gradient(circle_at_82%_10%,rgba(74,217,255,0.052),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(6,8,13,0.96))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.011)_1px,transparent_1px)] bg-[length:58px_58px] opacity-[0.26]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div className="min-w-0 rounded-[18px] border border-white/[0.022] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/[0.16] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              <Route size={12} />
              Campaign command
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              <BadgeCheck size={12} className="text-primary" />
              {projectName}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.35fr)] lg:items-end">
            <div className="min-w-0">
              <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Choose the right launch route before building.
              </h2>
              <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
                One board for project teams to decide whether they need a campaign container,
                a quest action, or a coordinated raid push.
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
                <Gauge size={17} className="shrink-0 text-primary" />
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
            <CampaignBoardSignal
              icon={<Layers3 size={14} />}
              label="Campaign lanes"
              value={`${activeCampaignCount}/${campaignCount}`}
              sub="active"
            />
            <CampaignBoardSignal
              icon={<Target size={14} />}
              label="Live quests"
              value={activeQuestCount}
              sub={`${questCount} total`}
            />
            <CampaignBoardSignal
              icon={<Swords size={14} />}
              label="Live raids"
              value={activeRaidCount}
              sub={`${raidCount} total`}
            />
            <CampaignBoardSignal
              icon={<UsersRound size={14} />}
              label="Reach"
              value={participantCount.toLocaleString()}
              sub={`${xpBudget.toLocaleString()} XP`}
            />
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Route picker
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                Start with the surface that matches the job.
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-primary" />
          </div>

          <div className="grid gap-2">
            {routeCards.map((route) => {
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

function CampaignBoardSignal({
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
  const hasXpValue = isXpDisplay(label, value);
  const hasXpSub = isXpDisplay(sub);

  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-white/[0.012] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-sub">
          {label}
        </p>
        <span className="shrink-0 text-primary">{icon}</span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        {hasXpValue ? (
          <XpValue size="sm">{value}</XpValue>
        ) : (
          <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
            {value}
          </p>
        )}
        {hasXpSub ? (
          <XpValue size="xs">{sub}</XpValue>
        ) : (
          <p className="truncate text-[10px] font-semibold text-sub">{sub}</p>
        )}
      </div>
    </div>
  );
}

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
  const activeQuests = projectQuests.filter((quest) => quest.status === "active");
  const activeRaids = projectRaids.filter((raid) => raid.status === "active");
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
        <ProjectCampaignCommandDeck
          projectId={project.id}
          projectName={project.name}
          primaryCampaignId={primaryCampaignId}
          campaignCount={projectCampaigns.length}
          activeCampaignCount={activeCampaigns.length}
          questCount={projectQuests.length}
          activeQuestCount={activeQuests.length}
          raidCount={projectRaids.length}
          activeRaidCount={activeRaids.length}
          participantCount={totalParticipants}
          xpBudget={totalXpBudget}
        />

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
                        <span className="rounded-full bg-white/[0.014] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-sub">
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
                      className="rounded-full bg-white/[0.026] p-2 text-sub transition group-hover:bg-primary/[0.075] group-hover:text-primary"
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
                        <XpValue size="sm">{campaign.xpBudget.toLocaleString()} XP</XpValue>
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
