"use client";
import { getCampaignLaunchPreview } from "@/lib/studio/campaign-studio";

type LaunchPreview = ReturnType<typeof getCampaignLaunchPreview>;

export default function CampaignLaunchPreview({
  preview,
}: {
  preview: LaunchPreview;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Launch preview
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-text">
          {preview.campaignTitle}
        </h3>
        <p className="mt-3 text-sm leading-6 text-sub">
          First member moment: <span className="font-semibold text-text">{preview.firstMemberMoment}</span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <PreviewStat label="Quest drafts" value={String(preview.questCount)} />
        <PreviewStat label="Reward drafts" value={String(preview.rewardCount)} />
        <PreviewStat label="Missing context" value={String(preview.missingContextCount)} />
      </div>

      <div className="space-y-3">
        {preview.readiness.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">{item.label}</p>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  item.complete
                    ? "bg-primary/15 text-primary"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {item.complete ? "Ready" : "Needs work"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-sub">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-lg font-black tracking-[-0.02em] text-text">{value}</p>
    </div>
  );
}
