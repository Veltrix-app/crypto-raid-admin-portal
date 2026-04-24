"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { PortalBillingBlockNotice } from "@/components/billing/PortalBillingBlockNotice";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSnapshotRow,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import ProjectsBoardHeader from "@/components/projects/ProjectsBoardHeader";
import ProjectsOnboardingQueue from "@/components/projects/ProjectsOnboardingQueue";
import ProjectsRosterTable from "@/components/projects/ProjectsRosterTable";
import { bootstrapPortalWorkspaceProject } from "@/lib/accounts/account-onboarding";
import {
  isBillingLimitError,
  type BillingLimitBlock,
} from "@/lib/billing/entitlement-blocks";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminFiltersStore } from "@/store/filters/useAdminFiltersStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

function ProjectsPageContent() {
  const router = useRouter();
  const projects = useAdminPortalStore((s) => s.projects);
  const loadAll = useAdminPortalStore((s) => s.loadAll);
  const onboardingRequests = useAdminPortalStore((s) => s.onboardingRequests);
  const approveOnboardingRequest = useAdminPortalStore((s) => s.approveOnboardingRequest);
  const rejectOnboardingRequest = useAdminPortalStore((s) => s.rejectOnboardingRequest);
  const role = useAdminAuthStore((s) => s.role);
  const refreshMemberships = useAdminAuthStore((s) => s.refreshMemberships);
  const { accessState, refresh } = useAccountEntryGuard();
  const isSuperAdmin = role === "super_admin";
  const { search, status, setSearch, setStatus, resetFilters } = useAdminFiltersStore();
  const [boardView, setBoardView] = useState<"portfolio" | "onboarding">("portfolio");
  const [runningRequestId, setRunningRequestId] = useState<string | null>(null);
  const [bootstrapName, setBootstrapName] = useState("");
  const [bootstrapChain, setBootstrapChain] = useState("Base");
  const [bootstrapCategory, setBootstrapCategory] = useState("community");
  const [bootstrapDescription, setBootstrapDescription] = useState("");
  const [bootstrappingProject, setBootstrappingProject] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");
  const [bootstrapBlock, setBootstrapBlock] = useState<BillingLimitBlock | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const term = search.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.chain.toLowerCase().includes(term) ||
        (project.contactEmail || "").toLowerCase().includes(term);

      const matchesStatus =
        status === "all" || project.status === status || project.onboardingStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  const pendingRequests = onboardingRequests.filter((request) => request.status === "submitted");
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const publicProjects = projects.filter((project) => project.isPublic).length;
  const approvedProjects = projects.filter(
    (project) => project.onboardingStatus === "approved"
  ).length;
  const totalMembers = projects.reduce((sum, project) => sum + project.members, 0);
  const chainCount = new Set(projects.map((project) => project.chain)).size;
  const draftProjects = projects.filter((project) => project.status === "draft").length;
  const pausedProjects = projects.filter((project) => project.status === "paused").length;
  const onboardingProjects = filteredProjects.filter(
    (project) =>
      project.onboardingStatus === "pending" ||
      project.status === "draft" ||
      project.status === "paused"
  );
  const rosterProjects = boardView === "onboarding" ? onboardingProjects : filteredProjects;
  const primaryAccount = accessState?.primaryAccount ?? null;
  const primaryAccountProjectCount = primaryAccount?.projectCount ?? 0;
  const showBootstrapEmptyState =
    !isSuperAdmin &&
    primaryAccountProjectCount === 0 &&
    Boolean(primaryAccount) &&
    accessState?.limitedNav;

  async function handleBootstrapProject() {
    if (!primaryAccount?.id || !bootstrapName.trim()) {
      return;
    }

    try {
      setBootstrappingProject(true);
      setBootstrapError("");
      setBootstrapBlock(null);
      const payload = await bootstrapPortalWorkspaceProject({
        accountId: primaryAccount.id,
        name: bootstrapName.trim(),
        chain: bootstrapChain,
        category: bootstrapCategory.trim(),
        description: bootstrapDescription.trim(),
      });

      await Promise.all([refreshMemberships(), loadAll(), refresh()]);
      router.push(`/projects/${payload.projectId}/launch?source=account_onboarding`);
    } catch (error) {
      if (isBillingLimitError(error)) {
        setBootstrapBlock(error.block);
        return;
      }

      setBootstrapError(error instanceof Error ? error.message : "First project bootstrap failed.");
    } finally {
      setBootstrappingProject(false);
    }
  }

  return (
    <div className="space-y-4">
      <ProjectsBoardHeader
        isSuperAdmin={isSuperAdmin}
        projectCount={projects.length}
        activeProjects={activeProjects}
        approvedProjects={approvedProjects}
        publicProjects={publicProjects}
        pendingRequests={pendingRequests.length}
        totalMembers={totalMembers}
        chainCount={chainCount}
        draftProjects={draftProjects}
        pausedProjects={pausedProjects}
        view={boardView}
        onViewChange={setBoardView}
      />

      {showBootstrapEmptyState ? (
        <OpsPanel
          eyebrow="First project bootstrap"
          title="Create the first project"
          description="Projects are the actual operating unit. Keep this first payload intentionally small and move into Launch right after creation."
          tone="accent"
        >
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              {bootstrapBlock ? (
                <PortalBillingBlockNotice
                  block={bootstrapBlock}
                  title="Creating another project needs more plan capacity"
                />
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <OpsMetricCard
                  label="Workspace"
                  value={primaryAccount?.name ?? "Workspace"}
                  emphasis="primary"
                />
                <OpsMetricCard label="Projects" value={0} emphasis="warning" />
                <OpsMetricCard label="Next step" value="Launch setup" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                    Project name
                  </span>
                  <input
                    value={bootstrapName}
                    onChange={(event) => setBootstrapName(event.target.value)}
                    placeholder="Veltrix Founding Campaign"
                    className="w-full rounded-[18px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                    Chain
                  </span>
                  <select
                    value={bootstrapChain}
                    onChange={(event) => setBootstrapChain(event.target.value)}
                    className="w-full rounded-[18px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Base">Base</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="Solana">Solana</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                    Category
                  </span>
                  <input
                    value={bootstrapCategory}
                    onChange={(event) => setBootstrapCategory(event.target.value)}
                    placeholder="community"
                    className="w-full rounded-[18px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                    Short context
                  </span>
                  <textarea
                    value={bootstrapDescription}
                    onChange={(event) => setBootstrapDescription(event.target.value)}
                    placeholder="What is this project launching and what kind of community is it building?"
                    rows={4}
                    className="w-full rounded-[18px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              {bootstrapError ? (
                <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {bootstrapError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleBootstrapProject()}
                  disabled={bootstrappingProject || !bootstrapName.trim()}
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bootstrappingProject ? "Creating project..." : "Create first project"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/getting-started")}
                  className="rounded-full border border-white/6 bg-white/[0.025] px-4 py-2.5 text-sm font-semibold text-text"
                >
                  Back to Getting Started
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <OpsPanel
                eyebrow="Why this matters"
                title="Projects are the operational unit"
                description="Campaigns, quests, raids, rewards and launch readiness all hang off a project workspace."
              >
                <div className="space-y-3">
                  <OpsSnapshotRow
                    label="What gets created"
                    value="Project workspace, owner linkage and initial team membership."
                  />
                  <OpsSnapshotRow
                    label="What happens next"
                    value="You land directly in Launch so the setup spine stays obvious."
                  />
                  <div className="pt-1">
                    <OpsStatusPill tone="warning">Small bootstrap payload only</OpsStatusPill>
                  </div>
                </div>
              </OpsPanel>
            </div>
          </div>
        </OpsPanel>
      ) : null}

      <OpsFilterBar>
        <OpsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects, chain or contact..."
          ariaLabel="Search projects"
          name="project-search"
        />
        <OpsSelect
          value={status}
          onChange={setStatus}
          ariaLabel="Filter projects by status"
          name="project-status"
        >
          <option value="all">all</option>
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
        </OpsSelect>
        <button
          onClick={resetFilters}
          className="rounded-[20px] border border-white/6 bg-white/[0.025] px-4 py-3 font-semibold text-text"
        >
          Reset
        </button>
      </OpsFilterBar>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.26fr)_340px]">
        <OpsPanel
          eyebrow="Workspace roster"
          title={boardView === "onboarding" ? "Projects needing setup attention" : "Project roster"}
          description={
            boardView === "onboarding"
              ? "Draft, paused and pending workspaces stay in one compact roster so you can open the next setup task quickly."
              : "Keep the roster as the primary surface: status, coverage and the next workspace entry all in one scan."
          }
        >
          <ProjectsRosterTable
            projects={rosterProjects}
            emptyState={
              showBootstrapEmptyState
                ? "Create the first project to turn this workspace into a real operator surface."
                : boardView === "onboarding"
                  ? "No draft, paused or pending workspaces match your filters."
                  : "No projects match your filters."
            }
          />
        </OpsPanel>

        <div className="space-y-4">
          <OpsPanel
            eyebrow="Board read"
            title="Keep the side rail secondary"
            description="Use this rail for intake and posture only. The roster should stay the main working surface."
          >
            <div className="grid gap-3">
              <OpsSnapshotRow
                label="Pending requests"
                value={pendingRequests.length > 0 ? `${pendingRequests.length}` : "Queue clear"}
              />
              <OpsSnapshotRow
                label="Approved / public"
                value={`${approvedProjects} approved • ${publicProjects} public`}
              />
              <OpsSnapshotRow
                label="Draft / paused"
                value={`${draftProjects} draft • ${pausedProjects} paused`}
              />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Onboarding queue"
            title="Workspace intake"
            description={
              pendingRequests.length > 0
                ? "Review incoming projects here without pushing the main roster off the page."
                : "No onboarding approvals are waiting right now."
            }
            tone={pendingRequests.length > 0 ? "accent" : "default"}
          >
            <ProjectsOnboardingQueue
              requests={pendingRequests}
              isSuperAdmin={isSuperAdmin}
              runningRequestId={runningRequestId}
              onApprove={(requestId) => {
                void (async () => {
                  setRunningRequestId(requestId);
                  try {
                    const projectId = await approveOnboardingRequest(requestId);
                    window.location.href = `/projects/${projectId}`;
                  } finally {
                    setRunningRequestId(null);
                  }
                })();
              }}
              onReject={(requestId) => {
                void (async () => {
                  setRunningRequestId(requestId);
                  try {
                    await rejectOnboardingRequest(requestId);
                  } finally {
                    setRunningRequestId(null);
                  }
                })();
              }}
            />
          </OpsPanel>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AdminShell>
      <ProjectsPageContent />
    </AdminShell>
  );
}
