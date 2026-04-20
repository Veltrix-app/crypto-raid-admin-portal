"use client";

import type { ReactNode } from "react";

export default function StudioPreviewCard({
  title = "Preview",
  eyebrow = "Member View",
  description,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4">
        <p className="text-lg font-black tracking-[-0.02em] text-text">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
