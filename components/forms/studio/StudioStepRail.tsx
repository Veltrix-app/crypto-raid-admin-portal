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
    <aside className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,31,0.96),rgba(10,12,18,0.94))] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.24)] xl:sticky xl:top-24 xl:self-start">
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const active = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`rounded-[20px] border px-3 py-3 text-left transition ${
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                  : "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                    active
                      ? "border-primary/25 bg-primary/12 text-primary"
                      : step.complete
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.04] text-sub"
                  }`}
                >
                  {step.shortLabel ?? index + 1}
                </span>
                <span className="flex-1 text-sm font-bold text-text">{step.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
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
