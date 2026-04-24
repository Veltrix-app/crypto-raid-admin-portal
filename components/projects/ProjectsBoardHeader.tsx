"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import { OpsSnapshotRow } from "@/components/layout/ops/OpsPrimitives";

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
      description="Run the portfolio from a calmer premium board: know what is live now, what needs onboarding next and which workspace deserves the next operator move."
      actions={
        <Link
          href="/projects/new"
          className="inline-flex rounded-full bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black shadow-[0_18px_40px_rgba(186,255,59,0.2)]"
        >
          {isSuperAdmin ? "New project" : "Apply project"}
        </Link>
      }
      statusBand={
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_320px]">
          <ProjectsTopCard
            label="Board read"
            title="Current portfolio posture"
            body="The board should immediately tell you whether the workspace portfolio is mostly live, mostly in setup or drifting into intake pressure."
            tone="primary"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProjectState label="Projects" value={`${projectCount}`} />
                  <ProjectState label="Active" value={`${activeProjects}`} />
                  <ProjectState label="Approved" value={`${approvedProjects}`} />
                  <ProjectState label="Public" value={`${publicProjects}`} />
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Mode
                  </p>
                  <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
                    <SegmentToggle
                      value={view}
                      options={[
                        { value: "portfolio", label: "Portfolio" },
                        { value: "onboarding", label: "Onboarding" },
                      ]}
                      onChange={onViewChange}
                    />
                  </div>
                  <p className="text-[12px] leading-5 text-sub">
                    {view === "portfolio"
                      ? "Portfolio mode keeps the roster front and center so you can scan live coverage fast."
                      : "Onboarding mode pushes intake, drafts and paused workspaces into the primary reading path."}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 rounded-[20px] border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Portfolio pressure
                </p>
                <ProjectSignal
                  label="Pending requests"
                  value={pendingRequests.toString()}
                  tone={pendingRequests > 0 ? "warning" : "default"}
                />
                <ProjectSignal label="Tracked members" value={totalMembers.toLocaleString()} />
                <ProjectSignal label="Chains represented" value={chainCount.toString()} />
                <ProjectSignal
                  label="Draft / paused"
                  value={`${draftProjects.toString()} / ${pausedProjects.toString()}`}
                  tone={draftProjects + pausedProjects > 0 ? "warning" : "default"}
                />
              </div>
            </div>
          </ProjectsTopCard>

          <ProjectsTopCard
            label="Signal rail"
            title="Signals worth keeping in peripheral view"
            body="These supporting numbers stay visible without turning the projects board into another full dashboard."
          >
            <div className="grid gap-3">
              <OpsSnapshotRow label="Pending requests" value={pendingRequests.toString()} />
              <OpsSnapshotRow label="Tracked members" value={totalMembers.toLocaleString()} />
              <OpsSnapshotRow label="Chains represented" value={chainCount.toString()} />
              <OpsSnapshotRow
                label="Draft / paused"
                value={`${draftProjects.toString()} draft / ${pausedProjects.toString()} paused`}
              />
            </div>
          </ProjectsTopCard>
        </div>
      }
    >
      <></>
    </PortalPageFrame>
  );
}

function ProjectsTopCard({
  label,
  title,
  body,
  children,
  tone = "default",
}: {
  label: string;
  title: string;
  body: string;
  children: ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[22px] border p-4 shadow-[0_22px_70px_rgba(0,0,0,0.18)] ${
        tone === "primary"
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(11,14,20,0.99),rgba(7,9,14,0.98))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.99),rgba(7,9,14,0.98))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.025),transparent_34%)]" />
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{label}</p>
        <h2 className="mt-3 text-[1.15rem] font-semibold tracking-[-0.03em] text-text sm:text-[1.3rem]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-sub">{body}</p>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function ProjectState({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function ProjectSignal({
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
      className={`rounded-[18px] border px-3.5 py-3 ${
        tone === "warning"
          ? "border-amber-400/16 bg-amber-500/[0.07]"
          : "border-white/6 bg-white/[0.02]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}
