"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { cn } from "@/lib/utils/cn";
import { getSettingsHref, SETTINGS_TABS, type SettingsTab } from "@/lib/navigation/portal-nav";

type HealthPill = {
  label: string;
  tone: "default" | "success" | "warning" | "danger";
};

type WorkspaceSettingsFrameProps = {
  title: string;
  description: string;
  workspaceName: string;
  healthPills: HealthPill[];
  children: ReactNode;
};

function isSettingsTabActive(pathname: string, tab: SettingsTab) {
  const href = getSettingsHref(tab.slug);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function WorkspaceSettingsFrame({
  title,
  description,
  workspaceName,
  healthPills,
  children,
}: WorkspaceSettingsFrameProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[20px] border border-white/[0.028] bg-[linear-gradient(180deg,rgba(10,13,19,0.99),rgba(7,9,14,0.99))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sub">
              Workspace settings
            </p>
            <h1 className="mt-2 text-[1.25rem] font-semibold tracking-[-0.04em] text-text md:text-[1.55rem]">
              {title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sub">{description}</p>
          </div>

          <div className="flex max-w-xl flex-wrap gap-2">
            <OpsStatusPill tone="default">{workspaceName}</OpsStatusPill>
            {healthPills.map((pill) => (
              <OpsStatusPill key={pill.label} tone={pill.tone}>
                {pill.label}
              </OpsStatusPill>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="inline-flex min-w-full gap-1 rounded-[14px] border border-white/[0.025] bg-white/[0.014] p-1">
            {SETTINGS_TABS.map((tab) => {
              const href = getSettingsHref(tab.slug);
              const active = isSettingsTabActive(pathname, tab);

              return (
                <Link
                  key={tab.slug || "overview"}
                  href={href}
                  className={cn(
                    "rounded-[11px] px-3 py-2 text-[12px] font-semibold transition",
                    active
                      ? "bg-white/[0.08] text-text"
                      : "text-sub hover:bg-white/[0.04] hover:text-text"
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
