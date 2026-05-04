"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  FileWarning,
  KeyRound,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
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

type ProjectPayoutCommandDeckProps = {
  projectId: string;
  projectName: string;
  loading: boolean;
  caseCount: number;
  openCaseCount: number;
  criticalCaseCount: number;
  escalatedCaseCount: number;
  pendingClaimCount: number;
  rewardCount: number;
  summaryOnly: boolean;
  canManagePermissions: boolean;
  visibilityPermissionCount: number;
  actionPermissionCount: number;
};

function ProjectPayoutCommandDeck({
  projectId,
  projectName,
  loading,
  caseCount,
  openCaseCount,
  criticalCaseCount,
  escalatedCaseCount,
  pendingClaimCount,
  rewardCount,
  summaryOnly,
  canManagePermissions,
  visibilityPermissionCount,
  actionPermissionCount,
}: ProjectPayoutCommandDeckProps) {
  const nextDecision = loading
    ? "Loading payout posture"
    : summaryOnly
      ? "Ask owner for case access"
      : criticalCaseCount > 0
        ? "Handle high severity case"
        : escalatedCaseCount > 0
          ? "Resolve project escalation"
          : openCaseCount > 0
            ? "Review open payout queue"
            : pendingClaimCount > 0
              ? "Watch pending claims"
              : "Payout rail is calm";
  const readinessScore = Math.min(
    100,
    [
      !loading,
      !summaryOnly,
      criticalCaseCount === 0,
      escalatedCaseCount === 0,
      openCaseCount === 0,
    ].filter(Boolean).length * 20
  );

  const routes = [
    {
      href: "#payout-queue",
      label: "Case queue",
      title: "Inspect blockers",
      body: "Use this when claims, stock, delivery or payout evidence needs project follow-through.",
      signal: `${openCaseCount} open / ${caseCount} total`,
      icon: FileWarning,
      primary: !summaryOnly && openCaseCount > 0,
    },
    {
      href: `/projects/${projectId}/rewards`,
      label: "Reward rail",
      title: "Check funding source",
      body: "Go back to reward inventory when payout pressure starts with funding or claim setup.",
      signal: `${rewardCount} rewards`,
      icon: WalletCards,
      primary: !summaryOnly && openCaseCount === 0 && pendingClaimCount > 0,
    },
    {
      href: "#payout-access",
      label: "Owner grants",
      title: "Set payout visibility",
      body: "Owners can grant case visibility and safe project payout actions to trusted teammates.",
      signal: canManagePermissions ? "owner controls" : "view access",
      icon: KeyRound,
      primary: summaryOnly || canManagePermissions,
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
              Payout command
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.03] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              <BadgeCheck size={12} className="text-primary" />
              {projectName}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.35fr)] lg:items-end">
            <div className="min-w-0">
              <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Resolve payout blockers without losing the route.
              </h2>
              <p className="mt-1.5 max-w-4xl text-[12px] leading-5 text-sub">
                One project-safe surface for claim pressure, escalations, owner grants and the
                next payout action.
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
                <TicketCheck size={17} className="shrink-0 text-primary" />
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
            <PayoutBoardSignal
              icon={<FileWarning size={14} />}
              label="Open cases"
              value={openCaseCount}
              sub={`${criticalCaseCount} high`}
            />
            <PayoutBoardSignal
              icon={<TicketCheck size={14} />}
              label="Pending claims"
              value={pendingClaimCount}
              sub={`${caseCount} cases`}
            />
            <PayoutBoardSignal
              icon={<ShieldCheck size={14} />}
              label="Access mode"
              value={summaryOnly ? "Summary" : "Case"}
              sub={`${visibilityPermissionCount} signals`}
            />
            <PayoutBoardSignal
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
                Payout route
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                Choose the surface that matches the blocker.
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

function PayoutBoardSignal({
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
  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  const projectQuests = quests.filter((quest) => quest.projectId === project.id);
  const projectRewards = rewards.filter((reward) => reward.projectId === project.id);

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
          campaignCount: projectCampaigns.length,
          questCount: projectQuests.length,
          rewardCount: projectRewards.length,
          operatorIncidentCount: openCases.length,
        })}
      >
        <ProjectPayoutCommandDeck
          projectId={project.id}
          projectName={project.name}
          loading={loadingCases}
          caseCount={payoutCases.length}
          openCaseCount={openCases.length}
          criticalCaseCount={criticalCases.length}
          escalatedCaseCount={escalatedCases.length}
          pendingClaimCount={pendingClaims}
          rewardCount={projectRewards.length}
          summaryOnly={summaryOnly}
          canManagePermissions={canManagePermissions}
          visibilityPermissionCount={payoutAccess?.visibilityPermissions.length ?? 0}
          actionPermissionCount={payoutAccess?.actionPermissions.length ?? 0}
        />

        <PayoutHealthPanel
          eyebrow="Payout snapshot"
          title="Current posture"
          description="Compact counts for cases, severity and pending claims after the command route."
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

        <div
          id="payout-access"
          className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start"
        >
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

        <div id="payout-queue" className="grid gap-3 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
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
