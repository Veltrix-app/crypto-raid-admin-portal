"use client";

import { useRouter } from "next/navigation";
import ProjectForm from "@/components/forms/project/ProjectForm";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
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
        title="New Project"
        description="A calmer entry rail for either direct workspace creation or onboarding intake, depending on who is opening this form."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Creation mode</p>
            <p className="text-lg font-extrabold text-text">
              {isSuperAdmin ? "Direct workspace create" : "Onboarding request"}
            </p>
            <OpsStatusPill tone={isSuperAdmin ? "success" : "warning"}>
              {isSuperAdmin ? "No approval gate" : "Needs review"}
            </OpsStatusPill>
          </div>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-3">
            <OpsMetricCard label="Existing projects" value={projects.length} />
            <OpsMetricCard
              label="Flow"
              value={isSuperAdmin ? "Create" : "Submit"}
              emphasis={isSuperAdmin ? "primary" : "warning"}
            />
            <OpsMetricCard
              label="Outcome"
              value={isSuperAdmin ? "Workspace opens instantly" : "Lands in onboarding queue"}
            />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Project intake"
            title="Core project setup"
            description={
              isSuperAdmin
                ? "Create a new workspace profile directly from the admin surface."
                : "Submit a strong onboarding package so the project can move through review cleanly."
            }
          >
            <ProjectForm
              submitLabel={isSuperAdmin ? "Create project" : "Submit request"}
              onSubmit={async (values) => {
                if (isSuperAdmin) {
                  const id = await createProject(values);
                  router.push(`/projects/${id}`);
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

          <div className="space-y-6">
            <OpsPanel
              eyebrow="Readiness guide"
              title="What a strong intake includes"
              description="These are the fields that make the next steps materially easier for reviewers and operators."
              tone="accent"
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Identity" value="Clear name, short description and category" />
                <OpsSnapshotRow label="Contactability" value="Website or contact email ready" />
                <OpsSnapshotRow label="Community" value="Discord, Telegram or X linked where possible" />
                <OpsSnapshotRow label="Launch context" value="Banner, docs and waitlist context if available" />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Flow outcome"
              title="What happens next"
              description="Keep the creation path explicit so the operator knows exactly what the submit button will do."
            >
              <div className="space-y-3">
                <OpsSnapshotRow
                  label="Route"
                  value={isSuperAdmin ? "Project is created immediately" : "Request is sent to onboarding review"}
                />
                <OpsSnapshotRow
                  label="Landing"
                  value={isSuperAdmin ? "Redirects into the new project workspace" : "Returns to the projects board"}
                />
                <OpsSnapshotRow
                  label="Team expectation"
                  value={isSuperAdmin ? "Operators can continue setup right away" : "Reviewers will validate the submission first"}
                />
              </div>
            </OpsPanel>
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
