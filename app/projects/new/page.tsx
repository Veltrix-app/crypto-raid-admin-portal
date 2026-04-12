"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useAdminPortalStore((s) => s.createProject);
  const createOnboardingRequest = useAdminPortalStore((s) => s.createOnboardingRequest);
  const role = useAdminAuthStore((s) => s.role);
  const isSuperAdmin = role === "super_admin";

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Project Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Project</h1>
          <p className="mt-2 text-sm text-sub">
            {isSuperAdmin
              ? "Create a new project profile directly from the admin workspace."
              : "Submit a new project for onboarding review and approval."}
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <ProjectForm
            submitLabel={isSuperAdmin ? "Create Project" : "Submit Request"}
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
        </div>
      </div>
    </AdminShell>
  );
}
