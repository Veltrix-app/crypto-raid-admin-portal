"use client";

import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { TrustCaseTimelineEventRecord } from "./types";
import { formatTrustDate } from "./trust-ui";

export default function TrustCaseTimeline({
  events,
  loading,
  emptyState,
}: {
  events: TrustCaseTimelineEventRecord[];
  loading?: boolean;
  emptyState: string;
}) {
  return (
    <OpsPanel
      eyebrow="Timeline"
      title="Case history"
      description="Every annotation, escalation and resolution stays visible in one explainable timeline."
    >
      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="rounded-[24px] border border-line bg-card px-5 py-6 text-sm text-sub">
            {loading ? "Loading trust timeline..." : emptyState}
          </div>
        ) : null}

        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-[24px] border border-line bg-card2 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
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
                  {event.summary ?? "No summary was recorded for this trust event."}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sub">
                {formatTrustDate(event.createdAt)}
              </span>
            </div>

            {event.eventPayload ? (
              <div className="mt-4 rounded-[20px] border border-line bg-card px-4 py-4">
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
