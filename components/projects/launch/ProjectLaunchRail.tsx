"use client";

import { CheckCircle2, CircleAlert, Lock, Rocket } from "lucide-react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { cn } from "@/lib/utils/cn";

type StepStatus = "complete" | "attention" | "blocked";

type LaunchStep = {
  id: string;
  title: string;
  summary: string;
  metric: string;
  status: StepStatus;
};

function iconForStatus(status: StepStatus) {
  if (status === "complete") {
    return <CheckCircle2 size={16} />;
  }
  if (status === "attention") {
    return <CircleAlert size={16} />;
  }
  return <Lock size={16} />;
}

function toneForStatus(status: StepStatus) {
  if (status === "complete") return "success" as const;
  if (status === "attention") return "warning" as const;
  return "danger" as const;
}

export default function ProjectLaunchRail({
  steps,
  activeStepId,
  completionRatio,
  onSelect,
}: {
  steps: LaunchStep[];
  activeStepId: string | null;
  completionRatio: number;
  onSelect: (stepId: string) => void;
}) {
  const completionPercent = Math.round(completionRatio * 100);

  return (
    <aside className="space-y-3.5 xl:sticky xl:top-28">
      <div className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,19,29,0.98),rgba(9,13,21,0.98))] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Launch rail
            </p>
            <h2 className="mt-2 text-[1.08rem] font-extrabold tracking-tight text-text">
              Setup spine
            </h2>
            <p className="mt-2 text-sm leading-5.5 text-sub">
              Move through the project setup in a calm, fixed order instead of hunting through routes.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/10 text-primary">
            <Rocket size={18} />
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.025] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
              Completion
            </p>
            <OpsStatusPill tone={completionPercent >= 75 ? "success" : "warning"}>
              {completionPercent}%
            </OpsStatusPill>
          </div>
          <div className="mt-3.5 h-2 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_24px_rgba(186,255,59,0.35)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,19,29,0.98),rgba(10,15,24,0.98))] p-2.5">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const active = activeStepId === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "w-full rounded-[18px] border px-3.5 py-3.5 text-left transition-colors duration-200",
                  active
                    ? "border-primary/24 bg-primary/8"
                    : "border-white/6 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8.5 w-8.5 items-center justify-center rounded-[14px] border text-[11px] font-extrabold",
                        active
                          ? "border-primary/24 bg-primary/10 text-primary"
                          : "border-white/6 bg-white/[0.025] text-text"
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="mt-2 h-6 w-px bg-white/10" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-text">{step.title}</p>
                      <OpsStatusPill tone={toneForStatus(step.status)}>
                        {step.status}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-2 text-sm leading-5.5 text-sub">{step.summary}</p>
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sub">
                      <span>{iconForStatus(step.status)}</span>
                      <span className="truncate">{step.metric}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
