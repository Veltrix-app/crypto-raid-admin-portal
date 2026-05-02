"use client";

import { QuestMemberPreviewModel } from "@/lib/studio/quest-studio";

export default function QuestMemberPreview({
  preview,
}: {
  preview: QuestMemberPreviewModel;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
      <div className="rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(6,8,12,0.82))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {preview.eyebrow}
            </p>
            <h3 className="mt-3 text-[1.45rem] font-extrabold tracking-[-0.03em] text-text">
              {preview.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-sub">{preview.description}</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.032] bg-black/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Reward posture
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">{preview.rewardLabel}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/[0.075] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {preview.verificationLabel}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            Member CTA
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            Recognition ready
          </span>
        </div>

        <div className="mt-5 rounded-[18px] border border-white/[0.032] bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
                Member lane
              </p>
              <p className="mt-2 text-base font-semibold text-text">
                Complete action and claim the next unlock
              </p>
            </div>
            <span className="rounded-full bg-primary/[0.065] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Active
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                Verification
              </p>
              <p className="mt-2 text-sm font-semibold text-text">{preview.verificationLabel}</p>
            </div>
            <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                Member reward
              </p>
              <p className="mt-2 text-sm font-semibold text-text">{preview.rewardLabel}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] bg-primary px-4 py-4 text-black shadow-[0_16px_28px_rgba(199,255,0,0.14)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/65">
              Primary CTA
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em]">
              {preview.actionLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
