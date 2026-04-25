"use client";

import Link from "next/link";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { AdminProject } from "@/types/entities/project";

type ProjectsRosterTableProps = {
  projects: AdminProject[];
  emptyState: string;
};

export default function ProjectsRosterTable({
  projects,
  emptyState,
}: ProjectsRosterTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.04] bg-white/[0.018] px-4 py-5 text-sm text-sub">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))]">
      <div className="hidden grid-cols-[minmax(0,1.8fr)_120px_220px_140px_150px] gap-3 border-b border-white/[0.04] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sub lg:grid">
        <span>Workspace</span>
        <span>Chain</span>
        <span>State</span>
        <span>Coverage</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-white/[0.045]">
        {projects.map((project) => (
          <article key={project.id} className="px-4 py-3">
            <div className="hidden items-center gap-3 lg:grid lg:grid-cols-[minmax(0,1.8fr)_120px_220px_140px_150px]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.05] bg-white/[0.025] text-[0.95rem]">
                  {project.logo}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-text">{project.name}</p>
                  <p className="mt-1 truncate text-[11px] text-sub">
                    {project.contactEmail || "No contact email"}
                    {project.category ? ` • ${project.category}` : ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[12px] font-semibold text-text">{project.chain}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <OpsStatusPill
                  tone={
                    project.status === "active"
                      ? "success"
                      : project.status === "draft"
                        ? "warning"
                        : "default"
                  }
                >
                  {project.status}
                </OpsStatusPill>
                <OpsStatusPill
                  tone={
                    project.onboardingStatus === "approved"
                      ? "success"
                      : project.onboardingStatus === "pending"
                        ? "warning"
                        : "default"
                  }
                >
                  {project.onboardingStatus}
                </OpsStatusPill>
                <OpsStatusPill tone={project.isPublic ? "success" : "default"}>
                  {project.isPublic ? "Public" : "Private"}
                </OpsStatusPill>
              </div>

              <div className="text-[12px] text-text">
                <p className="font-semibold">{project.members.toLocaleString()} members</p>
                <p className="mt-1 text-sub">{project.campaigns.toLocaleString()} campaigns</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-[12px] font-semibold text-primary transition hover:text-primary/80"
                >
                  Workspace
                </Link>
                <Link
                  href={`/projects/${project.id}/community`}
                  className="text-[12px] font-semibold text-sub transition hover:text-text"
                >
                  Community
                </Link>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.05] bg-white/[0.025] text-[0.95rem]">
                    {project.logo}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-text">{project.name}</p>
                    <p className="mt-1 truncate text-[11px] text-sub">
                      {project.chain}
                      {project.category ? ` • ${project.category}` : ""}
                    </p>
                  </div>
                </div>
                <OpsStatusPill
                  tone={
                    project.status === "active"
                      ? "success"
                      : project.status === "draft"
                        ? "warning"
                        : "default"
                  }
                >
                  {project.status}
                </OpsStatusPill>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <OpsStatusPill
                  tone={
                    project.onboardingStatus === "approved"
                      ? "success"
                      : project.onboardingStatus === "pending"
                        ? "warning"
                        : "default"
                  }
                >
                  {project.onboardingStatus}
                </OpsStatusPill>
                <OpsStatusPill tone={project.isPublic ? "success" : "default"}>
                  {project.isPublic ? "Public" : "Private"}
                </OpsStatusPill>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ProjectMetric label="Members" value={project.members.toLocaleString()} />
                <ProjectMetric label="Campaigns" value={project.campaigns.toLocaleString()} />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.04] pt-2.5">
                <Link href={`/projects/${project.id}`} className="text-[12px] font-semibold text-primary">
                  Workspace
                </Link>
                <Link href={`/projects/${project.id}/community`} className="text-[12px] font-semibold text-sub">
                  Community
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.018] px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}
