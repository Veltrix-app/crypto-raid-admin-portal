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
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-card2 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-primary text-black shadow-[0_10px_24px_rgba(186,255,59,0.22)]"
                : "text-sub hover:bg-white/[0.05] hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
