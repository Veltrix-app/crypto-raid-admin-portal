"use client";

import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessSignal } from "@/types/entities/success";

function toneForSignal(signal: AdminSuccessSignal["signalTone"]) {
  if (signal === "success") {
    return "success" as const;
  }

  if (signal === "danger") {
    return "danger" as const;
  }

  if (signal === "warning") {
    return "warning" as const;
  }

  return "default" as const;
}

export function SuccessSignalPanel({
  signals,
}: {
  signals: AdminSuccessSignal[];
}) {
  return (
    <OpsPanel
      eyebrow="Signals"
      title="Derived health and expansion signals"
      description="Signals are meant to explain why this account needs attention, not just assign a vague score."
    >
      <div className="space-y-3">
        {signals.length ? (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text">
                  {humanizeSuccessValue(signal.signalType)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <OpsStatusPill tone={toneForSignal(signal.signalTone)}>
                    {humanizeSuccessValue(signal.signalTone)}
                  </OpsStatusPill>
                  <OpsStatusPill>{humanizeSuccessValue(signal.status)}</OpsStatusPill>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">{signal.summary}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4 text-sm text-sub">
            No success signals are open for this account right now.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
