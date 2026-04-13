"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminAuditLog } from "@/types/entities/audit-log";
import { AdminVerificationResult } from "@/types/entities/verification-result";
import { DbVerificationResult } from "@/types/database";

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
  const [verificationResult, setVerificationResult] = useState<AdminVerificationResult | null>(null);

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

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadVerificationResult() {
      const { data, error } = await supabase
        .from("verification_results")
        .select("*")
        .eq("source_table", "quest_submissions")
        .eq("source_id", currentSubmission.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Verification result load failed:", error.message);
        if (active) {
          setVerificationResult(null);
        }
        return;
      }

      if (!active || !data) {
        if (active) {
          setVerificationResult(null);
        }
        return;
      }

      const row = data as DbVerificationResult;
      setVerificationResult({
        id: row.id,
        authUserId: row.auth_user_id ?? undefined,
        projectId: row.project_id ?? undefined,
        questId: row.quest_id ?? undefined,
        sourceTable: row.source_table,
        sourceId: row.source_id,
        verificationType: row.verification_type,
        route: row.route,
        decisionStatus: row.decision_status,
        decisionReason: row.decision_reason,
        confidenceScore: row.confidence_score,
        requiredConfigKeys: row.required_config_keys ?? [],
        missingConfigKeys: row.missing_config_keys ?? [],
        duplicateSignalTypes: row.duplicate_signal_types ?? [],
        metadata: row.metadata ? JSON.stringify(row.metadata, null, 2) : undefined,
        createdAt: row.created_at,
      });
    }

    loadVerificationResult();

    return () => {
      active = false;
    };
  }, [currentSubmission.id]);

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
        <DetailHero
          eyebrow="Submission Review"
          title={currentSubmission.questTitle}
          description="Review the proof, the automation route and any linked flags before moving this submission forward."
          badges={
            <>
              <DetailBadge>{currentSubmission.username}</DetailBadge>
              <DetailBadge>{currentSubmission.campaignTitle}</DetailBadge>
              <DetailBadge tone={user?.status === "flagged" ? "danger" : "default"}>{riskLabel}</DetailBadge>
              <DetailBadge tone={currentSubmission.status === "approved" ? "primary" : currentSubmission.status === "rejected" ? "danger" : "warning"}>
                {currentSubmission.status}
              </DetailBadge>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="User" value={currentSubmission.username} hint="Contributor currently under review." />
              <DetailMetricCard label="Quest" value={currentSubmission.questTitle} hint="Task the contributor attempted to complete." />
              <DetailMetricCard label="Campaign" value={currentSubmission.campaignTitle} hint="Campaign this submission routes into." />
              <DetailMetricCard label="Decision" value={decisionLabel} hint="Current automation or moderation posture." />
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DetailSurface
            title="Decision Context"
            description={decisionReason}
          >
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <DecisionCard
                label="Automation Route"
                value={verificationResult?.route.replace(/_/g, " ") || decisionLabel}
                tone={currentSubmission.status === "approved" ? "ready" : "review"}
              />
              <DecisionCard
                label="Risk Profile"
                value={riskLabel}
                tone={user?.status === "flagged" ? "danger" : "ready"}
              />
            </div>

            {verificationResult ? (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Verification Result
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <DecisionCard
                    label="Verification Type"
                    value={verificationResult.verificationType.replace(/_/g, " ")}
                    tone="ready"
                  />
                  <DecisionCard
                    label="Confidence"
                    value={`${verificationResult.confidenceScore}%`}
                    tone={
                      verificationResult.confidenceScore >= 80
                        ? "ready"
                        : verificationResult.confidenceScore >= 50
                          ? "review"
                          : "danger"
                    }
                  />
                </div>
                <p className="mt-4 text-sm text-sub">{verificationResult.decisionReason}</p>
                <div className="mt-4 space-y-3">
                  <DetailMetaRow
                    label="Required Config"
                    value={
                      verificationResult.requiredConfigKeys.length
                        ? verificationResult.requiredConfigKeys.join(", ")
                        : "No required keys"
                    }
                  />
                  <DetailMetaRow
                    label="Missing Config"
                    value={
                      verificationResult.missingConfigKeys.length
                        ? verificationResult.missingConfigKeys.join(", ")
                        : "None"
                    }
                  />
                  <DetailMetaRow
                    label="Duplicate Signals"
                    value={
                      verificationResult.duplicateSignalTypes.length
                        ? verificationResult.duplicateSignalTypes.join(", ")
                        : "None"
                    }
                  />
                </div>
                {verificationResult.metadata ? (
                  <pre className="mt-4 whitespace-pre-wrap break-all rounded-2xl border border-line bg-card px-4 py-3 text-xs text-sub">
                    {verificationResult.metadata}
                  </pre>
                ) : null}
              </div>
            ) : null}

            {linkedFlags.length > 0 ? (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Linked Flags
                </p>
                <div className="mt-3 space-y-3">
                  {linkedFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <DetailBadge>{flag.flagType.replace(/_/g, " ")}</DetailBadge>
                        <DetailBadge tone="warning">{flag.severity}</DetailBadge>
                        <DetailBadge>{flag.status}</DetailBadge>
                      </div>
                      <p className="mt-3 text-sm text-sub">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </DetailSurface>

          <DetailSurface
            title="Moderation Actions"
            description="Use these actions after checking both the proof and the automation context."
          >
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
          </DetailSurface>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <DetailSurface
            title="Proof"
            description="Review the submitted proof carefully before you confirm or reject the task."
          >
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
          </DetailSurface>

          <div className="space-y-6">
            <DetailSidebarSurface title="Submission Data">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Submission ID" value={currentSubmission.id} />
                <DetailMetaRow label="User ID" value={currentSubmission.userId || "-"} />
                <DetailMetaRow label="Quest ID" value={currentSubmission.questId} />
                <DetailMetaRow label="Campaign ID" value={currentSubmission.campaignId} />
                <DetailMetaRow label="Submitted At" value={formatDate(currentSubmission.submittedAt)} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Audit Trail">
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
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
