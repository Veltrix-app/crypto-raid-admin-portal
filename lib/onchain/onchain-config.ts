export const ONCHAIN_CASE_TYPES = [
  "ingress_rejected",
  "ingress_retry_failed",
  "enrichment_failed",
  "provider_sync_failure",
  "unmatched_project_asset",
  "unlinked_wallet_activity",
  "suspicious_onchain_pattern",
  "manual_onchain_review",
] as const;

export const ONCHAIN_CASE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const ONCHAIN_CASE_STATUSES = [
  "open",
  "triaging",
  "needs_project_input",
  "blocked",
  "retry_queued",
  "resolved",
  "dismissed",
] as const;

export const ONCHAIN_CASE_SOURCE_TYPES = [
  "onchain_ingress",
  "onchain_event",
  "provider_sync",
  "wallet_link",
  "tracked_asset",
  "manual",
  "project_escalation",
] as const;

export const ONCHAIN_CASE_ESCALATION_STATES = [
  "none",
  "awaiting_internal",
  "awaiting_project",
  "escalated",
] as const;

export const ONCHAIN_VISIBILITY_PERMISSIONS = [
  "onchain_summary",
  "case_list",
  "member_wallet_detail",
  "event_detail",
  "raw_signal_detail",
  "resolution_history",
] as const;

export const ONCHAIN_ACTION_PERMISSIONS = [
  "annotate_case",
  "escalate_case",
  "retry_project_case",
  "rerun_project_enrichment",
  "rescan_project_assets",
  "resolve_project_blocker",
] as const;

export type OnchainCaseType = (typeof ONCHAIN_CASE_TYPES)[number];
export type OnchainCaseSeverity = (typeof ONCHAIN_CASE_SEVERITIES)[number];
export type OnchainCaseStatus = (typeof ONCHAIN_CASE_STATUSES)[number];
export type OnchainCaseSourceType = (typeof ONCHAIN_CASE_SOURCE_TYPES)[number];
export type OnchainCaseEscalationState = (typeof ONCHAIN_CASE_ESCALATION_STATES)[number];
export type OnchainVisibilityPermission = (typeof ONCHAIN_VISIBILITY_PERMISSIONS)[number];
export type OnchainActionPermission = (typeof ONCHAIN_ACTION_PERMISSIONS)[number];

export const ONCHAIN_CASE_TYPE_LABELS: Record<OnchainCaseType, string> = {
  ingress_rejected: "Ingress rejected",
  ingress_retry_failed: "Ingress retry failed",
  enrichment_failed: "Enrichment failed",
  provider_sync_failure: "Provider sync failure",
  unmatched_project_asset: "Unmatched project asset",
  unlinked_wallet_activity: "Unlinked wallet activity",
  suspicious_onchain_pattern: "Suspicious on-chain pattern",
  manual_onchain_review: "Manual on-chain review",
};

export const ONCHAIN_CASE_STATUS_LABELS: Record<OnchainCaseStatus, string> = {
  open: "Open",
  triaging: "Triaging",
  needs_project_input: "Needs project input",
  blocked: "Blocked",
  retry_queued: "Retry queued",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const ONCHAIN_CASE_SEVERITY_LABELS: Record<OnchainCaseSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const ONCHAIN_VISIBILITY_LABELS: Record<OnchainVisibilityPermission, string> = {
  onchain_summary: "On-chain summary",
  case_list: "Case list",
  member_wallet_detail: "Member wallet detail",
  event_detail: "Event detail",
  raw_signal_detail: "Raw signal detail",
  resolution_history: "Resolution history",
};

export const ONCHAIN_ACTION_LABELS: Record<OnchainActionPermission, string> = {
  annotate_case: "Annotate case",
  escalate_case: "Escalate case",
  retry_project_case: "Retry project case",
  rerun_project_enrichment: "Rerun project enrichment",
  rescan_project_assets: "Rescan project assets",
  resolve_project_blocker: "Resolve project blocker",
};

export type OnchainPermissionPreset = {
  key: "summary_viewer" | "case_reviewer" | "project_onchain_lead";
  label: string;
  description: string;
  visibilityPermissions: readonly OnchainVisibilityPermission[];
  actionPermissions: readonly OnchainActionPermission[];
};

export const ONCHAIN_PERMISSION_PRESETS: readonly OnchainPermissionPreset[] = [
  {
    key: "summary_viewer",
    label: "Summary Viewer",
    description: "Can only see the project's on-chain posture and high-level case volume.",
    visibilityPermissions: ["onchain_summary"],
    actionPermissions: [],
  },
  {
    key: "case_reviewer",
    label: "Case Reviewer",
    description: "Can inspect project cases, add notes, and escalate when internal help is needed.",
    visibilityPermissions: [
      "onchain_summary",
      "case_list",
      "member_wallet_detail",
      "resolution_history",
    ],
    actionPermissions: ["annotate_case", "escalate_case"],
  },
  {
    key: "project_onchain_lead",
    label: "Project On-chain Lead",
    description: "Can inspect project-visible on-chain cases in detail and run project-safe recovery actions.",
    visibilityPermissions: [
      "onchain_summary",
      "case_list",
      "member_wallet_detail",
      "event_detail",
      "raw_signal_detail",
      "resolution_history",
    ],
    actionPermissions: [
      "annotate_case",
      "escalate_case",
      "retry_project_case",
      "rerun_project_enrichment",
      "rescan_project_assets",
      "resolve_project_blocker",
    ],
  },
] as const;

export function isOnchainVisibilityPermission(value: string): value is OnchainVisibilityPermission {
  return (ONCHAIN_VISIBILITY_PERMISSIONS as readonly string[]).includes(value);
}

export function isOnchainActionPermission(value: string): value is OnchainActionPermission {
  return (ONCHAIN_ACTION_PERMISSIONS as readonly string[]).includes(value);
}

export function isOnchainCaseType(value: string): value is OnchainCaseType {
  return (ONCHAIN_CASE_TYPES as readonly string[]).includes(value);
}

export function isOnchainCaseStatus(value: string): value is OnchainCaseStatus {
  return (ONCHAIN_CASE_STATUSES as readonly string[]).includes(value);
}

export function normalizeOnchainVisibilityPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is OnchainVisibilityPermission =>
          typeof permission === "string" && isOnchainVisibilityPermission(permission)
      )
    : [];
}

export function normalizeOnchainActionPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is OnchainActionPermission =>
          typeof permission === "string" && isOnchainActionPermission(permission)
      )
    : [];
}

export function getDefaultProjectOnchainPermissions() {
  return {
    visibilityPermissions: ["onchain_summary"] as OnchainVisibilityPermission[],
    actionPermissions: [] as OnchainActionPermission[],
  };
}

export function getFullProjectOnchainPermissions() {
  return {
    visibilityPermissions: [...ONCHAIN_VISIBILITY_PERMISSIONS] as OnchainVisibilityPermission[],
    actionPermissions: [...ONCHAIN_ACTION_PERMISSIONS] as OnchainActionPermission[],
  };
}
