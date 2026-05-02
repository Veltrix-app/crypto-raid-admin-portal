"use client";

import { useMemo, useState } from "react";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { TrustCaseAction } from "@/lib/trust/trust-actions";
import type { TrustCaseDetailRecord } from "./types";
import {
  formatTrustDate,
  getTrustCaseTypeLabel,
  TrustSeverityPill,
  TrustStatusPill,
} from "./trust-ui";

const INTERNAL_ACTION_ORDER: TrustCaseAction[] = [
  "annotate",
  "request_project_input",
  "escalate",
  "resolve",
  "dismiss",
  "mute_member",
  "freeze_reward_eligibility",
  "trust_override",
  "reward_override",
];

const PROJECT_ACTION_ORDER: TrustCaseAction[] = [
  "annotate",
  "escalate",
  "resolve",
  "mute_member",
  "freeze_reward_eligibility",
  "trust_override",
  "reward_override",
];

const ACTION_LABELS: Record<TrustCaseAction, string> = {
  annotate: "Annotate",
  request_project_input: "Request project input",
  escalate: "Escalate",
  dismiss: "Dismiss",
  resolve: "Resolve",
  mute_member: "Mute member",
  freeze_reward_eligibility: "Freeze rewards",
  trust_override: "Trust override",
  reward_override: "Reward override",
};

export default function TrustCaseDetailPanel({
  trustCase,
  loading,
  scope,
  availableActions,
  actionBusy,
  onAction,
}: {
  trustCase: TrustCaseDetailRecord | null;
  loading?: boolean;
  scope: "internal" | "project";
  availableActions: TrustCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: TrustCaseAction, notes: string) => void;
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
      title="Trust case detail"
      description="Inspect the evidence, review contributor context and apply the next explainable trust action."
    >
      {!trustCase ? (
        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-5 py-6 text-sm text-sub">
          {loading ? "Loading trust case..." : "Select a trust case to inspect the full detail rail."}
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-extrabold text-text">
                    {getTrustCaseTypeLabel(trustCase.caseType)}
                  </p>
                  <TrustSeverityPill severity={trustCase.severity} />
                  <TrustStatusPill status={trustCase.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{trustCase.summary}</p>
              </div>
              <span className="rounded-full border border-white/[0.026] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                {trustCase.escalationState.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailMeta label="Project" value={trustCase.projectName ?? "Project"} />
              <DetailMeta label="Contributor" value={trustCase.username ?? "Restricted"} />
              <DetailMeta label="Opened" value={formatTrustDate(trustCase.openedAt)} />
              <DetailMeta label="Updated" value={formatTrustDate(trustCase.updatedAt)} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EvidencePanel
              title="Identity and source"
              items={[
                ["Auth user", trustCase.authUserId ?? "Restricted"],
                ["Wallet", trustCase.walletAddress ?? "Restricted"],
                ["Source", trustCase.sourceType ?? "-"],
                ["Source id", trustCase.sourceId ?? "-"],
              ]}
            />
            <EvidencePanel
              title="Resolution posture"
              items={[
                ["Evidence summary", trustCase.evidenceSummary ?? "No evidence summary recorded yet."],
                ["Resolution notes", trustCase.resolutionNotes ?? "No resolution notes recorded yet."],
                ["Resolved", trustCase.resolvedAt ? formatTrustDate(trustCase.resolvedAt) : "-"],
                ["Dismissed", trustCase.dismissedAt ? formatTrustDate(trustCase.dismissedAt) : "-"],
              ]}
            />
          </div>

          {trustCase.rawSignalPayload ? (
            <EvidencePanel
              title="Raw signal payload"
              preformatted={JSON.stringify(trustCase.rawSignalPayload, null, 2)}
            />
          ) : null}

          {trustCase.metadata ? (
            <EvidencePanel
              title="Case metadata"
              preformatted={JSON.stringify(trustCase.metadata, null, 2)}
            />
          ) : null}

          {visibleActions.length > 0 && onAction ? (
            <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Actions
              </p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add investigation notes, rationale or escalation context..."
                className="mt-4 w-full rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4 text-sm text-text placeholder:text-sub/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          ? "border border-rose-500/30 bg-rose-500/[0.055] text-rose-300"
                          : "border border-white/[0.026] bg-white/[0.012] text-text hover:border-primary/35"
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
    <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3">
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
    <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
      {preformatted ? (
        <pre className="mt-4 whitespace-pre-wrap break-all rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4 text-xs leading-6 text-sub">
          {preformatted}
        </pre>
      ) : (
        <div className="mt-4 grid gap-3">
          {(items ?? []).map(([label, value]) => (
            <div key={label} className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
              <p className="mt-2 break-all text-sm leading-6 text-text">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
