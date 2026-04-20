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
      className={`relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.08),transparent_24%),linear-gradient(180deg,rgba(17,21,31,0.97),rgba(10,12,18,0.95))] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.22)] ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />

      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4">
        <p className="text-lg font-black tracking-[-0.02em] text-text">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-sub/95">{description}</p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-white/8 pt-4">{children}</div>
    </div>
  );
}
