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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-line bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.10),transparent_24%),linear-gradient(180deg,rgba(13,19,29,0.98),rgba(10,15,24,0.98))] p-6 shadow-[0_26px_90px_rgba(0,0,0,0.34)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project workspace
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
              {projectName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">
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
          <div className="inline-flex min-w-full gap-2 rounded-[24px] border border-white/10 bg-black/20 p-2">
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
                      ? "bg-primary text-black shadow-[0_12px_32px_rgba(186,255,59,0.20)]"
                      : "text-sub hover:bg-white/[0.06] hover:text-text"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
