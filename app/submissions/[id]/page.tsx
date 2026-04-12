"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminAuditLog } from "@/types/entities/audit-log";

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const submissions = useAdminPortalStore((s) => s.submissions);
  const users = useAdminPortalStore((s) => s.users);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const reviewSubmission = useAdminPortalStore((s) => s.reviewSubmission);
  const fetchAuditTrail = useAdminPortalStore((s) => s.fetchAuditTrail);

  const submission = useMemo(
    () => submissions.find((item) => item.id === params.id),
    [submissions, params.id]
  );

  const [working, setWorking] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

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

  const currentSubmission = submission;
  const user = users.find((item) => item.authUserId === currentSubmission.userId);
  const linkedFlags = reviewFlags.filter(
    (flag) => flag.sourceTable === "quest_submissions" && flag.sourceId === currentSubmission.id
  );
  const primaryFlag = linkedFlags[0];
  const riskLabel =
    user?.status === "flagged"
      ? `Watch • Sybil ${user.sybilScore}`
      : `Trust ${user?.trustScore ?? 50}`;
  const decisionLabel =
    primaryFlag?.flagType.replace(/_/g, " ") ??
    (currentSubmission.status === "approved"
      ? "Auto-approved"
      : currentSubmission.status === "pending"
        ? "Manual review"
        : "Validation failed");
  const decisionReason =
    primaryFlag?.reason ??
    (currentSubmission.status === "approved"
      ? "Veltrix approved this submission automatically because it matched the current low-risk verification rules."
      : currentSubmission.status === "pending"
        ? "This submission is waiting for a reviewer because it could not be fully auto-verified."
        : "This submission did not satisfy the current verification requirements.");
  const proofLooksLikeUrl =
    currentSubmission.proof.startsWith("http://") ||
    currentSubmission.proof.startsWith("https://");

  useEffect(() => {
    setReviewNotes(currentSubmission.reviewNotes || "");
  }, [currentSubmission.id, currentSubmission.reviewNotes]);

  useEffect(() => {
    let active = true;

    async function loadAuditTrail() {
      const logs = await fetchAuditTrail("quest_submissions", currentSubmission.id);
      if (active) {
        setAuditLogs(logs);
      }
    }

    loadAuditTrail();

    return () => {
      active = false;
    };
  }, [currentSubmission.id, fetchAuditTrail]);

  async function handleApprove() {
    try {
      setWorking(true);
      await reviewSubmission(currentSubmission.id, "approved", reviewNotes);
      setAuditLogs(await fetchAuditTrail("quest_submissions", currentSubmission.id));
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  async function handleReject() {
    try {
      setWorking(true);
      await reviewSubmission(currentSubmission.id, "rejected", reviewNotes);
      setAuditLogs(await fetchAuditTrail("quest_submissions", currentSubmission.id));
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Submission Review
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {currentSubmission.questTitle}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{currentSubmission.username}</Badge>
              <Badge>{currentSubmission.campaignTitle}</Badge>
              <Badge>{riskLabel}</Badge>
              <Badge className="capitalize">{currentSubmission.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">
              Review the proof and the automation decision before approving or rejecting this quest submission.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="User" value={currentSubmission.username} />
          <InfoCard label="Quest" value={currentSubmission.questTitle} />
          <InfoCard label="Campaign" value={currentSubmission.campaignTitle} />
          <InfoCard label="Decision" value={decisionLabel} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Decision Context</h2>
            <p className="mt-2 text-sm text-sub">{decisionReason}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <DecisionCard
                label="Automation Route"
                value={decisionLabel}
                tone={currentSubmission.status === "approved" ? "ready" : "review"}
              />
              <DecisionCard
                label="Risk Profile"
                value={riskLabel}
                tone={user?.status === "flagged" ? "danger" : "ready"}
              />
            </div>

            {linkedFlags.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-line bg-card2 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Linked Flags
                </p>
                <div className="mt-3 space-y-3">
                  {linkedFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="capitalize">{flag.flagType.replace(/_/g, " ")}</Badge>
                        <Badge className="capitalize">{flag.severity}</Badge>
                        <Badge className="capitalize">{flag.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-sub">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Moderation Actions</h2>
            <p className="mt-2 text-sm text-sub">
              Use these actions after reviewing both the proof and the automation context.
            </p>

            <div className="mt-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text">Reviewer Note</span>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                  placeholder="Capture why you approved, rejected, or escalated this submission."
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleApprove}
                disabled={working || currentSubmission.status === "approved"}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Approve"}
              </button>

              <button
                onClick={handleReject}
                disabled={working || currentSubmission.status === "rejected"}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 disabled:opacity-50"
              >
                {working ? "Working..." : "Reject"}
              </button>
            </div>
          </div>
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
                  href={currentSubmission.proof}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm font-semibold text-primary underline"
                >
                  {currentSubmission.proof}
                </a>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-text">
                  {currentSubmission.proof}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Submission Data</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Submission ID" value={currentSubmission.id} />
                <DetailRow label="User ID" value={currentSubmission.userId || "-"} />
                <DetailRow label="Quest ID" value={currentSubmission.questId} />
                <DetailRow label="Campaign ID" value={currentSubmission.campaignId} />
                <DetailRow label="Submitted At" value={formatDate(currentSubmission.submittedAt)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Audit Trail</h2>
              <div className="mt-4 space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-line bg-card2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold capitalize text-text">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <span className="text-xs text-sub">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-sub">{log.summary}</p>
                    {log.metadata ? (
                      <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                        {log.metadata}
                      </pre>
                    ) : null}
                  </div>
                ))}

                {auditLogs.length === 0 ? (
                  <p className="text-sm text-sub">
                    No audit events stored yet for this submission.
                  </p>
                ) : null}
              </div>
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

function DecisionCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ready" | "review" | "danger";
}) {
  const toneClass =
    tone === "ready"
      ? "bg-primary/15 text-primary"
      : tone === "danger"
        ? "bg-rose-500/15 text-rose-300"
        : "bg-amber-500/15 text-amber-300";

  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <div className="mt-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>
          {value}
        </span>
      </div>
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
