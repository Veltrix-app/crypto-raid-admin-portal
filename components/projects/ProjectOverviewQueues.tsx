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
}: {
  signals: QueueSignal[];
}) {
  return (
    <OpsPanel
      eyebrow="Priority rail"
      title="Project queues and pressure"
      description="A faster read on where this workspace currently needs attention."
      tone="accent"
    >
      <div className="grid gap-3 xl:grid-cols-3">
        {signals.map((signal) => (
          <Link
            key={signal.label}
            href={signal.href}
            className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.9))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-text">{signal.label}</p>
                  <OpsStatusPill tone={signal.tone ?? "default"}>{signal.value}</OpsStatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{signal.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </OpsPanel>
  );
}
