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
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(74,217,255,0.1),transparent_22%),linear-gradient(180deg,rgba(12,18,28,0.99),rgba(8,12,20,0.97))] px-6 py-7 shadow-[0_30px_90px_rgba(0,0,0,0.28)] md:px-7 md:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.035),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.55)]" />
              Project workspace
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-text md:text-[3rem] md:leading-[0.96]">
              {projectName}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sub md:text-[0.96rem] md:leading-8">
              {projectChain} operations surface for community, trust, on-chain execution and reward flow.
            </p>
          </div>

          <div className="min-w-[280px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4 backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">Workspace signal</p>
            <p className="mt-2 text-lg font-extrabold text-text">{projectChain}</p>
            <div className="mt-4 flex max-w-xl flex-wrap gap-2">
              <OpsStatusPill tone="default">{projectChain}</OpsStatusPill>
              {healthPills.map((pill) => (
                <OpsStatusPill key={pill.label} tone={pill.tone}>
                  {pill.label}
                </OpsStatusPill>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-[26px] border border-white/8 bg-white/[0.03] p-2">
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
                      ? "bg-primary text-black shadow-[0_16px_35px_rgba(186,255,59,0.22)]"
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

      <div className="space-y-8">{children}</div>
    </div>
  );
}
