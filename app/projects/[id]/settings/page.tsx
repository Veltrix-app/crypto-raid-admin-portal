"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
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
        <OpsPanel
          eyebrow="Project settings"
          title="Workspace configuration"
          description="Keep the public profile, links and launch context for this project clean from one focused setup surface."
        >
          <ProjectForm
            initialValues={initialValues}
            submitLabel="Save workspace"
            onSubmit={async (values) => {
              await updateProject(project.id, values);
            }}
          />
        </OpsPanel>

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
            className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
          >
            Delete project
          </button>
        </OpsPanel>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
