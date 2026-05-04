"use client";

import type { ReactNode } from "react";
import { BadgeCheck, FileWarning, Layers3 } from "lucide-react";
import type {
  CampaignStoryboardBlock,
  CampaignStoryboardBlockStatus,
} from "@/lib/studio/campaign-storyboard";

function getStatusLabel(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "Ready";
  if (status === "needs_attention") return "Watch";
  return "Draft";
}

function getStatusTone(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "bg-primary/[0.07] text-primary";
  if (status === "needs_attention") return "bg-amber-500/[0.08] text-amber-300";
  return "bg-white/[0.07] text-sub";
}

function getStatusIcon(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return <BadgeCheck size={13} />;
  if (status === "needs_attention") return <FileWarning size={13} />;
  return <Layers3 size={13} />;
}

export default function CampaignStoryboardInspector({
  block,
  children,
}: {
  block: CampaignStoryboardBlock | null;
  children?: ReactNode;
}) {
  if (!block) {
    return (
      <div className="rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.2)]">
        <p className="text-lg font-black tracking-[-0.02em] text-text">Select a storyboard block</p>
        <p className="mt-3 text-sm leading-6 text-sub">
          Pick a campaign block from the storyboard to focus the inspector on one part of the journey.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/[0.026] bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.045),transparent_28%),linear-gradient(180deg,rgba(15,19,28,0.96),rgba(8,10,15,0.94))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
          Selected block
        </p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${getStatusTone(
            block.status
          )}`}
        >
          {getStatusIcon(block.status)}
          {getStatusLabel(block.status)}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
          {block.title}
        </p>
        <p className="mt-2 text-[12px] leading-5 text-sub">{block.summary}</p>
      </div>

      <div className="mt-3 rounded-[15px] border border-primary/10 bg-primary/[0.035] px-3 py-3">
        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">Focus</p>
        <p className="mt-2 break-words text-[12px] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
          {block.metric}
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {block.notes.map((note) => (
          <div
            key={note}
            className="rounded-[15px] border border-white/[0.022] bg-white/[0.014] px-3 py-2.5"
          >
            <p className="line-clamp-3 text-[11px] leading-5 text-sub">{note}</p>
          </div>
        ))}
      </div>

      {children ? (
        <div className="mt-4 border-t border-white/[0.026] pt-4">{children}</div>
      ) : null}
    </div>
  );
}
