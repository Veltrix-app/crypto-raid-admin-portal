"use client";

import type { ReactNode } from "react";

export default function RaidActionCanvas({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Raid canvas
        </p>
        <h4 className="mt-3 text-[1.8rem] font-black tracking-[-0.03em] text-text">{title}</h4>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-sub">{description}</p>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
