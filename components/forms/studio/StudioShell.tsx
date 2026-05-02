"use client";

import type { ReactNode } from "react";
import {
  BuilderContextPillGroup,
  BuilderHero,
  BuilderHorizontalStepRail,
  BuilderSidebarStack,
} from "@/components/layout/builder/BuilderPrimitives";

export type StudioStep<TStep extends string> = {
  id: TStep;
  eyebrow: string;
  label: string;
  description: string;
  complete: boolean;
};

type Props<TStep extends string> = {
  eyebrow: string;
  title: string;
  description: string;
  progressPercent: number;
  metrics?: ReactNode;
  contextPills?: ReactNode;
  steps: StudioStep<TStep>[];
  currentStep: TStep;
  onSelectStep: (step: TStep) => void;
  children: ReactNode;
  sideRail?: ReactNode;
  topFrame?: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  canvasClassName?: string;
};

export default function StudioShell<TStep extends string>({
  eyebrow,
  title,
  description,
  progressPercent,
  metrics,
  contextPills,
  steps,
  currentStep,
  onSelectStep,
  children,
  sideRail,
  topFrame,
  leftRail,
  rightRail,
  canvasClassName,
}: Props<TStep>) {
  const useV3Layout = Boolean(topFrame || leftRail || rightRail);

  if (useV3Layout) {
    return (
      <div className="space-y-4">
        {topFrame}

        <div
          className={`grid gap-4 xl:items-start ${
            rightRail
              ? "xl:grid-cols-[220px_minmax(0,1fr)_320px]"
              : "xl:grid-cols-[220px_minmax(0,1fr)]"
          }`}
        >
          {leftRail ? <div>{leftRail}</div> : null}

          <div
            className={`self-start rounded-[20px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(12,15,22,0.98),rgba(8,10,15,0.96))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)] ${canvasClassName ?? ""}`.trim()}
          >
            {children}
          </div>

          {rightRail ? <BuilderSidebarStack>{rightRail}</BuilderSidebarStack> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BuilderHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        progressPercent={progressPercent}
        metrics={metrics}
      />

      {contextPills ? (
      <div className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,17,24,0.96),rgba(9,11,16,0.94))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Studio Context
            </p>
            <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
          </div>
          <div className="mt-3">
            <BuilderContextPillGroup>{contextPills}</BuilderContextPillGroup>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-4 xl:items-start ${sideRail ? "xl:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        <div className="space-y-4">
          <BuilderHorizontalStepRail
            title="Studio Flow"
            steps={steps}
            currentStep={currentStep}
            onSelect={onSelectStep}
          />
          <div className="rounded-[20px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(12,15,22,0.98),rgba(8,10,15,0.96))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
            {children}
          </div>
        </div>

        {sideRail ? <BuilderSidebarStack>{sideRail}</BuilderSidebarStack> : null}
      </div>
    </div>
  );
}
