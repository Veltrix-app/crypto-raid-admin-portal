"use client";

type StudioStepItem<TStep extends string> = {
  id: TStep;
  label: string;
  shortLabel?: string;
  complete?: boolean;
};

export default function StudioStepRail<TStep extends string>({
  steps,
  currentStep,
  onSelect,
}: {
  steps: StudioStepItem<TStep>[];
  currentStep: TStep;
  onSelect: (step: TStep) => void;
}) {
  return (
    <aside className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,31,0.96),rgba(10,12,18,0.94))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.18)] xl:sticky xl:top-24 xl:self-start">
      <div className="mb-4 flex items-center gap-3 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Studio Flow
        </p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
        {steps.map((step, index) => {
          const active = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              title={step.label}
              onClick={() => onSelect(step.id)}
              className={`min-w-[124px] rounded-[20px] border px-3 py-3 text-left transition ${
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.14),rgba(255,255,255,0.05))]"
                  : step.complete
                    ? "border-primary/18 bg-primary/[0.06]"
                    : "border-white/8 bg-black/20"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                    active
                      ? "border-primary/25 bg-primary/12 text-primary shadow-[0_0_16px_rgba(199,255,0,0.25)]"
                      : step.complete
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.04] text-sub"
                  }`}
                >
                  {step.shortLabel ?? index + 1}
                </span>
                <span
                  className={`block truncate text-[13px] font-bold ${
                    active ? "text-text" : step.complete ? "text-text/90" : "text-sub"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative hidden flex-col gap-2.5 xl:flex">
        <div className="pointer-events-none absolute bottom-4 left-[18px] top-4 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(199,255,0,0.18),rgba(255,255,255,0.06))]" />
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const statusTone = active
            ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.14),rgba(255,255,255,0.05))] shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
            : step.complete
              ? "border-primary/18 bg-primary/[0.06] hover:border-primary/28 hover:bg-primary/[0.09]"
              : "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]";

          return (
            <button
              key={step.id}
              type="button"
              title={step.label}
              onClick={() => onSelect(step.id)}
              className={`relative rounded-[22px] border px-3 py-3.5 text-left transition ${statusTone}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                    active
                      ? "border-primary/25 bg-primary/12 text-primary shadow-[0_0_16px_rgba(199,255,0,0.28)]"
                      : step.complete
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.04] text-sub"
                  }`}
                >
                  {step.shortLabel ?? index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[13px] font-bold leading-5 ${
                      active ? "text-text" : step.complete ? "text-text/90" : "text-sub"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    active
                      ? "bg-primary shadow-[0_0_14px_rgba(199,255,0,0.4)]"
                      : step.complete
                        ? "bg-primary/70"
                        : "bg-white/12"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
