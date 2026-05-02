"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { OpsCommandRead, OpsPanel } from "@/components/layout/ops/OpsPrimitives";
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
          operatorIncidentCount: 0,
        })}
      >
        <OpsCommandRead
          eyebrow="Project setup"
          title="Change identity, links and integrations"
          description="Settings is the dedicated surface for configuration changes, so the project home can stay calm and action-led."
          now={`${project.name} is ${project.status}`}
          next="Update the field group that blocks readiness"
          watch={
            project.onboardingStatus === "approved"
              ? "Public posture is approved"
              : "Public posture still needs approval"
          }
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <OpsPanel
            eyebrow="Project settings"
            title="Workspace configuration"
            description="Use settings as the project dossier: public profile, links and launch context should be readable before you drop into the deeper builder."
          >
            <div className="grid gap-2.5 md:grid-cols-3">
              <div className="min-w-0 rounded-[14px] bg-white/[0.014] px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">Identity</p>
                <p className="mt-2 break-words text-[0.95rem] font-bold text-text [overflow-wrap:anywhere]">
                  {project.name}
                </p>
                <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{project.slug || "No slug set yet"}</p>
              </div>
              <div className="min-w-0 rounded-[14px] bg-white/[0.014] px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">Public surface</p>
                <p className="mt-2 text-[0.95rem] font-bold text-text">
                  {project.isPublic ? "Public" : "Private"}
                </p>
                <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{project.contactEmail || "No contact email yet"}</p>
              </div>
              <div className="min-w-0 rounded-[14px] bg-white/[0.014] px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">Context</p>
                <p className="mt-2 text-[0.95rem] font-bold text-text">
                  {project.chain}
                </p>
                <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{project.category || "No category set yet"}</p>
              </div>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Settings posture"
            title="Change the project without losing orientation"
            description="The builder below holds the real edit flow. This top rail exists so the team can still read what this workspace is before changing it."
          >
            <div className="space-y-2.5">
              <div className="rounded-[14px] bg-white/[0.014] px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">What this affects</p>
                <p className="mt-2 text-[12px] leading-5 text-sub">
                  Public project pages, launch context, templates, connected channels and the profile surfaces used across the portal.
                </p>
              </div>
              <div className="rounded-[14px] bg-white/[0.014] px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">Recommended use</p>
                <p className="mt-2 text-[12px] leading-5 text-sub">
                  Treat this as a dossier and builder, not as a dumping ground for every project action. Operational work should still happen in Launch, Community and the project overview.
                </p>
              </div>
            </div>
          </OpsPanel>
        </div>

        <ProjectForm
          initialValues={initialValues}
          submitLabel="Save workspace"
          layout="horizontal"
          onSubmit={async (values) => {
            await updateProject(project.id, values);
          }}
        />

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
