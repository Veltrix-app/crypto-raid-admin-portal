"use client";

import type { ReactNode } from "react";
import { Gauge, Rocket, ShieldCheck, Siren } from "lucide-react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type LaunchTier = "blocked" | "warming_up" | "launchable" | "live_ready";

function labelForTier(tier: LaunchTier) {
  if (tier === "live_ready") return "Live ready";
  if (tier === "launchable") return "Launchable";
  if (tier === "warming_up") return "Warming up";
  return "Blocked";
}

function toneForTier(tier: LaunchTier) {
  if (tier === "live_ready") return "success" as const;
  if (tier === "launchable") return "warning" as const;
  if (tier === "warming_up") return "warning" as const;
  return "danger" as const;
}

export default function ProjectLaunchScorecard({
  score,
  tier,
  completionRatio,
  completedSteps,
  totalSteps,
  openIncidents,
  criticalIncidents,
  activeOverrides,
}: {
  score: number;
  tier: LaunchTier;
  completionRatio: number;
  completedSteps: number;
  totalSteps: number;
  openIncidents: number;
  criticalIncidents: number;
  activeOverrides: number;
}) {
  const completionPercent = Math.round(completionRatio * 100);

  return (
    <OpsPanel
      eyebrow="Launch posture"
      title="How close this project is to a clean launch"
      description="This score blends setup completion, live content posture, reward readiness, and Phase 1 operator health."
      action={<OpsStatusPill tone={toneForTier(tier)}>{labelForTier(tier)}</OpsStatusPill>}
      tone={tier === "blocked" ? "accent" : "default"}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsMetricCard
          label="Launch score"
          value={score}
          sub="Weighted readiness across profile, community, content, rewards and ops."
          emphasis={score >= 85 ? "primary" : score >= 65 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Setup completion"
          value={`${completionPercent}%`}
          sub={`${completedSteps}/${totalSteps} setup rails finished`}
          emphasis={completionPercent >= 75 ? "primary" : "warning"}
        />
        <OpsMetricCard
          label="Open incidents"
          value={openIncidents}
          sub={
            criticalIncidents > 0
              ? `${criticalIncidents} critical incident${criticalIncidents === 1 ? "" : "s"}`
              : "No critical incidents"
          }
          emphasis={criticalIncidents > 0 ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Active overrides"
          value={activeOverrides}
          sub="Pause, retry, mute or manual-complete overrides still in effect."
          emphasis={activeOverrides > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SignalCard
          icon={<Gauge size={16} />}
          title="Readiness tier"
          body="A fast read on whether this project is blocked, warming up, launchable, or truly live-ready."
        />
        <SignalCard
          icon={<Rocket size={16} />}
          title="Launch pressure"
          body="The launch score moves hardest on community targets, live missions and proven push rails."
        />
        <SignalCard
          icon={criticalIncidents > 0 ? <Siren size={16} /> : <ShieldCheck size={16} />}
          title="Operator calm"
          body="Phase 1 ops rails are part of launch posture now, so this score punishes unresolved incidents and active overrides."
        />
      </div>
    </OpsPanel>
  );
}

function SignalCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-4">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="font-bold text-text">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-sub">{body}</p>
    </div>
  );
}
