"use client";

import { useRouter } from "next/navigation";
import ProjectForm from "@/components/forms/project/ProjectForm";
import {
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  PROJECT_FIRST_RUN_STEPS,
  PROJECT_INTAKE_STEPS,
  ProjectOnboardingActionLink,
  ProjectOnboardingStepGrid,
} from "@/components/projects/onboarding/ProjectOnboardingPrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useAdminPortalStore((s) => s.createProject);
  const createOnboardingRequest = useAdminPortalStore((s) => s.createOnboardingRequest);
  const projects = useAdminPortalStore((s) => s.projects);
  const role = useAdminAuthStore((s) => s.role);
  const isSuperAdmin = role === "super_admin";

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Project onboarding"
        title="Create Project Workspace"
        description="Set the project basics, then continue into launch readiness with the workspace already prepared."
        actions={
          <div className="flex min-w-[190px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sub">
                Creation mode
              </p>
              <p className="mt-1 text-[0.92rem] font-semibold text-text">
                {isSuperAdmin ? "Create now" : "Submit for review"}
              </p>
            </div>
            <OpsStatusPill tone={isSuperAdmin ? "success" : "warning"}>
              {isSuperAdmin ? "Opens instantly" : "Approval needed"}
            </OpsStatusPill>
          </div>
        }
      >
        <OpsPanel
          eyebrow="Start here"
          title="Create the workspace"
          description={
            isSuperAdmin
              ? "Fill the basics, create the project, then continue directly into Launch setup."
              : "Fill the basics and submit a focused onboarding request for review."
          }
          tone="accent"
        >
          <ProjectForm
            layout="horizontal"
            submitLabel={isSuperAdmin ? "Create project" : "Submit request"}
            onSubmit={async (values) => {
              if (isSuperAdmin) {
                const id = await createProject(values);
                router.push(`/projects/${id}/launch?source=project_create`);
                return;
              }

              await createOnboardingRequest({
                projectName: values.name,
                chain: values.chain,
                category: values.category || "",
                website: values.website || "",
                contactEmail: values.contactEmail || "",
                shortDescription: values.description,
                longDescription: values.longDescription || "",
                logo: values.logo,
                bannerUrl: values.bannerUrl || "",
                xUrl: values.xUrl || "",
                telegramUrl: values.telegramUrl || "",
                discordUrl: values.discordUrl || "",
                requestedPlanId: "",
              });
              router.push("/projects");
            }}
          />
        </OpsPanel>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] xl:items-start">
          <OpsPanel
            eyebrow="Reference"
            title="What helps this project onboard well"
            description="Required fields come first. Token and launch context can follow when the project is ready."
          >
            <ProjectOnboardingStepGrid steps={PROJECT_INTAKE_STEPS} />
          </OpsPanel>

          <OpsPanel
            eyebrow="After submit"
            title="Where the project goes next"
            description="Launch turns the new project into a checklist for profile, community, campaign, missions and rewards."
          >
            <ProjectOnboardingStepGrid steps={PROJECT_FIRST_RUN_STEPS} />
            {projects.length > 0 ? (
              <div className="mt-3">
                <ProjectOnboardingActionLink href="/projects">
                  View current projects
                </ProjectOnboardingActionLink>
              </div>
            ) : null}
          </OpsPanel>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
