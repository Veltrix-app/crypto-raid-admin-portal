"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { DbAuditLog, DbTrustSnapshot } from "@/types/database";

type TrustAlert = {
  id: string;
  authUserId: string;
  username: string;
  score: number;
  createdAt: string;
  reasons: Record<string, unknown>;
};

export default function ModerationPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const users = useAdminPortalStore((s) => s.users);
  const approveSubmission = useAdminPortalStore((s) => s.approveSubmission);
  const rejectSubmission = useAdminPortalStore((s) => s.rejectSubmission);
  const updateReviewFlagStatus = useAdminPortalStore((s) => s.updateReviewFlagStatus);
  const applyTrustAction = useAdminPortalStore((s) => s.applyTrustAction);
  const [callbackFailures, setCallbackFailures] = useState<DbAuditLog[]>([]);
  const [onchainFailures, setOnchainFailures] = useState<DbAuditLog[]>([]);
  const [trustAlerts, setTrustAlerts] = useState<TrustAlert[]>([]);
  const [activeTrustActionKey, setActiveTrustActionKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [flagSeverity, setFlagSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [submissionStatus, setSubmissionStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadOpsFailures() {
      const [
        { data: callbackRows, error: callbackError },
        { data: onchainRows, error: onchainError },
        { data: trustRows, error: trustError },
      ] =
        await Promise.all([
          supabase
            .from("admin_audit_logs")
            .select("*")
            .eq("action", "verification_callback_failed")
            .order("created_at", { ascending: false })
            .limit(12),
          supabase
            .from("admin_audit_logs")
            .select("*")
            .in("action", ["onchain_ingress_rejected", "onchain_ingress_failed"])
            .order("created_at", { ascending: false })
            .limit(12),
          supabase
            .from("trust_snapshots")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(24),
        ]);

      if (!active) {
        return;
      }

      if (callbackError) {
        console.error("[moderation] callback failures load failed", callbackError.message);
      } else {
        setCallbackFailures((callbackRows ?? []) as DbAuditLog[]);
      }

      if (onchainError) {
        console.error("[moderation] onchain failures load failed", onchainError.message);
      } else {
        setOnchainFailures((onchainRows ?? []) as DbAuditLog[]);
      }

      if (trustError) {
        console.error("[moderation] trust snapshots load failed", trustError.message);
      } else {
        const usernamesByAuthUserId = new Map(
          users
            .filter((user) => user.authUserId)
            .map((user) => [user.authUserId as string, user.username])
        );
        const alerts = ((trustRows ?? []) as DbTrustSnapshot[])
          .filter((snapshot) => {
            const reasons =
              snapshot.reasons && typeof snapshot.reasons === "object" ? snapshot.reasons : {};
            const suspiciousFlags = Array.isArray((reasons as { suspiciousFlags?: unknown[] }).suspiciousFlags)
              ? ((reasons as { suspiciousFlags?: unknown[] }).suspiciousFlags ?? [])
              : [];
            return snapshot.score <= 45 || suspiciousFlags.length > 0;
          })
          .slice(0, 12)
          .map((snapshot) => ({
            id: snapshot.id,
            authUserId: snapshot.auth_user_id,
            username: usernamesByAuthUserId.get(snapshot.auth_user_id) ?? "Unknown user",
            score: snapshot.score,
            createdAt: snapshot.created_at,
            reasons: snapshot.reasons ?? {},
          }));
        setTrustAlerts(alerts);
      }
    }

    void loadOpsFailures();

    return () => {
      active = false;
    };
  }, [users]);

  const openFlags = reviewFlags.filter((flag) => flag.status === "open");
  const trustReviewFlags = openFlags.filter((flag) =>
    ["low_trust_posture", "watch_trust_posture", "wallet_watch_label", "low_value_transfer_spam", "low_value_transfer_pattern", "onchain_daily_cap_reached", "onchain_event_type_cap_reached", "exit_pattern", "no_social_proof", "fresh_wallet_activity"].includes(flag.flagType)
  );
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

  const filteredCallbackFailures = useMemo(() => {
    const term = search.toLowerCase();
    return callbackFailures.filter((failure) => {
      const haystack = [
        failure.summary,
        failure.source_id,
        failure.action,
        JSON.stringify(failure.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [callbackFailures, search]);

  const filteredOnchainFailures = useMemo(() => {
    const term = search.toLowerCase();
    return onchainFailures.filter((failure) => {
      const haystack = [
        failure.summary,
        failure.source_id,
        failure.action,
        JSON.stringify(failure.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [onchainFailures, search]);

  const filteredTrustAlerts = useMemo(() => {
    const term = search.toLowerCase();
    return trustAlerts.filter((alert) => {
      const haystack = [alert.username, String(alert.score), JSON.stringify(alert.reasons)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [trustAlerts, search]);

  async function handleTrustAction(input: {
    key: string;
    authUserId: string;
    action: "watch_wallet" | "clear_watch" | "flag_user" | "restore_user";
    projectId?: string;
    reviewFlagId?: string;
    reason: string;
  }) {
    try {
      setActiveTrustActionKey(input.key);
      await applyTrustAction({
        authUserId: input.authUserId,
        action: input.action,
        projectId: input.projectId,
        reviewFlagId: input.reviewFlagId,
        reason: input.reason,
      });
    } finally {
      setActiveTrustActionKey(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Moderation Queue"
          title="Proof Reviews"
          description="Review quest proofs, investigate suspicious behavior and resolve flagged cases from one queue."
        />

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          <OpsMetricCard
            label="Callback failures"
            value={callbackFailures.length}
            emphasis={callbackFailures.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Onchain failures"
            value={onchainFailures.length}
            emphasis={onchainFailures.length > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Trust drift"
            value={trustAlerts.length}
            emphasis={trustAlerts.length > 0 ? "warning" : "default"}
          />
        </div>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search user, quest, flag type or reason…"
            ariaLabel="Search moderation queue"
            name="moderation-search"
          />
          <OpsSelect
            value={flagSeverity}
            onChange={(value) => setFlagSeverity(value as "all" | "high" | "medium" | "low")}
            ariaLabel="Filter review flags by severity"
            name="moderation-severity"
          >
            <option value="all">all severities</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </OpsSelect>
          <OpsSelect
            value={submissionStatus}
            onChange={(value) => setSubmissionStatus(value as "all" | "pending" | "approved" | "rejected")}
            ariaLabel="Filter submissions by moderation status"
            name="moderation-status"
          >
            <option value="pending">pending submissions</option>
            <option value="all">all submissions</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </OpsSelect>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Trust drift"
          title="Low-trust posture and suspicious velocity"
          description="Latest trust snapshots that slipped into the watch band or carried suspicious on-chain reasons."
          action={
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {trustAlerts.length}
            </div>
          }
          tone="accent"
        >
          <div className="grid gap-4">
            {filteredTrustAlerts.map((alert) => (
              <div key={alert.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-text">{alert.username}</p>
                      <OpsStatusPill tone={alert.score <= 35 ? "danger" : "warning"}>
                        trust {alert.score}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-sub">
                      This snapshot crossed the trust watch threshold or landed with suspicious on-chain reasons that deserve operator review.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <DetailRow label="Auth user" value={alert.authUserId} />
                      <DetailRow label="Captured" value={formatDate(alert.createdAt)} />
                      <DetailRow label="Flags" value={Array.isArray((alert.reasons as { suspiciousFlags?: unknown[] }).suspiciousFlags) ? (((alert.reasons as { suspiciousFlags?: unknown[] }).suspiciousFlags ?? []).length) : 0} />
                    </div>
                    <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Reasons</p>
                      <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                        {JSON.stringify(alert.reasons, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          handleTrustAction({
                            key: `${alert.id}:watch`,
                            authUserId: alert.authUserId,
                            action: "watch_wallet",
                            reason: "Applied from trust drift moderation panel.",
                          })
                        }
                        disabled={activeTrustActionKey === `${alert.id}:watch`}
                        className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-bold text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Place wallet on watch
                      </button>
                      <button
                        onClick={() =>
                          handleTrustAction({
                            key: `${alert.id}:flag`,
                            authUserId: alert.authUserId,
                            action: "flag_user",
                            reason: "Contributor flagged from trust drift moderation panel.",
                          })
                        }
                        disabled={activeTrustActionKey === `${alert.id}:flag`}
                        className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Flag contributor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredTrustAlerts.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                No trust drift signals match the current moderation filters.
              </div>
            ) : null}
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Review Flags"
          title="Suspicious behavior and trust alerts"
          description="Duplicate identities, suspicious proof and elevated-risk users land here first."
          action={
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {trustReviewFlags.length} / {openFlags.length}
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
                    {flag.authUserId && isTrustFlag(flag.flagType) ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            handleTrustAction({
                              key: `${flag.id}:watch`,
                              authUserId: flag.authUserId!,
                              projectId: flag.projectId,
                              reviewFlagId: flag.id,
                              action: "watch_wallet",
                              reason: `Applied from review flag ${flag.flagType}.`,
                            })
                          }
                          disabled={activeTrustActionKey === `${flag.id}:watch`}
                          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-bold text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Watch wallet
                        </button>
                        <button
                          onClick={() =>
                            handleTrustAction({
                              key: `${flag.id}:flag`,
                              authUserId: flag.authUserId!,
                              projectId: flag.projectId,
                              reviewFlagId: flag.id,
                              action: "flag_user",
                              reason: `Contributor flagged from review flag ${flag.flagType}.`,
                            })
                          }
                          disabled={activeTrustActionKey === `${flag.id}:flag`}
                          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Flag contributor
                        </button>
                        <button
                          onClick={() =>
                            handleTrustAction({
                              key: `${flag.id}:clear`,
                              authUserId: flag.authUserId!,
                              projectId: flag.projectId,
                              reviewFlagId: flag.id,
                              action: "clear_watch",
                              reason: `Wallet watch cleared from review flag ${flag.flagType}.`,
                            })
                          }
                          disabled={activeTrustActionKey === `${flag.id}:clear`}
                          className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Clear watch
                        </button>
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
          eyebrow="Callback failures"
          title="Verification callback incidents"
          description="These are provider verifications that cleared at the bot/runtime layer but failed to confirm back into the portal."
          action={
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {callbackFailures.length}
            </div>
          }
          tone="accent"
        >
          <div className="grid gap-4">
            {filteredCallbackFailures.map((failure) => (
              <div key={failure.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-text">Quest verification callback</p>
                      <OpsStatusPill tone="danger">{failure.action.replace(/_/g, " ")}</OpsStatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-sub">{failure.summary}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <DetailRow label="Quest / source" value={failure.source_id} />
                      <DetailRow label="Created" value={formatDate(failure.created_at)} />
                      <DetailRow
                        label="Provider"
                        value={String((failure.metadata?.provider as string | undefined) ?? "-")}
                      />
                    </div>
                    {failure.metadata ? (
                      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Metadata</p>
                        <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                          {JSON.stringify(failure.metadata, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {filteredCallbackFailures.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                No callback failures match the current moderation filters.
              </div>
            ) : null}
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="On-chain intake"
          title="Rejected or failed on-chain ingestion"
          description="These rows show why chain activity was rejected before it could become XP or why normalization/storage failed."
          action={
            <div className="rounded-full border border-line bg-card2 px-4 py-2 text-sm font-bold text-text">
              {onchainFailures.length}
            </div>
          }
          tone="accent"
        >
          <div className="grid gap-4">
            {filteredOnchainFailures.map((failure) => (
              <div key={failure.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-text">On-chain intake</p>
                      <OpsStatusPill tone={failure.action === "onchain_ingress_failed" ? "danger" : "warning"}>
                        {failure.action.replace(/_/g, " ")}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-sub">{failure.summary}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <DetailRow label="Chain ref" value={failure.source_id} />
                      <DetailRow label="Created" value={formatDate(failure.created_at)} />
                      <DetailRow
                        label="Project"
                        value={failure.project_id ?? "-"}
                      />
                    </div>
                    {failure.metadata ? (
                      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Metadata</p>
                        <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                          {JSON.stringify(failure.metadata, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {filteredOnchainFailures.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                No on-chain intake failures match the current moderation filters.
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

function isTrustFlag(flagType: string) {
  return [
    "low_trust_posture",
    "watch_trust_posture",
    "wallet_watch_label",
    "low_value_transfer_spam",
    "low_value_transfer_pattern",
    "onchain_daily_cap_reached",
    "onchain_event_type_cap_reached",
    "exit_pattern",
    "no_social_proof",
    "fresh_wallet_activity",
  ].includes(flagType);
}
