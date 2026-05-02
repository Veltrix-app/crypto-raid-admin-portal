"use client";

import { useState } from "react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { getReleaseGateModeLabel } from "@/lib/release/release-contract";
import { updatePortalRelease } from "@/lib/release/release-dashboard";
import type { AdminReleaseDetail, AdminReleaseRunService } from "@/types/entities/release";

function ServiceRow({
  releaseId,
  service,
  onUpdated,
}: {
  releaseId: string;
  service: AdminReleaseRunService;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const [inclusionStatus, setInclusionStatus] = useState(service.inclusionStatus);
  const [deployStatus, setDeployStatus] = useState(service.deployStatus);
  const [versionLabel, setVersionLabel] = useState(service.versionLabel ?? "");
  const [notes, setNotes] = useState(service.notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const detail = await updatePortalRelease({
        releaseId,
        services: [
          {
            serviceKey: service.serviceKey,
            inclusionStatus,
            deployStatus,
            versionLabel,
            notes,
          },
        ],
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text">{service.serviceKey.replaceAll("_", " ")}</p>
            <OpsStatusPill>{getReleaseGateModeLabel(service.gateMode)}</OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">
            Control whether this surface is in scope, what deploy posture it is in, and which version label belongs to the current release candidate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save service"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <select
          value={inclusionStatus}
          onChange={(event) => setInclusionStatus(event.target.value as typeof inclusionStatus)}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="included">Included</option>
          <option value="not_in_scope">Not in scope</option>
        </select>
        <select
          value={deployStatus}
          onChange={(event) => setDeployStatus(event.target.value as typeof deployStatus)}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
          <option value="deployed">Deployed</option>
          <option value="degraded">Degraded</option>
          <option value="rolled_back">Rolled back</option>
        </select>
        <input
          value={versionLabel}
          onChange={(event) => setVersionLabel(event.target.value)}
          placeholder="Version label"
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function ReleaseServicesPanel({
  releaseId,
  services,
  onUpdated,
}: {
  releaseId: string;
  services: AdminReleaseRunService[];
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Services"
      title="Release scope and deploy posture"
      description="Keep the service scope explicit so webapp, portal, docs and the community bot all have a recorded release posture."
    >
      <div className="space-y-3">
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            releaseId={releaseId}
            service={service}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </OpsPanel>
  );
}

