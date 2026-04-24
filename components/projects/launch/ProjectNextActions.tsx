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
    <div className="space-y-4">
      <OpsPanel
        eyebrow="Next best plays"
        title="What the project team should do next"
        description="These are the clearest moves to close readiness gaps without bouncing through the portal."
        tone="accent"
      >
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Link
              key={`${action.title}:${action.href}`}
              href={action.href}
              className={`block rounded-[24px] border px-5 py-5 transition-colors duration-200 ${
                action.tone === "primary"
                  ? "border-primary/24 bg-primary/8 hover:bg-primary/10"
                  : "border-white/6 bg-white/[0.025] hover:border-white/12 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/6 bg-white/[0.025] text-primary">
                      {index === 0 ? <Rocket size={16} /> : <Sparkles size={16} />}
                    </div>
                    <p className="font-bold text-text">{action.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{action.summary}</p>
                </div>
                <ArrowUpRight className="shrink-0 text-sub" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </OpsPanel>

      <OpsPanel
        eyebrow="Support rails"
        title="Open the right workspace fast"
        description="Jump into the exact project rail that closes the current launch gap."
      >
        <div className="grid gap-3">
          {supportLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-4 transition-colors duration-200 hover:border-primary/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <FolderPlus size={16} className="text-primary" />
                    <p className="font-bold text-text">{link.label}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sub">{link.description}</p>
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
