"use client";

import type {
  CampaignStoryboardBlock as CampaignStoryboardBlockModel,
  CampaignStoryboardBlockStatus,
} from "@/lib/studio/campaign-storyboard";

function getStatusClasses(status: CampaignStoryboardBlockStatus, selected: boolean) {
  if (selected) {
    return "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))] shadow-[0_16px_34px_rgba(0,0,0,0.22)]";
  }

  if (status === "ready") {
    return "border-white/8 bg-white/[0.03] hover:border-primary/20 hover:bg-white/[0.05]";
  }

  if (status === "needs_attention") {
    return "border-amber-400/18 bg-amber-500/[0.06] hover:border-amber-300/28";
  }

  return "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]";
}

function getStatusLabel(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "Ready";
  if (status === "needs_attention") return "Needs attention";
  return "Draft";
}

export default function CampaignStoryboardBlock({
  block,
  selected,
  onSelect,
}: {
  block: CampaignStoryboardBlockModel;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[28px] border p-5 text-left transition ${getStatusClasses(
        block.status,
        selected
      )}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
            {block.eyebrow}
          </p>
          <h3 className="mt-3 text-xl font-black tracking-[-0.02em] text-text">
            {block.title}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            block.status === "ready"
              ? "bg-primary/15 text-primary"
              : block.status === "needs_attention"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-white/[0.08] text-sub"
          }`}
        >
          {getStatusLabel(block.status)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-sub">{block.summary}</p>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">Focus</p>
        <p className="mt-2 text-sm font-semibold text-text">{block.metric}</p>
      </div>
    </button>
  );
}
