"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
} from "@/components/layout/ops/OpsPrimitives";
import ProjectsBoardHeader from "@/components/projects/ProjectsBoardHeader";
import ProjectsOnboardingQueue from "@/components/projects/ProjectsOnboardingQueue";
import ProjectsRosterTable from "@/components/projects/ProjectsRosterTable";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminFiltersStore } from "@/store/filters/useAdminFiltersStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ProjectsPage() {
  const projects = useAdminPortalStore((s) => s.projects);
  const onboardingRequests = useAdminPortalStore((s) => s.onboardingRequests);
  const approveOnboardingRequest = useAdminPortalStore((s) => s.approveOnboardingRequest);
  const rejectOnboardingRequest = useAdminPortalStore((s) => s.rejectOnboardingRequest);
  const role = useAdminAuthStore((s) => s.role);
  const isSuperAdmin = role === "super_admin";
  const { search, status, setSearch, setStatus, resetFilters } = useAdminFiltersStore();
  const [boardView, setBoardView] = useState<"portfolio" | "onboarding">("portfolio");
  const [runningRequestId, setRunningRequestId] = useState<string | null>(null);

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

  return (
    <AdminShell>
      <div className="space-y-6">
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

        {boardView === "onboarding" ? (
          <OpsPanel
            eyebrow="Onboarding queue"
            title="Workspace intake"
            description="Review incoming projects first, then move straight into the workspace once a decision is made."
            tone="accent"
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
        ) : (
          <OpsPanel
            eyebrow="Portfolio posture"
            title="Workspace mix"
            description="A quick scan of the live portfolio, with the roster kept front and center for day-to-day navigation."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SignalCard
                label="Pending requests"
                value={pendingRequests.length}
                hint="Projects waiting for approval or rejection."
              />
              <SignalCard
                label="Tracked members"
                value={totalMembers.toLocaleString()}
                hint="Member count across all current projects."
              />
              <SignalCard
                label="Chains represented"
                value={chainCount}
                hint="Distinct ecosystems currently in the workspace set."
              />
            </div>
          </OpsPanel>
        )}

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
            className="rounded-[20px] border border-line bg-card2 px-4 py-3 font-semibold text-text"
          >
            Reset
          </button>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Workspace roster"
          title={boardView === "onboarding" ? "Intake-facing roster" : "Project stream"}
          description={
            boardView === "onboarding"
              ? "Filtered to the projects that are most likely to need approval, setup or a recovery action next."
              : "The active project list with status, onboarding posture and a fast route into each workspace."
          }
        >
          <ProjectsRosterTable
            projects={boardView === "onboarding" ? onboardingProjects : filteredProjects}
            emptyState={
              boardView === "onboarding"
                ? "No draft, paused or pending workspaces match your filters."
                : "No projects match your filters."
            }
          />
        </OpsPanel>
      </div>
    </AdminShell>
  );
}

function SignalCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}
