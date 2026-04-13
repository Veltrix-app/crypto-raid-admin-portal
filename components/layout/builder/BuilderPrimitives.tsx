"use client";

import type { ReactNode } from "react";

export function BuilderHero({
  eyebrow,
  title,
  description,
  metrics,
  progressPercent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: ReactNode;
  progressPercent: number;
}) {
  return (
    <div className="rounded-[32px] border border-line bg-card p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-extrabold text-text">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
        </div>
        {metrics ? <div className="grid gap-3 sm:grid-cols-3">{metrics}</div> : null}
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-sub">
          <span>Builder progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card2">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

export function BuilderStepRail<TStep extends string>({
  title = "Progress",
  steps,
  currentStep,
  onSelect,
}: {
  title?: string;
  steps: Array<{
    id: TStep;
    eyebrow: string;
    label: string;
    description: string;
    complete: boolean;
  }>;
  currentStep: TStep;
  onSelect: (step: TStep) => void;
}) {
  return (
    <aside className="rounded-[28px] border border-line bg-card p-5 xl:sticky xl:top-24 xl:self-start">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                active ? "border-primary/50 bg-primary/10" : "border-line bg-card2 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">{step.eyebrow}</p>
                  <p className="mt-2 text-sm font-bold text-text">
                    {index + 1}. {step.label}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                    step.complete ? "bg-primary/15 text-primary" : active ? "bg-card text-text" : "bg-card text-sub"
                  }`}
                >
                  {step.complete ? "Ready" : active ? "Current" : "Open"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function BuilderStepHeader({
  eyebrow,
  title,
  description,
  stepIndex,
  totalSteps,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold text-text">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      </div>
      <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Workflow</p>
        <p className="mt-2 text-sm font-semibold text-text">
          {stepIndex} of {totalSteps}
        </p>
      </div>
    </div>
  );
}

export function BuilderBottomNav({
  previousLabel = "Back",
  nextLabel,
  onBack,
  onNext,
  canGoBack,
  footerLabel,
  submitButton,
}: {
  previousLabel?: string;
  nextLabel?: string;
  onBack?: () => void;
  onNext?: () => void;
  canGoBack: boolean;
  footerLabel: string;
  submitButton?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="rounded-2xl border border-line bg-card2 px-5 py-3 font-bold text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          {previousLabel}
        </button>
        {submitButton
          ? submitButton
          : nextLabel && onNext
            ? (
              <button
                type="button"
                onClick={onNext}
                className="rounded-2xl bg-primary px-5 py-3 font-bold text-black"
              >
                {nextLabel}
              </button>
            )
            : null}
      </div>

      <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-sub">
        {footerLabel}
      </div>
    </div>
  );
}

export function BuilderSidebarStack({ children }: { children: ReactNode }) {
  return <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">{children}</aside>;
}

export function BuilderSidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-line bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function BuilderMetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-sub">{sublabel}</p> : null}
    </div>
  );
}

export function BuilderSignalRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
          ready ? "bg-primary/15 text-primary" : "bg-card text-sub"
        }`}
      >
        {ready ? "Ready" : "Missing"}
      </span>
    </div>
  );
}
