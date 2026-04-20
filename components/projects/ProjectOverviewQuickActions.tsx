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
  return (
    <OpsPanel
      eyebrow="Quick actions"
      title="Open the next studio or workspace"
      description="Jump straight into the launch workspace, Campaign Studio, Quest Studio, Community OS, or the exact rail this project needs next."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group rounded-[24px] border border-line bg-card2 p-5 transition hover:border-primary/40"
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
    </OpsPanel>
  );
}
