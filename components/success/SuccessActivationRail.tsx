"use client";

import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";

function toneForWorkspaceHealth(value: AdminSuccessAccountSummary["workspaceHealthState"]) {
  if (value === "live") {
    return "success" as const;
  }

  if (value === "stalled") {
    return "warning" as const;
  }

  return "default" as const;
}

function toneForSuccessHealth(value: AdminSuccessAccountSummary["successHealthState"]) {
  if (value === "expansion_ready") {
    return "success" as const;
  }

  if (value === "churn_risk") {
    return "danger" as const;
  }

  if (value === "watching") {
    return "warning" as const;
  }

  return "default" as const;
}

export function SuccessActivationRail({
  summary,
  eyebrow = "Activation posture",
  title = "What is complete and what is still missing",
  description = "This rail keeps the next move explicit so the workspace can keep moving without guessing.",
}: {
  summary: AdminSuccessAccountSummary;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <OpsPanel eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-3">
        <OpsMetricCard
          label="Stage"
          value={humanizeSuccessValue(summary.activation.activationStage)}
          emphasis={summary.workspaceHealthState === "live" ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Workspace health"
          value={humanizeSuccessValue(summary.workspaceHealthState)}
          emphasis={summary.workspaceHealthState === "stalled" ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Blockers"
          value={summary.blockers.length}
          emphasis={summary.blockers.length > 0 ? "warning" : "primary"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone={toneForWorkspaceHealth(summary.workspaceHealthState)}>
              {humanizeSuccessValue(summary.workspaceHealthState)}
            </OpsStatusPill>
            <OpsStatusPill tone={toneForSuccessHealth(summary.successHealthState)}>
              {humanizeSuccessValue(summary.successHealthState)}
            </OpsStatusPill>
          </div>

          <div className="grid gap-3">
            <OpsSnapshotRow
              label="Completed milestones"
              value={
                summary.activation.completedMilestones.length
                  ? summary.activation.completedMilestones.join(" / ")
                  : "Nothing completed yet."
              }
            />
            <OpsSnapshotRow
              label="Current blockers"
              value={
                summary.blockers.length
                  ? summary.blockers.join(" / ")
                  : "No hard blockers. The workspace can keep moving."
              }
            />
          </div>
        </div>

        <OpsPriorityLink
          href={summary.nextBestActionRoute ?? "/projects"}
          title={summary.nextBestActionLabel ?? "Continue activation"}
          body={
            summary.blockers[0] ??
            "The activation rail already has enough progress to keep moving with light-touch guidance."
          }
          cta="Open next move"
          emphasis
        />
      </div>
    </OpsPanel>
  );
}
