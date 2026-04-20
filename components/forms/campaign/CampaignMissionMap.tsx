"use client";

import { CampaignMissionMapItem } from "@/lib/studio/campaign-studio";

const KIND_LABELS: Record<CampaignMissionMapItem["kind"], string> = {
  entry: "Entry",
  quest: "Quest",
  reward: "Reward",
  raid: "Raid",
};

export default function CampaignMissionMap({
  items,
}: {
  items: CampaignMissionMapItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
        <p className="text-sm font-bold text-text">Mission map is empty</p>
        <p className="mt-2 text-sm leading-6 text-sub">
          Pick a playbook or include generated drafts to see the first-wave campaign architecture.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
                  {KIND_LABELS[item.kind]}
                </span>
                <span className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                  Stage {index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-text">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-sub">{item.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  item.status === "ready"
                    ? "bg-primary/15 text-primary"
                    : item.status === "needs_context"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-white/5 text-sub"
                }`}
              >
                {item.status === "ready"
                  ? "Ready"
                  : item.status === "needs_context"
                    ? "Needs context"
                    : "Draft"}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
                {item.meta}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
