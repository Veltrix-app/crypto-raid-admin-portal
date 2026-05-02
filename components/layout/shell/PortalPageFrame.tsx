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
    <div className="space-y-3.5">
      <section className="rounded-[16px] border border-white/[0.018] bg-[linear-gradient(180deg,rgba(11,14,20,0.64),rgba(7,9,14,0.52))] px-3 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.1)] md:px-3.5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.055] px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {eyebrow}
              </span>
              <h1 className="truncate text-[0.98rem] font-semibold tracking-[-0.025em] text-text">
                {title}
              </h1>
            </div>
            <p className="mt-1 max-w-4xl text-[11px] leading-5 text-sub">{description}</p>
          </div>

          {actions ? (
            <div className="rounded-[14px] border border-white/[0.024] bg-white/[0.018] px-3 py-2">
              {actions}
            </div>
          ) : null}
        </div>
      </section>
      {statusBand ? <div>{statusBand}</div> : null}
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}
