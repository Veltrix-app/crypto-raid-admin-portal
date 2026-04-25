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
      className={`relative self-start overflow-hidden rounded-[18px] border border-white/[0.04] bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.045),transparent_24%),linear-gradient(180deg,rgba(13,17,24,0.97),rgba(8,10,15,0.95))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />

      <div className="flex items-center gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.12),transparent)]" />
      </div>

      <div className="mt-3">
        <p className="text-[0.98rem] font-semibold tracking-[-0.02em] text-text">{title}</p>
        {description ? (
          <p className="mt-1.5 text-[12px] leading-5 text-sub/95">{description}</p>
        ) : null}
      </div>

      <div className="mt-3.5 border-t border-white/[0.04] pt-3.5">{children}</div>
    </div>
  );
}
