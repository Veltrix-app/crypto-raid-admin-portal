"use client";

import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminComplianceControl } from "@/types/entities/security";

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
        <div className="grid gap-2.5 xl:grid-cols-2">
          {controls.map((control) => (
            <div key={control.id} className="rounded-[16px] border border-white/[0.025] bg-white/[0.014] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-text">{control.title}</p>
                    <OpsStatusPill tone="default">
                      {formatSecurityLabel(control.controlState)}
                    </OpsStatusPill>
                    <OpsStatusPill>{formatSecurityLabel(control.reviewState)}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-sub">{control.summary}</p>
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
