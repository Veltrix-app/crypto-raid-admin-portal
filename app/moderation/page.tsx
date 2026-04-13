"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsFilterBar,
  OpsHero,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ModerationPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const approveSubmission = useAdminPortalStore((s) => s.approveSubmission);
  const rejectSubmission = useAdminPortalStore((s) => s.rejectSubmission);
  const updateReviewFlagStatus = useAdminPortalStore((s) => s.updateReviewFlagStatus);
  const [search, setSearch] = useState("");
  const [flagSeverity, setFlagSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [submissionStatus, setSubmissionStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const openFlags = reviewFlags.filter((flag) => flag.status === "open");
  const filteredFlags = useMemo(() => {
    return openFlags.filter((flag) => {
      const term = search.toLowerCase();
      const matchesSearch =
        (flag.username || "").toLowerCase().includes(term) ||
        flag.flagType.toLowerCase().includes(term) ||
        flag.reason.toLowerCase().includes(term);
      const matchesSeverity = flagSeverity === "all" || flag.severity === flagSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [openFlags, search, flagSeverity]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const term = search.toLowerCase();
      const matchesSearch =
        submission.username.toLowerCase().includes(term) ||
        submission.questTitle.toLowerCase().includes(term) ||
        submission.campaignTitle.toLowerCase().includes(term) ||
        submission.proof.toLowerCase().includes(term);
      const matchesStatus = submissionStatus === "all" || submission.status === submissionStatus;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, submissionStatus]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Moderation Queue"
          title="Proof Reviews"
          description="Review quest proofs, investigate suspicious behavior and resolve flagged cases from one queue."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard
            label="Pending submissions"
            value={submissions.filter((submission) => submission.status === "pending").length}
            emphasis={submissions.some((submission) => submission.status === "pending") ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Open flags"
            value={openFlags.length}
            emphasis={openFlags.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="High severity"
            value={openFlags.filter((flag) => flag.severity === "high").length}
            emphasis="warning"
          />
          <OpsMetricCard
            label="Duplicate signals"
            value={openFlags.filter((flag) => ["duplicate_proof", "duplicate_wallet"].includes(flag.flagType)).length}
          />
        </div>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search user, quest, flag type or reason..."
          />
          <OpsSelect
            value={flagSeverity}
            onChange={(value) => setFlagSeverity(value as "all" | "high" | "medium" | "low")}
          >
            <option value="all">all severities</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </OpsSelect>
          <OpsSelect
            value={submissionStatus}
            onChange={(value) => setSubmissionStatus(value as "all" | "pending" | "approved" | "rejected")}
          >
            <option value="pending">pending submissions</option>
            <option value="all">all submissions</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </OpsSelect>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Review Flags"
          title="Suspicious behavior and trust alerts"
          description="Duplicate identities, suspicious proof and elevated-risk users land here first."
          action={
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {openFlags.length}
            </div>
          }
          tone="accent"
        >
          <div className="grid gap-4">
            {filteredFlags.map((flag) => (
              <div key={flag.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-text">{flag.username || "Unknown user"}</p>
                      <OpsStatusPill
                        tone={
                          flag.severity === "high"
                            ? "danger"
                            : flag.severity === "medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {flag.severity}
                      </OpsStatusPill>
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                        {flag.flagType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-sub">{flag.reason}</p>

                    {["duplicate_proof", "duplicate_wallet"].includes(flag.flagType) ? (
                      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                          Duplicate detection
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          This case was escalated automatically because Veltrix detected overlapping proof or wallet identity signals.
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <DetailRow label="Source" value={flag.sourceTable} />
                      <DetailRow label="Source ID" value={flag.sourceId} />
                      <DetailRow label="Created" value={formatDate(flag.createdAt)} />
                    </div>

                    {flag.metadata ? (
                      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Metadata</p>
                        <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">{flag.metadata}</pre>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3">
                    <button
                      onClick={() => updateReviewFlagStatus(flag.id, "resolved")}
                      className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReviewFlagStatus(flag.id, "dismissed")}
                      className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFlags.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card2 p-6 text-sm text-sub">
                No review flags match the current filters.
              </div>
            ) : null}
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Proof queue"
          title="Submission review stream"
          description="Pending proofs stay at the top of the daily queue so reviewers can move quickly."
        >
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-[24px] border border-line bg-card p-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-extrabold text-text">{submission.username}</p>
                      <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs capitalize text-sub">
                        {submission.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-sub">
                      Quest: {submission.questTitle} • Campaign: {submission.campaignTitle}
                    </p>

                    <div className="mt-4 rounded-2xl border border-line bg-card2 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Proof</p>
                      <p className="mt-2 break-all text-sm text-text">{submission.proof}</p>
                    </div>

                    <p className="mt-3 text-xs text-sub">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {submission.status === "pending" ? (
                    <div className="flex shrink-0 flex-col gap-3">
                      <button
                        onClick={() => approveSubmission(submission.id)}
                        className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectSubmission(submission.id)}
                        className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {filteredSubmissions.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                No submissions match the current moderation filters.
              </div>
            ) : null}
          </div>
        </OpsPanel>
      </div>
    </AdminShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
