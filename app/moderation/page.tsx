"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ModerationPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const approveSubmission = useAdminPortalStore((s) => s.approveSubmission);
  const rejectSubmission = useAdminPortalStore((s) => s.rejectSubmission);
  const updateReviewFlagStatus = useAdminPortalStore((s) => s.updateReviewFlagStatus);

  const openFlags = reviewFlags.filter((flag) => flag.status === "open");

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Moderation Queue
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Proof Reviews</h1>
          <p className="mt-2 text-sm text-sub">
            Review quest proofs, investigate suspicious behavior and resolve flagged cases from one queue.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard
            label="Pending Submissions"
            value={submissions.filter((submission) => submission.status === "pending").length}
          />
          <InfoCard label="Open Flags" value={openFlags.length} />
          <InfoCard
            label="High Severity"
            value={openFlags.filter((flag) => flag.severity === "high").length}
          />
          <InfoCard
            label="Resolved Flags"
            value={reviewFlags.filter((flag) => flag.status === "resolved").length}
          />
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Review Flags
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-text">
                Suspicious behavior and trust alerts
              </h2>
            </div>
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {openFlags.length}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {openFlags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-2xl border border-line bg-card2 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-text">
                        {flag.username || "Unknown User"}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          flag.severity === "high"
                            ? "bg-rose-500/15 text-rose-300"
                            : flag.severity === "medium"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-card text-sub"
                        }`}
                      >
                        {flag.severity}
                      </span>
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                        {flag.flagType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-sub">{flag.reason}</p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <DetailRow label="Source" value={flag.sourceTable} />
                      <DetailRow label="Source ID" value={flag.sourceId} />
                      <DetailRow label="Created" value={formatDate(flag.createdAt)} />
                    </div>

                    {flag.metadata ? (
                      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Metadata
                        </p>
                        <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                          {flag.metadata}
                        </pre>
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

            {openFlags.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card2 p-6 text-sm text-sub">
                No open review flags right now.
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-[24px] border border-line bg-card p-5"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-extrabold text-text">
                      {submission.username}
                    </p>
                    <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs capitalize text-sub">
                      {submission.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-sub">
                    Quest: {submission.questTitle} • Campaign: {submission.campaignTitle}
                  </p>

                  <div className="mt-4 rounded-2xl border border-line bg-card2 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      Proof
                    </p>
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

          {submissions.length === 0 ? (
            <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
              No submissions yet.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
