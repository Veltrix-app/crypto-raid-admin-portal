"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SubmissionsPage() {
  const submissions = useAdminPortalStore((s) => s.submissions);
  const users = useAdminPortalStore((s) => s.users);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch =
        submission.username.toLowerCase().includes(search.toLowerCase()) ||
        submission.questTitle.toLowerCase().includes(search.toLowerCase()) ||
        submission.campaignTitle.toLowerCase().includes(search.toLowerCase()) ||
        submission.proof.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || submission.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, status]);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
  const usersByAuthId = new Map(
    users
      .filter((user) => !!user.authUserId)
      .map((user) => [user.authUserId as string, user])
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Submission Moderation
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Submissions</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard label="Pending" value={pendingCount} />
          <InfoCard label="Approved" value={approvedCount} />
          <InfoCard label="Rejected" value={rejectedCount} />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, quest, campaign or proof..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all statuses</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
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
            const riskLabel =
              user?.status === "flagged"
                ? `Watch • Sybil ${user.sybilScore}`
                : `Trust ${user?.trustScore ?? 50}`;

            return (
              <div
                key={submission.id}
                className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div className="font-semibold">{submission.username}</div>
                <div>{submission.questTitle}</div>
                <div>{submission.campaignTitle}</div>
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user?.status === "flagged"
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-card2 text-sub"
                    }`}
                  >
                    {riskLabel}
                  </span>
                </div>
                <div className="capitalize text-primary">{submission.status}</div>
                <div>{formatDate(submission.submittedAt)}</div>
                <div className="truncate text-sub">{submission.proof}</div>
                <div>
                  <Link
                    href={`/submissions/${submission.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
