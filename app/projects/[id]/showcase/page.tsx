"use client";

import { useEffect } from "react";
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

export default function ProjectShowcasePage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const role = useAdminAuthStore((s) => s.role);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
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
  });

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
