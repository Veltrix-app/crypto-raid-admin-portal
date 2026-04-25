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
      eyebrow="Operate"
      title="Open the next workspace directly"
      description="Put the main working surfaces first and keep the supporting routes secondary."
    >
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-2">
          {primaryActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-[18px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-text">{action.label}</p>
                  <p className="mt-2 text-[12px] leading-5 text-sub">{action.description}</p>
                </div>
                <ArrowUpRight className="text-sub transition group-hover:text-primary" size={16} />
              </div>
            </Link>
          ))}
        </div>

        {secondaryActions.length > 0 ? (
          <div className="rounded-[18px] border border-white/[0.04] bg-white/[0.018] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
              Supporting routes
            </p>
            <div className="mt-3 grid gap-2">
              {secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-start justify-between gap-4 rounded-[14px] px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.03]"
                >
                  <div>
                    <p className="text-[12px] font-semibold text-text">{action.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-sub">{action.description}</p>
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
