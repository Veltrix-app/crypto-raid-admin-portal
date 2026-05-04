"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  ProjectOnboardingPriorityPill,
  type ProjectOnboardingPriority,
} from "@/components/projects/onboarding/ProjectOnboardingPrimitives";
import { cn } from "@/lib/utils/cn";

type StepStatus = "complete" | "attention" | "blocked";
type ReadinessSeverity = "critical" | "warning";
type ReadinessStatus = "ready" | "watching" | "blocked";

type LaunchStep = {
  id: string;
  title: string;
  summary: string;
  metric: string;
  status: StepStatus;
  href: string;
  blockers: string[];
};

type ReadinessIssue = {
  id: string;
  title: string;
  summary: string;
  severity: ReadinessSeverity;
  href: string;
};

type ReadinessGroup = {
  id: string;
  title: string;
  status: ReadinessStatus;
  score: number;
  summary: string;
  signals: string[];
};

type LaunchWorkspaceView = "setup" | "launch";

function priorityForStepStatus(status: StepStatus): ProjectOnboardingPriority {
  if (status === "complete") return "complete";
  if (status === "attention") return "recommended";
  return "required";
}

function labelForStepStatus(status: StepStatus) {
  if (status === "complete") return "Ready";
  if (status === "attention") return "Recommended";
  return "Needed";
}

export default function ProjectLaunchChecklist({
  view,
  steps,
  activeStepId,
  hardBlockers,
  softBlockers,
  groups,
  onSelectStep,
}: {
  view: LaunchWorkspaceView;
  steps: LaunchStep[];
  activeStepId: string | null;
  hardBlockers: ReadinessIssue[];
  softBlockers: ReadinessIssue[];
  groups: ReadinessGroup[];
  onSelectStep: (stepId: string) => void;
}) {
  if (view === "setup") {
    const selectedStep = steps.find((step) => step.id === activeStepId) ?? steps[0];
    const selectedStepIndex = selectedStep
      ? steps.findIndex((step) => step.id === selectedStep.id)
      : -1;

    return (
      <div className="space-y-3">
        {selectedStep ? (
          <div className="relative overflow-hidden rounded-[18px] border border-primary/[0.12] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.075),transparent_30%),linear-gradient(180deg,rgba(186,255,59,0.04),rgba(11,16,24,0.98))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(199,255,0,0.34),transparent)]" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/[0.16] bg-primary/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                    Step {selectedStepIndex + 1} of {steps.length}
                  </span>
                  <ProjectOnboardingPriorityPill priority={priorityForStepStatus(selectedStep.status)}>
                    {labelForStepStatus(selectedStep.status)}
                  </ProjectOnboardingPriorityPill>
                </div>
                <h3 className="mt-2.5 text-[1.02rem] font-bold tracking-[-0.02em] text-text">
                  {selectedStep.title}
                </h3>
                <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
                  {selectedStep.summary}
                </p>
              </div>
              <ProjectOnboardingPriorityPill priority={priorityForStepStatus(selectedStep.status)}>
                {selectedStep.metric}
              </ProjectOnboardingPriorityPill>
            </div>

            {selectedStep.blockers.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {selectedStep.blockers.map((blocker) => (
                  <div
                    key={blocker}
                    className="rounded-[13px] border border-white/[0.02] bg-black/24 px-3.5 py-2.5 text-[12px] leading-5 text-sub"
                  >
                    {blocker}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-[14px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-2.5 text-[12px] text-emerald-200">
                This step is already in good shape. You can still open its rail to refine the details.
              </div>
            )}

            <Link
              href={selectedStep.href}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[12px] font-black text-black transition hover:brightness-105"
            >
              Open this step
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              aria-pressed={step.id === activeStepId}
              className={cn(
                "rounded-[14px] border px-3 py-2.5 text-left transition-colors duration-200",
                step.id === activeStepId
                  ? "border-primary/[0.18] bg-primary/[0.06]"
                  : "border-transparent bg-white/[0.014] hover:border-white/[0.024] hover:bg-white/[0.028]"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.018] text-[10px] font-black text-sub">
                      {index + 1}
                    </span>
                    <p className="truncate text-[12px] font-bold text-text">{step.title}</p>
                  </div>
                  <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-sub">
                    {step.metric}
                  </p>
                </div>
                <ProjectOnboardingPriorityPill priority={priorityForStepStatus(step.status)}>
                  {labelForStepStatus(step.status)}
                </ProjectOnboardingPriorityPill>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <IssueGroup
          title="Hard blockers"
          eyebrow="Critical before launch"
          tone="danger"
          issues={hardBlockers}
          emptyTitle="No hard blockers"
          emptyDescription="The project has no critical launch blockers right now."
        />
        <IssueGroup
          title="Soft gaps"
          eyebrow="Worth tightening"
          tone="warning"
          issues={softBlockers}
          emptyTitle="No soft gaps"
          emptyDescription="The launch stack looks tight enough for the next step."
        />
      </div>

      <div className="grid gap-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-[15px] bg-white/[0.014] p-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-text">{group.title}</p>
                  <OpsStatusPill
                    tone={
                      group.status === "ready"
                        ? "success"
                        : group.status === "watching"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {group.status}
                  </OpsStatusPill>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-sub">{group.summary}</p>
              </div>
              <div className="rounded-[13px] bg-black/20 px-3.5 py-2.5 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                  Group score
                </p>
                  <p className="mt-1.5 text-[1.02rem] font-extrabold tracking-tight text-text">
                  {group.score}
                </p>
              </div>
            </div>

            <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
              {group.signals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-[13px] bg-black/20 px-3.5 py-2.5 text-[12px] text-sub"
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssueGroup({
  title,
  eyebrow,
  tone,
  issues,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  eyebrow: string;
  tone: "danger" | "warning";
  issues: ReadinessIssue[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (issues.length === 0) {
    return <InlineEmptyNotice title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="rounded-[16px] bg-white/[0.014] p-3.5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h3 className="mt-2 text-[1rem] font-bold text-text">{title}</h3>
      <div className="mt-3.5 space-y-2.5">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={issue.href}
            className="block rounded-[13px] bg-black/20 px-3.5 py-3 transition hover:bg-white/[0.035]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary">
                    {tone === "danger" ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
                  </span>
                  <p className="font-bold text-text">{issue.title}</p>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-sub">{issue.summary}</p>
              </div>
              <OpsStatusPill tone={tone}>{issue.severity}</OpsStatusPill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
