"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";

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
  const primaryActions = actions.slice(0, 4);
  const secondaryActions = actions.slice(4);

  return (
    <OpsPanel
      eyebrow="Create"
      title="Create or inspect the next work item"
      description="Use these routes after the command center has oriented the project. They stay focused on object creation, queues and team support."
      className={className}
    >
      <div className="space-y-3">
        <div className="grid gap-2.5 md:grid-cols-2">
          {primaryActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-[16px] border border-white/[0.016] bg-white/[0.01] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.075)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/18"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text">{action.label}</p>
                  <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{action.description}</p>
                </div>
                <ArrowUpRight className="text-sub transition group-hover:text-primary" size={16} />
              </div>
            </Link>
          ))}
        </div>

        {secondaryActions.length > 0 ? (
          <div className="rounded-[16px] border border-white/[0.016] bg-white/[0.008] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
              Supporting routes
            </p>
            <div className="mt-2.5 grid gap-1.5 md:grid-cols-2">
              {secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-start justify-between gap-3 rounded-[12px] px-2.5 py-2 transition-colors duration-200 hover:bg-white/[0.018]"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-text">{action.label}</p>
                    <p className="mt-1 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">{action.description}</p>
                  </div>
                  <ArrowUpRight className="mt-1 text-sub transition group-hover:text-primary" size={16} />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
