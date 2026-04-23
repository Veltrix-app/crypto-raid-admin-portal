"use client";

import { useState } from "react";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminDataAccessRequest } from "@/types/entities/security";

function statusTone(status: AdminDataAccessRequest["status"]) {
  switch (status) {
    case "rejected":
      return "danger";
    case "approved":
    case "completed":
      return "success";
    case "submitted":
    case "in_review":
    case "awaiting_verification":
      return "warning";
  }
}

export function DataRequestPanel({
  requests,
  onCreate,
}: {
  requests: AdminDataAccessRequest[];
  onCreate: (input: { requestType: "export" | "delete"; summary: string }) => Promise<void> | void;
}) {
  const [requestType, setRequestType] = useState<"export" | "delete">("export");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!summary.trim() || saving) {
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        requestType,
        summary,
      });
      setSummary("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Data lifecycle"
      title="Export and delete requests"
      description="Raise a reviewed export or delete request instead of relying on ad-hoc support notes."
    >
      <form onSubmit={handleSubmit} className="rounded-[22px] border border-line bg-card2 p-4">
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_140px]">
          <select
            value={requestType}
            onChange={(event) => setRequestType(event.target.value as "export" | "delete")}
            className="rounded-[18px] border border-line bg-black/20 px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="export">Data export</option>
            <option value="delete">Delete request</option>
          </select>
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="What should Veltrix export or review for deletion?"
            className="rounded-[18px] border border-line bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-[18px] bg-primary px-4 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {requests.length ? (
          requests.map((request) => (
            <div key={request.id} className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text">{formatSecurityLabel(request.requestType)}</p>
                    <OpsStatusPill tone={statusTone(request.status)}>
                      {formatSecurityLabel(request.status)}
                    </OpsStatusPill>
                    <OpsStatusPill>{formatSecurityLabel(request.verificationState)}</OpsStatusPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sub">{request.summary}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <InlineEmptyNotice
            title="No data requests yet"
            description="Submitted export and delete requests will appear here with their current review state."
          />
        )}
      </div>
    </OpsPanel>
  );
}
