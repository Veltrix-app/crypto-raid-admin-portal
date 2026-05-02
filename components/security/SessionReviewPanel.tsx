"use client";

import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminSecuritySession } from "@/types/entities/security";

function formatDateLabel(value: string | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(status: AdminSecuritySession["status"]) {
  switch (status) {
    case "revoked":
      return "danger";
    case "challenged":
      return "warning";
    default:
      return "success";
  }
}

export function SessionReviewPanel({
  sessions,
  onRevoke,
  revokingSessionId,
}: {
  sessions: AdminSecuritySession[];
  onRevoke: (sessionId: string) => Promise<void> | void;
  revokingSessionId?: string | null;
}) {
  return (
    <OpsPanel
      eyebrow="Sessions"
      title="Review active sessions"
      description="Revoke stale sessions quickly when a device is no longer trusted or when a re-auth flow is needed."
    >
      {sessions.length ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text">
                      {session.userAgent || "Unknown device"}
                    </p>
                    <OpsStatusPill tone={statusTone(session.status)}>
                      {formatSecurityLabel(session.status)}
                    </OpsStatusPill>
                    <OpsStatusPill>{formatSecurityLabel(session.primaryAuthMethod)}</OpsStatusPill>
                    <OpsStatusPill>{session.currentAal}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Last seen {formatDateLabel(session.lastSeenAt)}
                    {session.ipSummary ? ` | IP ${session.ipSummary}` : ""}
                    {session.email ? ` | ${session.email}` : ""}
                  </p>
                </div>

                {session.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => void onRevoke(session.id)}
                    disabled={revokingSessionId === session.id}
                    className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                  >
                    {revokingSessionId === session.id ? "Revoking..." : "Revoke"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <InlineEmptyNotice
          title="No tracked sessions yet"
          description="Session posture appears here after the current portal session has been synced through the security layer."
        />
      )}
    </OpsPanel>
  );
}
