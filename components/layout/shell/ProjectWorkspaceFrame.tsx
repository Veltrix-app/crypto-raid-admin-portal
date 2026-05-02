"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { cn } from "@/lib/utils/cn";
import {
  getProjectWorkspaceHref,
  PROJECT_WORKSPACE_TAB_GROUPS,
  PROJECT_WORKSPACE_TABS,
  type ProjectWorkspaceTab,
} from "@/lib/navigation/portal-nav";

type HealthPill = {
  label: string;
  tone: "default" | "success" | "warning" | "danger";
};

type ProjectWorkspaceFrameProps = {
  projectId: string;
  projectName: string;
  projectChain: string;
  healthPills: HealthPill[];
  children: ReactNode;
};

function isWorkspaceTabActive(pathname: string, projectId: string, tab: ProjectWorkspaceTab) {
  const href = getProjectWorkspaceHref(projectId, tab.slug);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ProjectWorkspaceFrame({
  projectId,
  projectName,
  projectChain,
  healthPills,
  children,
}: ProjectWorkspaceFrameProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="space-y-3.5">
      <section className="relative overflow-hidden rounded-[18px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(11,14,20,0.78),rgba(7,9,14,0.7))] px-3.5 py-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.11)] md:px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary">
                Workspace
              </p>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-sub">
                Project home
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-[1.05rem] font-semibold tracking-[-0.03em] text-text [overflow-wrap:anywhere] md:text-[1.18rem]">
                {projectName}
              </h1>
              <OpsStatusPill tone="default">{projectChain}</OpsStatusPill>
              {healthPills.map((pill) => (
                <OpsStatusPill key={pill.label} tone={pill.tone}>
                  {pill.label}
                </OpsStatusPill>
              ))}
            </div>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-sub">
              One project workspace. Start with the next move, then open the exact surface you need.
            </p>
          </div>

          <div className="rounded-[14px] border border-white/[0.024] bg-white/[0.018] px-3 py-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">Focus</p>
            <p className="mt-1 text-[11px] font-semibold text-text">
              Overview first. Deep work by surface.
            </p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto border-t border-white/[0.02] pt-2.5">
          <div className="flex min-w-max flex-wrap gap-2">
            {PROJECT_WORKSPACE_TAB_GROUPS.map((group) => {
              const tabs = PROJECT_WORKSPACE_TABS.filter((tab) => tab.group === group.key);
              const groupActive = tabs.some((tab) => isWorkspaceTabActive(pathname, projectId, tab));

              if (tabs.length === 0) {
                return null;
              }

              return (
                <div
                  key={group.key}
                  className={cn(
                    "flex items-center gap-1 rounded-[14px] border bg-white/[0.012] p-1",
                    groupActive ? "border-primary/16" : "border-white/[0.018]"
                  )}
                >
                  <span
                    className={cn(
                      "hidden px-2 text-[8px] font-black uppercase tracking-[0.14em] sm:inline",
                      groupActive ? "text-primary" : "text-sub/75"
                    )}
                  >
                    {group.label}
                  </span>
                  {tabs.map((tab) => {
                    const href = getProjectWorkspaceHref(projectId, tab.slug);
                    const active = isWorkspaceTabActive(pathname, projectId, tab);

                    return (
                      <Link
                        key={tab.slug || "overview"}
                        href={href}
                        className={cn(
                          "rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold transition",
                          active
                            ? "bg-white/[0.08] text-text shadow-[inset_0_0_0_1px_rgba(186,255,59,0.12)]"
                            : "text-sub hover:bg-white/[0.028] hover:text-text"
                        )}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-3.5">{children}</div>
    </div>
  );
}
