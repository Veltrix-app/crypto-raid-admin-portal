"use client";

import { useState } from "react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatReleaseLabel } from "@/lib/release/release-contract";
import { getSmokePackDefinition } from "@/lib/release/smoke-packs";
import { updatePortalReleaseSmoke } from "@/lib/release/release-dashboard";
import type { AdminReleaseDetail, AdminReleaseRunSmokeResult } from "@/types/entities/release";

function resultTone(result: AdminReleaseRunSmokeResult["result"]) {
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

function SmokeRow({
  releaseId,
  smokeResult,
  onUpdated,
}: {
  releaseId: string;
  smokeResult: AdminReleaseRunSmokeResult;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const [result, setResult] = useState(smokeResult.result);
  const [notes, setNotes] = useState(smokeResult.notes);
  const [saving, setSaving] = useState(false);
  const pack = getSmokePackDefinition(smokeResult.smokeCategory);

  async function handleSave() {
    try {
      setSaving(true);
      const detail = await updatePortalReleaseSmoke({
        releaseId,
        smokeResultId: smokeResult.id,
        result,
        notes,
      });
      onUpdated(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-line bg-card2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-text">{smokeResult.scenarioLabel}</p>
            <OpsStatusPill tone={resultTone(result)}>{formatReleaseLabel(result)}</OpsStatusPill>
            <OpsStatusPill>{pack?.label ?? formatReleaseLabel(smokeResult.smokeCategory)}</OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">
            {pack?.description ??
              "Record whether this smoke scenario has been run and whether the result is clean enough for release."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save smoke"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <select
          value={result}
          onChange={(event) => setResult(event.target.value as typeof result)}
          className="rounded-[18px] border border-line bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="not_run">Not run</option>
          <option value="passed">Passed</option>
          <option value="warning">Warning</option>
          <option value="failed">Failed</option>
        </select>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="What happened during this smoke check?"
          className="rounded-[18px] border border-line bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function ReleaseSmokePanel({
  releaseId,
  smokeResults,
  onUpdated,
}: {
  releaseId: string;
  smokeResults: AdminReleaseRunSmokeResult[];
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Smoke"
      title="Post-deploy verification"
      description="Record the minimum route and flow checks that prove the release is healthy after deployment."
    >
      <div className="space-y-3">
        {smokeResults.map((smokeResult) => (
          <SmokeRow
            key={smokeResult.id}
            releaseId={releaseId}
            smokeResult={smokeResult}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </OpsPanel>
  );
}

