"use client";

import Link from "next/link";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

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
      description="Manage the project portfolio from one compact workbench: roster first, intake second, and the next workspace action always within reach."
      actions={
        <div className="flex items-center gap-2">
          <OpsStatusPill tone={pendingRequests > 0 ? "warning" : "default"}>
            {pendingRequests > 0 ? `${pendingRequests} pending` : "Queue clear"}
          </OpsStatusPill>
          <Link
            href="/projects/new"
            className="inline-flex rounded-full bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-black"
          >
            {isSuperAdmin ? "New project" : "Apply project"}
          </Link>
        </div>
      }
      statusBand={
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <ProjectBoardStat label="Projects" value={`${projectCount}`} />
            <ProjectBoardStat label="Active" value={`${activeProjects}`} />
            <ProjectBoardStat label="Draft" value={`${draftProjects}`} tone={draftProjects > 0 ? "warning" : "default"} />
            <ProjectBoardStat label="Paused" value={`${pausedProjects}`} tone={pausedProjects > 0 ? "warning" : "default"} />
            <ProjectBoardStat label="Members" value={totalMembers.toLocaleString()} />
            <ProjectBoardStat label="Chains" value={`${chainCount}`} />
          </div>

          <div className="rounded-[16px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">Board mode</p>
            <div className="mt-2">
              <SegmentToggle
                value={view}
                options={[
                  { value: "portfolio", label: "Portfolio" },
                  { value: "onboarding", label: "Onboarding" },
                ]}
                onChange={onViewChange}
              />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-sub">
              {view === "portfolio"
                ? `${approvedProjects} approved and ${publicProjects} public workspaces are visible in the main roster.`
                : "Onboarding mode filters the roster toward drafts, paused workspaces and setup pressure."}
            </p>
          </div>
        </div>
      }
    >
      <></>
    </PortalPageFrame>
  );
}

function ProjectBoardStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-[14px] border px-3 py-2.5 ${
        tone === "warning"
          ? "border-amber-400/16 bg-amber-500/[0.07]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))]"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}
