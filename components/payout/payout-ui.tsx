import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  PAYOUT_CASE_ESCALATION_STATES,
  PAYOUT_CASE_SEVERITY_LABELS,
  PAYOUT_CASE_STATUS_LABELS,
  PAYOUT_CASE_TYPE_LABELS,
  type PayoutCaseSeverity,
  type PayoutCaseStatus,
  type PayoutCaseType,
} from "@/lib/payout/payout-config";

export function formatPayoutDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getPayoutCaseTypeLabel(value: string) {
  return PAYOUT_CASE_TYPE_LABELS[value as PayoutCaseType] ?? value.replace(/_/g, " ");
}

export function getPayoutSeverityLabel(value: string) {
  return PAYOUT_CASE_SEVERITY_LABELS[value as PayoutCaseSeverity] ?? value;
}

export function getPayoutStatusLabel(value: string) {
  return PAYOUT_CASE_STATUS_LABELS[value as PayoutCaseStatus] ?? value.replace(/_/g, " ");
}

export function getPayoutEscalationLabel(value: string) {
  return (PAYOUT_CASE_ESCALATION_STATES as readonly string[]).includes(value)
    ? value.replace(/_/g, " ")
    : value;
}

export function getPayoutSeverityTone(value: string): "default" | "warning" | "danger" {
  if (value === "critical" || value === "high") {
    return "danger";
  }
  if (value === "medium") {
    return "warning";
  }
  return "default";
}

export function getPayoutStatusTone(value: string): "default" | "success" | "warning" {
  if (value === "resolved" || value === "dismissed") {
    return "success";
  }
  if (value === "needs_project_input" || value === "blocked" || value === "retry_queued") {
    return "warning";
  }
  return "default";
}

export function PayoutSeverityPill({ severity }: { severity: string }) {
  return (
    <OpsStatusPill tone={getPayoutSeverityTone(severity)}>
      {getPayoutSeverityLabel(severity)}
    </OpsStatusPill>
  );
}

export function PayoutStatusPill({ status }: { status: string }) {
  return (
    <OpsStatusPill tone={getPayoutStatusTone(status)}>
      {getPayoutStatusLabel(status)}
    </OpsStatusPill>
  );
}
