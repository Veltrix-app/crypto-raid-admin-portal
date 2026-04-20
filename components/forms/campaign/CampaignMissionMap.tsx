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
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Mission architecture
          </p>
          <h3 className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-text">
            The first-wave member path
          </h3>
        </div>
        <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
          {items.length} blocks
        </span>
      </div>

      <div className="mt-5 space-y-0">
        {items.map((item, index) => (
          <div key={item.id} className="grid gap-4 md:grid-cols-[68px_minmax(0,1fr)]">
            <div className="relative flex min-h-[172px] flex-col items-center pt-2">
              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border text-sm font-black tracking-[-0.02em] ${
                  item.status === "ready"
                    ? "border-primary/35 bg-primary/12 text-primary shadow-[0_0_24px_rgba(199,255,0,0.18)]"
                    : item.status === "needs_context"
                      ? "border-amber-400/30 bg-amber-500/12 text-amber-300"
                      : "border-white/12 bg-white/[0.03] text-text"
                }`}
              >
                {index + 1}
              </div>
              {index < items.length - 1 ? (
                <div className="mt-3 h-full w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
              ) : null}
            </div>

            <div className="pb-5">
              <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
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
                    <p className="mt-3 text-base font-bold text-text">{item.title}</p>
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
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
                    Operator note
                  </p>
                  <p className="mt-2 text-sm font-semibold text-text">{item.meta}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
