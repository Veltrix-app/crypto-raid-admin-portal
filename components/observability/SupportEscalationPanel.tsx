"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsMetricCard, OpsSelect, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type SupportEscalationRecord = {
  id: string;
  project_id: string | null;
  source_surface: string;
  source_type: string;
  source_id: string;
  title: string;
  summary: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "triaging"
    | "waiting_internal"
    | "waiting_project"
    | "waiting_provider"
    | "blocked"
    | "resolved"
    | "dismissed";
  waiting_on: "internal" | "project" | "provider" | "deploy" | "none";
  owner_auth_user_id: string | null;
  next_action_summary: string | null;
  resolution_notes: string | null;
  updated_at: string;
  opened_at: string;
  projectName: string | null;
  ownerIsViewer: boolean;
};

type SupportEscalationSummary = {
  total: number;
  unresolved: number;
  critical: number;
  waitingProject: number;
  waitingProvider: number;
  waitingDeploy: number;
};

const STATUS_OPTIONS: SupportEscalationRecord["status"][] = [
  "open",
  "triaging",
  "waiting_internal",
  "waiting_project",
  "waiting_provider",
  "blocked",
  "resolved",
  "dismissed",
];

const WAITING_OPTIONS: SupportEscalationRecord["waiting_on"][] = [
  "internal",
  "project",
  "provider",
  "deploy",
  "none",
];

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatRelative(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 1) {
    return "Updated just now";
  }
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

function toneFromSeverity(severity: SupportEscalationRecord["severity"]) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "default" as const;
  return "success" as const;
}

export default function SupportEscalationPanel({
  title,
  description,
  projectId,
  sourceSurface,
  includeResolved = false,
  requireProjectContext = false,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  projectId?: string | null;
  sourceSurface?: string | null;
  includeResolved?: boolean;
  requireProjectContext?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [escalations, setEscalations] = useState<SupportEscalationRecord[]>([]);
  const [summary, setSummary] = useState<SupportEscalationSummary | null>(null);
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [status, setStatus] = useState<SupportEscalationRecord["status"]>("open");
  const [waitingOn, setWaitingOn] = useState<SupportEscalationRecord["waiting_on"]>("internal");
  const [nextActionSummary, setNextActionSummary] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const enabled = !requireProjectContext || Boolean(projectId);

  async function loadEscalations(preserveSelection = true) {
    if (!enabled) {
      setEscalations([]);
      setSummary(null);
      setSelectedEscalationId(null);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (sourceSurface) params.set("sourceSurface", sourceSurface);
      if (includeResolved) params.set("includeResolved", "true");

      const response = await fetch(`/api/ops/escalations?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            escalations?: SupportEscalationRecord[];
            summary?: SupportEscalationSummary;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load support escalations.");
      }

      const rows = payload.escalations ?? [];
      setEscalations(rows);
      setSummary(payload.summary ?? null);
      setSelectedEscalationId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (loadError) {
      setEscalations([]);
      setSummary(null);
      setSelectedEscalationId(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load support escalations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEscalations(false);
  }, [enabled, includeResolved, projectId, sourceSurface]);

  const selectedEscalation = useMemo(
    () => escalations.find((row) => row.id === selectedEscalationId) ?? null,
    [escalations, selectedEscalationId]
  );

  useEffect(() => {
    if (!selectedEscalation) {
      setStatus("open");
      setWaitingOn("internal");
      setNextActionSummary("");
      setResolutionNotes("");
      return;
    }

    setStatus(selectedEscalation.status);
    setWaitingOn(selectedEscalation.waiting_on);
    setNextActionSummary(selectedEscalation.next_action_summary ?? "");
    setResolutionNotes(selectedEscalation.resolution_notes ?? "");
  }, [selectedEscalation]);

  async function handleSave() {
    if (!selectedEscalation) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`/api/ops/escalations/${selectedEscalation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          waitingOn,
          nextActionSummary,
          resolutionNotes,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; escalation?: SupportEscalationRecord; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to update support escalation.");
      }

      await loadEscalations();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update support escalation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
        <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      </div>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <OpsMetricCard label="Unresolved" value={summary.unresolved} />
          <OpsMetricCard
            label="Critical"
            value={summary.critical}
            emphasis={summary.critical > 0 ? "warning" : "default"}
          />
          <OpsMetricCard label="Waiting project" value={summary.waitingProject} />
          <OpsMetricCard label="Waiting provider" value={summary.waitingProvider} />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!enabled ? (
        <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
          <p className="font-semibold text-text">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-sub">{emptyDescription}</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            {loading ? (
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-6 text-sm text-sub">
                Loading support escalations...
              </div>
            ) : escalations.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="font-semibold text-text">{emptyTitle}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{emptyDescription}</p>
              </div>
            ) : (
              escalations.map((escalation) => (
                <button
                  key={escalation.id}
                  type="button"
                  onClick={() => setSelectedEscalationId(escalation.id)}
                  className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all ${
                    escalation.id === selectedEscalationId
                      ? "border-primary/40 bg-primary/10"
                      : "border-line bg-card2 hover:border-white/12"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">{escalation.title}</p>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        {escalation.summary ?? "No summary recorded for this escalation yet."}
                      </p>
                    </div>
                    <OpsStatusPill tone={toneFromSeverity(escalation.severity)}>
                      {humanize(escalation.severity)}
                    </OpsStatusPill>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-sub">
                    <span>{escalation.projectName ?? "Platform-wide"}</span>
                    <span>•</span>
                    <span>{humanize(escalation.status)}</span>
                    <span>•</span>
                    <span>{formatRelative(escalation.updated_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
            {selectedEscalation ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      Escalation detail
                    </p>
                    <h3 className="mt-2 text-lg font-extrabold text-text">
                      {selectedEscalation.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      {selectedEscalation.summary ?? "No summary recorded for this escalation yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OpsStatusPill tone={toneFromSeverity(selectedEscalation.severity)}>
                      {humanize(selectedEscalation.severity)}
                    </OpsStatusPill>
                    <OpsStatusPill>{humanize(selectedEscalation.waiting_on)}</OpsStatusPill>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Snapshot label="Project" value={selectedEscalation.projectName ?? "Platform-wide"} />
                  <Snapshot label="Source surface" value={humanize(selectedEscalation.source_surface)} />
                  <Snapshot label="Current status" value={humanize(selectedEscalation.status)} />
                  <Snapshot
                    label="Ownership"
                    value={
                      selectedEscalation.ownerIsViewer
                        ? "Owned by you"
                        : selectedEscalation.owner_auth_user_id
                          ? "Assigned"
                          : "Unassigned"
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                      Status
                    </span>
                    <OpsSelect value={status} onChange={(value) => setStatus(value as SupportEscalationRecord["status"])} ariaLabel="Support escalation status">
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {humanize(option)}
                        </option>
                      ))}
                    </OpsSelect>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                      Waiting on
                    </span>
                    <OpsSelect value={waitingOn} onChange={(value) => setWaitingOn(value as SupportEscalationRecord["waiting_on"])} ariaLabel="Support escalation waiting on">
                      {WAITING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {humanize(option)}
                        </option>
                      ))}
                    </OpsSelect>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    Next action
                  </span>
                  <textarea
                    value={nextActionSummary}
                    onChange={(event) => setNextActionSummary(event.target.value)}
                    rows={3}
                    className="w-full rounded-[20px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.95),rgba(13,19,29,0.95))] px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="What should happen next to clear this escalation?"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    Resolution notes
                  </span>
                  <textarea
                    value={resolutionNotes}
                    onChange={(event) => setResolutionNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-[20px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.95),rgba(13,19,29,0.95))] px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Capture the operator note or the final resolution context."
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-sub">
                    Saving an escalation assigns accountability to the current operator.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="rounded-[18px] border border-primary/35 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save escalation"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-line px-4 py-6 text-sm leading-6 text-sub">
                Select an escalation to inspect the current owner, next action and waiting state.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-black/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
