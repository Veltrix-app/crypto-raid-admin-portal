"use client";

import {
  OpsCommandRead,
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import type { TrustCockpitSnapshot } from "@/lib/trust/trust-cockpit";
import { formatTrustDate, TrustSeverityPill } from "./trust-ui";

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatWallet(value: string | null) {
  if (!value) {
    return "Hidden";
  }

  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function getRiskTone(value: string): "default" | "success" | "warning" | "danger" {
  if (value === "critical" || value === "high") return "danger";
  if (value === "medium") return "warning";
  if (value === "clear") return "success";
  return "default";
}

export default function ProjectTrustCockpitPanel({
  cockpit,
  loading,
  error,
  onRetry,
}: {
  cockpit: TrustCockpitSnapshot | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <OpsPanel
        eyebrow="Trust cockpit"
        title="Loading Trust Engine signals"
        description="VYNTRO is pulling project-scoped risk rollups, held rewards and recent decisions."
      >
        <div className="rounded-[18px] border border-white/[0.03] bg-white/[0.016] px-4 py-5 text-sm text-sub">
          Loading project trust posture...
        </div>
      </OpsPanel>
    );
  }

  if (error || !cockpit) {
    return (
      <OpsPanel
        eyebrow="Trust cockpit"
        title="Trust cockpit could not load"
        description={error ?? "The Trust Engine did not return a cockpit payload."}
        action={
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-primary px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105"
          >
            Retry
          </button>
        }
      >
        <div className="rounded-[18px] border border-amber-300/12 bg-amber-500/8 px-4 py-5 text-sm text-amber-100">
          Keep the existing trust cases below available while this v2 cockpit refreshes.
        </div>
      </OpsPanel>
    );
  }

  return (
    <div className="space-y-3.5">
      <OpsCommandRead
        eyebrow="Trust cockpit"
        title="Review risky members before rewards, XP or campaign claims move."
        description="This view is project-scoped: project teams see only their own affected contributors, while raw internal graph/session context stays behind VYNTRO trust controls."
        now={cockpit.commandRead.now}
        next={cockpit.commandRead.next}
        watch={cockpit.commandRead.watch}
        rail={
          <OpsPanel
            eyebrow="Scope"
            title={cockpit.scope.visibilityLabel}
            description={
              cockpit.scope.rawEvidenceVisible
                ? "Raw project evidence and resolution history are visible for this role."
                : "Sensitive evidence is summarized so project teams can act without seeing cross-project or session-level data."
            }
          >
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={cockpit.scope.memberDetailVisible ? "success" : "warning"}>
                {cockpit.scope.memberDetailVisible ? "member detail" : "summary members"}
              </OpsStatusPill>
              <OpsStatusPill tone={cockpit.scope.rawEvidenceVisible ? "success" : "default"}>
                {cockpit.scope.rawEvidenceVisible ? "evidence visible" : "evidence hidden"}
              </OpsStatusPill>
            </div>
          </OpsPanel>
        }
      />

      <div className="grid gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <OpsMetricCard label="Flagged members" value={cockpit.summary.flaggedMembers} />
        <OpsMetricCard
          label="High risk"
          value={cockpit.summary.highRiskMembers}
          emphasis={cockpit.summary.highRiskMembers > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Critical events"
          value={cockpit.summary.criticalEvents}
          emphasis={cockpit.summary.criticalEvents > 0 ? "warning" : "default"}
        />
        <OpsMetricCard label="Open signals" value={cockpit.summary.openEvents} />
        <OpsMetricCard
          label="Held rewards"
          value={cockpit.summary.heldRewards}
          emphasis={cockpit.summary.heldRewards > 0 ? "warning" : "default"}
        />
        <OpsMetricCard label="Decisions" value={cockpit.summary.recentDecisions} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start">
        <OpsPanel
          eyebrow="Review queue"
          title="Members needing trust attention"
          description="Prioritized by risk level, critical events, high-severity signals and latest activity."
        >
          <div className="grid gap-2.5">
            {cockpit.reviewQueue.length === 0 ? (
              <EmptyTrustState text="No project members are currently in the trust review queue." />
            ) : null}
            {cockpit.reviewQueue.map((row) => (
              <div
                key={row.authUserId}
                className="rounded-[18px] border border-white/[0.03] bg-white/[0.016] px-3.5 py-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-sm font-semibold text-text [overflow-wrap:anywhere]">
                        {row.displayName}
                      </p>
                      <OpsStatusPill tone={getRiskTone(row.riskLevel)}>{row.riskLevel}</OpsStatusPill>
                      <OpsStatusPill tone="default">{formatStatus(row.status)}</OpsStatusPill>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-5 text-sub">
                      {row.openEventCount} open signals, {row.highEventCount} high,{" "}
                      {row.criticalEventCount} critical. Recommended:{" "}
                      <span className="font-semibold text-text">{row.recommendedActionLabel}</span>.
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-sub">
                    <p>{formatTrustDate(row.updatedAt)}</p>
                    <p className="mt-1 font-semibold text-text">{formatWallet(row.walletAddress)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <MiniStat label="Trust" value={row.trustScore === null ? "n/a" : String(row.trustScore)} />
                  <MiniStat label="Sybil" value={row.sybilScore === null ? "n/a" : String(row.sybilScore)} />
                  <MiniStat label="Held rewards" value={String(row.heldRewardCount)} />
                </div>

                {row.reasonCodes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.reasonCodes.slice(0, 5).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-white/[0.035] bg-white/[0.018] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-sub"
                      >
                        {formatStatus(reason)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </OpsPanel>

        <div className="grid gap-3">
          <OpsPanel
            eyebrow="Reward holds"
            title="Claims paused by Trust Engine"
            description="These rewards are saved, but should not release until the trust posture is clear."
          >
            <div className="grid gap-2.5">
              {cockpit.heldRewards.length === 0 ? (
                <EmptyTrustState text="No rewards are currently held for this project." />
              ) : null}
              {cockpit.heldRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-[16px] border border-white/[0.03] bg-white/[0.016] px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{reward.displayName}</p>
                      <p className="mt-1 text-[12px] text-sub">{reward.campaignTitle}</p>
                    </div>
                    <OpsStatusPill tone="warning">{formatStatus(reward.status)}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-sub">{reward.reason}</p>
                  <p className="mt-2 text-[11px] font-semibold text-text">
                    {reward.rewardAmount} {reward.rewardAsset}
                  </p>
                </div>
              ))}
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Risk stream"
            title="Recent project-visible signals"
            description="Evidence is summarized unless this role has raw signal visibility."
          >
            <div className="grid gap-2.5">
              {cockpit.events.length === 0 ? (
                <EmptyTrustState text="No project-visible risk events have been recorded yet." />
              ) : null}
              {cockpit.events.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="rounded-[16px] border border-white/[0.03] bg-white/[0.016] px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TrustSeverityPill severity={event.severity} />
                      <OpsStatusPill tone="default">{formatStatus(event.riskCategory)}</OpsStatusPill>
                    </div>
                    <span className="text-[11px] text-sub">{formatTrustDate(event.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-text">{event.displayName}</p>
                  <p className="mt-1 text-[12px] leading-5 text-sub">{event.reason}</p>
                  {event.evidence ? (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-sub/85">
                      Evidence: {JSON.stringify(event.evidence)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </OpsPanel>

          {cockpit.decisions.length > 0 ? (
            <OpsPanel
              eyebrow="Decision log"
              title="Recent trust decisions"
              description="Visible decisions are shown as an audit trail, not a raw global fraud profile."
            >
              <div className="grid gap-2.5">
                {cockpit.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-[16px] border border-white/[0.03] bg-white/[0.016] px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-text">{decision.displayName}</p>
                      <OpsStatusPill tone="default">{formatStatus(decision.newStatus)}</OpsStatusPill>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-5 text-sub">{decision.reason}</p>
                  </div>
                ))}
              </div>
            </OpsPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.025] bg-white/[0.014] px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function EmptyTrustState({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-white/[0.045] bg-white/[0.012] px-3.5 py-4 text-[12px] leading-5 text-sub">
      {text}
    </div>
  );
}
