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
      <div className="rounded-[24px] border border-white/6 bg-white/[0.02] px-4 py-5 text-sm text-sub">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-3 2xl:grid-cols-4">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,18,24,0.98),rgba(8,10,14,0.98))] p-3.5 shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/6 bg-white/[0.03] text-[0.96rem] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                {project.logo}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                  {project.name}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-sub">
                  {(project.contactEmail || "No contact email") +
                    " / " +
                    (project.category || "Uncategorized")}
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

          <div className="mt-3 flex flex-wrap gap-2">
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

          <div className="mt-3 grid grid-cols-3 gap-2">
            <ProjectMetric label="Chain" value={project.chain} />
            <ProjectMetric label="Members" value={project.members.toLocaleString()} />
            <ProjectMetric label="Campaigns" value={project.campaigns.toLocaleString()} />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3.5">
            <Link href={`/projects/${project.id}`} className="text-[12px] font-semibold text-primary transition hover:text-primary/80">
              Workspace
            </Link>
            <Link href={`/projects/${project.id}/community`} className="text-[12px] font-semibold text-sub transition hover:text-text">
              Community
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-white/[0.02] px-2.5 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}
