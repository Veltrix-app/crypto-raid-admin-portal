"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useAdminPortalStore((s) => s.createProject);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Project Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Project</h1>
          <p className="mt-2 text-sm text-sub">
            Create a new project profile and move it through onboarding.
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <ProjectForm
            onSubmit={(values) => {
              const id = createProject(values);
              router.push(`/projects/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}