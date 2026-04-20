"use client";

import { QuestMemberPreviewModel } from "@/lib/studio/quest-studio";

export default function QuestMemberPreview({
  preview,
}: {
  preview: QuestMemberPreviewModel;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {preview.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-text">
            {preview.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-sub">{preview.description}</p>
        </div>
        <span className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-sm font-bold text-text">
          {preview.rewardLabel}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {preview.verificationLabel}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
          Member CTA
        </span>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
          User CTA
        </p>
        <p className="mt-2 text-sm font-semibold text-text">{preview.actionLabel}</p>
      </div>
    </div>
  );
}
