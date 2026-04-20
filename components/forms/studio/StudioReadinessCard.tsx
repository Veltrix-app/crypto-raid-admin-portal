"use client";

type ReadinessItem = {
  label: string;
  value: string;
  complete: boolean;
};

export default function StudioReadinessCard({
  title = "Readiness",
  items,
  emptyState = "No readiness issues right now.",
  showOnlyIncomplete = false,
}: {
  title?: string;
  items: ReadinessItem[];
  emptyState?: string;
  showOnlyIncomplete?: boolean;
}) {
  const visibleItems = showOnlyIncomplete ? items.filter((item) => !item.complete) : items;

  return (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,21,31,0.96),rgba(10,12,18,0.94))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{title}</p>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.18),transparent)]" />
      </div>

      <div className="mt-4 space-y-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{item.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    item.complete
                      ? "bg-primary/15 text-primary"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {item.complete ? "Ready" : "Needs work"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">{item.value}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm leading-6 text-sub">{emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );
}
