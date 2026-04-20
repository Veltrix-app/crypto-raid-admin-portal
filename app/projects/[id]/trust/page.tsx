"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import OpsTable, { type OpsTableColumn } from "@/components/layout/ops/OpsTable";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { AdminReviewFlag } from "@/types/entities/review-flag";

export default function ProjectTrustPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);

  const project = getProjectById(params.id);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This trust workspace could not be resolved from the current project state."
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
          title="Trust access is project-scoped"
          description="Only members of this project can open this trust workspace."
        />
      </AdminShell>
    );
  }

  const projectFlags = reviewFlags.filter((flag) => flag.projectId === project.id);
  const openFlags = projectFlags.filter((flag) => flag.status === "open");
  const highSeverityFlags = openFlags.filter((flag) => flag.severity === "high");

  const flagColumns: OpsTableColumn<AdminReviewFlag>[] = [
    {
      key: "reason",
      label: "Signal",
      render: (flag) => (
        <div>
          <p className="font-semibold text-text">{flag.flagType}</p>
          <p className="mt-1 text-xs text-sub">{flag.reason || "No reason was recorded."}</p>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      render: (flag) => (
        <OpsStatusPill tone={flag.severity === "high" ? "danger" : flag.severity === "medium" ? "warning" : "default"}>
          {flag.severity}
        </OpsStatusPill>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (flag) => (
        <OpsStatusPill tone={flag.status === "open" ? "warning" : "success"}>
          {flag.status}
        </OpsStatusPill>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (flag) => flag.sourceTable,
    },
    {
      key: "user",
      label: "Contributor",
      render: (flag) => flag.username || "Unknown",
    },
  ];

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
          operatorIncidentCount: openFlags.length,
        })}
      >
        <OpsPanel
          eyebrow="Trust rail"
          title="Project trust posture"
          description="Scan the project-specific trust queue and see whether contributor quality drift is building."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="Flags" value={projectFlags.length} />
            <OpsMetricCard label="Open" value={openFlags.length} emphasis={openFlags.length > 0 ? "warning" : "default"} />
            <OpsMetricCard
              label="High severity"
              value={highSeverityFlags.length}
              emphasis={highSeverityFlags.length > 0 ? "warning" : "default"}
            />
            <OpsMetricCard
              label="Resolved"
              value={projectFlags.filter((flag) => flag.status !== "open").length}
            />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Trust queue"
          title="Project review flags"
          description="Use the global moderation center for heavy operations, but keep this route as the project-scoped readout."
        >
          <OpsTable
            columns={flagColumns}
            rows={projectFlags}
            getRowKey={(flag) => flag.id}
            emptyState="No project-specific trust flags are active right now."
          />
        </OpsPanel>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
