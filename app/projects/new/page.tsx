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
  ProjectOnboardingHero,
  ProjectOnboardingPriorityPill,
  ProjectOnboardingRail,
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
        description="Start with the essentials, then let the launch workspace guide the project into campaigns, missions, rewards and public readiness."
        actions={
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sub">
              Creation mode
            </p>
            <p className="text-[0.98rem] font-semibold text-text">
              {isSuperAdmin ? "Create now" : "Submit for review"}
            </p>
            <OpsStatusPill tone={isSuperAdmin ? "success" : "warning"}>
              {isSuperAdmin ? "Opens instantly" : "Approval needed"}
            </OpsStatusPill>
          </div>
        }
        statusBand={
          <ProjectOnboardingHero
            title="Give the project a clear path to its first launch."
            description="This flow only asks for the context Veltrix needs to create a useful workspace. The deeper setup comes after creation, inside the project launch cockpit, so teams are never left guessing where to go next."
            modeLabel={isSuperAdmin ? "Admin creates the workspace directly" : "Project submits an onboarding request"}
            outcomeLabel={
              isSuperAdmin
                ? "The project opens and can continue setup immediately"
                : "The request lands in the onboarding queue for review"
            }
          >
            <div className="flex flex-wrap gap-2">
              <ProjectOnboardingPriorityPill priority="required" />
              <ProjectOnboardingPriorityPill priority="recommended" />
              <ProjectOnboardingPriorityPill priority="later" />
            </div>
          </ProjectOnboardingHero>
        }
      >
        <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
          <OpsPanel
            eyebrow="Intake map"
            title="What the project needs to provide"
            description="The page now separates must-have launch context from helpful polish and advanced automation context."
            tone="accent"
          >
            <ProjectOnboardingStepGrid steps={PROJECT_INTAKE_STEPS} />
          </OpsPanel>

          <ProjectOnboardingRail
            title="What happens after creation"
            description="The first launch cockpit turns the project into a checklist instead of sending teams through the portal tree."
            steps={PROJECT_FIRST_RUN_STEPS}
            action={
              projects.length > 0 ? (
                <ProjectOnboardingActionLink href="/projects">
                  View current projects
                </ProjectOnboardingActionLink>
              ) : null
            }
          />
        </div>

        <OpsPanel
          eyebrow="Project intake"
          title="Create the workspace from guided basics"
          description={
            isSuperAdmin
              ? "Create the project with the same backend flow, then continue into launch setup from the new workspace."
              : "Submit a focused onboarding request with enough context for review and setup handoff."
          }
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
      </PortalPageFrame>
    </AdminShell>
  );
}
