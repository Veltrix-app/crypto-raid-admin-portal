"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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
        title="Create Project Workspace"
        description="Create the project with a focused payload, then move directly into launch readiness."
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
        statusBand={
          <ProjectCreationStatusBand
            isSuperAdmin={isSuperAdmin}
            projectCount={projects.length}
          />
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
      </PortalPageFrame>
    </AdminShell>
  );
}

function ProjectCreationStatusBand({
  isSuperAdmin,
  projectCount,
}: {
  isSuperAdmin: boolean;
  projectCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.024] bg-[radial-gradient(circle_at_6%_0%,rgba(199,255,0,0.075),transparent_26%),radial-gradient(circle_at_90%_12%,rgba(88,146,255,0.045),transparent_24%),linear-gradient(180deg,rgba(12,15,22,0.98),rgba(7,9,14,0.96))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.45fr)] xl:items-center">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            <Rocket size={12} />
            Creation route
          </p>
          <h2 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.2rem]">
            Start small, then let Launch guide the rest
          </h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
            The page now prioritizes the working task: create a recognizable project workspace without burying teams under reference panels.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <ProjectCreationSignal
            icon={<ShieldCheck size={13} />}
            label="Mode"
            value={isSuperAdmin ? "Create instantly" : "Submit for review"}
          />
          <ProjectCreationSignal
            icon={<ArrowRight size={13} />}
            label="After submit"
            value={isSuperAdmin ? "Open Launch setup" : "Return to project board"}
          />
          <ProjectCreationSignal
            icon={<Sparkles size={13} />}
            label="Workspace count"
            value={`${projectCount} current project${projectCount === 1 ? "" : "s"}`}
          />
        </div>
      </div>
    </section>
  );
}

function ProjectCreationSignal({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.024] bg-black/25 px-3 py-2.5">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}
