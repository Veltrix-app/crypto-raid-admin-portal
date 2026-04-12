"use client";

import Link from "next/link";
import { useMemo } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { useAdminFiltersStore } from "@/store/filters/useAdminFiltersStore";

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
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.chain.toLowerCase().includes(search.toLowerCase()) ||
        (project.contactEmail || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" ||
        project.status === status ||
        project.onboardingStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  const pendingRequests = onboardingRequests.filter((request) => request.status === "submitted");

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Projects</h1>
          </div>

          <Link
            href="/projects/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            {isSuperAdmin ? "New Project" : "Apply Project"}
          </Link>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="rounded-[24px] border border-line bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Onboarding Queue
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  Pending Requests
                </h2>
              </div>
              <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
                {pendingRequests.length}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-line bg-card2 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{request.logo}</span>
                        <p className="font-bold text-text">{request.projectName}</p>
                        <span className="rounded-full border border-line px-3 py-1 text-xs uppercase text-primary">
                          {request.chain}
                        </span>
                        {request.category ? (
                          <span className="rounded-full border border-line px-3 py-1 text-xs uppercase text-sub">
                            {request.category}
                          </span>
                        ) : null}
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
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1.4fr_220px_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, chain or contact..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all</option>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
          </select>

          <button
            onClick={resetFilters}
            className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
          >
            Reset
          </button>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
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
              <div className="capitalize text-primary">{project.status}</div>
              <div className="capitalize text-sub">{project.onboardingStatus}</div>
              <div>{project.members.toLocaleString()}</div>
              <div>{project.campaigns}</div>
              <div>
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                >
                  View
                </Link>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 ? (
            <div className="px-5 py-8 text-sm text-sub">No projects match your filters.</div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
