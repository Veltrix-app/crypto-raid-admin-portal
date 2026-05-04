"use client";

import {
  BadgeCheck,
  ChevronRight,
  FileWarning,
  Layers3,
  RadioTower,
  Sparkles,
} from "lucide-react";
import type {
  CampaignStoryboardBlock as CampaignStoryboardBlockModel,
  CampaignStoryboardBlockId,
  CampaignStoryboardBlockStatus,
} from "@/lib/studio/campaign-storyboard";

function getStatusLabel(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "Ready";
  if (status === "needs_attention") return "Needs attention";
  return "Draft";
}

function getStatusClasses(status: CampaignStoryboardBlockStatus, selected = false) {
  if (selected) {
    return "border-primary/28 bg-[linear-gradient(135deg,rgba(199,255,0,0.105),rgba(255,255,255,0.035))] shadow-[0_14px_34px_rgba(0,0,0,0.2)]";
  }

  if (status === "ready") {
    return "border-white/[0.026] bg-white/[0.014] hover:border-primary/18 hover:bg-white/[0.035]";
  }

  if (status === "needs_attention") {
    return "border-amber-400/16 bg-amber-500/[0.045] hover:border-amber-300/25";
  }

  return "border-white/[0.026] bg-black/20 hover:border-white/[0.05] hover:bg-white/[0.03]";
}

function getStatusIcon(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return <BadgeCheck size={13} />;
  if (status === "needs_attention") return <FileWarning size={13} />;
  return <Layers3 size={13} />;
}

function getStatusTone(status: CampaignStoryboardBlockStatus) {
  if (status === "ready") return "text-primary bg-primary/[0.07]";
  if (status === "needs_attention") return "text-amber-300 bg-amber-500/[0.08]";
  return "text-sub bg-white/[0.07]";
}

export default function CampaignStoryboardCanvas({
  blocks,
  selectedBlockId,
  onSelect,
}: {
  blocks: CampaignStoryboardBlockModel[];
  selectedBlockId: CampaignStoryboardBlockId;
  onSelect: (blockId: CampaignStoryboardBlockId) => void;
}) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] p-5">
        <p className="text-lg font-black tracking-[-0.02em] text-text">
          Storyboard is still empty
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">
          Pick a campaign direction or template first, then the storyboard will project the
          launch journey here.
        </p>
      </div>
    );
  }

  const selectedBlock =
    blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? null;
  const selectedIndex = Math.max(
    0,
    blocks.findIndex((block) => block.id === selectedBlock?.id)
  );
  const readyCount = blocks.filter((block) => block.status === "ready").length;
  const attentionCount = blocks.filter((block) => block.status === "needs_attention").length;

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.026] bg-[radial-gradient(circle_at_6%_0%,rgba(199,255,0,0.06),transparent_26%),radial-gradient(circle_at_92%_4%,rgba(88,146,255,0.045),transparent_24%),linear-gradient(180deg,rgba(12,15,22,0.985),rgba(8,10,15,0.965))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.009)_1px,transparent_1px)] bg-[length:54px_54px] opacity-25" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-stretch">
        <div className="min-w-0 rounded-[18px] border border-white/[0.026] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/14 bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  <RadioTower size={12} />
                  Storyboard command
                </span>
                <span className="rounded-full border border-white/[0.026] bg-white/[0.018] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-sub">
                  Stage {selectedIndex + 1} of {blocks.length}
                </span>
              </div>
              <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.2rem]">
                {selectedBlock?.title ?? "Select a block"}
              </h3>
              <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
                {selectedBlock?.summary ??
                  "Campaign architecture waits for a focused launch block."}
              </p>
            </div>

            {selectedBlock ? (
              <span
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${getStatusTone(
                  selectedBlock.status
                )}`}
              >
                {getStatusIcon(selectedBlock.status)}
                {getStatusLabel(selectedBlock.status)}
              </span>
            ) : null}
          </div>

          {selectedBlock ? (
            <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
              <div className="rounded-[16px] border border-primary/10 bg-primary/[0.035] p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
                  Primary lens
                </p>
                <p className="mt-2 break-words text-[0.92rem] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
                  {selectedBlock.metric}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedBlock.notes.slice(0, 2).map((note, index) => (
                  <div
                    key={note}
                    className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3"
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-sub">
                      {index === 0 ? "Operator note" : "Launch note"}
                    </p>
                    <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-sub">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Route health
            </p>
            <Sparkles size={14} className="text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StoryboardMetric label="Ready" value={readyCount} />
            <StoryboardMetric label="Watch" value={attentionCount} />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(199,255,0,0.3)]"
              style={{ width: `${((selectedIndex + 1) / blocks.length) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-5 text-sub">
            One focused block carries the active quest, reward and launch decision.
          </p>
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-5">
        {blocks.map((block, index) => {
          const selected = block.id === selectedBlockId;

          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelect(block.id)}
              className={`group min-w-0 rounded-[16px] border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${getStatusClasses(
                block.status,
                selected
              )}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                      selected
                        ? "border-primary/24 bg-primary/[0.07] text-primary shadow-[0_0_16px_rgba(199,255,0,0.25)]"
                        : "border-white/[0.032] bg-black/20 text-sub"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-primary">
                      {block.eyebrow}
                    </p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-text">
                      {block.title}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full p-1.5 ${getStatusTone(block.status)}`}>
                  {getStatusIcon(block.status)}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 min-h-10 text-[11px] leading-5 text-sub">
                {block.summary}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.024] pt-2.5">
                <span className="truncate text-[10px] font-semibold text-sub">
                  {block.metric}
                </span>
                <ChevronRight
                  size={13}
                  className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
                    selected ? "text-primary" : "text-sub"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StoryboardMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
        {value}
      </p>
    </div>
  );
}
