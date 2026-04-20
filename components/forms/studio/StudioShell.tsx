"use client";

import type { ReactNode } from "react";
import {
  BuilderContextPillGroup,
  BuilderHero,
  BuilderSidebarStack,
  BuilderStepRail,
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
}: Props<TStep>) {
  return (
    <div className="space-y-6">
      <BuilderHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        progressPercent={progressPercent}
        metrics={metrics}
      />

      {contextPills ? (
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Studio Context
            </p>
            <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
          </div>
          <div className="mt-4">
            <BuilderContextPillGroup>{contextPills}</BuilderContextPillGroup>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-6 ${sideRail ? "xl:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        <div className="space-y-6">
          <BuilderStepRail
            title="Studio Flow"
            steps={steps}
            currentStep={currentStep}
            onSelect={onSelectStep}
          />
          <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.98),rgba(10,12,18,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            {children}
          </div>
        </div>

        {sideRail ? <BuilderSidebarStack>{sideRail}</BuilderSidebarStack> : null}
      </div>
    </div>
  );
}
