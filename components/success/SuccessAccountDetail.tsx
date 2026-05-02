"use client";

import { useState } from "react";
import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { SuccessActivationRail } from "@/components/success/SuccessActivationRail";
import { SuccessSignalPanel } from "@/components/success/SuccessSignalPanel";
import { SuccessTaskPanel } from "@/components/success/SuccessTaskPanel";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessAccountDetail } from "@/types/entities/success";

export function SuccessAccountDetail({
  detail,
  onRefresh,
}: {
  detail: AdminSuccessAccountDetail;
  onRefresh: () => Promise<void>;
}) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote() {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/success/accounts/${detail.accountId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: noteTitle,
          body: noteBody,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to add success note.");
      }

      setNoteTitle("");
      setNoteBody("");
      await onRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to add success note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <OpsPanel
        eyebrow="Account command read"
        title="Pressure and next move"
        description="Use this short read before you start adding notes or tasks so the account story is obvious at a glance."
        tone="accent"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <OpsSnapshotRow
            label="Now"
            value={detail.blockers[0] ?? "No dominant blocker is active right now."}
          />
          <OpsSnapshotRow
            label="Next"
            value={detail.nextBestActionLabel ?? "Continue workspace activation"}
          />
          <OpsSnapshotRow
            label="Watch"
            value={
              detail.successHealthState === "expansion_ready"
                ? "Expansion pressure is building"
                : detail.successHealthState === "churn_risk"
                  ? "Keep churn posture under watch"
                  : "No severe success drift is visible"
            }
          />
        </div>
      </OpsPanel>

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetricCard label="Workspace" value={detail.accountName} emphasis="primary" />
        <OpsMetricCard
          label="Workspace health"
          value={humanizeSuccessValue(detail.workspaceHealthState)}
          emphasis={detail.workspaceHealthState === "stalled" ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Success health"
          value={humanizeSuccessValue(detail.successHealthState)}
          emphasis={detail.successHealthState === "expansion_ready" ? "primary" : detail.successHealthState === "churn_risk" ? "warning" : "default"}
        />
        <OpsMetricCard label="Projects" value={detail.projectCount} />
      </div>

      <SuccessActivationRail
        summary={detail}
        eyebrow="Workspace activation"
        title="Activation and expansion posture"
        description="The success rail should make both the missing setup steps and the commercial upside obvious."
      />

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <OpsPanel
          eyebrow="Workspace detail"
          title="Current posture"
          description="This drilldown keeps the important context in one place before you open billing, support or project surfaces."
        >
          <div className="grid gap-3">
            <OpsSnapshotRow label="Plan" value={detail.billingPlanId ?? "Free"} />
            <OpsSnapshotRow label="Billing status" value={humanizeSuccessValue(detail.billingStatus)} />
            <OpsSnapshotRow label="Next move" value={detail.nextBestActionLabel ?? "Continue"} />
            <OpsSnapshotRow
              label="Last member activity"
              value={detail.lastMemberActivityAt ? new Date(detail.lastMemberActivityAt).toLocaleString() : "No live member activity yet"}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <OpsMetricCard label="Campaigns" value={detail.activeCampaignCount} />
            <OpsMetricCard label="Providers" value={detail.providerCount} />
            <OpsMetricCard label="Billable seats" value={detail.billableSeatCount} />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Linked member posture"
          title="Primary owner health"
          description="This is the member-side read of the same workspace activation story."
          action={
            detail.memberState ? (
              <OpsStatusPill tone={detail.memberState.memberHealthState === "reactivation_needed" ? "warning" : detail.memberState.memberHealthState === "active" ? "success" : "default"}>
                {humanizeSuccessValue(detail.memberState.memberHealthState)}
              </OpsStatusPill>
            ) : null
          }
        >
          {detail.memberState ? (
            <div className="grid gap-3">
              <OpsSnapshotRow label="Lane" value={humanizeSuccessValue(detail.memberState.activationLane)} />
              <OpsSnapshotRow
                label="Next member move"
                value={detail.memberState.nextBestActionLabel ?? "Open community"}
              />
              <OpsSnapshotRow
                label="Member blockers"
                value={
                  detail.memberState.blockers.length
                    ? detail.memberState.blockers.join(" / ")
                    : "No member blockers open."
                }
              />
            </div>
          ) : (
            <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4 text-sm text-sub">
              No linked member activation state found for the primary owner yet.
            </div>
          )}
        </OpsPanel>
      </div>

      <SuccessSignalPanel signals={detail.signals} />

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <OpsPanel
          eyebrow="Notes"
          title="Internal CS notes"
          description="Keep account narrative, blockers and follow-up context inside the workspace record."
        >
          <div className="grid gap-2.5">
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Note title"
              className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text outline-none transition focus:border-primary/40"
            />
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="What matters about this account right now?"
              rows={3}
              className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] leading-5 text-text outline-none transition focus:border-primary/40"
            />
            <button
              type="button"
              onClick={() => void addNote()}
              disabled={saving || !noteTitle.trim() || !noteBody.trim()}
              className="inline-flex w-fit items-center rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add note"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-500/[0.055] px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-4 space-y-2.5">
            {detail.notes.length ? (
              detail.notes.map((note) => (
                <div key={note.id} className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-text">{note.title}</p>
                    <OpsStatusPill>{humanizeSuccessValue(note.noteType)}</OpsStatusPill>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-5 text-sub">{note.body}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-3.5 text-[13px] text-sub">
                No internal CS notes yet.
              </div>
            )}
          </div>
        </OpsPanel>

        <SuccessTaskPanel accountId={detail.accountId} tasks={detail.tasks} onTaskChanged={onRefresh} />
      </div>

      <OpsPriorityLink
        href={detail.nextBestActionRoute ?? "/account"}
        title={detail.nextBestActionLabel ?? "Continue workspace activation"}
        body={detail.blockers[0] ?? "This workspace is clear enough to keep moving through the next product surface."}
        cta="Open next move"
        emphasis
      />
    </div>
  );
}
