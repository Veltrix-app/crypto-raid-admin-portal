"use client";

import { cn } from "@/lib/utils/cn";

type SegmentToggleOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentToggleProps<T extends string> = {
  value: T;
  options: SegmentToggleOption<T>[];
  onChange: (next: T) => void;
};

export default function SegmentToggle<T extends string>({
  value,
  options,
  onChange,
}: SegmentToggleProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[16px] border border-white/[0.016] bg-white/[0.01] p-0.5 shadow-[0_8px_18px_rgba(0,0,0,0.07)]">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[12px] px-3 py-1.5 text-[12px] font-semibold transition",
              active
                ? "bg-primary text-black shadow-[0_8px_18px_rgba(186,255,59,0.12)]"
                : "text-sub hover:bg-white/[0.03] hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
