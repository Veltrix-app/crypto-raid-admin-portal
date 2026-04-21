export const PAYOUT_CASE_TYPES = [
  "claim_review",
  "claim_blocked",
  "delivery_failure",
  "reward_inventory_risk",
  "campaign_finalization_failure",
  "payout_dispute",
  "manual_payout_review",
] as const;

export const PAYOUT_CASE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const PAYOUT_CASE_STATUSES = [
  "open",
  "triaging",
  "needs_project_input",
  "blocked",
  "retry_queued",
  "resolved",
  "dismissed",
] as const;

export const PAYOUT_CASE_SOURCE_TYPES = [
  "reward_claim",
  "reward_distribution",
  "campaign_finalization",
  "reward_inventory",
  "manual",
] as const;

export const PAYOUT_CASE_ESCALATION_STATES = [
  "none",
  "awaiting_internal",
  "awaiting_project",
  "escalated",
] as const;

export const PAYOUT_VISIBILITY_PERMISSIONS = [
  "payout_summary",
  "claim_list",
  "member_claim_detail",
  "payout_failure_detail",
  "wallet_delivery_detail",
  "resolution_history",
] as const;

export const PAYOUT_ACTION_PERMISSIONS = [
  "annotate_case",
  "escalate_case",
  "retry_project_flow",
  "resolve_project_blocker",
  "freeze_reward",
  "pause_claim_rail",
  "payout_override",
] as const;

export type PayoutCaseType = (typeof PAYOUT_CASE_TYPES)[number];
export type PayoutCaseSeverity = (typeof PAYOUT_CASE_SEVERITIES)[number];
export type PayoutCaseStatus = (typeof PAYOUT_CASE_STATUSES)[number];
export type PayoutCaseSourceType = (typeof PAYOUT_CASE_SOURCE_TYPES)[number];
export type PayoutCaseEscalationState = (typeof PAYOUT_CASE_ESCALATION_STATES)[number];
export type PayoutVisibilityPermission = (typeof PAYOUT_VISIBILITY_PERMISSIONS)[number];
export type PayoutActionPermission = (typeof PAYOUT_ACTION_PERMISSIONS)[number];

export const PAYOUT_CASE_TYPE_LABELS: Record<PayoutCaseType, string> = {
  claim_review: "Claim review",
  claim_blocked: "Claim blocked",
  delivery_failure: "Delivery failure",
  reward_inventory_risk: "Reward inventory risk",
  campaign_finalization_failure: "Campaign finalization failure",
  payout_dispute: "Payout dispute",
  manual_payout_review: "Manual payout review",
};

export const PAYOUT_CASE_STATUS_LABELS: Record<PayoutCaseStatus, string> = {
  open: "Open",
  triaging: "Triaging",
  needs_project_input: "Needs project input",
  blocked: "Blocked",
  retry_queued: "Retry queued",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const PAYOUT_CASE_SEVERITY_LABELS: Record<PayoutCaseSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PAYOUT_VISIBILITY_LABELS: Record<PayoutVisibilityPermission, string> = {
  payout_summary: "Payout summary",
  claim_list: "Claim list",
  member_claim_detail: "Member claim detail",
  payout_failure_detail: "Payout failure detail",
  wallet_delivery_detail: "Wallet or delivery detail",
  resolution_history: "Resolution history",
};

export const PAYOUT_ACTION_LABELS: Record<PayoutActionPermission, string> = {
  annotate_case: "Annotate case",
  escalate_case: "Escalate case",
  retry_project_flow: "Retry project flow",
  resolve_project_blocker: "Resolve project blocker",
  freeze_reward: "Freeze reward",
  pause_claim_rail: "Pause claim rail",
  payout_override: "Payout override",
};

export type PayoutPermissionPreset = {
  key: "summary_viewer" | "claim_reviewer" | "project_payout_lead";
  label: string;
  description: string;
  visibilityPermissions: readonly PayoutVisibilityPermission[];
  actionPermissions: readonly PayoutActionPermission[];
};

export const PAYOUT_PERMISSION_PRESETS: readonly PayoutPermissionPreset[] = [
  {
    key: "summary_viewer",
    label: "Summary Viewer",
    description: "Can only see payout posture and health summaries.",
    visibilityPermissions: ["payout_summary"],
    actionPermissions: [],
  },
  {
    key: "claim_reviewer",
    label: "Claim Reviewer",
    description: "Can inspect project claims, annotate cases and trigger safe retries or escalations.",
    visibilityPermissions: [
      "payout_summary",
      "claim_list",
      "member_claim_detail",
      "resolution_history",
    ],
    actionPermissions: ["annotate_case", "escalate_case", "retry_project_flow"],
  },
  {
    key: "project_payout_lead",
    label: "Project Payout Lead",
    description: "Can inspect project payout cases in detail and run the project-side payout actions.",
    visibilityPermissions: [
      "payout_summary",
      "claim_list",
      "member_claim_detail",
      "payout_failure_detail",
      "wallet_delivery_detail",
      "resolution_history",
    ],
    actionPermissions: [
      "annotate_case",
      "escalate_case",
      "retry_project_flow",
      "resolve_project_blocker",
      "freeze_reward",
      "pause_claim_rail",
      "payout_override",
    ],
  },
] as const;

export function isPayoutVisibilityPermission(value: string): value is PayoutVisibilityPermission {
  return (PAYOUT_VISIBILITY_PERMISSIONS as readonly string[]).includes(value);
}

export function isPayoutActionPermission(value: string): value is PayoutActionPermission {
  return (PAYOUT_ACTION_PERMISSIONS as readonly string[]).includes(value);
}

export function normalizePayoutVisibilityPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is PayoutVisibilityPermission =>
          typeof permission === "string" && isPayoutVisibilityPermission(permission)
      )
    : [];
}

export function normalizePayoutActionPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (permission): permission is PayoutActionPermission =>
          typeof permission === "string" && isPayoutActionPermission(permission)
      )
    : [];
}

export function getDefaultProjectPayoutPermissions() {
  return {
    visibilityPermissions: ["payout_summary"] as PayoutVisibilityPermission[],
    actionPermissions: [] as PayoutActionPermission[],
  };
}

export function getFullProjectPayoutPermissions() {
  return {
    visibilityPermissions: [...PAYOUT_VISIBILITY_PERMISSIONS] as PayoutVisibilityPermission[],
    actionPermissions: [...PAYOUT_ACTION_PERMISSIONS] as PayoutActionPermission[],
  };
}
