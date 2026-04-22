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
      <div className="space-y-6">
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

              <div className="rounded-[28px] border border-line bg-card p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      Workspace focus
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                      Switch between review queue and decision signals
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-sub">
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
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
                <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
                  {filteredSubmissions.length} submissions in view
                </div>
              </OpsFilterBar>

              <OpsPanel
                eyebrow="Review queue"
                title="Submission stream"
                description="Each row combines user risk, proof context and the decision route that currently explains the state."
              >
                <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
                  <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
                    <div>User</div>
                    <div>Quest</div>
                    <div>Campaign</div>
                    <div>Risk</div>
                    <div>Status</div>
                    <div>Submitted</div>
                    <div>Proof</div>
                    <div>Open</div>
                  </div>

                  {filteredSubmissions.map((submission) => {
                    const user = usersByAuthId.get(submission.userId);
                    const linkedFlags = flagsBySubmissionId.get(submission.id) ?? [];
                    const riskLabel =
                      user?.status === "flagged"
                        ? `Watch • Sybil ${user.sybilScore}`
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
                        ? "Veltrix approved this submission automatically because it met the current low-risk verification rules."
                        : submission.status === "pending"
                          ? "This submission is waiting for a reviewer because it could not be fully auto-verified."
                          : "This submission did not meet the current verification requirements.");

                    return (
                      <div
                        key={submission.id}
                        className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                      >
                        <div className="font-semibold">{submission.username}</div>
                        <div>{submission.questTitle}</div>
                        <div>{submission.campaignTitle}</div>
                        <div>
                          <div className="space-y-2">
                            <OpsStatusPill tone={user?.status === "flagged" ? "danger" : "default"}>
                              {riskLabel}
                            </OpsStatusPill>
                            <span className="block text-xs text-sub capitalize">{decisionLabel}</span>
                          </div>
                        </div>
                        <div className="capitalize text-primary">{submission.status}</div>
                        <div>{formatDate(submission.submittedAt)}</div>
                        <div className="space-y-2">
                          <p className="truncate text-sub">{submission.proof}</p>
                          <p className="line-clamp-2 text-xs text-sub">{decisionReason}</p>
                        </div>
                        <div>
                          <Link
                            href={`/submissions/${submission.id}`}
                            className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {filteredSubmissions.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-sub">
                      No submissions match your filters.
                    </div>
                  ) : null}
                </div>
              </OpsPanel>
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
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
