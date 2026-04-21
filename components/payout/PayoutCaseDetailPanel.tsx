"use client";

import { useMemo, useState } from "react";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { PayoutCaseAction } from "@/lib/payout/payout-actions";
import type { PayoutCaseDetailRecord } from "./types";
import {
  formatPayoutDate,
  getPayoutCaseTypeLabel,
  PayoutSeverityPill,
  PayoutStatusPill,
} from "./payout-ui";

const INTERNAL_ACTION_ORDER: PayoutCaseAction[] = [
  "annotate",
  "request_project_input",
  "escalate",
  "retry",
  "resolve",
  "dismiss",
  "freeze_reward",
  "pause_claim_rail",
  "payout_override",
];

const PROJECT_ACTION_ORDER: PayoutCaseAction[] = [
  "annotate",
  "escalate",
  "retry",
  "resolve",
  "freeze_reward",
  "pause_claim_rail",
  "payout_override",
];

const ACTION_LABELS: Record<PayoutCaseAction, string> = {
  annotate: "Annotate",
  request_project_input: "Request project input",
  escalate: "Escalate",
  retry: "Retry",
  dismiss: "Dismiss",
  resolve: "Resolve",
  freeze_reward: "Freeze reward",
  pause_claim_rail: "Pause claim rail",
  payout_override: "Payout override",
};

export default function PayoutCaseDetailPanel({
  payoutCase,
  loading,
  scope,
  availableActions,
  actionBusy,
  onAction,
}: {
  payoutCase: PayoutCaseDetailRecord | null;
  loading?: boolean;
  scope: "internal" | "project";
  availableActions: PayoutCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: PayoutCaseAction, notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const actionOrder = scope === "internal" ? INTERNAL_ACTION_ORDER : PROJECT_ACTION_ORDER;
  const visibleActions = useMemo(
    () => actionOrder.filter((action) => availableActions.includes(action)),
    [actionOrder, availableActions]
  );

  return (
    <OpsPanel
      eyebrow={scope === "internal" ? "Investigation" : "Project case"}
      title="Payout case detail"
      description="Inspect reward, claim, delivery and campaign context before you take the next bounded payout action."
    >
      {!payoutCase ? (
        <div className="rounded-[24px] border border-line bg-card px-5 py-6 text-sm text-sub">
          {loading ? "Loading payout case..." : "Select a payout case to inspect the full detail rail."}
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-extrabold text-text">
                    {getPayoutCaseTypeLabel(payoutCase.caseType)}
                  </p>
                  <PayoutSeverityPill severity={payoutCase.severity} />
                  <PayoutStatusPill status={payoutCase.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{payoutCase.summary}</p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                {payoutCase.escalationState.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailMeta label="Project" value={payoutCase.projectName ?? "Project"} />
              <DetailMeta label="Reward" value={payoutCase.rewardTitle ?? "Reward"} />
              <DetailMeta label="Campaign" value={payoutCase.campaignTitle ?? "Campaign"} />
              <DetailMeta label="Opened" value={formatPayoutDate(payoutCase.openedAt)} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EvidencePanel
              title="Claim and identity"
              items={[
                ["Contributor", payoutCase.username ?? "Restricted"],
                ["Auth user", payoutCase.authUserId ?? "Restricted"],
                ["Wallet", payoutCase.walletAddress ?? "Restricted"],
                ["Claim method", payoutCase.claimMethod ?? "-"],
              ]}
            />
            <EvidencePanel
              title="Resolution posture"
              items={[
                ["Evidence summary", payoutCase.evidenceSummary ?? "No evidence summary recorded yet."],
                ["Resolution notes", payoutCase.resolutionNotes ?? "No resolution notes recorded yet."],
                ["Resolved", payoutCase.resolvedAt ? formatPayoutDate(payoutCase.resolvedAt) : "-"],
                ["Dismissed", payoutCase.dismissedAt ? formatPayoutDate(payoutCase.dismissedAt) : "-"],
              ]}
            />
          </div>

          {payoutCase.rawPayload ? (
            <EvidencePanel
              title="Raw payout payload"
              preformatted={JSON.stringify(payoutCase.rawPayload, null, 2)}
            />
          ) : null}

          {payoutCase.metadata ? (
            <EvidencePanel
              title="Case metadata"
              preformatted={JSON.stringify(payoutCase.metadata, null, 2)}
            />
          ) : null}

          {visibleActions.length > 0 && onAction ? (
            <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Actions
              </p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add payout context, delivery notes or escalation rationale..."
                className="mt-4 w-full rounded-[20px] border border-line bg-card px-4 py-4 text-sm text-text placeholder:text-sub/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {visibleActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onAction(action, notes)}
                    disabled={Boolean(actionBusy)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      action === "resolve"
                        ? "bg-primary text-black"
                        : action === "dismiss"
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : "border border-line bg-card text-text hover:border-primary/35"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {actionBusy === action ? "Working..." : ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </OpsPanel>
  );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-card px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function EvidencePanel({
  title,
  items,
  preformatted,
}: {
  title: string;
  items?: Array<[string, string]>;
  preformatted?: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
      {preformatted ? (
        <pre className="mt-4 whitespace-pre-wrap break-all rounded-[20px] border border-line bg-card px-4 py-4 text-xs leading-6 text-sub">
          {preformatted}
        </pre>
      ) : (
        <div className="mt-4 grid gap-3">
          {(items ?? []).map(([label, value]) => (
            <div key={label} className="rounded-[20px] border border-line bg-card px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
              <p className="mt-2 break-all text-sm leading-6 text-text">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
