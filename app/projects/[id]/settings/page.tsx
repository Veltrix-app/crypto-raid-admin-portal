"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, CheckCircle2, Globe2, Settings2 } from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const deleteProject = useAdminPortalStore((s) => s.deleteProject);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);

  const project = getProjectById(params.id);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  const initialValues = useMemo(() => {
    if (!project) return null;
    const { id: _id, ...rest } = project;
    return rest;
  }, [project]);

  if (!project || !initialValues) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This settings workspace could not be resolved from the current project state."
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
          title="Settings access is project-scoped"
          description="Only members of this project can open this settings workspace."
        />
      </AdminShell>
    );
  }

  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);

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
        <ProjectSettingsCommandDeck
          projectId={project.id}
          projectName={project.name}
          projectSlug={project.slug}
          projectStatus={project.status}
          onboardingStatus={project.onboardingStatus}
          isPublic={project.isPublic}
          chain={project.chain}
          category={project.category}
          contactEmail={project.contactEmail}
          campaignCount={projectCampaigns.length}
          questCount={projectQuests.length}
          rewardCount={projectRewards.length}
        />

        <div id="workspace-builder">
          <ProjectForm
            initialValues={initialValues}
            submitLabel="Save workspace"
            layout="horizontal"
            mode="settings"
            onSubmit={async (values) => {
              await updateProject(project.id, values);
            }}
          />
        </div>

        <OpsPanel
          eyebrow="Danger zone"
          title="Project removal"
          description="Only remove a workspace when you are certain its campaigns, community rails and claim flows are no longer needed."
        >
          <button
            type="button"
            onClick={async () => {
              await deleteProject(project.id);
              router.push("/projects");
            }}
            className="rounded-[18px] border border-rose-500/30 bg-rose-500/[0.055] px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
          >
            Delete project
          </button>
        </OpsPanel>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}

function ProjectSettingsCommandDeck({
  projectId,
  projectName,
  projectSlug,
  projectStatus,
  onboardingStatus,
  isPublic,
  chain,
  category,
  contactEmail,
  campaignCount,
  questCount,
  rewardCount,
}: {
  projectId: string;
  projectName: string;
  projectSlug?: string;
  projectStatus: string;
  onboardingStatus?: string;
  isPublic?: boolean;
  chain: string;
  category?: string;
  contactEmail?: string;
  campaignCount: number;
  questCount: number;
  rewardCount: number;
}) {
  const connectedWork = campaignCount + questCount + rewardCount;
  const profileFieldsReady = [projectName, projectSlug, chain, category, contactEmail].filter(Boolean).length;

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_7%_0%,rgba(199,255,0,0.085),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(0,255,163,0.052),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.965))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[length:64px_64px] opacity-[0.32]" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.38fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone={isPublic ? "success" : "default"}>
              {isPublic ? "Public surface" : "Private surface"}
            </OpsStatusPill>
            <OpsStatusPill tone={onboardingStatus === "approved" ? "success" : "warning"}>
              {onboardingStatus === "approved" ? "Approved" : "Needs review"}
            </OpsStatusPill>
          </div>

          <h1 className="mt-3 text-[1.24rem] font-semibold tracking-[-0.035em] text-text md:text-[1.55rem]">
            Tune {projectName} without losing launch clarity
          </h1>
          <p className="mt-2 max-w-4xl text-[12px] leading-5 text-sub">
            Settings now works like a focused project dossier: edit identity, links and context, then jump back into the operational surfaces that use those inputs.
          </p>

          <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <SettingsMetric icon={<Settings2 size={15} />} label="Status" value={projectStatus} />
            <SettingsMetric icon={<Globe2 size={15} />} label="Profile" value={`${profileFieldsReady}/5`} />
            <SettingsMetric icon={<CheckCircle2 size={15} />} label="Work linked" value={String(connectedWork)} />
            <SettingsMetric icon={<Globe2 size={15} />} label="Chain" value={chain} />
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-black/25 p-3.5">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
            Fast routes
          </p>
          <div className="mt-3 grid gap-2">
            <Link
              href="#workspace-builder"
              className="group flex items-center justify-between gap-3 rounded-[14px] border border-primary/[0.14] bg-primary/[0.055] px-3 py-2.5 text-[12px] font-semibold text-text transition hover:bg-primary/[0.085]"
            >
              Continue editing
              <ArrowDown size={13} className="text-primary transition group-hover:translate-y-0.5" />
            </Link>
            <Link
              href={`/projects/${projectId}/launch`}
              className="group flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.024] bg-white/[0.014] px-3 py-2.5 text-[12px] font-semibold text-text transition hover:bg-white/[0.028]"
            >
              Launch cockpit
              <ArrowUpRight size={13} className="text-primary transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={`/projects/${projectId}/showcase`}
              className="group flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.024] bg-white/[0.014] px-3 py-2.5 text-[12px] font-semibold text-text transition hover:bg-white/[0.028]"
            >
              Showcase studio
              <ArrowUpRight size={13} className="text-primary transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[15px] border border-white/[0.024] bg-white/[0.014] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-text">{value || "Missing"}</p>
    </div>
  );
}
