"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Megaphone, RadioTower, Settings2, Sparkles } from "lucide-react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type QuickAction = {
  label: string;
  description: string;
  href: string;
};

export default function ProjectOverviewQuickActions({
  actions,
  className,
}: {
  actions: QuickAction[];
  className?: string;
}) {
  const primaryAction = actions[0] ?? null;
  const primaryActions = actions.slice(1, 4);
  const secondaryActions = actions.slice(4);

  return (
    <section className={`relative overflow-hidden rounded-[20px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(11,14,20,0.92),rgba(7,9,14,0.9))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.1)] ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            Action router
          </p>
          <h2 className="mt-1.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
            Create or inspect the next work item
          </h2>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-sub">
            Keep creation routes close, but let the recommended project command stay in control.
          </p>
        </div>
        <OpsStatusPill tone={actions.length > 0 ? "success" : "warning"}>
          {actions.length} routes
        </OpsStatusPill>
      </div>

      <div className="relative mt-3 space-y-2.5">
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="group block rounded-[16px] border border-primary/[0.14] bg-[radial-gradient(circle_at_0%_0%,rgba(199,255,0,0.07),transparent_34%),linear-gradient(180deg,rgba(199,255,0,0.035),rgba(255,255,255,0.012))] p-3 transition-all duration-200 hover:border-primary/[0.26] hover:bg-primary/[0.075]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-primary/[0.18] bg-primary/[0.08] text-primary">
                    {iconForAction(primaryAction.label)}
                  </span>
                  <p className="text-[13px] font-black text-text">{primaryAction.label}</p>
                </div>
                <p className="mt-2 line-clamp-2 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
                  {primaryAction.description}
                </p>
              </div>
              <ArrowUpRight className="shrink-0 text-primary transition group-hover:translate-x-0.5" size={16} />
            </div>
          </Link>
        ) : null}

        <div className="grid gap-2 md:grid-cols-3">
          {primaryActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-[14px] border border-white/[0.016] bg-white/[0.01] p-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.075)] transition-all duration-200 hover:border-primary/18 hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{iconForAction(action.label)}</span>
                    <p className="truncate text-[12px] font-bold text-text">{action.label}</p>
                  </div>
                  <p className="mt-1.5 line-clamp-2 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight className="text-sub transition group-hover:text-primary" size={16} />
              </div>
            </Link>
          ))}
        </div>

        {secondaryActions.length > 0 ? (
          <div className="rounded-[16px] border border-white/[0.016] bg-black/20 p-2.5">
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              Supporting routes
            </p>
            <div className="mt-2 grid gap-1.5 md:grid-cols-2">
              {secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2 transition-colors duration-200 hover:bg-white/[0.018]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-sub">{iconForAction(action.label)}</span>
                    <p className="truncate text-[12px] font-semibold text-text">{action.label}</p>
                  </div>
                  <ArrowUpRight className="shrink-0 text-sub transition group-hover:text-primary" size={14} />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function iconForAction(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("raid")) return <RadioTower size={15} />;
  if (normalized.includes("campaign")) return <Megaphone size={15} />;
  if (normalized.includes("quest") || normalized.includes("claims")) {
    return <ClipboardCheck size={15} />;
  }
  if (normalized.includes("team") || normalized.includes("settings")) {
    return <Settings2 size={15} />;
  }

  return <Sparkles size={15} />;
}
