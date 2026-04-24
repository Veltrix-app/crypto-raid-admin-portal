"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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

export default function ProjectLaunchChecklist({
  view,
  steps,
  activeStepId,
  hardBlockers,
  softBlockers,
  groups,
}: {
  view: LaunchWorkspaceView;
  steps: LaunchStep[];
  activeStepId: string | null;
  hardBlockers: ReadinessIssue[];
  softBlockers: ReadinessIssue[];
  groups: ReadinessGroup[];
}) {
  if (view === "setup") {
    const selectedStep = steps.find((step) => step.id === activeStepId) ?? steps[0];

    return (
      <div className="space-y-4">
        {selectedStep ? (
          <div className="rounded-[22px] border border-primary/25 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(11,16,24,0.98))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.2)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Active setup step
                </p>
                <h3 className="mt-2 text-[1.35rem] font-extrabold tracking-tight text-text">
                  {selectedStep.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-sub">{selectedStep.summary}</p>
              </div>
              <OpsStatusPill
                tone={
                  selectedStep.status === "complete"
                    ? "success"
                    : selectedStep.status === "attention"
                      ? "warning"
                      : "danger"
                }
              >
                {selectedStep.metric}
              </OpsStatusPill>
            </div>

            {selectedStep.blockers.length > 0 ? (
              <div className="mt-4 grid gap-2.5">
                {selectedStep.blockers.map((blocker) => (
                  <div
                    key={blocker}
                    className="rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-3.5 text-sm leading-5.5 text-sub"
                  >
                    {blocker}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3.5 text-sm text-emerald-200">
                This step is already in good shape. You can still open its rail to refine the details.
              </div>
            )}

            <Link
              href={selectedStep.href}
              className="mt-4 inline-flex items-center gap-2 rounded-[16px] border border-primary/30 bg-primary/12 px-3.5 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/18"
            >
              Open step rail
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "rounded-[20px] border px-3.5 py-3.5 transition-all duration-200",
                step.id === activeStepId
                  ? "border-primary/25 bg-primary/10"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(15,20,31,0.98),rgba(10,14,22,0.98))]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-text">{step.title}</p>
                  <p className="mt-2 text-sm leading-5.5 text-sub">{step.summary}</p>
                </div>
                <OpsStatusPill
                  tone={
                    step.status === "complete"
                      ? "success"
                      : step.status === "attention"
                        ? "warning"
                        : "danger"
                  }
                >
                  {step.status}
                </OpsStatusPill>
              </div>
            </div>
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
            className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,31,0.98),rgba(10,14,22,0.98))] p-4"
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
                <p className="mt-2 text-sm leading-5.5 text-sub">{group.summary}</p>
              </div>
              <div className="rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5 text-right">
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
                  className="rounded-[16px] border border-white/8 bg-black/20 px-3.5 py-2.5 text-sm text-sub"
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
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,31,0.98),rgba(10,14,22,0.98))] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h3 className="mt-2 text-[1.08rem] font-extrabold tracking-tight text-text">{title}</h3>
      <div className="mt-3.5 space-y-2.5">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={issue.href}
            className="block rounded-[18px] border border-white/10 bg-black/20 px-3.5 py-3.5 transition hover:border-primary/25 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary">
                    {tone === "danger" ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
                  </span>
                  <p className="font-bold text-text">{issue.title}</p>
                </div>
                <p className="mt-2 text-sm leading-5.5 text-sub">{issue.summary}</p>
              </div>
              <OpsStatusPill tone={tone}>{issue.severity}</OpsStatusPill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
