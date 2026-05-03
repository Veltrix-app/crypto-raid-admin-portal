"use client";

import type { ReactNode } from "react";

type PortalPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  statusBand?: ReactNode;
  children: ReactNode;
};

export default function PortalPageFrame({
  eyebrow,
  title,
  description,
  actions,
  statusBand,
  children,
}: PortalPageFrameProps) {
  return (
    <div className="space-y-3">
      <section className="border-b border-white/[0.018] pb-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.045] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {eyebrow}
              </span>
              <h1 className="min-w-0 truncate text-[1rem] font-semibold tracking-[-0.025em] text-text">
                {title}
              </h1>
            </div>
            <p className="mt-1 max-w-4xl text-[11px] leading-5 text-sub">{description}</p>
          </div>

          {actions ? (
            <div className="rounded-[14px] border border-white/[0.02] bg-white/[0.012] px-2.5 py-2">
              {actions}
            </div>
          ) : null}
        </div>
      </section>
      {statusBand ? <div>{statusBand}</div> : null}
      <div className="space-y-3">{children}</div>
    </div>
  );
}
