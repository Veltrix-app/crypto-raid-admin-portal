"use client";

import Link from "next/link";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
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
  const columns: OpsTableColumn<AdminProject>[] = [
    {
      key: "project",
      label: "Project",
      render: (project) => (
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-xl shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
            {project.logo}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-text">{project.name}</p>
            <p className="mt-1 truncate text-xs text-sub">
              {(project.contactEmail || "No contact email") +
                " / " +
                (project.category || "Uncategorized")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "chain",
      label: "Chain",
      render: (project) => (
        <div>
          <p className="font-medium text-text">{project.chain}</p>
          <p className="mt-1 text-xs text-sub capitalize">
            {project.isPublic ? "Public surface" : "Private surface"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (project) => (
        <div className="flex flex-wrap gap-2">
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
        </div>
      ),
    },
    {
      key: "members",
      label: "Members",
      render: (project) => project.members.toLocaleString(),
    },
    {
      key: "campaigns",
      label: "Campaigns",
      render: (project) => project.campaigns.toLocaleString(),
    },
    {
      key: "open",
      label: "Open",
      render: (project) => (
        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${project.id}`} className="font-semibold text-primary">
            Workspace
          </Link>
          <Link href={`/projects/${project.id}/community`} className="font-semibold text-sub">
            Community
          </Link>
        </div>
      ),
    },
  ];

  return (
    <OpsTable
      columns={columns}
      rows={projects}
      getRowKey={(project) => project.id}
      emptyState={emptyState}
    />
  );
}
