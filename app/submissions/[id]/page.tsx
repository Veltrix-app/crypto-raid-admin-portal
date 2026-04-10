"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const submissions = useAdminPortalStore((s) => s.submissions);
  const approveSubmission = useAdminPortalStore((s) => s.approveSubmission);
  const rejectSubmission = useAdminPortalStore((s) => s.rejectSubmission);

  const submission = useMemo(
    () => submissions.find((item) => item.id === params.id),
    [submissions, params.id]
  );

  const [working, setWorking] = useState(false);

  if (!submission) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Submission not found</h1>
          <p className="mt-2 text-sm text-sub">
            This submission could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  async function handleApprove() {
    try {
      setWorking(true);
      await approveSubmission(submission.id);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  async function handleReject() {
    try {
      setWorking(true);
      await rejectSubmission(submission.id);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  const proofLooksLikeUrl =
    submission.proof.startsWith("http://") || submission.proof.startsWith("https://");

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Submission Review
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {submission.questTitle}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{submission.username}</Badge>
              <Badge>{submission.campaignTitle}</Badge>
              <Badge className="capitalize">{submission.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">
              Review the proof and approve or reject this quest submission.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="User" value={submission.username} />
          <InfoCard label="Quest" value={submission.questTitle} />
          <InfoCard label="Campaign" value={submission.campaignTitle} />
          <InfoCard label="Status" value={submission.status} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Proof</h2>
            <p className="mt-2 text-sm text-sub">
              Review the submitted proof carefully before moderating.
            </p>

            <div className="mt-6 rounded-[24px] border border-line bg-card2 p-5">
              {proofLooksLikeUrl ? (
                <a
                  href={submission.proof}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm font-semibold text-primary underline"
                >
                  {submission.proof}
                </a>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-text">
                  {submission.proof}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleApprove}
                disabled={working || submission.status === "approved"}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Approve"}
              </button>

              <button
                onClick={handleReject}
                disabled={working || submission.status === "rejected"}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 disabled:opacity-50"
              >
                {working ? "Working..." : "Reject"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Submission Data</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Submission ID" value={submission.id} />
                <DetailRow label="User ID" value={submission.userId || "-"} />
                <DetailRow label="Quest ID" value={submission.questId} />
                <DetailRow label="Campaign ID" value={submission.campaignId} />
                <DetailRow label="Submitted At" value={formatDate(submission.submittedAt)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Moderation Note</h2>
              <p className="mt-2 text-sm text-sub">
                Reviewer notes can be added in the next schema step. For now,
                moderation changes only update status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold text-text ${className}`}
    >
      {children}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}