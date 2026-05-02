"use client";

import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import type { AdminReleaseDetail } from "@/types/entities/release";

function formatDateTime(value: string | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ReleaseTimelinePanel({ detail }: { detail: AdminReleaseDetail }) {
  const entries = [
    {
      key: "created",
      label: "Draft created",
      at: detail.release.createdAt,
      tone: "default" as const,
      body: "The release candidate was created and seeded with services, checks, smoke packs and audits.",
    },
    {
      key: "approved",
      label: "Approved",
      at: detail.release.approvedAt,
      tone: "warning" as const,
      body: "The release was explicitly approved for rollout.",
    },
    {
      key: "deploying",
      label: "Deploying",
      at: detail.release.deployingAt,
      tone: "warning" as const,
      body: "The release moved into rollout mode across the in-scope services.",
    },
    {
      key: "verified",
      label: "Verified",
      at: detail.release.verifiedAt,
      tone: "success" as const,
      body: "The release was marked verified after the critical smoke pack and gate posture were clear.",
    },
  ].filter((entry) => Boolean(entry.at));

  return (
    <OpsPanel
      eyebrow="Timeline"
      title="Release progression"
      description="Keep the rollout story explicit: when the release was approved, when deploy started, and whether it ever reached verified."
    >
      {entries.length ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.key} className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{entry.label}</p>
                <OpsStatusPill tone={entry.tone}>{formatDateTime(entry.at)}</OpsStatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-sub">{entry.body}</p>
            </div>
          ))}

          {detail.migrationLinks.length ? (
            <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4">
              <p className="text-sm font-bold text-text">Linked migrations</p>
              <div className="mt-3 space-y-2">
                {detail.migrationLinks.map((link) => (
                  <div key={link.id} className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">{link.migrationFilename}</p>
                      <div className="flex flex-wrap gap-2">
                        <OpsStatusPill>{link.reviewState.replaceAll("_", " ")}</OpsStatusPill>
                        <OpsStatusPill>{link.runState.replaceAll("_", " ")}</OpsStatusPill>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      {link.mitigationNotes || "No mitigation notes captured yet."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <InlineEmptyNotice
          title="Timeline is still sparse"
          description="This release has only been drafted so far; approval, deploy and verified timestamps will appear here as you move it through the lifecycle."
        />
      )}
    </OpsPanel>
  );
}

