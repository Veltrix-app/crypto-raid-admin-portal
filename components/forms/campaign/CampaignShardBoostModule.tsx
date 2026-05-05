"use client";

import { BadgeCheck, Gem, RadioTower } from "lucide-react";
import {
  FEATURED_SHARD_POOL_PRESETS,
  type FeaturedShardPoolPresetId,
} from "@/lib/lootboxes/featured-shard-pool-presets";

type Props = {
  value: FeaturedShardPoolPresetId;
  onChange: (value: FeaturedShardPoolPresetId) => void;
};

export default function CampaignShardBoostModule({ value, onChange }: Props) {
  const selectedPreset =
    FEATURED_SHARD_POOL_PRESETS.find((preset) => preset.id === value) ??
    FEATURED_SHARD_POOL_PRESETS[0];

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.035] bg-[radial-gradient(circle_at_0%_0%,rgba(199,255,0,0.09),transparent_32%),radial-gradient(circle_at_100%_14%,rgba(52,211,153,0.08),transparent_26%),linear-gradient(180deg,rgba(13,16,22,0.99),rgba(7,9,13,0.97))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            <RadioTower size={13} />
            Shard boost
          </p>
          <h3 className="mt-2 text-[1.02rem] font-semibold tracking-[-0.03em] text-text">
            Add hunt pressure to this campaign
          </h3>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sub">
            Boost pools deplete only when verified members complete valid featured actions.
          </p>
        </div>
        <div className="rounded-full border border-primary/[0.18] bg-primary/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
          {selectedPreset.id === "none" ? "Standard" : `${selectedPreset.poolSize.toLocaleString("en-US")} shards`}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {FEATURED_SHARD_POOL_PRESETS.map((preset) => {
          const active = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`rounded-[16px] border p-3 text-left transition ${
                active
                  ? "border-primary/45 bg-primary/[0.1] shadow-[0_0_30px_rgba(199,255,0,0.12)]"
                  : "border-white/[0.035] bg-white/[0.025] hover:border-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-text">{preset.label}</p>
                {active ? (
                  <BadgeCheck size={14} className="text-primary" />
                ) : (
                  <Gem size={14} className="text-sub" />
                )}
              </div>
              <p className="mt-2 min-h-[40px] text-[11px] leading-5 text-sub">
                {preset.description}
              </p>
              {preset.id !== "none" ? (
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
                  +{preset.bonusMin}-{preset.bonusMax} per verified action
                </p>
              ) : (
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-sub">
                  No extra pool attached
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
