"use client";

import Link from "next/link";
import { ArrowUpRight, FolderPlus, Rocket, Sparkles } from "lucide-react";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type LaunchAction = {
  title: string;
  summary: string;
  href: string;
  tone?: "primary" | "default";
};

type SupportLink = {
  label: string;
  description: string;
  href: string;
};

export default function ProjectNextActions({
  actions,
  supportLinks,
}: {
  actions: LaunchAction[];
  supportLinks: SupportLink[];
}) {
  return (
    <div className="space-y-3">
      <OpsPanel
        eyebrow="Next step"
        title="What the project team should do next"
        description="Start with the first card. Each action opens the right studio with project context already attached."
      >
        <div className="space-y-2.5">
          {actions.map((action, index) => (
            <Link
              key={`${action.title}:${action.href}`}
              href={action.href}
              className={`block rounded-[15px] border px-3.5 py-3 transition-colors duration-200 ${
                action.tone === "primary"
                  ? "border-white/[0.026] bg-white/[0.032] hover:bg-white/[0.048]"
                  : "border-transparent bg-white/[0.014] hover:border-white/[0.028] hover:bg-white/[0.018]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/[0.018] text-sub">
                      {index === 0 ? <Rocket size={16} /> : <Sparkles size={16} />}
                    </div>
                    <p className="text-[13px] font-bold text-text">{action.title}</p>
                  </div>
                  <p className="mt-2 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{action.summary}</p>
                </div>
                <ArrowUpRight className="shrink-0 text-sub" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </OpsPanel>

      <OpsPanel
        eyebrow="More setup options"
        title="Open the right workspace fast"
        description="Use these when the next step needs a specific builder, community setup or reward surface."
      >
        <div className="grid gap-2.5">
          {supportLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-[15px] border border-transparent bg-white/[0.014] px-3.5 py-3 transition-colors duration-200 hover:border-white/[0.028] hover:bg-white/[0.018]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <FolderPlus size={16} className="text-sub" />
                    <p className="text-[13px] font-bold text-text">{link.label}</p>
                  </div>
                  <p className="mt-2 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{link.description}</p>
                </div>
                <ArrowUpRight className="shrink-0 text-sub" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </OpsPanel>
    </div>
  );
}
