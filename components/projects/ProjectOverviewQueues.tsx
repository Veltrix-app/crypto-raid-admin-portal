"use client";

import Link from "next/link";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type QueueSignal = {
  label: string;
  value: string;
  description: string;
  href: string;
  tone?: "default" | "success" | "warning" | "danger";
};

export default function ProjectOverviewQueues({
  signals,
  className,
}: {
  signals: QueueSignal[];
  className?: string;
}) {
  return (
    <OpsPanel
      eyebrow="Watch"
      title="Project pressure and watchpoints"
      description="Keep the queues in peripheral view without letting them overpower the main workspace actions."
      className={className}
    >
      <div className="grid gap-2.5">
        {signals.map((signal) => (
          <Link
            key={signal.label}
            href={signal.href}
            className="rounded-[15px] border border-white/[0.016] bg-white/[0.01] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.075)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/18"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold text-text">{signal.label}</p>
                  <OpsStatusPill tone={signal.tone ?? "default"}>{signal.value}</OpsStatusPill>
                </div>
                <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">{signal.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </OpsPanel>
  );
}
