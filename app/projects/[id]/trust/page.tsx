"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRoundCheck,
} from "lucide-react";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import ProjectTrustCaseDetailPanel from "@/components/trust/ProjectTrustCaseDetailPanel";
import ProjectTrustCasesPanel from "@/components/trust/ProjectTrustCasesPanel";
import ProjectTrustCockpitPanel from "@/components/trust/ProjectTrustCockpitPanel";
import ProjectTrustPermissionsPanel from "@/components/trust/ProjectTrustPermissionsPanel";
import TrustCaseTimeline from "@/components/trust/TrustCaseTimeline";
import TrustHealthPanel from "@/components/trust/TrustHealthPanel";
import type {
  ProjectTrustAccessSummary,
  TrustCaseDetailRecord,
  TrustCaseListRow,
  TrustCaseTimelineEventRecord,
} from "@/components/trust/types";
import type { TrustCockpitSnapshot } from "@/lib/trust/trust-cockpit";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import type { TrustCaseAction } from "@/lib/trust/trust-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ProjectTrustCaseDetailPayload = TrustCaseDetailRecord & {
  events: TrustCaseTimelineEventRecord[];
};

type ProjectTrustCommandDeckProps = {
  projectId: string;
  projectName: string;
  loadingCases: boolean;
  loadingCockpit: boolean;
  caseCount: number;
  openCaseCount: number;
  criticalCaseCount: number;
  escalatedCaseCount: number;
  summaryOnly: boolean;
  canManagePermissions: boolean;
  visibilityPermissionCount: number;
  actionPermissionCount: number;
  flaggedMemberCount: number;
  highRiskMemberCount: number;
  heldRewardCount: number;
};

function ProjectTrustCommandDeck({
  projectId,
  projectName,
  loadingCases,
  loadingCockpit,
  caseCount,
  openCaseCount,
  criticalCaseCount,
  escalatedCaseCount,
  summaryOnly,
  canManagePermissions,
  visibilityPermissionCount,
  actionPermissionCount,
  flaggedMemberCount,
  highRiskMemberCount,
  heldRewardCount,
}: ProjectTrustCommandDeckProps) {
  const loading = loadingCases || loadingCockpit;
  const nextDecision = loading
    ? "Loading trust posture"
    : summaryOnly
      ? "Ask owner for trust access"
      : criticalCaseCount > 0
        ? "Review critical trust signal"
        : heldRewardCount > 0
          ? "Review held rewards"
          : escalatedCaseCount > 0
            ? "Resolve project escalation"
            : openCaseCount > 0
              ? "Work open trust queue"
              : "Trust rail is calm";
  const readinessScore = Math.min(
    100,
    [
      !loading,
      !summaryOnly,
      criticalCaseCount === 0,
      heldRewardCount === 0,
      escalatedCaseCount === 0,
    ].filter(Boolean).length * 20
  );

  const routes = [
    {
      href: "#trust-cockpit",
      label: "Trust cockpit",
      title: "Read member risk",
      body: "Start here for flagged members, high-risk contributors and reward hold pressure.",
      signal: `${flaggedMemberCount} flagged / ${highRiskMemberCount} high`,
      icon: Eye,
      primary: !summaryOnly && (flaggedMemberCount > 0 || heldRewardCount > 0),
    },
    {
      href: "#trust-queue",
      label: "Case queue",
      title: "Work trust cases",
      body: "Use this when a project-visible signal needs notes, escalation or resolution.",
      signal: `${openCaseCount} open / ${caseCount} total`,
      icon: ShieldAlert,
      primary: !summaryOnly && openCaseCount > 0,
    },
    {
      href: "#trust-access",
      label: "Owner grants",
      title: "Set trust visibility",
      body: "Owners can grant member detail, evidence visibility and safe trust actions.",
      signal: canManagePermissions ? "owner controls" : "view access",
      icon: KeyRound,
      primary: summaryOnly || canManagePermissions,
    },
    {
      href: `/projects/${projectId}/rewards`,
      label: "Reward rail",
      title: "Check held rewards",
      body: "Jump to reward inventory when trust posture is blocking claim or reward movement.",
      signal: `${heldRewardCount} held`,
      icon: UserRoundCheck,
      primary: !summaryOnly && heldRewardCount > 0,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(186,255,59,0.074),transparent_28%),radial-gradient(circle_at_86%_8%,rgba(74,217,255,0.05),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(6,8,13,0.96))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.011)_1px,transparent_1px)] bg-[length:58px_58px] opacity-[0.25]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div className="min-w-0 rounded-[18px] border border-white/[0.022] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/[0.16] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              <ShieldCheck size={12} />
              Trust command
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              <BadgeCheck size={12} className="text-primary" />
              {projectName}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.35fr)] lg:items-end">
            <div className="min-w-0">
              <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Keep trust decisions readable before rewards move.
              </h2>
              <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
                One project-safe surface for member risk, evidence visibility, held rewards
                and owner-granted trust actions.
              </p>
            </div>

            <div className="rounded-[16px] border border-primary/[0.1] bg-primary/[0.035] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                    Next decision
                  </p>
                  <p className="mt-1.5 text-[0.9rem] font-semibold tracking-[-0.02em] text-text">
                    {nextDecision}
                  </p>
                </div>
                <Siren size={17} className="shrink-0 text-primary" />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.35)]"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <TrustBoardSignal
              icon={<ShieldAlert size={14} />}
              label="Open cases"
              value={openCaseCount}
              sub={`${criticalCaseCount} high`}
            />
            <TrustBoardSignal
              icon={<UserRoundCheck size={14} />}
              label="Risk members"
              value={highRiskMemberCount}
              sub={`${flaggedMemberCount} flagged`}
            />
            <TrustBoardSignal
              icon={<Eye size={14} />}
              label="Access mode"
              value={summaryOnly ? "Summary" : "Case"}
              sub={`${visibilityPermissionCount} signals`}
            />
            <TrustBoardSignal
              icon={<KeyRound size={14} />}
              label="Actions"
              value={actionPermissionCount}
              sub={canManagePermissions ? "owner" : "granted"}
            />
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Trust route
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                Choose the surface that matches the trust question.
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-primary" />
          </div>

          <div className="grid gap-2">
            {routes.map((route) => {
              const Icon = route.icon;

              return (
                <Link
                  key={route.label}
                  href={route.href}
                  className={`group rounded-[15px] border p-3 transition-all duration-200 hover:-translate-y-0.5 ${
                    route.primary
                      ? "border-primary/[0.16] bg-primary/[0.055]"
                      : "border-white/[0.022] bg-black/20 hover:border-white/[0.06] hover:bg-white/[0.026]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.025] bg-white/[0.025] text-primary">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-primary">
                        {route.label}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-text">{route.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-sub">
                        {route.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sub">
                        <span>{route.signal}</span>
                        <span className="text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                          Open
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBoardSignal({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-white/[0.012] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-sub">
          {label}
        </p>
        <span className="shrink-0 text-primary">{icon}</span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
          {value}
        </p>
        <p className="truncate text-[10px] font-semibold text-sub">{sub}</p>
      </div>
    </div>
  );
}

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
  const [trustCockpit, setTrustCockpit] = useState<TrustCockpitSnapshot | null>(null);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingCockpit, setLoadingCockpit] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cockpitError, setCockpitError] = useState<string | null>(null);
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

  async function loadTrustCockpit() {
    if (!project?.id) {
      return;
    }

    try {
      setLoadingCockpit(true);
      setCockpitError(null);
      const response = await fetch(`/api/projects/${project.id}/trust-cockpit`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load project trust cockpit.");
      }

      setTrustCockpit((payload.cockpit ?? null) as TrustCockpitSnapshot | null);
      setTrustAccess((payload.access ?? null) as ProjectTrustAccessSummary | null);
    } catch (error) {
      setTrustCockpit(null);
      setCockpitError(
        error instanceof Error ? error.message : "Failed to load project trust cockpit."
      );
    } finally {
      setLoadingCockpit(false);
    }
  }

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
    void loadTrustCockpit();
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
  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);

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
          campaignCount: projectCampaigns.length,
          questCount: projectQuests.length,
          rewardCount: projectRewards.length,
          operatorIncidentCount: openCases.length,
        })}
      >
        <ProjectTrustCommandDeck
          projectId={project.id}
          projectName={project.name}
          loadingCases={loadingCases}
          loadingCockpit={loadingCockpit}
          caseCount={trustCases.length}
          openCaseCount={openCases.length}
          criticalCaseCount={criticalCases.length}
          escalatedCaseCount={escalatedCases.length}
          summaryOnly={summaryOnly}
          canManagePermissions={canManagePermissions}
          visibilityPermissionCount={trustAccess?.visibilityPermissions.length ?? 0}
          actionPermissionCount={trustAccess?.actionPermissions.length ?? 0}
          flaggedMemberCount={trustCockpit?.summary.flaggedMembers ?? 0}
          highRiskMemberCount={trustCockpit?.summary.highRiskMembers ?? 0}
          heldRewardCount={trustCockpit?.summary.heldRewards ?? 0}
        />

        <TrustHealthPanel
          eyebrow="Trust snapshot"
          title="Current posture"
          description="Compact counts for cases, severity and escalations after the command route."
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

        <div id="trust-cockpit">
          <ProjectTrustCockpitPanel
            cockpit={trustCockpit}
            loading={loadingCockpit}
            error={cockpitError}
            onRetry={() => void loadTrustCockpit()}
          />
        </div>

        <div
          id="trust-access"
          className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start"
        >
          <OpsPanel
            eyebrow="Access posture"
            title="Current trust visibility"
            description="Owners decide what teammates can inspect and which trust actions they may run."
          >
            <div className="flex flex-wrap gap-2">
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
              <p className="mt-3 text-sm leading-6 text-sub">
                Summary-only mode is active. The owner can grant case visibility or action scopes when this teammate should work trust cases.
              </p>
            ) : null}
          </OpsPanel>

          <ProjectTrustPermissionsPanel
            projectId={project.id}
            teamMembers={teamMembers}
            canManage={canManagePermissions}
          />
        </div>

        {loadError ? (
          <div className="rounded-[16px] border border-rose-500/20 bg-rose-500/[0.055] px-4 py-4 text-sm text-rose-300">
            {loadError}
          </div>
        ) : null}

        <div id="trust-queue" className="grid gap-3 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
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

          <div className="grid gap-3">
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
