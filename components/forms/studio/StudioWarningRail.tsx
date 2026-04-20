"use client";

type WarningItem = {
  label: string;
  description: string;
  tone?: "default" | "warning" | "success";
};

export default function StudioWarningRail({
  title = "Warnings",
  eyebrow = "Readiness",
  emptyState = "No blockers right now. This studio is ready for the next step.",
  items,
}: {
  title?: string;
  eyebrow?: string;
  emptyState?: string;
  items: WarningItem[];
}) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4">
        <p className="text-lg font-black tracking-[-0.02em] text-text">{title}</p>
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => {
            const toneClass =
              item.tone === "success"
                ? "bg-primary/10 text-primary"
                : item.tone === "warning"
                  ? "bg-amber-500/14 text-amber-300"
                  : "bg-white/[0.08] text-text";

            return (
              <div
                key={item.label}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClass}`}>
                    {item.tone === "success"
                      ? "Ready"
                      : item.tone === "warning"
                        ? "Watch"
                        : "Info"}
                  </span>
                  <p className="text-sm font-bold text-text">{item.label}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{item.description}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm leading-6 text-sub">{emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );
}
