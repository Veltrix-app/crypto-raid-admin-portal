"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import ProjectTrustCaseDetailPanel from "@/components/trust/ProjectTrustCaseDetailPanel";
import ProjectTrustCasesPanel from "@/components/trust/ProjectTrustCasesPanel";
import ProjectTrustPermissionsPanel from "@/components/trust/ProjectTrustPermissionsPanel";
import TrustCaseTimeline from "@/components/trust/TrustCaseTimeline";
import TrustHealthPanel from "@/components/trust/TrustHealthPanel";
import type {
  ProjectTrustAccessSummary,
  TrustCaseDetailRecord,
  TrustCaseListRow,
  TrustCaseTimelineEventRecord,
} from "@/components/trust/types";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import type { TrustCaseAction } from "@/lib/trust/trust-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ProjectTrustCaseDetailPayload = TrustCaseDetailRecord & {
  events: TrustCaseTimelineEventRecord[];
};

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
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [trustCases, setTrustCases] = useState<TrustCaseListRow[]>([]);
  const [trustAccess, setTrustAccess] = useState<ProjectTrustAccessSummary | null>(null);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [trustCaseDetail, setTrustCaseDetail] = useState<ProjectTrustCaseDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const project = getProjectById(params.id);

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  const hasProjectAccess =
    role === "super_admin" || memberships.some((item) => item.projectId === project?.id);

  async function loadTrustCases(preserveSelection = true) {
    if (!project?.id) {
      return;
    }

    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch(`/api/projects/${project.id}/trust-cases`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load project trust cases.");
      }

      const rows = (payload.cases ?? []) as TrustCaseListRow[];
      setTrustCases(rows);
      setTrustAccess((payload.access ?? null) as ProjectTrustAccessSummary | null);
      setSummaryOnly(Boolean(payload.summaryOnly));
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setTrustCases([]);
      setSelectedCaseId(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load project trust cases.");
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void loadTrustCases(false);
  }, [project?.id]);

  useEffect(() => {
    let active = true;

    async function loadTrustCaseDetail() {
      if (!project?.id || !selectedCaseId || summaryOnly) {
        setTrustCaseDetail(null);
        return;
      }

      try {
        setLoadingDetail(true);
        const response = await fetch(
          `/api/projects/${project.id}/trust-cases/${selectedCaseId}`,
          { cache: "no-store" }
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load project trust case detail.");
        }

        if (!active) {
          return;
        }

        setTrustCaseDetail((payload.trustCase ?? null) as ProjectTrustCaseDetailPayload | null);
      } catch (error) {
        if (!active) {
          return;
        }

        setTrustCaseDetail(null);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load project trust case detail."
        );
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadTrustCaseDetail();

    return () => {
      active = false;
    };
  }, [project?.id, selectedCaseId, summaryOnly]);

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

  const openCases = trustCases.filter(
    (trustCase) => trustCase.status === "open" || trustCase.status === "triaging"
  );
  const escalatedCases = trustCases.filter(
    (trustCase) =>
      trustCase.status === "escalated" ||
      trustCase.status === "needs_project_input" ||
      trustCase.escalationState !== "none"
  );
  const criticalCases = trustCases.filter(
    (trustCase) => trustCase.severity === "critical" || trustCase.severity === "high"
  );
  const canManagePermissions = Boolean(
    trustAccess && (trustAccess.isSuperAdmin || trustAccess.membershipRole === "owner")
  );
  const availableProjectActions = (trustAccess?.actionPermissions ?? []) as TrustCaseAction[];

  async function handleProjectAction(action: TrustCaseAction, notes: string) {
    if (!project?.id || !selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");
      const response = await fetch(
        `/api/projects/${project.id}/trust-cases/${selectedCaseId}/actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, notes }),
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to apply project trust action.");
      }

      setTrustCaseDetail((payload.trustCase ?? null) as ProjectTrustCaseDetailPayload | null);
      await loadTrustCases();
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to apply project trust action."
      );
    } finally {
      setActionBusy(null);
    }
  }

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
          operatorIncidentCount: openCases.length,
        })}
      >
        <TrustHealthPanel
          eyebrow="Project trust rail"
          title="Project trust posture"
          description="Stay on top of flagged members, project-visible escalations and the current contributor-risk mix for this community."
          metrics={[
            { label: "Cases", value: trustCases.length },
            {
              label: "Open",
              value: openCases.length,
              emphasis: openCases.length > 0 ? "warning" : "default",
            },
            {
              label: "High severity",
              value: criticalCases.length,
              emphasis: criticalCases.length > 0 ? "warning" : "default",
            },
            {
              label: "Escalated",
              value: escalatedCases.length,
              emphasis: escalatedCases.length > 0 ? "primary" : "default",
            },
          ]}
        />

        <OpsPanel
          eyebrow="Access posture"
          title="Current trust visibility"
          description="Project trust is deliberately permissioned. Owners decide what other teammates can inspect and which actions they may run."
        >
          <div className="flex flex-wrap gap-3">
            {(trustAccess?.visibilityPermissions ?? ["trust_summary"]).map((permission) => (
              <OpsStatusPill key={permission}>{permission.replace(/_/g, " ")}</OpsStatusPill>
            ))}
            {(trustAccess?.actionPermissions ?? []).map((permission) => (
              <OpsStatusPill key={permission} tone="warning">
                {permission.replace(/_/g, " ")}
              </OpsStatusPill>
            ))}
          </div>
          {summaryOnly ? (
            <p className="mt-4 text-sm leading-6 text-sub">
              This account is currently in summary-only mode. The owner can explicitly grant case
              list visibility or action scopes if this teammate should work trust cases.
            </p>
          ) : null}
        </OpsPanel>

        <ProjectTrustPermissionsPanel
          projectId={project.id}
          teamMembers={teamMembers}
          canManage={canManagePermissions}
        />

        {loadError ? (
          <div className="rounded-[18px] border border-white/[0.04] bg-white/[0.02] px-5 py-5 text-sm text-rose-300">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:items-start xl:grid-cols-[1.05fr_0.95fr]">
          <ProjectTrustCasesPanel
            rows={trustCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={summaryOnly ? undefined : setSelectedCaseId}
            emptyState={
              summaryOnly
                ? "This role currently has summary-only trust access."
                : "No project-specific trust cases are active right now."
            }
          />

          <div className="grid gap-4">
            <ProjectTrustCaseDetailPanel
              trustCase={summaryOnly ? null : trustCaseDetail}
              loading={loadingDetail}
              availableActions={availableProjectActions}
              actionBusy={actionBusy}
              onAction={handleProjectAction}
            />
            <TrustCaseTimeline
              events={trustCaseDetail?.events ?? []}
              loading={loadingDetail}
              emptyState={
                summaryOnly
                  ? "Resolution history is hidden until the owner grants that trust visibility."
                  : "No project-visible timeline events were recorded for this case yet."
              }
            />
          </div>
        </div>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
