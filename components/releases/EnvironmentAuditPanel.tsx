"use client";

import { useState } from "react";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { updatePortalEnvironmentAudit } from "@/lib/release/release-dashboard";
import type {
  AdminDeployCheckSummary,
  AdminEnvironmentAudit,
  AdminReleaseDetail,
} from "@/types/entities/release";

function auditTone(status: AdminEnvironmentAudit["status"]) {
  switch (status) {
    case "ready":
      return "success" as const;
    case "critical":
      return "danger" as const;
    case "warning":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function AuditRow({
  releaseId,
  audit,
  onUpdated,
}: {
  releaseId: string;
  audit: AdminEnvironmentAudit;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const [status, setStatus] = useState(audit.status);
  const [summary, setSummary] = useState(audit.summary);
  const [missingKeys, setMissingKeys] = useState(audit.missingKeys.join("\n"));
  const [mismatchNotes, setMismatchNotes] = useState(audit.mismatchNotes.join("\n"));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const detail = await updatePortalEnvironmentAudit({
        releaseId,
        auditId: audit.id,
        status,
        summary,
        missingKeys,
        mismatchNotes,
      });
      onUpdated(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-text">{audit.serviceKey.replaceAll("_", " ")}</p>
            <OpsStatusPill tone={auditTone(status)}>{status.replaceAll("_", " ")}</OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">{audit.summary}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save audit"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
          >
            <option value="not_reviewed">Not reviewed</option>
            <option value="ready">Ready</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <div className="rounded-[18px] border border-dashed border-white/10 bg-black/10 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
              Required keys
            </p>
            <p className="mt-2 text-sm leading-6 text-sub">
              {audit.requiredKeys.length ? audit.requiredKeys.join(", ") : "Manual review only"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={missingKeys}
            onChange={(event) => setMissingKeys(event.target.value)}
            rows={4}
            placeholder="Missing env keys, one per line"
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <textarea
          value={mismatchNotes}
          onChange={(event) => setMismatchNotes(event.target.value)}
          rows={7}
          placeholder="Mismatch notes or suspicious environment posture"
          className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function EnvironmentAuditPanel({
  releaseId,
  audits,
  deployChecks,
  onUpdated,
}: {
  releaseId: string;
  audits: AdminEnvironmentAudit[];
  deployChecks?: AdminDeployCheckSummary | null;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Environment"
      title="Environment audits"
      description="Track reviewed env posture per service and keep the operator notes close to the current release candidate."
    >
      <div className="space-y-3">
        {audits.map((audit) => (
          <AuditRow
            key={audit.id}
            releaseId={releaseId}
            audit={audit}
            onUpdated={onUpdated}
          />
        ))}
      </div>

      <div className="mt-6">
        {deployChecks ? (
          <div className="rounded-[18px] border border-white/[0.024] bg-black/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Live deploy hygiene snapshot</p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  A runtime snapshot from the current portal deployment, useful as a fast warning layer on top of the manual audits.
                </p>
              </div>
              <OpsStatusPill tone={deployChecks.overallState === "critical" ? "danger" : deployChecks.overallState === "warning" ? "warning" : "success"}>
                {deployChecks.overallState}
              </OpsStatusPill>
            </div>
            <div className="mt-4 space-y-2">
              {deployChecks.checks.map((check) => (
                <div key={check.key} className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text">{check.label}</p>
                    <OpsStatusPill tone={check.state === "critical" ? "danger" : check.state === "warning" ? "warning" : "success"}>
                      {check.state}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sub">{check.summary}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <InlineEmptyNotice
            title="No live deploy snapshot"
            description="The release machine could not load the current portal-side deploy hygiene snapshot for this session."
          />
        )}
      </div>
    </OpsPanel>
  );
}

