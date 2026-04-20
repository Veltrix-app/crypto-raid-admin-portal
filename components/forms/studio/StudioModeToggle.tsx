"use client";

type Option<TValue extends string> = {
  value: TValue;
  label: string;
  eyebrow?: string;
};

type Props<TValue extends string> = {
  label: string;
  options: Option<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export default function StudioModeToggle<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: Props<TValue>) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{label}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                  : "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]"
              }`}
            >
              {option.eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
                  {option.eyebrow}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-bold text-text">{option.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
