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
  const warningCount = items.filter((item) => item.tone === "warning").length;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_24%),linear-gradient(180deg,rgba(17,21,31,0.97),rgba(10,12,18,0.95))] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />

      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-lg font-black tracking-[-0.02em] text-text">{title}</p>
        <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
          {warningCount > 0 ? `${warningCount} watch` : "stable"}
        </span>
      </div>

      <div className="mt-4 border-t border-white/8 pt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => {
            const toneClass =
              item.tone === "success"
                ? "bg-primary/10 text-primary"
                : item.tone === "warning"
                  ? "bg-amber-500/14 text-amber-300"
                  : "bg-white/[0.08] text-text";
            const borderClass =
              item.tone === "warning"
                ? "border-amber-400/16"
                : item.tone === "success"
                  ? "border-primary/16"
                  : "border-white/8";

            return (
              <div
                key={item.label}
                className={`rounded-[22px] border bg-white/[0.03] p-4 ${borderClass}`}
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
                <p className="mt-3 text-sm leading-6 text-sub/95">{item.description}</p>
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
