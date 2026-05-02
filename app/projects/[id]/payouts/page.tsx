"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import ProjectPayoutCaseDetailPanel from "@/components/payout/ProjectPayoutCaseDetailPanel";
import ProjectPayoutCasesPanel from "@/components/payout/ProjectPayoutCasesPanel";
import ProjectPayoutPermissionsPanel from "@/components/payout/ProjectPayoutPermissionsPanel";
import PayoutCaseTimeline from "@/components/payout/PayoutCaseTimeline";
import PayoutHealthPanel from "@/components/payout/PayoutHealthPanel";
import type {
  PayoutCaseDetailRecord,
  PayoutCaseListRow,
  PayoutCaseTimelineEventRecord,
  ProjectPayoutAccessSummary,
} from "@/components/payout/types";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import type { PayoutCaseAction } from "@/lib/payout/payout-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ProjectPayoutCaseDetailPayload = PayoutCaseDetailRecord & {
  events: PayoutCaseTimelineEventRecord[];
};

function mapProjectActionPermissionsToActions(
  permissions: string[]
): PayoutCaseAction[] {
  const actions: PayoutCaseAction[] = [];
  if (permissions.includes("annotate_case")) actions.push("annotate");
  if (permissions.includes("escalate_case")) actions.push("escalate");
  if (permissions.includes("retry_project_flow")) actions.push("retry");
  if (permissions.includes("resolve_project_blocker")) actions.push("resolve");
  if (permissions.includes("freeze_reward")) actions.push("freeze_reward");
  if (permissions.includes("pause_claim_rail")) actions.push("pause_claim_rail");
  if (permissions.includes("payout_override")) actions.push("payout_override");
  return actions;
}

export default function ProjectPayoutPage() {
  const params = useParams<{ id: string }>();
  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const claims = useAdminPortalStore((s) => s.claims);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [payoutCases, setPayoutCases] = useState<PayoutCaseListRow[]>([]);
  const [payoutAccess, setPayoutAccess] = useState<ProjectPayoutAccessSummary | null>(null);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [payoutCaseDetail, setPayoutCaseDetail] = useState<ProjectPayoutCaseDetailPayload | null>(null);
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

  async function loadPayoutCases(preserveSelection = true) {
    if (!project?.id) {
      return;
    }

    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch(`/api/projects/${project.id}/payout-cases`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load project payout cases.");
      }

      const rows = (payload.cases ?? []) as PayoutCaseListRow[];
      setPayoutCases(rows);
      setPayoutAccess((payload.access ?? null) as ProjectPayoutAccessSummary | null);
      setSummaryOnly(Boolean(payload.summaryOnly));
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setPayoutCases([]);
      setSelectedCaseId(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load project payout cases.");
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void loadPayoutCases(false);
  }, [project?.id]);

  useEffect(() => {
    let active = true;

    async function loadPayoutCaseDetail() {
      if (!project?.id || !selectedCaseId || summaryOnly) {
        setPayoutCaseDetail(null);
        return;
      }

      try {
        setLoadingDetail(true);
        const response = await fetch(
          `/api/projects/${project.id}/payout-cases/${selectedCaseId}`,
          { cache: "no-store" }
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load project payout case detail.");
        }

        if (!active) {
          return;
        }

        setPayoutCaseDetail((payload.payoutCase ?? null) as ProjectPayoutCaseDetailPayload | null);
      } catch (error) {
        if (!active) {
          return;
        }

        setPayoutCaseDetail(null);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load project payout case detail."
        );
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadPayoutCaseDetail();

    return () => {
      active = false;
    };
  }, [project?.id, selectedCaseId, summaryOnly]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This payout workspace could not be resolved from the current project state."
        />
      </AdminShell>
    );
  }

  if (!hasProjectAccess) {
    return (
      <AdminShell>
        <NotFoundState
          title="Payout access is project-scoped"
          description="Only members of this project can open this payout workspace."
        />
      </AdminShell>
    );
  }

  const openCases = payoutCases.filter(
    (payoutCase) =>
      payoutCase.status === "open" ||
      payoutCase.status === "triaging" ||
      payoutCase.status === "blocked"
  );
  const escalatedCases = payoutCases.filter(
    (payoutCase) =>
      payoutCase.status === "needs_project_input" ||
      payoutCase.escalationState !== "none"
  );
  const criticalCases = payoutCases.filter(
    (payoutCase) => payoutCase.severity === "critical" || payoutCase.severity === "high"
  );
  const canManagePermissions = Boolean(
    payoutAccess && (payoutAccess.isSuperAdmin || payoutAccess.membershipRole === "owner")
  );
  const availableProjectActions = mapProjectActionPermissionsToActions(
    payoutAccess?.actionPermissions ?? []
  );
  const pendingClaims = claims.filter((claim) => claim.projectId === project.id && claim.status === "pending")
    .length;

  async function handleProjectAction(action: PayoutCaseAction, notes: string) {
    if (!project?.id || !selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");
      const response = await fetch(
        `/api/projects/${project.id}/payout-cases/${selectedCaseId}/actions`,
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
        throw new Error(payload?.error ?? "Failed to apply project payout action.");
      }

      setPayoutCaseDetail((payload.payoutCase ?? null) as ProjectPayoutCaseDetailPayload | null);
      await loadPayoutCases();
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to apply project payout action."
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
        <PayoutHealthPanel
          eyebrow="Project payout rail"
          title="Project payout posture"
          description="Stay on top of blocked claims, payout incidents, stock pressure and the cases that currently need project-side follow-through."
          metrics={[
            { label: "Cases", value: payoutCases.length },
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
              label: "Pending claims",
              value: pendingClaims,
              emphasis: pendingClaims > 0 ? "primary" : "default",
            },
          ]}
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <OpsPanel
            eyebrow="Access posture"
            title="Current payout visibility"
            description="Owners decide what teammates can inspect and which payout actions they may run."
          >
            <div className="flex flex-wrap gap-2">
              {(payoutAccess?.visibilityPermissions ?? ["payout_summary"]).map((permission) => (
                <OpsStatusPill key={permission}>{permission.replace(/_/g, " ")}</OpsStatusPill>
              ))}
              {(payoutAccess?.actionPermissions ?? []).map((permission) => (
                <OpsStatusPill key={permission} tone="warning">
                  {permission.replace(/_/g, " ")}
                </OpsStatusPill>
              ))}
            </div>
            {summaryOnly ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                Summary-only mode is active. The owner can grant case visibility or safe payout actions when this teammate should help with blocked claims.
              </p>
            ) : null}
          </OpsPanel>

          <ProjectPayoutPermissionsPanel
            projectId={project.id}
            teamMembers={teamMembers}
            canManage={canManagePermissions}
          />
        </div>

        {loadError ? (
          <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/[0.055] px-5 py-5 text-sm text-rose-300">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-3 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
          <ProjectPayoutCasesPanel
            rows={payoutCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={summaryOnly ? undefined : setSelectedCaseId}
            emptyState={
              summaryOnly
                ? "This role currently has summary-only payout access."
                : "No project-specific payout cases are active right now."
            }
          />

          <div className="grid gap-3">
            <ProjectPayoutCaseDetailPanel
              payoutCase={summaryOnly ? null : payoutCaseDetail}
              loading={loadingDetail}
              availableActions={availableProjectActions}
              actionBusy={actionBusy}
              onAction={handleProjectAction}
            />
            <PayoutCaseTimeline
              events={payoutCaseDetail?.events ?? []}
              loading={loadingDetail}
              emptyState={
                summaryOnly
                  ? "Resolution history is hidden until the owner grants that payout visibility."
                  : "No project-visible timeline events were recorded for this payout case yet."
              }
            />
          </div>
        </div>
      </ProjectWorkspaceFrame>
    </AdminShell>
  );
}
