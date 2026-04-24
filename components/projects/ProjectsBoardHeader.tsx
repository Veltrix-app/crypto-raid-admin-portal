"use client";

import Link from "next/link";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import { OpsMetricCard, OpsSnapshotRow } from "@/components/layout/ops/OpsPrimitives";

type ProjectsBoardView = "portfolio" | "onboarding";

type ProjectsBoardHeaderProps = {
  isSuperAdmin: boolean;
  projectCount: number;
  activeProjects: number;
  approvedProjects: number;
  publicProjects: number;
  pendingRequests: number;
  totalMembers: number;
  chainCount: number;
  draftProjects: number;
  pausedProjects: number;
  view: ProjectsBoardView;
  onViewChange: (next: ProjectsBoardView) => void;
};

export default function ProjectsBoardHeader({
  isSuperAdmin,
  projectCount,
  activeProjects,
  approvedProjects,
  publicProjects,
  pendingRequests,
  totalMembers,
  chainCount,
  draftProjects,
  pausedProjects,
  view,
  onViewChange,
}: ProjectsBoardHeaderProps) {
  return (
    <PortalPageFrame
      eyebrow="Project board"
      title="Projects"
      description="Run the portfolio from a calmer board: see what is live, what is waiting for approval and which workspaces need the next operator move."
      actions={
        <Link
          href="/projects/new"
          className="inline-flex rounded-2xl bg-primary px-4 py-3 font-bold text-black"
        >
          {isSuperAdmin ? "New Project" : "Apply Project"}
        </Link>
      }
      statusBand={
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="Projects" value={projectCount} />
            <OpsMetricCard
              label="Active"
              value={activeProjects}
              emphasis={activeProjects > 0 ? "primary" : "default"}
            />
            <OpsMetricCard
              label="Approved"
              value={approvedProjects}
              emphasis={approvedProjects > 0 ? "primary" : "default"}
            />
            <OpsMetricCard
              label="Public"
              value={publicProjects}
              emphasis={publicProjects > 0 ? "primary" : "default"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-white/6 bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Board focus
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                    Switch between portfolio and intake
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-sub">
                    Portfolio mode keeps the roster front and center. Intake mode prioritizes
                    onboarding requests, drafts and paused workspaces that need attention.
                  </p>
                </div>

                <SegmentToggle
                  value={view}
                  options={[
                    { value: "portfolio", label: "Portfolio" },
                    { value: "onboarding", label: "Onboarding" },
                  ]}
                  onChange={onViewChange}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <OpsSnapshotRow label="Pending requests" value={pendingRequests.toString()} />
              <OpsSnapshotRow label="Tracked members" value={totalMembers.toLocaleString()} />
              <OpsSnapshotRow label="Chains represented" value={chainCount.toString()} />
              <OpsSnapshotRow
                label="Draft / paused"
                value={`${draftProjects.toString()} draft / ${pausedProjects.toString()} paused`}
              />
            </div>
          </div>
        </div>
      }
    >
      <></>
    </PortalPageFrame>
  );
}
