"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRightCircle,
  CheckCircle2,
  ShieldAlert,
  Siren,
  XCircle,
} from "lucide-react";
import {
  ProjectOperationIncidentRecord,
  type ProjectOperationIncidentStatus,
} from "@/lib/platform/core-ops";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

function severityTone(severity: ProjectOperationIncidentRecord["severity"]) {
  if (severity === "critical") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  return "default" as const;
}

function statusTone(status: ProjectOperationIncidentRecord["status"]) {
  if (status === "resolved") return "success" as const;
  if (status === "dismissed") return "default" as const;
  if (status === "watching") return "warning" as const;
  return "danger" as const;
}

function sourceLabel(source: ProjectOperationIncidentRecord["source_type"]) {
  return source.replace(/_/g, " ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function OpsIncidentPanel({
  incidents,
  emptyTitle = "No open incidents",
  emptyDescription = "This part of the project is running cleanly right now.",
  workingIncidentId,
  onUpdateStatus,
}: {
  incidents: ProjectOperationIncidentRecord[];
  emptyTitle?: string;
  emptyDescription?: string;
  workingIncidentId?: string | null;
  onUpdateStatus?: (
    incidentId: string,
    status: Extract<ProjectOperationIncidentStatus, "watching" | "resolved" | "dismissed">
  ) => void | Promise<void>;
}) {
  if (incidents.length === 0) {
    return <InlineEmptyNotice title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const busy = workingIncidentId === incident.id;

        return (
          <div
            key={incident.id}
            className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,31,0.98),rgba(10,14,22,0.98))] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 text-primary">
                    {incident.severity === "critical" ? (
                      <Siren size={18} />
                    ) : incident.status === "watching" ? (
                      <ShieldAlert size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-text">{incident.title}</p>
                    <p className="mt-1 text-sm text-sub">
                      {incident.summary || "No extra incident summary was logged."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <OpsStatusPill tone={severityTone(incident.severity)}>
                    {incident.severity}
                  </OpsStatusPill>
                  <OpsStatusPill tone={statusTone(incident.status)}>
                    {incident.status}
                  </OpsStatusPill>
                  <OpsStatusPill>{sourceLabel(incident.source_type)}</OpsStatusPill>
                  <OpsStatusPill>{incident.object_type}</OpsStatusPill>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <SignalRow label="Object ID" value={incident.object_id} />
                  <SignalRow label="Opened" value={formatDate(incident.opened_at)} />
                  <SignalRow label="Updated" value={formatDate(incident.updated_at)} />
                </div>
              </div>

              {onUpdateStatus ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <ActionButton
                    label={busy ? "Updating..." : "Watch"}
                    icon={<ArrowRightCircle size={14} />}
                    disabled={busy}
                    onClick={() => onUpdateStatus(incident.id, "watching")}
                  />
                  <ActionButton
                    label={busy ? "Updating..." : "Resolve"}
                    icon={<CheckCircle2 size={14} />}
                    disabled={busy}
                    tone="primary"
                    onClick={() => onUpdateStatus(incident.id, "resolved")}
                  />
                  <ActionButton
                    label={busy ? "Updating..." : "Dismiss"}
                    icon={<XCircle size={14} />}
                    disabled={busy}
                    tone="muted"
                    onClick={() => onUpdateStatus(incident.id, "dismissed")}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.032] bg-black/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  tone = "default",
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  tone?: "default" | "primary" | "muted";
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className={`inline-flex items-center gap-2 rounded-[18px] border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
        tone === "primary"
          ? "border-primary/30 bg-primary/[0.065] text-primary hover:bg-primary/18"
          : tone === "muted"
            ? "border-white/10 bg-white/[0.04] text-sub hover:border-white/16 hover:bg-white/[0.06]"
            : "border-amber-400/25 bg-amber-500/[0.055] text-amber-300 hover:bg-amber-500/14"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {icon}
      {label}
    </button>
  );
}
