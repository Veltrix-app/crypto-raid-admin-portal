export type PlatformLifecycleState =
  | "draft"
  | "ready"
  | "live"
  | "paused"
  | "completed"
  | "archived"
  | "failed";

export const PLATFORM_LIFECYCLE_LABELS: Record<PlatformLifecycleState, string> = {
  draft: "Draft",
  ready: "Ready",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
  failed: "Failed",
};

const TRANSITIONS: Record<PlatformLifecycleState, PlatformLifecycleState[]> = {
  draft: ["ready", "archived"],
  ready: ["live", "paused", "archived"],
  live: ["paused", "completed", "failed"],
  paused: ["ready", "live", "archived"],
  completed: ["archived"],
  archived: [],
  failed: ["paused", "ready", "archived"],
};

export function canTransitionLifecycle(
  current: PlatformLifecycleState,
  next: PlatformLifecycleState
) {
  return TRANSITIONS[current].includes(next);
}

export function normalizeLifecycleState(
  input: string | null | undefined,
  fallback: PlatformLifecycleState = "draft"
): PlatformLifecycleState {
  if (!input) {
    return fallback;
  }

  return input in PLATFORM_LIFECYCLE_LABELS
    ? (input as PlatformLifecycleState)
    : fallback;
}

export function deriveLifecycleState(
  input: string | null | undefined,
  fallback: PlatformLifecycleState = "draft"
): PlatformLifecycleState {
  if (!input) {
    return fallback;
  }

  const normalized = input.toLowerCase();

  if (normalized === "active") return "live";
  if (normalized === "inactive") return "paused";
  if (normalized === "scheduled") return "ready";
  if (normalized === "fulfilled" || normalized === "completed") return "completed";
  if (normalized === "rejected" || normalized === "failed") return "failed";

  return normalizeLifecycleState(normalized, fallback);
}
