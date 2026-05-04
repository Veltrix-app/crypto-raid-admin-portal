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
  const selectedStep = steps.find((step) => step.id === activeStepId) ?? steps[0] ?? null;

  return (
    <aside className="space-y-2.5 xl:sticky xl:top-24">
      <div className="overflow-hidden rounded-[18px] border border-white/[0.024] bg-[radial-gradient(circle_at_15%_0%,rgba(199,255,0,0.07),transparent_31%),linear-gradient(180deg,rgba(13,19,29,0.98),rgba(8,12,19,0.96))] p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
              Launch flow
            </p>
            <h2 className="mt-1.5 text-[0.94rem] font-semibold tracking-[-0.02em] text-text">
              Create momentum
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-sub">
              Keep the next project task visible without turning the rail into a document.
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-white/[0.026] bg-white/[0.018] text-primary">
            <Rocket size={18} />
          </div>
        </div>

        <div className="mt-3 rounded-[14px] border border-white/[0.022] bg-black/20 p-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              Completion
            </p>
            <OpsStatusPill tone={completionPercent >= 75 ? "success" : "warning"}>
              {completionPercent}%
            </OpsStatusPill>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(186,255,59,0.72),rgba(102,255,198,0.82))] shadow-[0_0_18px_rgba(186,255,59,0.18)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(13,19,29,0.965),rgba(7,10,16,0.965))] p-2">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const active = activeStepId === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(step.id)}
                aria-pressed={active}
                className={cn(
                  "group w-full rounded-[14px] border px-2.5 py-2.5 text-left transition-colors duration-200",
                  active
                    ? "border-primary/[0.22] bg-primary/[0.07] shadow-[0_0_24px_rgba(199,255,0,0.06)]"
                    : "border-transparent bg-white/[0.012] hover:border-white/[0.024] hover:bg-white/[0.028]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex shrink-0 flex-col items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-[11px] border text-[10px] font-black",
                        active
                          ? "border-primary/[0.24] bg-primary/[0.09] text-primary"
                          : "border-transparent bg-white/[0.018] text-sub"
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="mt-1.5 h-4 w-px bg-white/10" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-text">{step.title}</p>
                    <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sub">
                      <span>{iconForStatus(step.status)}</span>
                      <span className="truncate">{step.metric}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      step.status === "complete"
                        ? "bg-emerald-300"
                        : step.status === "attention"
                          ? "bg-primary"
                          : "bg-rose-300"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedStep ? (
        <div className="rounded-[18px] border border-white/[0.022] bg-black/24 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              Selected step
            </p>
            <OpsStatusPill tone={toneForStatus(selectedStep.status)}>
              {selectedStep.status}
            </OpsStatusPill>
          </div>
          <p className="mt-2 text-[12px] font-bold text-text">{selectedStep.title}</p>
          <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-sub">
            {selectedStep.summary}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
