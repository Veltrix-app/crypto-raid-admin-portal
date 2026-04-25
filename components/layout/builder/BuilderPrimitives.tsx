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
    <div className="relative self-start overflow-hidden rounded-[22px] border border-white/[0.04] bg-[radial-gradient(circle_at_top_left,rgba(199,255,0,0.09),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(88,146,255,0.07),transparent_22%),linear-gradient(180deg,rgba(12,15,22,0.985),rgba(8,10,15,0.985))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)] md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.025),transparent_24%,transparent_72%,rgba(199,255,0,0.025))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="pointer-events-none absolute -right-12 top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/90">{eyebrow}</p>
          <h2 className="mt-2 max-w-2xl text-[1.28rem] font-semibold tracking-[-0.03em] text-text md:text-[1.55rem]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-sub">{description}</p>
        </div>
        {metrics ? <div className="grid gap-2.5 sm:grid-cols-3 lg:min-w-[320px]">{metrics}</div> : null}
      </div>
      <div className="relative mt-4 rounded-[16px] border border-white/[0.04] bg-black/20 px-3.5 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
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
      ? "border-primary/18 bg-primary/10 text-primary"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
        : "border-white/[0.04] bg-white/[0.025] text-text";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneClass}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</span>
      <span className="text-[13px] font-semibold">{value}</span>
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
    <aside className="rounded-[20px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(13,17,24,0.97),rgba(9,11,16,0.96))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)] xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">{title}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.14),transparent)]" />
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`group relative w-full overflow-hidden rounded-[16px] border px-3 py-3 text-left transition-all duration-200 ${
                active
                  ? "border-primary/24 bg-[linear-gradient(135deg,rgba(199,255,0,0.08),rgba(255,255,255,0.025))]"
                  : "border-white/[0.04] bg-white/[0.018] hover:border-white/[0.08] hover:bg-white/[0.03]"
              }`}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,rgba(199,255,0,0.9),rgba(102,255,198,0.5))] opacity-0 transition group-hover:opacity-60 group-focus-visible:opacity-60" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                      step.complete
                        ? "border-primary/30 bg-primary/12 text-primary"
                        : active
                          ? "border-white/20 bg-white/[0.08] text-text"
                          : "border-white/[0.05] bg-black/20 text-sub"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sub">{step.eyebrow}</p>
                    <p className="mt-1.5 text-[13px] font-bold tracking-[-0.01em] text-text">{step.label}</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-sub">{step.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
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
    <div className="flex flex-col gap-4 border-b border-white/[0.04] pb-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-[1.12rem] font-semibold tracking-[-0.03em] text-text md:text-[1.28rem]">{title}</h3>
        <p className="mt-2 max-w-2xl text-[12px] leading-5 text-sub">{description}</p>
      </div>
      <div className="min-w-[138px] rounded-[16px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">Workflow</p>
        <p className="mt-1.5 text-[13px] font-semibold text-text">
          {stepIndex} of {totalSteps}
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/6">
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
    <div className="flex flex-col gap-4 border-t border-white/[0.04] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="rounded-[14px] border border-white/[0.05] bg-white/[0.025] px-3.5 py-2.5 text-[12px] font-bold text-text transition-all duration-200 hover:bg-white/[0.04] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-[14px] bg-[linear-gradient(90deg,rgba(199,255,0,0.92),rgba(102,255,198,0.95))] px-3.5 py-2.5 text-[12px] font-bold text-black shadow-[0_12px_24px_rgba(141,255,89,0.16)] transition-all duration-200 hover:brightness-105 active:translate-y-0"
              >
                {nextLabel}
              </button>
            )
            : null}
      </div>

      <div className="rounded-[14px] border border-white/[0.04] bg-black/20 px-3.5 py-2.5 text-[12px] text-sub backdrop-blur-sm">
        {footerLabel}
      </div>
    </div>
  );
}

export function BuilderSidebarStack({ children }: { children: ReactNode }) {
  return <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">{children}</aside>;
}

export function BuilderSidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative self-start overflow-hidden rounded-[20px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(13,17,24,0.97),rgba(9,11,16,0.96))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition-colors duration-200 hover:border-white/[0.08]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="flex items-center gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">{title}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.12),transparent)]" />
      </div>
      <div className="mt-3">{children}</div>
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
    <div className="relative overflow-hidden rounded-[16px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-3 py-3 shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-colors duration-200 hover:border-primary/16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[0.95rem] font-black tracking-[-0.02em] text-text">{value}</p>
      {sublabel ? <p className="mt-1 text-xs leading-5 text-sub">{sublabel}</p> : null}
    </div>
  );
}

export function BuilderSignalRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-white/[0.04] bg-white/[0.025] px-3 py-2.5 transition-colors duration-200 hover:border-primary/16 hover:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            ready ? "bg-primary shadow-[0_0_14px_rgba(199,255,0,0.45)]" : "bg-white/20"
          }`}
        />
        <p className="text-[13px] font-semibold text-text">{label}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
          ready ? "bg-primary/15 text-primary" : "bg-card text-sub"
        }`}
      >
        {ready ? "Ready" : "Missing"}
      </span>
    </div>
  );
}
