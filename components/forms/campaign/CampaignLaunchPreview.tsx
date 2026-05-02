"use client";
import { getCampaignLaunchPreview } from "@/lib/studio/campaign-studio";

type LaunchPreview = ReturnType<typeof getCampaignLaunchPreview>;

export default function CampaignLaunchPreview({
  preview,
}: {
  preview: LaunchPreview;
}) {
  const readyCount = preview.readiness.filter((item) => item.complete).length;
  const readinessPercent = Math.round(
    (readyCount / Math.max(preview.readiness.length, 1)) * 100
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Launch preview
            </p>
            <h3 className="mt-2 text-[1.35rem] font-black tracking-[-0.03em] text-text">
              {preview.campaignTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-sub">
              First member moment:{" "}
              <span className="font-semibold text-text">{preview.firstMemberMoment}</span>
            </p>
          </div>

          <div className="rounded-[16px] border border-white/[0.032] bg-black/20 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Launch posture
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {readyCount}/{preview.readiness.length} ready
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.032] bg-black/20 px-3.5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Launch pressure
            </p>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {readinessPercent}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.95),rgba(199,255,0,0.4))]"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
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
            className="rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 py-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    item.complete
                      ? "bg-primary shadow-[0_0_18px_rgba(199,255,0,0.32)]"
                      : "bg-amber-300"
                  }`}
                />
                <p className="text-sm font-bold text-text">{item.label}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  item.complete ? "bg-primary/[0.075] text-primary" : "bg-amber-500/[0.075] text-amber-300"
                }`}
              >
                {item.complete ? "Ready" : "Needs work"}
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-5.5 text-sub">{item.value}</p>
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
    <div className="rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[1.02rem] font-black tracking-[-0.03em] text-text">{value}</p>
    </div>
  );
}
