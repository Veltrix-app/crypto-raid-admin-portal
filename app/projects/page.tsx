"use client";

import Link from "next/link";
import { useMemo } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsFilterBar,
  OpsHero,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
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

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const term = search.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.chain.toLowerCase().includes(term) ||
        (project.contactEmail || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || project.status === status || project.onboardingStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  const pendingRequests = onboardingRequests.filter((request) => request.status === "submitted");
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const publicProjects = projects.filter((project) => project.isPublic).length;
  const approvedProjects = projects.filter((project) => project.onboardingStatus === "approved").length;
  const totalMembers = projects.reduce((sum, project) => sum + project.members, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Project Board"
          title="Projects"
          description="Track onboarding flow, workspace readiness and the projects currently powering the network."
          aside={
            <Link href="/projects/new" className="inline-flex rounded-2xl bg-primary px-4 py-3 font-bold text-black">
              {isSuperAdmin ? "New Project" : "Apply Project"}
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Projects" value={projects.length} />
          <OpsMetricCard label="Active" value={activeProjects} emphasis={activeProjects > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Approved" value={approvedProjects} emphasis={approvedProjects > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Public" value={publicProjects} emphasis={publicProjects > 0 ? "primary" : "default"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Workspace mix"
            title="What the project layer holds"
            description="A concise read on live workspaces, onboarding pressure and the size of the member base."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SignalCard label="Pending requests" value={pendingRequests.length} hint="Projects waiting for approval or rejection." />
              <SignalCard label="Tracked members" value={totalMembers.toLocaleString()} hint="Member count across all current projects." />
              <SignalCard label="Chains represented" value={new Set(projects.map((project) => project.chain)).size} hint="Distinct ecosystems currently in the workspace set." />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Onboarding posture"
            title="Queue signal"
            description="A shorter board for approval pressure and workspace readiness."
          >
            <div className="grid gap-4">
              <MiniRow label="Pending requests" value={`${pendingRequests.length}`} />
              <MiniRow label="Draft projects" value={`${projects.filter((project) => project.status === "draft").length}`} />
              <MiniRow label="Paused workspaces" value={`${projects.filter((project) => project.status === "paused").length}`} />
            </div>
          </OpsPanel>
        </div>

        {pendingRequests.length > 0 ? (
          <OpsPanel
            eyebrow="Onboarding queue"
            title="Pending requests"
            description="Requests that still need a super-admin decision before the workspace can go live."
            tone="accent"
          >
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-line bg-card2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{request.logo}</span>
                        <p className="font-bold text-text">{request.projectName}</p>
                        <OpsStatusPill tone="default">{request.chain}</OpsStatusPill>
                        {request.category ? <OpsStatusPill tone="success">{request.category}</OpsStatusPill> : null}
                      </div>

                      <p className="mt-3 text-sm text-sub">{request.shortDescription || "No description provided yet."}</p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-sub">
                        <span>{request.contactEmail || "No contact email"}</span>
                        <span>{new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {isSuperAdmin ? (
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            const projectId = await approveOnboardingRequest(request.id);
                            window.location.href = `/projects/${projectId}`;
                          }}
                          className="rounded-xl bg-primary px-4 py-2 font-bold text-black"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            await rejectOnboardingRequest(request.id);
                          }}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-bold text-rose-300"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-sub">
                        Awaiting review
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </OpsPanel>
        ) : null}

        <OpsFilterBar>
          <OpsSearchInput value={search} onChange={setSearch} placeholder="Search projects, chain or contact..." />
          <OpsSelect value={status} onChange={setStatus}>
            <option value="all">all</option>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
          </OpsSelect>
          <button onClick={resetFilters} className="rounded-[20px] border border-line bg-card2 px-4 py-3 font-semibold text-text">
            Reset
          </button>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Workspace roster"
          title="Project stream"
          description="The active project list with status, onboarding posture and a fast route into each workspace."
        >
          <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
            <div className="grid grid-cols-7 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
              <div>Project</div>
              <div>Chain</div>
              <div>Status</div>
              <div>Onboarding</div>
              <div>Members</div>
              <div>Campaigns</div>
              <div>Open</div>
            </div>

            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-7 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-xl">{project.logo}</span>
                  {project.name}
                </div>
                <div>{project.chain}</div>
                <div>
                  <OpsStatusPill tone={project.status === "active" ? "success" : project.status === "draft" ? "warning" : "default"}>
                    {project.status}
                  </OpsStatusPill>
                </div>
                <div className="capitalize text-sub">{project.onboardingStatus}</div>
                <div>{project.members.toLocaleString()}</div>
                <div>{project.campaigns}</div>
                <div>
                  <Link href={`/projects/${project.id}`} className="rounded-xl border border-line bg-card px-3 py-2 font-semibold">
                    View
                  </Link>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 ? (
              <div className="px-5 py-8 text-sm text-sub">No projects match your filters.</div>
            ) : null}
          </div>
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

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
