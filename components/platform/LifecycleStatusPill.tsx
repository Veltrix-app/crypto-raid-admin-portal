import {
  normalizeLifecycleState,
  PLATFORM_LIFECYCLE_LABELS,
  type PlatformLifecycleState,
} from "@/lib/platform/core-lifecycle";

function toneClasses(state: PlatformLifecycleState) {
  if (state === "live" || state === "completed") {
    return "border-emerald-400/25 bg-emerald-500/12 text-emerald-300";
  }
  if (state === "ready") {
    return "border-primary/30 bg-primary/12 text-primary";
  }
  if (state === "paused") {
    return "border-amber-400/25 bg-amber-500/12 text-amber-300";
  }
  if (state === "failed") {
    return "border-rose-400/25 bg-rose-500/12 text-rose-300";
  }
  if (state === "archived") {
    return "border-white/10 bg-white/[0.04] text-sub";
  }
  return "border-white/10 bg-card2 text-sub";
}

export default function LifecycleStatusPill({
  state,
  fallback = "draft",
}: {
  state: string | null | undefined;
  fallback?: PlatformLifecycleState;
}) {
  const normalized = normalizeLifecycleState(state, fallback);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${toneClasses(normalized)}`}
    >
      {PLATFORM_LIFECYCLE_LABELS[normalized]}
    </span>
  );
}
