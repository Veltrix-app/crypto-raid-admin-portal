"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Fingerprint,
  Gift,
  Landmark,
  Megaphone,
  Rocket,
  Settings,
  Sparkles,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
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

const WORKSPACE_NEXT_ROUTE: Record<ProjectWorkspaceTab["slug"], ProjectWorkspaceTab["slug"]> = {
  "": "launch",
  showcase: "settings",
  launch: "campaigns",
  campaigns: "community",
  community: "rewards",
  rewards: "showcase",
  payouts: "trust",
  onchain: "trust",
  trust: "",
  settings: "launch",
};

const WORKSPACE_TAB_ICONS: Record<ProjectWorkspaceTab["slug"], LucideIcon> = {
  "": BarChart3,
  showcase: Sparkles,
  launch: Rocket,
  campaigns: Megaphone,
  community: UsersRound,
  rewards: Gift,
  payouts: WalletCards,
  onchain: Landmark,
  trust: Fingerprint,
  settings: Settings,
};

const WORKSPACE_GROUP_COPY: Record<ProjectWorkspaceTab["group"], string> = {
  Core: "Build and run the project",
  Safety: "Keep execution controlled",
  Control: "Tune identity and access",
};

function getProjectInitial(projectName: string) {
  return projectName.trim().charAt(0).toUpperCase() || "V";
}

export default function ProjectWorkspaceFrame({
  projectId,
  projectName,
  projectChain,
  healthPills,
  children,
}: ProjectWorkspaceFrameProps) {
  const pathname = usePathname() ?? "";
  const activeTab =
    PROJECT_WORKSPACE_TABS.find((tab) => isWorkspaceTabActive(pathname, projectId, tab)) ??
    PROJECT_WORKSPACE_TABS[0];
  const nextTab =
    PROJECT_WORKSPACE_TABS.find((tab) => tab.slug === WORKSPACE_NEXT_ROUTE[activeTab.slug]) ??
    PROJECT_WORKSPACE_TABS[0];
  const ActiveIcon = WORKSPACE_TAB_ICONS[activeTab.slug];
  const nextHref = getProjectWorkspaceHref(projectId, nextTab.slug);

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_10%_0%,rgba(199,255,0,0.075),transparent_28%),radial-gradient(circle_at_88%_6%,rgba(91,211,255,0.045),transparent_24%),linear-gradient(180deg,rgba(12,15,22,0.98),rgba(7,9,14,0.96))] p-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[length:72px_72px] opacity-[0.3]" />

        <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(270px,0.36fr)_minmax(230px,0.28fr)] xl:items-stretch">
          <div className="min-w-0 rounded-[18px] border border-white/[0.022] bg-black/20 p-3.5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] border border-primary/[0.16] bg-primary/[0.06] text-[1.1rem] font-black text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                {getProjectInitial(projectName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
                    Project workspace
                  </p>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-sub/75">
                    {activeTab.group}
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-[1.08rem] font-semibold tracking-[-0.03em] text-text [overflow-wrap:anywhere] md:text-[1.22rem]">
                    {projectName}
                  </h1>
                  <OpsStatusPill tone="default">{projectChain}</OpsStatusPill>
                  {healthPills.map((pill) => (
                    <OpsStatusPill key={pill.label} tone={pill.tone}>
                      {pill.label}
                    </OpsStatusPill>
                  ))}
                </div>
                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-sub">
                  {activeTab.description}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/[0.022] bg-white/[0.014] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub/80">
                  Current surface
                </p>
                <h2 className="mt-1.5 truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                  {activeTab.label}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-sub">
                  {WORKSPACE_GROUP_COPY[activeTab.group]}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-primary/[0.15] bg-primary/[0.055] text-primary">
                <ActiveIcon size={18} />
              </div>
            </div>
          </div>

          <Link
            href={nextHref}
            className="group rounded-[18px] border border-primary/[0.12] bg-primary/[0.045] p-3.5 transition hover:border-primary/[0.24] hover:bg-primary/[0.07]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                  Suggested next
                </p>
                <h2 className="mt-1.5 truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                  {nextTab.label}
                </h2>
                <p className="mt-1.5 text-[11px] font-semibold text-primary">
                  Open surface
                </p>
              </div>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </Link>
        </div>

        <div className="relative mt-3 overflow-x-auto">
          <div className="flex min-w-max gap-1.5">
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
                    "flex items-center gap-1 rounded-[15px] border bg-black/20 p-1",
                    groupActive ? "border-primary/18" : "border-white/[0.018]"
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
                    const TabIcon = WORKSPACE_TAB_ICONS[tab.slug];

                    return (
                      <Link
                        key={tab.slug || "overview"}
                        href={href}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-[12px] px-2.5 py-2 text-[11px] font-semibold transition",
                          active
                            ? "bg-primary text-black shadow-[0_8px_22px_rgba(186,255,59,0.13)]"
                            : "text-sub hover:bg-white/[0.032] hover:text-text"
                        )}
                      >
                        <TabIcon size={13} />
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
