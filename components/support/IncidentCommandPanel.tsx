"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OpsMetricCard, OpsPanel, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { IncidentStatusComposer } from "@/components/support/IncidentStatusComposer";
import type {
  AdminServiceIncidentDetail,
  AdminServiceIncidentImpactScope,
  AdminServiceIncidentSeverity,
  AdminServiceIncidentSummary,
} from "@/types/entities/support";

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function tone(value: string) {
  switch (value) {
    case "critical":
    case "major_outage":
      return "danger" as const;
    case "major":
    case "partial_outage":
    case "identified":
      return "warning" as const;
    case "resolved":
    case "operational":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export function IncidentCommandPanel({ incidentId }: { incidentId?: string }) {
  const [incidents, setIncidents] = useState<AdminServiceIncidentSummary[]>([]);
  const [incident, setIncident] = useState<AdminServiceIncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    title: "",
    componentKey: "platform",
    severity: "major" as AdminServiceIncidentSeverity,
    impactScope: "degraded" as AdminServiceIncidentImpactScope,
    publicSummary: "",
    internalSummary: "",
  });

  async function load() {
    try {
      setLoading(true);
      setError(null);

      if (incidentId) {
        const response = await fetch(`/api/support/incidents/${incidentId}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; incident?: AdminServiceIncidentDetail; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.incident) {
          throw new Error(payload?.error ?? "Failed to load incident.");
        }

        setIncident(payload.incident);
      } else {
        const response = await fetch("/api/support/incidents?includeResolved=true", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; incidents?: AdminServiceIncidentSummary[]; error?: string }
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load incidents.");
        }

        setIncidents(payload.incidents ?? []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [incidentId]);

  if (incidentId) {
    return (
      <OpsPanel
        eyebrow="Incident command"
        title={incident?.title ?? "Incident detail"}
        description="Declare, update and resolve service incidents from one bounded command surface with both public and internal timelines."
      >
        {loading ? (
          <div className="rounded-[20px] border border-line bg-card2 px-3.5 py-4 text-[13px] text-sub">
            Loading incident command...
          </div>
        ) : error ? (
          <div className="rounded-[20px] border border-rose-400/20 bg-rose-500/10 px-3.5 py-4 text-[13px] text-rose-200">
            {error}
          </div>
        ) : incident ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <OpsMetricCard label="Severity" value={incident.severity} emphasis={tone(incident.severity) === "danger" || tone(incident.severity) === "warning" ? "warning" : "default"} />
              <OpsMetricCard label="State" value={incident.state} emphasis={incident.state === "resolved" ? "primary" : "default"} />
              <OpsMetricCard label="Impact" value={humanize(incident.impactScope)} emphasis={tone(incident.impactScope) === "warning" || tone(incident.impactScope) === "danger" ? "warning" : "default"} />
              <OpsMetricCard label="Updates" value={incident.updates.length} />
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Incident command read
                </p>
                <p className="mt-1.5 text-[13px] leading-5 text-sub">
                  Use this short read before posting updates so severity, impact and the next operator move stay obvious.
                </p>
              </div>
              <div className="mt-3.5 grid gap-3 md:grid-cols-3">
                <OpsSnapshotRow label="Now" value={incident.publicSummary} />
                <OpsSnapshotRow label="Next" value={incident.state === "resolved" ? "Keep the timeline consistent and close the loop" : "Publish the next internal and public status update"} />
                <OpsSnapshotRow label="Watch" value={incident.updates.length > 0 ? `${incident.updates.length} timeline updates already shape the incident narrative` : "No incident updates have been posted yet"} />
              </div>
            </div>

            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {incident.incidentRef} · {incident.componentLabel}
                  </p>
                  <h2 className="mt-2.5 text-[1.15rem] font-extrabold text-text">{incident.title}</h2>
                  <p className="mt-2.5 text-[13px] leading-5 text-sub">{incident.publicSummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={tone(incident.severity)}>{incident.severity}</OpsStatusPill>
                  <OpsStatusPill tone={tone(incident.state)}>{incident.state}</OpsStatusPill>
                  <OpsStatusPill tone={tone(incident.impactScope)}>{humanize(incident.impactScope)}</OpsStatusPill>
                </div>
              </div>
            </div>

            <IncidentStatusComposer
              busy={busy}
              onSubmit={async (payload) => {
                try {
                  setBusy(true);
                  setError(null);
                  const response = await fetch(`/api/support/incidents/${incidentId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const result = (await response.json().catch(() => null)) as
                    | { ok?: boolean; incident?: AdminServiceIncidentDetail; error?: string }
                    | null;

                  if (!response.ok || !result?.ok || !result.incident) {
                    throw new Error(result?.error ?? "Failed to update incident.");
                  }

                  setIncident(result.incident);
                } catch (submitError) {
                  setError(
                    submitError instanceof Error ? submitError.message : "Failed to update incident."
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />

            <div className="space-y-2.5">
              {incident.updates.map((update) => (
                <div key={update.id} className="rounded-[20px] border border-line bg-card2 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-bold text-text">{update.title ?? humanize(update.updateType)}</p>
                      <OpsStatusPill>{update.visibilityScope}</OpsStatusPill>
                      {update.incidentState ? (
                        <OpsStatusPill tone={tone(update.incidentState)}>{update.incidentState}</OpsStatusPill>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-sub">{new Date(update.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-5 text-sub">{update.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-line bg-card2 px-3.5 py-4 text-[13px] text-sub">
            Incident not found.
          </div>
        )}
      </OpsPanel>
    );
  }

  return (
    <OpsPanel
      eyebrow="Incident command"
      title="Declare and route service incidents"
      description="Use this internal control rail when the issue is broader than one ticket and needs a public status timeline."
    >
      {error ? (
        <div className="rounded-[20px] border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            try {
              setBusy(true);
              setError(null);
              const response = await fetch("/api/support/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createDraft),
              });
              const payload = (await response.json().catch(() => null)) as
                | { ok?: boolean; incident?: AdminServiceIncidentDetail; error?: string }
                | null;

              if (!response.ok || !payload?.ok || !payload.incident) {
                throw new Error(payload?.error ?? "Failed to create incident.");
              }

              setCreateDraft({
                title: "",
                componentKey: "platform",
                severity: "major",
                impactScope: "degraded",
                publicSummary: "",
                internalSummary: "",
              });
              await load();
            } catch (submitError) {
              setError(
                submitError instanceof Error ? submitError.message : "Failed to create incident."
              );
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-3.5 rounded-[22px] border border-line bg-card2 p-4"
        >
          <h3 className="text-base font-extrabold text-text">Declare new incident</h3>

          <input
            value={createDraft.title}
            onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Incident title"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={createDraft.componentKey}
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, componentKey: event.target.value }))
              }
              className="rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="platform">Platform</option>
              <option value="auth">Authentication</option>
              <option value="portal">Admin portal</option>
              <option value="member_app">Member app</option>
              <option value="billing">Billing</option>
              <option value="community">Community delivery</option>
              <option value="verification">Verification</option>
              <option value="trust">Trust operations</option>
              <option value="payouts">Payouts</option>
              <option value="onchain">On-chain</option>
            </select>

            <select
              value={createDraft.severity}
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, severity: event.target.value as AdminServiceIncidentSeverity }))
              }
              className="rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={createDraft.impactScope}
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, impactScope: event.target.value as AdminServiceIncidentImpactScope }))
              }
              className="rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="degraded">Degraded</option>
              <option value="partial_outage">Partial outage</option>
              <option value="major_outage">Major outage</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <textarea
            value={createDraft.publicSummary}
            onChange={(event) =>
              setCreateDraft((current) => ({ ...current, publicSummary: event.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Public summary for the status page"
          />

          <textarea
            value={createDraft.internalSummary}
            onChange={(event) =>
              setCreateDraft((current) => ({ ...current, internalSummary: event.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-line bg-card px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Internal summary for operators"
          />

          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-primary/35 bg-primary/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition hover:border-primary/50 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Declaring..." : "Declare incident"}
          </button>
        </form>

        <div className="space-y-2.5">
          {loading ? (
            <div className="rounded-[24px] border border-line bg-card2 px-5 py-6 text-sm text-sub">
              Loading incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-card2 px-3.5 py-4 text-[13px] text-sub">
              No incidents have been declared yet.
            </div>
          ) : (
            incidents.map((item) => (
              <Link
                key={item.id}
                href={`/support/incidents/${item.id}`}
                className="block rounded-[22px] border border-line bg-card2 p-4 transition hover:border-primary/30 hover:bg-primary/8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {item.incidentRef} · {item.componentLabel}
                    </p>
                    <h3 className="mt-2.5 text-[0.98rem] font-extrabold text-text">{item.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-5 text-sub">{item.publicSummary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OpsStatusPill tone={tone(item.severity)}>{item.severity}</OpsStatusPill>
                    <OpsStatusPill tone={tone(item.state)}>{item.state}</OpsStatusPill>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </OpsPanel>
  );
}
