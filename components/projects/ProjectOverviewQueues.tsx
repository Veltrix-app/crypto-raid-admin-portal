"use client";

import Link from "next/link";
import { ArrowUpRight, Gauge, ShieldAlert } from "lucide-react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

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
    <section className={`rounded-[20px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(11,14,20,0.92),rgba(7,9,14,0.9))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.1)] ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            Watch rail
          </p>
          <h2 className="mt-1.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
            Project pressure
          </h2>
          <p className="mt-1.5 text-[12px] leading-5 text-sub">
            Keep risk and readiness visible without pushing the main task downward.
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-white/[0.026] bg-white/[0.014] text-primary">
          <Gauge size={16} />
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {signals.map((signal) => (
          <Link
            key={signal.label}
            href={signal.href}
            className="group rounded-[15px] border border-white/[0.016] bg-white/[0.01] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.075)] transition-colors duration-200 hover:border-primary/18 hover:bg-white/[0.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-primary">
                    <ShieldAlert size={14} />
                  </span>
                  <p className="text-[13px] font-bold text-text">{signal.label}</p>
                  <OpsStatusPill tone={signal.tone ?? "default"}>{signal.value}</OpsStatusPill>
                </div>
                <p className="mt-1.5 line-clamp-2 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
                  {signal.description}
                </p>
              </div>
              <ArrowUpRight className="shrink-0 text-sub transition group-hover:text-primary" size={15} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
