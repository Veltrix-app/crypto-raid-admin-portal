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
    <div className="relative self-start overflow-hidden rounded-[20px] border border-white/[0.026] bg-[radial-gradient(circle_at_top_left,rgba(199,255,0,0.08),transparent_20%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_22%),linear-gradient(180deg,rgba(13,17,24,0.985),rgba(8,10,15,0.965))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[28%] bg-[radial-gradient(circle_at_center,rgba(199,255,0,0.045),transparent_58%)]" />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/90">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-[1.18rem] font-semibold tracking-[-0.03em] text-text md:text-[1.4rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-sub/95">{description}</p>
          </div>

          {actions ? (
            <div className="min-w-[220px] rounded-[16px] border border-white/[0.026] bg-black/20 p-3 xl:max-w-[300px]">
              {actions}
            </div>
          ) : null}
        </div>

        {context || supporting ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
            {context ? (
          <div className="rounded-[16px] border border-white/[0.026] bg-black/20 px-3 py-3">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
                Studio context
              </p>
              <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.12),transparent)]" />
            </div>
            <div className="mt-2.5">{context}</div>
          </div>
            ) : (
              <div />
            )}

            {supporting ? (
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-3 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary/90">
                    Studio signals
                  </p>
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.12),transparent)]" />
                </div>
                <div className="mt-2.5">{supporting}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
