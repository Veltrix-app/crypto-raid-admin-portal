"use client";

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Goal
        </p>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {intentOptions.map((option) => {
            const active = option.id === selectedIntent;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onIntentChange(option.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  active
                    ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                    : "border-line bg-card2 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold text-text">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{option.summary}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Audience
        </p>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {audienceOptions.map((option) => {
            const active = option.id === selectedAudience;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAudienceChange(option.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  active
                    ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                    : "border-line bg-card2 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold text-text">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{option.summary}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
