"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ModerationPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const approveSubmission = useAdminPortalStore((s) => s.approveSubmission);
  const rejectSubmission = useAdminPortalStore((s) => s.rejectSubmission);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Moderation Queue
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Proof Reviews</h1>
          <p className="mt-2 text-sm text-sub">
            Review quest proofs and approve or reject submissions.
          </p>
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