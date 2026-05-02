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
    return "border-white/[0.032] bg-white/[0.018] hover:border-primary/20 hover:bg-white/[0.05]";
  }

  if (status === "needs_attention") {
    return "border-amber-400/18 bg-amber-500/[0.06] hover:border-amber-300/28";
  }

  return "border-white/[0.032] bg-black/20 hover:border-white/14 hover:bg-white/[0.04]";
}

function getStatusLabel(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "Ready";
  if (status === "needs_attention") return "Needs attention";
  return "Draft";
}

function getStatusCopy(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "This block already has enough context to ship in the first wave.";
  if (status === "needs_attention") {
    return "A few missing inputs are still stopping this moment from feeling launch-grade.";
  }

  return "Direction is defined, but the execution details still need shaping.";
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
      className={`relative overflow-hidden rounded-[18px] border p-4 text-left transition ${getStatusClasses(
        block.status,
        selected
      )}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_center,rgba(199,255,0,0.08),transparent_64%)]" />
      <div
        className={`pointer-events-none absolute inset-y-5 left-4 w-px bg-[linear-gradient(180deg,rgba(199,255,0,0.4),transparent_80%)] transition ${
          selected ? "opacity-100" : "opacity-35"
        }`}
      />

      <div className="flex items-start justify-between gap-4 pl-4">
        <div className="max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
            {block.eyebrow}
          </p>
          <h3 className="mt-2 text-[1.08rem] font-black tracking-[-0.02em] text-text">
            {block.title}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            block.status === "ready"
              ? "bg-primary/[0.075] text-primary"
              : block.status === "needs_attention"
                ? "bg-amber-500/[0.075] text-amber-300"
                : "bg-white/[0.08] text-sub"
          }`}
        >
          {getStatusLabel(block.status)}
        </span>
      </div>

      <p className="mt-3 min-h-[64px] pl-4 text-sm leading-5.5 text-sub/95">{block.summary}</p>

      <div className="mt-4 grid gap-2.5 pl-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
                Primary lens
              </p>
              <p className="mt-2 text-base font-semibold text-text">{block.metric}</p>
            </div>
            <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
              {selected ? "Live focus" : "Storyboard block"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-5.5 text-sub/90">{getStatusCopy(block.status)}</p>
        </div>

        {block.notes[0] ? (
          <div className="rounded-[18px] border border-white/[0.032] bg-black/20 px-3.5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Guidance
            </p>
            <p className="mt-2.5 text-sm leading-5.5 text-sub/95">{block.notes[0]}</p>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-4 flex items-center gap-2 pl-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(199,255,0,0.42)]" />
          Focus block
        </div>
      ) : null}
    </button>
  );
}
