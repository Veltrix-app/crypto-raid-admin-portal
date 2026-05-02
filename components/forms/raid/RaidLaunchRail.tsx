"use client";

import type { RaidLaunchWarning } from "@/lib/studio/raid-studio";

export default function RaidLaunchRail({
  rewardXp,
  timer,
  status,
  warnings,
}: {
  rewardXp: number;
  timer?: string;
  status: string;
  warnings: RaidLaunchWarning[];
}) {
  const warningCount = warnings.filter((item) => item.tone === "warning").length;

  return (
    <div className="space-y-4 rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Launch posture
          </p>
          <p className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-text">
            Pressure and urgency
          </p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
          {warningCount > 0 ? `${warningCount} watch` : "stable"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LaunchStat label="Reward XP" value={`${rewardXp || 0}`} />
        <LaunchStat label="Timer" value={timer?.trim() || "No timer"} />
        <LaunchStat label="Status" value={status} />
      </div>

      <div className="space-y-3">
        {warnings.slice(0, 2).map((warning) => (
          <div
            key={warning.label}
            className={`rounded-[20px] border px-4 py-4 ${
              warning.tone === "warning"
                ? "border-amber-400/16 bg-amber-500/8"
                : warning.tone === "success"
                  ? "border-primary/16 bg-primary/8"
                  : "border-white/[0.032] bg-white/[0.018]"
            }`}
          >
            <p className="text-sm font-bold text-text">{warning.label}</p>
            <p className="mt-2 text-sm leading-6 text-sub">{warning.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.032] bg-white/[0.018] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-text">{value}</p>
    </div>
  );
}
