"use client";

import { RaidMemberPreview as RaidMemberPreviewModel } from "@/lib/studio/raid-studio";

export default function RaidMemberPreview({
  preview,
}: {
  preview: RaidMemberPreviewModel;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(88,146,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(199,255,0,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(6,8,12,0.82))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {preview.eyebrow}
            </p>
            <h3 className="mt-3 text-[1.45rem] font-extrabold tracking-[-0.03em] text-text">
              {preview.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-sub">{preview.summary}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Reward posture
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">{preview.rewardLabel}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {preview.verificationLabel}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            {preview.timerLabel}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            {preview.instructionCount} steps
          </span>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
                Pressure lane
              </p>
              <p className="mt-2 text-base font-semibold text-text">
                One live destination, one clear action, one guided wave.
              </p>
            </div>
            <span className="rounded-full bg-primary/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Raid live
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PreviewMeta label="Verification" value={preview.verificationLabel} />
            <PreviewMeta label="Urgency" value={preview.timerLabel} />
          </div>

          <div className="mt-5 rounded-[20px] bg-primary px-4 py-4 text-black shadow-[0_16px_28px_rgba(199,255,0,0.14)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/65">
              Primary objective
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em]">
              {preview.cta}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
