import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  ONCHAIN_CASE_ESCALATION_STATES,
  ONCHAIN_CASE_SEVERITY_LABELS,
  ONCHAIN_CASE_STATUS_LABELS,
  ONCHAIN_CASE_TYPE_LABELS,
  type OnchainCaseSeverity,
  type OnchainCaseStatus,
  type OnchainCaseType,
} from "@/lib/onchain/onchain-config";

export function formatOnchainDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getOnchainCaseTypeLabel(value: string) {
  return ONCHAIN_CASE_TYPE_LABELS[value as OnchainCaseType] ?? value.replace(/_/g, " ");
}

export function getOnchainSeverityLabel(value: string) {
  return ONCHAIN_CASE_SEVERITY_LABELS[value as OnchainCaseSeverity] ?? value;
}

export function getOnchainStatusLabel(value: string) {
  return ONCHAIN_CASE_STATUS_LABELS[value as OnchainCaseStatus] ?? value.replace(/_/g, " ");
}

export function getOnchainEscalationLabel(value: string) {
  return (ONCHAIN_CASE_ESCALATION_STATES as readonly string[]).includes(value)
    ? value.replace(/_/g, " ")
    : value;
}

export function getOnchainSourceLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function getOnchainSeverityTone(value: string): "default" | "warning" | "danger" {
  if (value === "critical" || value === "high") {
    return "danger";
  }
  if (value === "medium") {
    return "warning";
  }
  return "default";
}

export function getOnchainStatusTone(value: string): "default" | "success" | "warning" {
  if (value === "resolved" || value === "dismissed") {
    return "success";
  }
  if (value === "needs_project_input" || value === "blocked" || value === "retry_queued") {
    return "warning";
  }
  return "default";
}

export function OnchainSeverityPill({ severity }: { severity: string }) {
  return (
    <OpsStatusPill tone={getOnchainSeverityTone(severity)}>
      {getOnchainSeverityLabel(severity)}
    </OpsStatusPill>
  );
}

export function OnchainStatusPill({ status }: { status: string }) {
  return (
    <OpsStatusPill tone={getOnchainStatusTone(status)}>
      {getOnchainStatusLabel(status)}
    </OpsStatusPill>
  );
}
