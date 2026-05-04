"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Crosshair, Sparkles, Users } from "lucide-react";
import {
  CampaignStudioAudienceId,
  CampaignStudioIntentId,
  getCampaignStudioAudienceOptions,
  getCampaignStudioIntentOptions,
} from "@/lib/studio/campaign-studio";

export default function CampaignIntentStep({
  selectedIntent,
  selectedAudience,
  onIntentChange,
  onAudienceChange,
}: {
  selectedIntent: CampaignStudioIntentId;
  selectedAudience: CampaignStudioAudienceId;
  onIntentChange: (intent: CampaignStudioIntentId) => void;
  onAudienceChange: (audience: CampaignStudioAudienceId) => void;
}) {
  const intentOptions = getCampaignStudioIntentOptions();
  const audienceOptions = getCampaignStudioAudienceOptions();
  const selectedIntentOption = intentOptions.find((option) => option.id === selectedIntent);
  const selectedAudienceOption = audienceOptions.find((option) => option.id === selectedAudience);

  return (
    <section className="rounded-[22px] border border-white/[0.026] bg-[radial-gradient(circle_at_3%_0%,rgba(199,255,0,0.06),transparent_32%),linear-gradient(180deg,rgba(13,16,23,0.965),rgba(8,10,15,0.94))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.15)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            <Sparkles size={12} />
            Campaign direction
          </p>
          <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.2rem]">
            Choose the lens before the playbook locks in
          </h3>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
            Goal and audience now sit in one compact decision layer, so project teams understand why a template is recommended before they continue.
          </p>
        </div>

        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[300px] sm:grid-cols-2">
          <DirectionMetric label="Goal" value={selectedIntentOption?.label || "Choose"} />
          <DirectionMetric label="Audience" value={selectedAudienceOption?.label || "Choose"} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <IntentChoiceLane
          icon={<Crosshair size={12} />}
          eyebrow="Goal"
          title="Campaign intent"
          options={intentOptions}
          selectedId={selectedIntent}
          onSelect={onIntentChange}
        />
        <IntentChoiceLane
          icon={<Users size={12} />}
          eyebrow="Audience"
          title="Member lens"
          options={audienceOptions}
          selectedId={selectedAudience}
          onSelect={onAudienceChange}
        />
      </div>
    </section>
  );
}

function DirectionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/25 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function IntentChoiceLane<T extends string>({
  icon,
  eyebrow,
  title,
  options,
  selectedId,
  onSelect,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  options: Array<{ id: T; label: string; summary: string }>;
  selectedId: T;
  onSelect: (id: T) => void;
}) {
  return (
    <section className="rounded-[18px] border border-white/[0.026] bg-black/20 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            {icon}
            {eyebrow}
          </p>
          <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.03em] text-text">
            {title}
          </h3>
        </div>
        <span className="rounded-full border border-white/[0.026] bg-black/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-sub">
          {options.length} options
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const active = option.id === selectedId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group rounded-[16px] border p-3 text-left transition duration-200 hover:-translate-y-0.5 ${
                active
                  ? "border-primary/30 bg-[linear-gradient(135deg,rgba(199,255,0,0.1),rgba(255,255,255,0.035))]"
                  : "border-white/[0.026] bg-black/20 hover:border-white/[0.05] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-[13px] font-semibold text-text [overflow-wrap:anywhere]">
                    {option.label}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-sub">
                    {option.summary}
                  </p>
                </div>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? "border-primary/20 bg-primary/[0.07] text-primary"
                      : "border-white/[0.03] bg-white/[0.025] text-sub"
                  }`}
                >
                  {active ? <BadgeCheck size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
