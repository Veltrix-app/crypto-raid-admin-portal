"use client";

import Link from "next/link";
import { listRunbooks, type RunbookEntry } from "@/lib/runbooks/runbook-registry";

export default function RunbookRail({
  surface,
  title = "Runbook rail",
  description = "Keep recovery playbooks one click away when queues or providers start to drift.",
}: {
  surface?: RunbookEntry["surface"];
  title?: string;
  description?: string;
}) {
  const runbooks = listRunbooks(surface);

  return (
    <div className="space-y-4 rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,19,29,0.96),rgba(10,15,24,0.98))] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.22)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Runbooks</p>
        <h3 className="mt-2 text-[1.08rem] font-extrabold tracking-tight text-text">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-sub">{description}</p>
      </div>

      <div className="grid gap-3">
        {runbooks.map((runbook) => (
          <div
            key={runbook.key}
            className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {runbook.surface}
                </p>
                <h4 className="mt-2 text-lg font-bold text-text">{runbook.title}</h4>
                <p className="mt-2 text-sm leading-5.5 text-sub">{runbook.summary}</p>
              </div>
              <Link
                href={runbook.href}
                className="rounded-[16px] border border-primary/35 bg-primary/[0.075] px-3.5 py-2 text-[13px] font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/20"
              >
                Open surface
              </Link>
            </div>

            <div className="mt-3.5 grid gap-2">
              {runbook.checklist.map((step) => (
                <div
                  key={step}
                  className="rounded-[16px] border border-white/[0.032] bg-black/20 px-3.5 py-2.5 text-sm leading-5.5 text-sub"
                >
                  {step}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-sub">
              Reference: {runbook.docPath}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
