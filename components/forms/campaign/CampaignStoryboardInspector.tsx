"use client";

import type { ReactNode } from "react";
import type { CampaignStoryboardBlock } from "@/lib/studio/campaign-storyboard";

export default function CampaignStoryboardInspector({
  block,
  children,
}: {
  block: CampaignStoryboardBlock | null;
  children?: ReactNode;
}) {
  if (!block) {
    return (
      <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <p className="text-lg font-black tracking-[-0.02em] text-text">Select a storyboard block</p>
        <p className="mt-3 text-sm leading-6 text-sub">
          Pick a campaign block from the storyboard to focus the inspector on one part of the journey.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Selected block
        </p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4">
        <p className="text-lg font-black tracking-[-0.02em] text-text">{block.title}</p>
        <p className="mt-2 text-sm leading-6 text-sub">{block.summary}</p>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">Focus</p>
        <p className="mt-2 text-sm font-semibold text-text">{block.metric}</p>
      </div>

      <div className="mt-5 space-y-3">
        {block.notes.map((note) => (
          <div
            key={note}
            className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
          >
            <p className="text-sm leading-6 text-sub">{note}</p>
          </div>
        ))}
      </div>

      {children ? <div className="mt-6 border-t border-white/8 pt-6">{children}</div> : null}
    </div>
  );
}
