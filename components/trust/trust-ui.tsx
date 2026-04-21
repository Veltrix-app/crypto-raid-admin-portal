import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  TRUST_CASE_ESCALATION_STATES,
  TRUST_CASE_SEVERITY_LABELS,
  TRUST_CASE_STATUS_LABELS,
  TRUST_CASE_TYPE_LABELS,
  type TrustCaseEscalationState,
  type TrustCaseSeverity,
  type TrustCaseStatus,
  type TrustCaseType,
} from "@/lib/trust/trust-config";

export function formatTrustDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getTrustCaseTypeLabel(value: string) {
  return TRUST_CASE_TYPE_LABELS[value as TrustCaseType] ?? value.replace(/_/g, " ");
}

export function getTrustSeverityLabel(value: string) {
  return TRUST_CASE_SEVERITY_LABELS[value as TrustCaseSeverity] ?? value;
}

export function getTrustStatusLabel(value: string) {
  return TRUST_CASE_STATUS_LABELS[value as TrustCaseStatus] ?? value.replace(/_/g, " ");
}

export function getTrustEscalationLabel(value: string) {
  return (TRUST_CASE_ESCALATION_STATES as readonly string[]).includes(value)
    ? value.replace(/_/g, " ")
    : value;
}

export function getTrustSeverityTone(value: string): "default" | "warning" | "danger" {
  if (value === "critical" || value === "high") {
    return "danger";
  }
  if (value === "medium") {
    return "warning";
  }
  return "default";
}

export function getTrustStatusTone(value: string): "default" | "success" | "warning" {
  if (value === "resolved" || value === "dismissed") {
    return "success";
  }
  if (value === "needs_project_input" || value === "escalated") {
    return "warning";
  }
  return "default";
}

export function TrustSeverityPill({ severity }: { severity: string }) {
  return (
    <OpsStatusPill tone={getTrustSeverityTone(severity)}>
      {getTrustSeverityLabel(severity)}
    </OpsStatusPill>
  );
}

export function TrustStatusPill({ status }: { status: string }) {
  return (
    <OpsStatusPill tone={getTrustStatusTone(status)}>
      {getTrustStatusLabel(status)}
    </OpsStatusPill>
  );
}
