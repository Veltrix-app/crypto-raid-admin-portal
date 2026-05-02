"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SubmissionsPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const users = useAdminPortalStore((s) => s.users);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const router = useRouter();
  const pathname = usePathname() ?? "/submissions";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [submissionsView, setSubmissionsView] = useState<"queue" | "signals">("queue");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
    setStatus(params.get("status") ?? "all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [pathname, router, search, status]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const term = search.toLowerCase();
      const matchesSearch =
        submission.username.toLowerCase().includes(term) ||
        submission.questTitle.toLowerCase().includes(term) ||
        submission.campaignTitle.toLowerCase().includes(term) ||
        submission.proof.toLowerCase().includes(term);

      const matchesStatus = status === "all" || submission.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, status]);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
  const usersByAuthId = new Map(
    users.filter((user) => !!user.authUserId).map((user) => [user.authUserId as string, user])
  );
  const flagsBySubmissionId = reviewFlags.reduce((acc, flag) => {
    if (flag.sourceTable !== "quest_submissions") return acc;
    const existing = acc.get(flag.sourceId) ?? [];
    existing.push(flag);
    acc.set(flag.sourceId, existing);
    return acc;
  }, new Map<string, typeof reviewFlags>());

  const autoApprovedCount = submissions.filter(
    (submission) =>
      submission.status === "approved" && !(flagsBySubmissionId.get(submission.id)?.length)
  ).length;
  const flaggedFlowCount = submissions.filter(
    (submission) => (flagsBySubmissionId.get(submission.id)?.length ?? 0) > 0
  ).length;

  return (
    <AdminShell>
      <div className="space-y-4">
        <PortalPageFrame
          eyebrow="Submission review board"
          title="Submissions"
          description="Track proof traffic, see which decisions are automatic and keep risky proofs separated from the calmer throughput signals."
          statusBand={
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <OpsMetricCard
                  label="Pending"
                  value={pendingCount}
                  emphasis={pendingCount > 0 ? "warning" : "default"}
                />
                <OpsMetricCard
                  label="Approved"
                  value={approvedCount}
                  emphasis={approvedCount > 0 ? "primary" : "default"}
                />
                <OpsMetricCard
                  label="Rejected"
                  value={rejectedCount}
                  emphasis={rejectedCount > 0 ? "warning" : "default"}
                />
                <OpsMetricCard
                  label="Flagged flow"
                  value={flaggedFlowCount}
                  emphasis={flaggedFlowCount > 0 ? "warning" : "default"}
                />
              </div>

              <div className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,17,24,0.96),rgba(9,12,18,0.96))] p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                      Workspace focus
                    </p>
                    <h2 className="mt-1.5 text-[0.98rem] font-semibold tracking-tight text-text">
                      Switch between review queue and decision signals
                    </h2>
                    <p className="mt-1.5 text-[12px] leading-5 text-sub">
                      Queue mode is for reviewing individual proofs. Signals mode gives a calmer
                      read on how verification is resolving overall so the page does not feel like
                      one endless moderation wall.
                    </p>
                  </div>

                  <SegmentToggle
                    value={submissionsView}
                    options={[
                      { value: "queue", label: "Review queue" },
                      { value: "signals", label: "Decision signals" },
                    ]}
                    onChange={setSubmissionsView}
                  />
                </div>
              </div>
            </div>
          }
        >
          {submissionsView === "signals" ? (
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <OpsPanel
                eyebrow="Decision mix"
                title="How proof traffic is resolving"
                description="A compact board for what is getting auto-approved, stuck for review or rejected outright."
                tone="accent"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <DecisionCard
                    label="Auto approved"
                    value={autoApprovedCount}
                    hint="Low-risk proof that clears current verification rules."
                    tone="success"
                  />
                  <DecisionCard
                    label="Needs review"
                    value={pendingCount}
                    hint="Proof that still needs a human because automation could not close it."
                    tone="warning"
                  />
                  <DecisionCard
                    label="Flagged path"
                    value={flaggedFlowCount}
                    hint="Submissions escalated by duplicate signals or explicit review flags."
                    tone="danger"
                  />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Queue signal"
                title="Moderation posture"
                description="A shorter read on risk, rejection pressure and throughput."
              >
                <div className="grid gap-4">
                  <SignalRow label="Approved throughput" value={`${approvedCount} approved`} />
                  <SignalRow
                    label="Open review flags"
                    value={`${reviewFlags.filter((flag) => flag.status === "open" && flag.sourceTable === "quest_submissions").length} alerts`}
                  />
                  <SignalRow label="Rejected submissions" value={`${rejectedCount} rejected`} />
                </div>
              </OpsPanel>
            </div>
          ) : (
            <>
              <OpsFilterBar>
                <OpsSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search user, quest, campaign or proof..."
                  ariaLabel="Search submissions"
                  name="submission-search"
                />
                <OpsSelect
                  value={status}
                  onChange={setStatus}
                  ariaLabel="Filter submissions by status"
                  name="submission-status"
                >
                  <option value="all">all statuses</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </OpsSelect>
                <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5 text-[12px] text-sub">
                  {filteredSubmissions.length} submissions in view
                </div>
              </OpsFilterBar>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <OpsPanel
                  eyebrow="Review queue"
                  title="Submission stream"
                  description="Each card keeps proof, user risk and the current decision route together so the queue reads like a dossier rail instead of a table wall."
                >
                  <div className="grid gap-4">
                    {filteredSubmissions.map((submission) => {
                      const user = usersByAuthId.get(submission.userId);
                      const linkedFlags = flagsBySubmissionId.get(submission.id) ?? [];
                      const riskLabel =
                        user?.status === "flagged"
                          ? `Watch / Sybil ${user.sybilScore}`
                          : `Trust ${user?.trustScore ?? 50}`;
                      const decisionLabel =
                        linkedFlags.length > 0
                          ? linkedFlags[0].flagType.replace(/_/g, " ")
                          : submission.status === "approved"
                            ? "Auto-approved"
                            : submission.status === "pending"
                              ? "Manual review"
                              : "Validation failed";
                      const decisionReason =
                        linkedFlags[0]?.reason ??
                        (submission.status === "approved"
                          ? "VYNTRO approved this submission automatically because it met the current low-risk verification rules."
                          : submission.status === "pending"
                            ? "This submission is waiting for a reviewer because it could not be fully auto-verified."
                            : "This submission did not meet the current verification requirements.");

                      return (
                        <div key={submission.id} className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-[0.98rem] font-semibold text-text">{submission.username}</h2>
                                <OpsStatusPill tone={user?.status === "flagged" ? "danger" : "default"}>
                                  {riskLabel}
                                </OpsStatusPill>
                                <OpsStatusPill
                                  tone={
                                    submission.status === "approved"
                                      ? "success"
                                      : submission.status === "rejected"
                                        ? "danger"
                                        : "warning"
                                  }
                                >
                                  {submission.status}
                                </OpsStatusPill>
                              </div>
                              <p className="mt-2.5 text-[12px] font-semibold text-text">
                                {submission.questTitle}
                                <span className="ml-2 text-sub">inside {submission.campaignTitle}</span>
                              </p>
                              <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-sub">{decisionReason}</p>

                              <div className="mt-3 grid gap-2.5 md:grid-cols-3">
                                <Metric label="Decision" value={decisionLabel} />
                                <Metric label="Submitted" value={formatDate(submission.submittedAt)} />
                                <Metric
                                  label="Proof"
                                  value={submission.proof.length > 64 ? `${submission.proof.slice(0, 64)}...` : submission.proof}
                                />
                              </div>
                            </div>

                            <Link
                              href={`/submissions/${submission.id}`}
                              className="rounded-[14px] border border-white/[0.032] bg-white/[0.014] px-3 py-2 text-[12px] font-bold text-text transition hover:border-primary/30 hover:text-primary"
                            >
                              Open review
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {filteredSubmissions.length === 0 ? (
                      <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-4 text-[12px] text-sub">
                        No submissions match your filters.
                      </div>
                    ) : null}
                  </div>
                </OpsPanel>

                <OpsPanel
                  eyebrow="Queue posture"
                  title="What is actually slowing review"
                  description="Use this shorter read to decide whether the bottleneck is manual moderation, low-confidence automation or risk flags."
                >
                  <div className="grid gap-4">
                    <DecisionCard
                      label="Manual review"
                      value={pendingCount}
                      hint="Proof currently waiting on a human because automation could not close it."
                      tone="warning"
                    />
                    <DecisionCard
                      label="Auto-approved"
                      value={autoApprovedCount}
                      hint="Submissions already clearing the calm low-risk path."
                      tone="success"
                    />
                    <DecisionCard
                      label="Flagged path"
                      value={flaggedFlowCount}
                      hint="Submissions escalated by duplicate signals or explicit review flags."
                      tone="danger"
                    />
                  </div>
                </OpsPanel>
              </div>
            </>
          )}
        </PortalPageFrame>
      </div>
    </AdminShell>
  );
}

function DecisionCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
      <p className="text-[12px] text-sub">{label}</p>
      <p className={`mt-1.5 text-[1.05rem] font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-[12px] leading-5 text-sub">{hint}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.018] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
