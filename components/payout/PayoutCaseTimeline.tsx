"use client";

import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { PayoutCaseTimelineEventRecord } from "./types";
import { formatPayoutDate } from "./payout-ui";

export default function PayoutCaseTimeline({
  events,
  loading,
  emptyState,
}: {
  events: PayoutCaseTimelineEventRecord[];
  loading?: boolean;
  emptyState: string;
}) {
  return (
    <OpsPanel
      eyebrow="Timeline"
      title="Case history"
      description="Every annotation, retry, escalation and resolution stays visible in one explainable payout timeline."
    >
      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-5 py-6 text-sm text-sub">
            {loading ? "Loading payout timeline..." : emptyState}
          </div>
        ) : null}

        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-bold text-text">{event.eventType.replace(/_/g, " ")}</p>
                  {event.visibilityScope ? (
                    <OpsStatusPill>{event.visibilityScope}</OpsStatusPill>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-sub">
                  {event.summary ?? "No summary was recorded for this payout event."}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sub">
                {formatPayoutDate(event.createdAt)}
              </span>
            </div>

            {event.eventPayload ? (
              <div className="mt-4 rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                <pre className="whitespace-pre-wrap break-all text-xs leading-6 text-sub">
                  {JSON.stringify(event.eventPayload, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </OpsPanel>
  );
}
