"use client";

import type { AdminRaid } from "@/types/entities/raid";

export default function RaidVerificationRail({
  verificationType,
  verificationConfig,
  platform,
}: {
  verificationType: AdminRaid["verificationType"];
  verificationConfig?: string;
  platform: AdminRaid["platform"];
}) {
  const configState = getConfigState(verificationConfig);

  return (
    <div className="space-y-4 rounded-[18px] border border-white/[0.032] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Verification rail
          </p>
          <p className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-text">
            {verificationType.replace(/_/g, " ")}
          </p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
          {platform}
        </span>
      </div>

      <p className="text-sm leading-6 text-sub">
        Raids work best when the proof path is obvious. Keep the route simple enough for contributors
        and strong enough for operators to trust the result.
      </p>

      <div className="rounded-[18px] border border-white/[0.032] bg-black/20 px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Config state" value={configState.label} />
          <InfoRow
            label="Suggested route"
            value={
              verificationType === "manual_confirm"
                ? "Use when captains or moderators confirm the wave manually."
                : verificationType === "telegram_bot_check" || verificationType === "discord_role_check"
                  ? "Best when the community bot can prove the member completed the join or role step."
                  : "Use exact post or account data so the verification layer has one clear target."
            }
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow label="Operator posture" value={configState.operatorPosture} />
        <InfoRow label="Why it matters" value={configState.reason} />
      </div>
    </div>
  );
}

function getConfigState(raw: string | undefined) {
  if (!raw?.trim()) {
    return {
      label: "No JSON config yet",
      operatorPosture: "Manual-safe",
      reason: "This raid can still work, but automated checks will be weaker without explicit config.",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const keyCount = Object.keys(parsed).length;

    return {
      label: `${keyCount} config ${keyCount === 1 ? "key" : "keys"} connected`,
      operatorPosture: "Automation-ready",
      reason: "The verification rail has structured input and can be reviewed with more confidence.",
    };
  } catch {
    return {
      label: "Invalid JSON",
      operatorPosture: "Fix before launch",
      reason: "Invalid config makes the verification route brittle and should be corrected before the raid goes live.",
    };
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.032] bg-white/[0.018] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}
