"use client";

import { useEffect, useState } from "react";
import { OpsMetricCard, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type DeployCheckRecord = {
  key: string;
  label: string;
  state: "healthy" | "warning" | "critical";
  summary: string;
  nextAction: string;
};

type DeployCheckSummary = {
  overallState: "healthy" | "warning" | "critical";
  warningCount: number;
  criticalCount: number;
  checks: DeployCheckRecord[];
};

function toneFromState(state: DeployCheckRecord["state"]) {
  if (state === "critical") return "danger" as const;
  if (state === "warning") return "warning" as const;
  return "success" as const;
}

export default function DeployCheckPanel() {
  const [summary, setSummary] = useState<DeployCheckSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadChecks() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/ops/deploy-checks", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; summary?: DeployCheckSummary; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.summary) {
          throw new Error(payload?.error ?? "Failed to load deploy checks.");
        }

        if (!active) {
          return;
        }

        setSummary(payload.summary);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setSummary(null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load deploy checks.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadChecks();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4 rounded-[22px] border border-line bg-[linear-gradient(180deg,rgba(13,19,29,0.96),rgba(10,15,24,0.98))] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Deploy hygiene
          </p>
          <h3 className="mt-2 text-[1.08rem] font-extrabold tracking-tight text-text">
            Environment and deploy posture
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sub">
            Keep environment drift visible before it turns into broken queues, silent webhooks or
            dead deep links.
          </p>
        </div>
        {summary ? (
          <OpsStatusPill tone={toneFromState(summary.overallState)}>{summary.overallState}</OpsStatusPill>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-3 md:grid-cols-3">
          <OpsMetricCard label="Critical checks" value={summary.criticalCount} emphasis={summary.criticalCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Warnings" value={summary.warningCount} emphasis={summary.warningCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Healthy checks" value={summary.checks.length - summary.warningCount - summary.criticalCount} emphasis="primary" />
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[18px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
          Loading deploy checks...
        </div>
      ) : summary ? (
        <div className="grid gap-3">
          {summary.checks.map((check) => (
            <div
              key={check.key}
              className="rounded-[18px] border border-line bg-card2 px-4 py-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">{check.label}</p>
                  <p className="mt-2 text-sm leading-5.5 text-sub">{check.summary}</p>
                </div>
                <OpsStatusPill tone={toneFromState(check.state)}>{check.state}</OpsStatusPill>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                Next action
              </p>
              <p className="mt-1 text-sm leading-5.5 text-sub">{check.nextAction}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
