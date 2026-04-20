"use client";

import type { ReactNode } from "react";

export default function StudioTopFrame({
  eyebrow,
  title,
  description,
  context,
  actions,
  supporting,
}: {
  eyebrow: string;
  title: string;
  description: string;
  context?: ReactNode;
  actions?: ReactNode;
  supporting?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,255,0,0.12),transparent_20%),linear-gradient(180deg,rgba(16,20,29,0.98),rgba(10,12,18,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-primary/90">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[2rem] font-black tracking-[-0.03em] text-text md:text-[2.45rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">{description}</p>
          </div>

          {actions ? (
            <div className="min-w-[240px] xl:max-w-[320px]">{actions}</div>
          ) : null}
        </div>

        {context ? (
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Studio context
              </p>
              <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
            </div>
            <div className="mt-4">{context}</div>
          </div>
        ) : null}

        {supporting ? <div>{supporting}</div> : null}
      </div>
    </div>
  );
}
