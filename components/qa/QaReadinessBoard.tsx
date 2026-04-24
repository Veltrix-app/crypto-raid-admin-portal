"use client";

import Link from "next/link";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import {
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { formatReleaseLabel, getReleaseDecisionTone } from "@/lib/release/release-contract";
import type { AdminQaOverview } from "@/types/entities/release";

function readinessTone(value: "ready" | "warning" | "critical") {
  if (value === "ready") {
    return "success" as const;
  }
  if (value === "critical") {
    return "danger" as const;
  }
  return "warning" as const;
}

export function QaReadinessBoard({ overview }: { overview: AdminQaOverview }) {
  return (
    <div className="space-y-6">
      <OpsPanel
        eyebrow="QA posture"
        title="Readiness at a glance"
        description="See what still blocks launch, which smoke packs are incomplete, and where the current release candidate needs review."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <OpsMetricCard label="Candidates waiting on QA" value={overview.releaseCandidatesWaitingOnQa.length} />
          <OpsMetricCard
            label="Blocking failures"
            value={overview.blockingChecks.length}
            emphasis={overview.blockingChecks.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Smoke pending"
            value={overview.incompleteSmoke.length}
            emphasis={overview.incompleteSmoke.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Env warnings"
            value={overview.environmentWarnings.length}
            emphasis={overview.environmentWarnings.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Deploy hygiene warnings"
            value={overview.deployChecks?.warningCount ?? 0}
            emphasis={(overview.deployChecks?.warningCount ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </OpsPanel>

      <OpsPanel
        eyebrow="Service readiness"
        title="Readiness by surface"
        description="Keep the whole stack in one board: webapp, portal, docs and the community bot."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview.readinessByService.map((surface) => (
            <div key={surface.serviceKey} className="rounded-[20px] border border-line bg-card2 px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-text">{surface.label}</p>
                <OpsStatusPill tone={readinessTone(surface.readiness)}>{surface.readiness}</OpsStatusPill>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-sub">
                {surface.releaseCount} active releases, {surface.blockingFailures} blocking failures,{" "}
                {surface.smokePending} pending smoke items.
              </p>
            </div>
          ))}
        </div>
      </OpsPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <OpsPanel
          eyebrow="Current candidate"
          title={overview.activeRelease?.title ?? "No active release"}
          description={
            overview.activeRelease
              ? overview.activeRelease.summary || "This is the active release currently moving through QA."
              : "There is no active release candidate to verify right now."
          }
        >
          {overview.activeRelease ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <OpsStatusPill tone={getReleaseDecisionTone(overview.activeRelease.decision)}>
                  {formatReleaseLabel(overview.activeRelease.decision)}
                </OpsStatusPill>
                <OpsStatusPill>{formatReleaseLabel(overview.activeRelease.state)}</OpsStatusPill>
              </div>
              <Link
                href={`/releases/${overview.activeRelease.id}`}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
              >
                Open release
              </Link>
            </div>
          ) : (
            <InlineEmptyNotice
              title="No active release"
              description="Create a release candidate first so QA can start tracking real gates and smoke posture."
            />
          )}
        </OpsPanel>

        <OpsPanel
          eyebrow="Live deploy hygiene"
          title="Runtime snapshot"
          description="A current deploy snapshot from the portal runtime, useful as an early warning layer while QA is running."
          tone="accent"
        >
          {overview.deployChecks ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <OpsStatusPill
                  tone={
                    overview.deployChecks.overallState === "critical"
                      ? "danger"
                      : overview.deployChecks.overallState === "warning"
                        ? "warning"
                        : "success"
                  }
                >
                  {overview.deployChecks.overallState}
                </OpsStatusPill>
                <p className="text-sm text-sub">
                  {overview.deployChecks.warningCount} warnings, {overview.deployChecks.criticalCount} critical
                </p>
              </div>
              <div className="space-y-2">
                {overview.deployChecks.checks.map((check) => (
                  <div key={check.key} className="rounded-[16px] border border-white/10 bg-black/15 px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">{check.label}</p>
                      <OpsStatusPill
                        tone={
                          check.state === "critical"
                            ? "danger"
                            : check.state === "warning"
                              ? "warning"
                              : "success"
                        }
                      >
                        {check.state}
                      </OpsStatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <InlineEmptyNotice
              title="No deploy snapshot"
              description="The portal could not load the live deploy hygiene summary for this session."
            />
          )}
        </OpsPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <OpsPanel
          eyebrow="Blocking checks"
          title="What stops launch right now"
          description="These are the checks that currently produce hard no-go pressure across the release candidates still in flight."
        >
          {overview.blockingChecks.length ? (
            <div className="space-y-2">
              {overview.blockingChecks.map((check) => (
                <div key={check.id} className="rounded-[16px] border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5">
                  <p className="text-sm font-bold text-text">{check.label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-sub">{check.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyNotice
              title="No blocking checks"
              description="The QA board does not currently see any blocking failed checks across active release candidates."
            />
          )}
        </OpsPanel>

        <OpsPanel
          eyebrow="Smoke and environment"
          title="What still needs verification"
          description="Pending smoke items and environment warnings that still keep the release machine on watch."
        >
          <div className="space-y-4">
            {overview.incompleteSmoke.length ? (
              <div>
                <p className="text-sm font-bold text-text">Incomplete smoke</p>
                <div className="mt-2 space-y-2">
                  {overview.incompleteSmoke.map((entry) => (
                    <div key={entry.id} className="rounded-[16px] border border-white/10 bg-black/15 px-3.5 py-2.5">
                      <p className="text-sm font-semibold text-text">{entry.scenarioLabel}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {overview.environmentWarnings.length ? (
              <div>
                <p className="text-sm font-bold text-text">Environment warnings</p>
                <div className="mt-2 space-y-2">
                  {overview.environmentWarnings.map((audit) => (
                    <div key={audit.id} className="rounded-[16px] border border-white/10 bg-black/15 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text">{audit.serviceKey.replaceAll("_", " ")}</p>
                        <OpsStatusPill tone={audit.status === "critical" ? "danger" : "warning"}>
                          {audit.status.replaceAll("_", " ")}
                        </OpsStatusPill>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!overview.incompleteSmoke.length && !overview.environmentWarnings.length ? (
              <InlineEmptyNotice
                title="Verification pressure is clear"
                description="The QA board does not currently see pending smoke items or environment warnings on active release candidates."
              />
            ) : null}
          </div>
        </OpsPanel>
      </div>
    </div>
  );
}
