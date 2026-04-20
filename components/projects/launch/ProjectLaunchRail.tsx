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
    <aside className="space-y-4 xl:sticky xl:top-28">
      <div className="overflow-hidden rounded-[28px] border border-line bg-[linear-gradient(180deg,rgba(13,19,29,0.98),rgba(9,13,21,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Launch rail
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
              Setup spine
            </h2>
            <p className="mt-2 text-sm leading-6 text-sub">
              Move through the project setup in a calm, fixed order instead of hunting through routes.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/20 bg-primary/10 text-primary">
            <Rocket size={18} />
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
              Completion
            </p>
            <OpsStatusPill tone={completionPercent >= 75 ? "success" : "warning"}>
              {completionPercent}%
            </OpsStatusPill>
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_24px_rgba(186,255,59,0.35)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-line bg-[linear-gradient(180deg,rgba(13,19,29,0.98),rgba(10,15,24,0.98))] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const active = activeStepId === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-200",
                  active
                    ? "border-primary/30 bg-primary/10 shadow-[0_14px_36px_rgba(186,255,59,0.12)]"
                    : "border-white/8 bg-black/15 hover:border-white/14 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[16px] border text-xs font-extrabold",
                        active
                          ? "border-primary/35 bg-primary/12 text-primary"
                          : "border-white/10 bg-black/20 text-text"
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="mt-2 h-8 w-px bg-white/10" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-text">{step.title}</p>
                      <OpsStatusPill tone={toneForStatus(step.status)}>
                        {step.status}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-sub">{step.summary}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sub">
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
