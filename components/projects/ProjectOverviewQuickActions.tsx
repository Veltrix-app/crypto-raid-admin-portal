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
}: {
  actions: QuickAction[];
}) {
  const primaryActions = actions.slice(0, 4);
  const secondaryActions = actions.slice(4);

  return (
    <OpsPanel
      eyebrow="Quick actions"
      title="Open the next studio without hunting for it"
      description="Keep the main build surfaces visible first, and tuck the supporting routes into a quieter secondary rail."
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {primaryActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-text">{action.label}</p>
                  <p className="mt-3 text-sm leading-6 text-sub">{action.description}</p>
                </div>
                <ArrowUpRight className="text-sub transition group-hover:text-primary" size={16} />
              </div>
            </Link>
          ))}
        </div>

        {secondaryActions.length > 0 ? (
          <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
              Supporting routes
            </p>
            <div className="mt-4 grid gap-3">
              {secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-start justify-between gap-4 rounded-[18px] px-3 py-3 transition-colors duration-200 hover:bg-white/[0.03]"
                >
                  <div>
                    <p className="font-semibold text-text">{action.label}</p>
                    <p className="mt-1 text-sm leading-6 text-sub">{action.description}</p>
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
