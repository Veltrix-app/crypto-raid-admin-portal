"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { cn } from "@/lib/utils/cn";
import {
  getProjectWorkspaceHref,
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
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,14,20,0.99),rgba(7,9,14,0.99))] px-4 py-4 shadow-[0_16px_38px_rgba(0,0,0,0.16)] md:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.02),transparent_34%)]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-4xl">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-primary">
              Project workspace
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h1 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-text md:text-[1.35rem]">
                {projectName}
              </h1>
              <OpsStatusPill tone="default">{projectChain}</OpsStatusPill>
              {healthPills.map((pill) => (
                <OpsStatusPill key={pill.label} tone={pill.tone}>
                  {pill.label}
                </OpsStatusPill>
              ))}
            </div>
            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-sub">
              Operate launch, community, rewards and trust from one project-first surface.
            </p>
          </div>

          <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">Focus</p>
            <p className="mt-1 text-[12px] font-semibold text-text">
              Keep the next operator move visible.
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/6 pt-3 overflow-x-auto">
          <div className="inline-flex min-w-full gap-1.5">
            {PROJECT_WORKSPACE_TABS.map((tab) => {
              const href = getProjectWorkspaceHref(projectId, tab.slug);
              const active = isWorkspaceTabActive(pathname, projectId, tab);

              return (
                <Link
                  key={tab.slug || "overview"}
                  href={href}
                  className={cn(
                    "rounded-[12px] px-3 py-2 text-[12px] font-semibold transition",
                    active
                      ? "bg-primary text-black shadow-[0_10px_24px_rgba(186,255,59,0.18)]"
                      : "border border-transparent bg-white/[0.02] text-sub hover:border-white/10 hover:bg-white/[0.04] hover:text-text"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
