"use client";

import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminComplianceControl } from "@/types/entities/security";

function toneForControl(control: AdminComplianceControl) {
  if (control.controlState === "needs_work" || control.reviewState === "attention_needed") {
    return "warning";
  }

  if (control.controlState === "implemented" && control.reviewState === "reviewed") {
    return "success";
  }

  return "default";
}

export function ComplianceControlsPanel({
  controls,
}: {
  controls: AdminComplianceControl[];
}) {
  return (
    <OpsPanel
      eyebrow="Compliance controls"
      title="Review cadence and evidence posture"
      description="These controls power both the public trust center and the internal compliance review queue."
    >
      {controls.length ? (
        <div className="space-y-3">
          {controls.map((control) => (
            <div key={control.id} className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text">{control.title}</p>
                    <OpsStatusPill tone={toneForControl(control)}>
                      {formatSecurityLabel(control.controlState)}
                    </OpsStatusPill>
                    <OpsStatusPill>{formatSecurityLabel(control.reviewState)}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sub">{control.summary}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <InlineEmptyNotice
          title="No compliance controls loaded"
          description="Controls appear here once the security compliance layer is seeded."
        />
      )}
    </OpsPanel>
  );
}
