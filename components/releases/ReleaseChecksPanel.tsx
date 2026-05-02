"use client";

import { useState } from "react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatReleaseLabel } from "@/lib/release/release-contract";
import { updatePortalReleaseCheck } from "@/lib/release/release-dashboard";
import type { AdminReleaseDetail, AdminReleaseRunCheck } from "@/types/entities/release";

function resultTone(result: AdminReleaseRunCheck["result"]) {
  switch (result) {
    case "passed":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "warning":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function severityTone(severity: AdminReleaseRunCheck["severity"]) {
  return severity === "P0" ? "danger" : severity === "P1" ? "warning" : "default";
}

function CheckRow({
  releaseId,
  check,
  onUpdated,
}: {
  releaseId: string;
  check: AdminReleaseRunCheck;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const [result, setResult] = useState(check.result);
  const [summary, setSummary] = useState(check.summary);
  const [nextAction, setNextAction] = useState(check.nextAction);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const detail = await updatePortalReleaseCheck({
        releaseId,
        checkId: check.id,
        result,
        summary,
        nextAction,
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
            <p className="text-sm font-bold text-text">{check.label}</p>
            <OpsStatusPill tone={severityTone(check.severity)}>{check.severity}</OpsStatusPill>
            <OpsStatusPill tone={resultTone(result)}>{formatReleaseLabel(result)}</OpsStatusPill>
            <OpsStatusPill>{formatReleaseLabel(check.checkBlock)}</OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">{check.summary}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save check"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <select
          value={result}
          onChange={(event) => setResult(event.target.value as typeof result)}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="not_run">Not run</option>
          <option value="passed">Passed</option>
          <option value="warning">Warning</option>
          <option value="failed">Failed</option>
        </select>

        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={3}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />

        <textarea
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          rows={3}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function ReleaseChecksPanel({
  releaseId,
  checks,
  onUpdated,
}: {
  releaseId: string;
  checks: AdminReleaseRunCheck[];
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Checks"
      title="Gate posture"
      description="Record the hard and light gates that decide whether this release can move toward go or should stop immediately."
    >
      <div className="space-y-3">
        {checks.map((check) => (
          <CheckRow
            key={check.id}
            releaseId={releaseId}
            check={check}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </OpsPanel>
  );
}

