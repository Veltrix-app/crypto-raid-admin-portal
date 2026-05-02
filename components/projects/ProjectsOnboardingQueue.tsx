"use client";

import type { AdminOnboardingRequest } from "@/types/entities/onboarding-request";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type ProjectsOnboardingQueueProps = {
  requests: AdminOnboardingRequest[];
  isSuperAdmin: boolean;
  runningRequestId: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

export default function ProjectsOnboardingQueue({
  requests,
  isSuperAdmin,
  runningRequestId,
  onApprove,
  onReject,
}: ProjectsOnboardingQueueProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.014] px-4 py-6 text-sm text-sub">
        No pending onboarding requests right now.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {requests.map((request) => {
        const busy = runningRequestId === request.id;

        return (
          <div key={request.id} className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-4">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.95rem]">{request.logo}</span>
                  <p className="font-bold text-text">{request.projectName}</p>
                  <OpsStatusPill tone="default">{request.chain}</OpsStatusPill>
                  {request.category ? (
                    <OpsStatusPill tone="success">{request.category}</OpsStatusPill>
                  ) : null}
                </div>

                <p className="mt-2.5 text-[12px] leading-5 text-sub">
                  {request.shortDescription || "No description provided yet."}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-sub">
                  <span>{request.contactEmail || "No contact email"}</span>
                  <span>{new Date(request.createdAt).toLocaleString()}</span>
                  <span>{request.website || "No website submitted"}</span>
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onApprove(request.id)}
                    disabled={busy}
                    className="rounded-xl bg-primary px-3.5 py-2 text-[12px] font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Working..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(request.id)}
                    disabled={busy}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/[0.055] px-3.5 py-2 text-[12px] font-bold text-rose-300 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.026] px-4 py-2 text-sm font-semibold text-sub">
                  Awaiting review
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
