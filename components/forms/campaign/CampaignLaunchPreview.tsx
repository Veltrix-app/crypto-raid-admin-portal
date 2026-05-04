"use client";
import { BadgeCheck, FileWarning, RadioTower } from "lucide-react";
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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[18px] border border-white/[0.032] bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.1),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/14 bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              <RadioTower size={12} />
              Launch preview
            </p>
            <h3 className="mt-3 break-words text-[1.05rem] font-semibold leading-6 tracking-[-0.03em] text-text [overflow-wrap:anywhere]">
              {preview.campaignTitle}
            </h3>
            <p className="mt-2 text-[12px] leading-5 text-sub">
              First member moment:{" "}
              <span className="font-semibold text-text">{preview.firstMemberMoment}</span>
            </p>
          </div>

          <div className="rounded-[14px] border border-white/[0.032] bg-black/25 px-3 py-2.5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
              Launch posture
            </p>
            <p className="mt-1 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
              {readyCount}/{preview.readiness.length} ready
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[16px] border border-white/[0.026] bg-black/25 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              Launch pressure
            </p>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">
              {readinessPercent}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.95),rgba(199,255,0,0.4))]"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <PreviewStat label="Quest drafts" value={String(preview.questCount)} />
        <PreviewStat label="Reward drafts" value={String(preview.rewardCount)} />
        <PreviewStat label="Missing context" value={String(preview.missingContextCount)} />
      </div>

      <div className="space-y-2">
        {preview.readiness.map((item) => (
          <div
            key={item.label}
            className="rounded-[16px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3.5 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    item.complete
                      ? "border-primary/20 bg-primary/[0.06] text-primary"
                      : "border-amber-400/20 bg-amber-500/[0.08] text-amber-300"
                  }`}
                >
                  {item.complete ? <BadgeCheck size={13} /> : <FileWarning size={13} />}
                </span>
                <p className="text-[12px] font-semibold text-text">{item.label}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${
                  item.complete ? "bg-primary/[0.075] text-primary" : "bg-amber-500/[0.075] text-amber-300"
                }`}
              >
                {item.complete ? "Ready" : "Needs work"}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-sub">{item.value}</p>
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
    <div className="rounded-[14px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">{value}</p>
    </div>
  );
}
