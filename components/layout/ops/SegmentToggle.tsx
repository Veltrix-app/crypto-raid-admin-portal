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
    <div className="inline-flex flex-wrap gap-1 rounded-[16px] border border-white/[0.03] bg-white/[0.018] p-1 shadow-[0_8px_18px_rgba(0,0,0,0.1)]">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[12px] px-3 py-2 text-[12px] font-semibold transition",
              active
                ? "bg-white/[0.085] text-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)]"
                : "text-sub hover:bg-white/[0.04] hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
