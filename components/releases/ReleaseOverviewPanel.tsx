"use client";

import Link from "next/link";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import {
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { formatReleaseLabel, getReleaseDecisionTone } from "@/lib/release/release-contract";
import type { AdminReleaseOverview } from "@/types/entities/release";

function stateTone(state: string) {
  if (state === "verified") {
    return "success" as const;
  }
  if (state === "degraded" || state === "rolled_back") {
    return "danger" as const;
  }
  if (["approved", "deploying", "smoke_pending", "ready_for_review"].includes(state)) {
    return "warning" as const;
  }
  return "default" as const;
}

export function ReleaseOverviewPanel({ overview }: { overview: AdminReleaseOverview }) {
  return (
    <div className="space-y-6">
      <OpsPanel
        eyebrow="Release posture"
        title="Candidate overview"
        description="See what is live, what is waiting on QA, and which release still needs operator attention."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <OpsMetricCard label="Open releases" value={overview.counts.openReleases} />
          <OpsMetricCard label="Verified" value={overview.counts.verifiedReleases} />
          <OpsMetricCard
            label="Blocking failures"
            value={overview.counts.blockingFailures}
            emphasis={overview.counts.blockingFailures > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Smoke pending"
            value={overview.counts.smokePending}
            emphasis={overview.counts.smokePending > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Env warnings"
            value={overview.counts.environmentWarnings}
            emphasis={overview.counts.environmentWarnings > 0 ? "warning" : "default"}
          />
        </div>
      </OpsPanel>

      <OpsPanel
        eyebrow="Current candidate"
        title={overview.activeRelease ? overview.activeRelease.title : "No active release"}
        description={
          overview.activeRelease
            ? overview.activeRelease.summary || "This release is currently the closest thing to the active ship candidate."
            : "Create a draft release to start tracking gates, smoke and rollback posture."
        }
        tone="accent"
      >
        {overview.activeRelease ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
                {overview.activeRelease.releaseRef}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <OpsStatusPill tone={stateTone(overview.activeRelease.state)}>
                  {formatReleaseLabel(overview.activeRelease.state)}
                </OpsStatusPill>
                <OpsStatusPill tone={getReleaseDecisionTone(overview.activeRelease.decision)}>
                  {formatReleaseLabel(overview.activeRelease.decision)}
                </OpsStatusPill>
                <OpsStatusPill>{overview.activeRelease.targetEnvironment}</OpsStatusPill>
              </div>
              <p className="mt-3 text-xs leading-5 text-sub">
                {overview.activeRelease.counts.blockingFailures} blocking failures,{" "}
                {overview.activeRelease.counts.smokePending} pending smoke items and{" "}
                {overview.activeRelease.counts.envWarnings} environment warnings are currently attached to this release.
              </p>
            </div>

            <div className="flex items-end">
              <Link
                href={`/releases/${overview.activeRelease.id}`}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
              >
                Open
              </Link>
            </div>
          </div>
        ) : (
          <InlineEmptyNotice
            title="No active release"
            description="Draft the next release candidate and seed the checks, smoke packs and environment audits."
          />
        )}
      </OpsPanel>

      <OpsPanel
        eyebrow="Recent releases"
        title="Release history"
        description="Recent candidates, their current state and how much work is still open on each one."
      >
        {overview.releases.length ? (
          <div className="space-y-3">
            {overview.releases.map((release) => (
              <Link
                key={release.id}
                href={`/releases/${release.id}`}
                className="block rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-4 py-3.5 transition hover:border-primary/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-text">{release.title}</p>
                    <p className="mt-1.5 text-xs leading-5 text-sub">
                      {release.releaseRef} | {release.targetEnvironment} | {release.counts.servicesIncluded} services in scope
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <OpsStatusPill tone={stateTone(release.state)}>
                      {formatReleaseLabel(release.state)}
                    </OpsStatusPill>
                    <OpsStatusPill tone={getReleaseDecisionTone(release.decision)}>
                      {formatReleaseLabel(release.decision)}
                    </OpsStatusPill>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <InlineEmptyNotice
            title="No releases recorded yet"
            description="The Phase 15 release machine is ready, but it does not have any release candidates yet."
          />
        )}
      </OpsPanel>
    </div>
  );
}
