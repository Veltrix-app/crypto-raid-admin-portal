"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import {
  commercialLeadStateOptions,
  humanizeCommercialLabel,
  leadStateTone,
  sourceTone,
} from "@/lib/growth/growth-contract";
import type { AdminCommercialLeadState, AdminGrowthLeadDetail } from "@/types/entities/growth-sales";

export function LeadDetailPanel({
  detail,
  saving,
  onSave,
}: {
  detail: AdminGrowthLeadDetail;
  saving: boolean;
  onSave: (input: {
    leadState: AdminCommercialLeadState;
    qualificationSummary: string;
    intentSummary: string;
  }) => Promise<void>;
}) {
  const [leadState, setLeadState] = useState(detail.leadState);
  const [qualificationSummary, setQualificationSummary] = useState(detail.qualificationSummary);
  const [intentSummary, setIntentSummary] = useState(detail.intentSummary);

  useEffect(() => {
    setLeadState(detail.leadState);
    setQualificationSummary(detail.qualificationSummary);
    setIntentSummary(detail.intentSummary);
  }, [detail]);

  return (
    <OpsPanel
      eyebrow="Lead detail"
      title={detail.companyName || detail.contactName || detail.contactEmail}
      description="Keep the commercial narrative, qualification posture and next buyer move on the lead itself."
      tone="accent"
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <OpsSnapshotRow
          label="Now"
          value={detail.intentSummary || "No intent summary captured yet."}
        />
        <OpsSnapshotRow
          label="Next"
          value={
            detail.tasks.some((task) => task.status !== "resolved" && task.status !== "canceled")
              ? "Clear the next open follow-up task"
              : "Advance qualification and commercial narrative"
          }
        />
        <OpsSnapshotRow
          label="Watch"
          value={
            detail.latestEnterpriseRequest
              ? "Enterprise requirements are already in play"
              : detail.latestDemoRequest
                ? "Demo intent is active"
                : "No structured buyer request captured yet"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-3">
          <OpsSnapshotRow label="Contact" value={`${detail.contactName} | ${detail.contactEmail}`} />
          <OpsSnapshotRow label="Company domain" value={detail.companyDomain ?? "Not captured"} />
          <OpsSnapshotRow label="Latest signal" value={detail.lastSignalAt ?? "No signal timestamp"} />
          <OpsSnapshotRow label="Linked account" value={detail.accountName ?? "Not linked yet"} />
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone={leadStateTone(detail.leadState)}>
                {humanizeCommercialLabel(detail.leadState)}
              </OpsStatusPill>
              <OpsStatusPill tone={sourceTone(detail.source)}>
                {humanizeCommercialLabel(detail.source)}
              </OpsStatusPill>
            </div>
            {detail.accountName && detail.linkedCustomerAccountId ? (
              <Link
                href={`/business/accounts/${detail.linkedCustomerAccountId}`}
                className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-primary"
              >
                Open linked account
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Lead state
            <select
              value={leadState}
              onChange={(event) => setLeadState(event.target.value as AdminCommercialLeadState)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-sm text-text outline-none transition focus:border-primary/35"
            >
              {commercialLeadStateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Qualification summary
            <textarea
              value={qualificationSummary}
              onChange={(event) => setQualificationSummary(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-[22px] border border-line bg-card px-3 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary/35"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Intent summary
            <textarea
              value={intentSummary}
              onChange={(event) => setIntentSummary(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-[22px] border border-line bg-card px-3 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary/35"
            />
          </label>

          <button
            type="button"
            onClick={() => void onSave({ leadState, qualificationSummary, intentSummary })}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save lead posture"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RequestCard
          title="Latest demo request"
          body={
            detail.latestDemoRequest
              ? `${detail.latestDemoRequest.useCase} | ${detail.latestDemoRequest.urgency}`
              : "No demo request captured yet."
          }
        />
        <RequestCard
          title="Latest enterprise intake"
          body={
            detail.latestEnterpriseRequest
              ? `${detail.latestEnterpriseRequest.requirementSummary} | ${detail.latestEnterpriseRequest.urgency}`
              : "No enterprise intake captured yet."
          }
        />
      </div>
    </OpsPanel>
  );
}

function RequestCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{body}</p>
    </div>
  );
}
