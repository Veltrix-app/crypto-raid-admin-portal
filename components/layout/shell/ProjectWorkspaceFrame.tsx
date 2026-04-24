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
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.09),transparent_24%),linear-gradient(180deg,rgba(13,18,27,0.98),rgba(10,14,21,0.96))] px-6 py-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Project workspace
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-text md:text-[2.75rem]">
              {projectName}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sub">
              {projectChain} operations surface for community, trust, on-chain execution and reward flow.
            </p>
          </div>

          <div className="flex max-w-xl flex-wrap gap-2">
            <OpsStatusPill tone="default">{projectChain}</OpsStatusPill>
            {healthPills.map((pill) => (
              <OpsStatusPill key={pill.label} tone={pill.tone}>
                {pill.label}
              </OpsStatusPill>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-[24px] border border-white/6 bg-white/[0.025] p-2">
            {PROJECT_WORKSPACE_TABS.map((tab) => {
              const href = getProjectWorkspaceHref(projectId, tab.slug);
              const active = isWorkspaceTabActive(pathname, projectId, tab);

              return (
                <Link
                  key={tab.slug || "overview"}
                  href={href}
                  className={cn(
                    "rounded-[18px] px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-black"
                      : "text-sub hover:bg-white/[0.05] hover:text-text"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-8">{children}</div>
    </div>
  );
}
