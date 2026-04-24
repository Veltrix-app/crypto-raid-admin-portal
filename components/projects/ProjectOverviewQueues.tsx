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
            className="rounded-[24px] border border-white/6 bg-white/[0.025] p-5 transition-colors duration-200 hover:border-primary/24"
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
