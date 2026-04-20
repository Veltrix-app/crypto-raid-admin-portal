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
    <div className="relative overflow-hidden rounded-[40px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,255,0,0.16),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(88,146,255,0.14),transparent_22%),linear-gradient(180deg,rgba(15,20,29,0.98),rgba(8,10,15,0.98))] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.42)] transition-transform duration-500 hover:-translate-y-0.5 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,transparent_72%,rgba(199,255,0,0.05))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/90">{eyebrow}</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] text-text md:text-[2.6rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-sub">{description}</p>
        </div>
        {metrics ? <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[380px]">{metrics}</div> : null}
      </div>
      <div className="relative mt-8 rounded-[28px] border border-white/8 bg-black/20 px-4 py-4 backdrop-blur-sm md:px-5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
          <span>Builder progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.78),rgba(102,255,198,0.96))] shadow-[0_0_18px_rgba(199,255,0,0.24)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BuilderContextPillGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}

export function BuilderContextPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "border-primary/20 bg-primary/12 text-primary"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
        : "border-white/8 bg-white/[0.04] text-text";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${toneClass}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
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
    <aside className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{title}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.22),transparent)]" />
      </div>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`group relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-300 ${
                active
                  ? "border-primary/45 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))] shadow-[0_18px_34px_rgba(0,0,0,0.24)]"
                  : "border-white/8 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,rgba(199,255,0,0.9),rgba(102,255,198,0.5))] opacity-0 transition group-hover:opacity-60 group-focus-visible:opacity-60" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                      step.complete
                        ? "border-primary/30 bg-primary/12 text-primary"
                        : active
                          ? "border-white/20 bg-white/[0.08] text-text"
                          : "border-white/10 bg-black/20 text-sub"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sub">{step.eyebrow}</p>
                    <p className="mt-2 text-sm font-bold tracking-[-0.01em] text-text">{step.label}</p>
                    <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    step.complete
                      ? "bg-primary/15 text-primary"
                      : active
                        ? "bg-white/[0.08] text-text"
                        : "bg-black/20 text-sub"
                  }`}
                >
                  {step.complete ? "Ready" : active ? "Current" : "Open"}
                </span>
              </div>
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
    <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-[2rem] font-black tracking-[-0.03em] text-text md:text-[2.2rem]">{title}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">{description}</p>
      </div>
      <div className="min-w-[150px] rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">Workflow</p>
        <p className="mt-2 text-sm font-semibold text-text">
          {stepIndex} of {totalSteps}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.82),rgba(102,255,198,0.92))]"
            style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
          />
        </div>
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
    <div className="flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-3 font-bold text-text transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-[20px] bg-[linear-gradient(90deg,rgba(199,255,0,0.92),rgba(102,255,198,0.95))] px-5 py-3 font-bold text-black shadow-[0_16px_36px_rgba(141,255,89,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
              >
                {nextLabel}
              </button>
            )
            : null}
      </div>

      <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-sub backdrop-blur-sm">
        {footerLabel}
      </div>
    </div>
  );
}

export function BuilderSidebarStack({ children }: { children: ReactNode }) {
  return <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">{children}</aside>;
}

export function BuilderSidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,0,0,0.26)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{title}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>
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
    <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-2 text-lg font-black tracking-[-0.02em] text-text">{value}</p>
      {sublabel ? <p className="mt-1 text-xs leading-5 text-sub">{sublabel}</p> : null}
    </div>
  );
}

export function BuilderSignalRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:border-primary/20 hover:bg-white/[0.045]">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            ready ? "bg-primary shadow-[0_0_14px_rgba(199,255,0,0.45)]" : "bg-white/20"
          }`}
        />
        <p className="text-sm font-semibold text-text">{label}</p>
      </div>
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
