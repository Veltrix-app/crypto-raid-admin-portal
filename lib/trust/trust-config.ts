export const TRUST_CASE_TYPES = [
  "sybil_suspicion",
  "referral_abuse",
  "fake_engagement",
  "wallet_anomaly",
  "trust_drop",
  "reward_trust_risk",
  "manual_review",
] as const;

export const TRUST_CASE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const TRUST_CASE_STATUSES = [
  "open",
  "triaging",
  "needs_project_input",
  "escalated",
  "resolved",
  "dismissed",
] as const;

export const TRUST_CASE_SOURCE_TYPES = [
  "review_flag",
  "trust_snapshot",
  "onchain_signal",
  "manual",
  "project_escalation",
] as const;

export const TRUST_CASE_ESCALATION_STATES = [
  "none",
  "awaiting_internal",
  "awaiting_project",
  "escalated",
] as const;

export const TRUST_VISIBILITY_PERMISSIONS = [
  "trust_summary",
  "trust_case_list",
  "member_case_detail",
  "raw_signal_detail",
  "wallet_detail",
  "resolution_history",
] as const;

export const TRUST_ACTION_PERMISSIONS = [
  "annotate_case",
  "escalate_case",
  "request_project_input",
  "resolve_project_case",
  "mute_member",
  "freeze_reward_eligibility",
  "reward_trust_override",
  "trust_override",
] as const;

export type TrustCaseType = (typeof TRUST_CASE_TYPES)[number];
export type TrustCaseSeverity = (typeof TRUST_CASE_SEVERITIES)[number];
export type TrustCaseStatus = (typeof TRUST_CASE_STATUSES)[number];
export type TrustCaseSourceType = (typeof TRUST_CASE_SOURCE_TYPES)[number];
export type TrustCaseEscalationState = (typeof TRUST_CASE_ESCALATION_STATES)[number];
export type TrustVisibilityPermission = (typeof TRUST_VISIBILITY_PERMISSIONS)[number];
export type TrustActionPermission = (typeof TRUST_ACTION_PERMISSIONS)[number];

export const TRUST_CASE_TYPE_LABELS: Record<TrustCaseType, string> = {
  sybil_suspicion: "Sybil suspicion",
  referral_abuse: "Referral abuse",
  fake_engagement: "Fake engagement",
  wallet_anomaly: "Wallet anomaly",
  trust_drop: "Trust drop",
  reward_trust_risk: "Reward trust risk",
  manual_review: "Manual review",
};

export const TRUST_CASE_STATUS_LABELS: Record<TrustCaseStatus, string> = {
  open: "Open",
  triaging: "Triaging",
  needs_project_input: "Needs project input",
  escalated: "Escalated",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const TRUST_CASE_SEVERITY_LABELS: Record<TrustCaseSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TRUST_VISIBILITY_LABELS: Record<TrustVisibilityPermission, string> = {
  trust_summary: "Trust summary",
  trust_case_list: "Case list",
  member_case_detail: "Member case detail",
  raw_signal_detail: "Raw signal detail",
  wallet_detail: "Wallet detail",
  resolution_history: "Resolution history",
};

export const TRUST_ACTION_LABELS: Record<TrustActionPermission, string> = {
  annotate_case: "Annotate case",
  escalate_case: "Escalate case",
  request_project_input: "Request project input",
  resolve_project_case: "Resolve project case",
  mute_member: "Mute member",
  freeze_reward_eligibility: "Freeze reward eligibility",
  reward_trust_override: "Reward trust override",
  trust_override: "Trust override",
};

export type TrustPermissionPreset = {
  key: "summary_viewer" | "case_reviewer" | "project_trust_lead";
  label: string;
  description: string;
  visibilityPermissions: readonly TrustVisibilityPermission[];
  actionPermissions: readonly TrustActionPermission[];
};

export const TRUST_PERMISSION_PRESETS: readonly TrustPermissionPreset[] = [
  {
    key: "summary_viewer",
    label: "Summary Viewer",
    description: "Can see trust posture and case volume, but not member-level detail or actions.",
    visibilityPermissions: ["trust_summary", "trust_case_list"],
    actionPermissions: [],
  },
  {
    key: "case_reviewer",
    label: "Case Reviewer",
    description: "Can inspect project cases, annotate them, and escalate when internal help is needed.",
    visibilityPermissions: [
      "trust_summary",
      "trust_case_list",
      "member_case_detail",
      "resolution_history",
    ],
    actionPermissions: ["annotate_case", "escalate_case", "request_project_input"],
  },
  {
    key: "project_trust_lead",
    label: "Project Trust Lead",
    description: "Can review project cases in detail and resolve project-scoped trust issues.",
    visibilityPermissions: [
      "trust_summary",
      "trust_case_list",
      "member_case_detail",
      "raw_signal_detail",
      "wallet_detail",
      "resolution_history",
    ],
    actionPermissions: [
      "annotate_case",
      "escalate_case",
      "request_project_input",
      "resolve_project_case",
      "mute_member",
      "freeze_reward_eligibility",
    ],
  },
];

export function isTrustVisibilityPermission(value: string): value is TrustVisibilityPermission {
  return (TRUST_VISIBILITY_PERMISSIONS as readonly string[]).includes(value);
}

export function isTrustActionPermission(value: string): value is TrustActionPermission {
  return (TRUST_ACTION_PERMISSIONS as readonly string[]).includes(value);
}

export function isTrustCaseType(value: string): value is TrustCaseType {
  return (TRUST_CASE_TYPES as readonly string[]).includes(value);
}

export function isTrustCaseStatus(value: string): value is TrustCaseStatus {
  return (TRUST_CASE_STATUSES as readonly string[]).includes(value);
}

export function normalizeTrustVisibilityPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is TrustVisibilityPermission =>
          typeof permission === "string" && isTrustVisibilityPermission(permission)
      )
    : [];
}

export function normalizeTrustActionPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is TrustActionPermission =>
          typeof permission === "string" && isTrustActionPermission(permission)
      )
    : [];
}

export function getDefaultProjectTrustPermissions() {
  return {
    visibilityPermissions: ["trust_summary"] as TrustVisibilityPermission[],
    actionPermissions: [] as TrustActionPermission[],
  };
}

export function getFullProjectTrustPermissions() {
  return {
    visibilityPermissions: [...TRUST_VISIBILITY_PERMISSIONS] as TrustVisibilityPermission[],
    actionPermissions: [...TRUST_ACTION_PERMISSIONS] as TrustActionPermission[],
  };
}
