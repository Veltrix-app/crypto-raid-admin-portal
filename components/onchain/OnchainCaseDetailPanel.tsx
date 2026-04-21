"use client";

import { useMemo, useState } from "react";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { OnchainCaseAction } from "@/lib/onchain/onchain-actions";
import type { OnchainCaseDetailRecord } from "./types";
import {
  formatOnchainDate,
  getOnchainCaseTypeLabel,
  getOnchainSourceLabel,
  OnchainSeverityPill,
  OnchainStatusPill,
} from "./onchain-ui";

const INTERNAL_ACTION_ORDER: OnchainCaseAction[] = [
  "annotate",
  "request_project_input",
  "escalate",
  "retry",
  "rerun_enrichment",
  "rescan_assets",
  "resolve",
  "dismiss",
];

const PROJECT_ACTION_ORDER: OnchainCaseAction[] = [
  "annotate",
  "escalate",
  "retry",
  "rerun_enrichment",
  "rescan_assets",
  "resolve",
];

const ACTION_LABELS: Record<OnchainCaseAction, string> = {
  annotate: "Annotate",
  request_project_input: "Request project input",
  escalate: "Escalate",
  retry: "Retry case",
  rerun_enrichment: "Rerun enrichment",
  rescan_assets: "Rescan assets",
  dismiss: "Dismiss",
  resolve: "Resolve",
};

export default function OnchainCaseDetailPanel({
  onchainCase,
  loading,
  scope,
  availableActions,
  actionBusy,
  onAction,
}: {
  onchainCase: OnchainCaseDetailRecord | null;
  loading?: boolean;
  scope: "internal" | "project";
  availableActions: OnchainCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: OnchainCaseAction, notes: string) => void;
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
      title="On-chain case detail"
      description="Inspect wallet, asset, source and failure context before you take the next bounded recovery action."
    >
      {!onchainCase ? (
        <div className="rounded-[24px] border border-line bg-card px-5 py-6 text-sm text-sub">
          {loading ? "Loading on-chain case..." : "Select an on-chain case to inspect the full detail rail."}
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-extrabold text-text">
                    {getOnchainCaseTypeLabel(onchainCase.caseType)}
                  </p>
                  <OnchainSeverityPill severity={onchainCase.severity} />
                  <OnchainStatusPill status={onchainCase.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{onchainCase.summary}</p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                {onchainCase.escalationState.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailMeta label="Project" value={onchainCase.projectName ?? "Project"} />
              <DetailMeta label="Asset" value={onchainCase.assetSymbol ?? "Restricted"} />
              <DetailMeta label="Source" value={getOnchainSourceLabel(onchainCase.sourceType)} />
              <DetailMeta label="Opened" value={formatOnchainDate(onchainCase.openedAt)} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EvidencePanel
              title="Wallet and asset context"
              items={[
                ["Contributor", onchainCase.username ?? "Restricted"],
                ["Auth user", onchainCase.authUserId ?? "Restricted"],
                ["Wallet", onchainCase.walletAddress ?? "Restricted"],
                ["Asset", onchainCase.assetSymbol ?? "Restricted"],
              ]}
            />
            <EvidencePanel
              title="Resolution posture"
              items={[
                [
                  "Evidence summary",
                  onchainCase.evidenceSummary ?? "No evidence summary recorded yet.",
                ],
                [
                  "Resolution notes",
                  onchainCase.resolutionNotes ?? "No resolution notes recorded yet.",
                ],
                [
                  "Resolved",
                  onchainCase.resolvedAt ? formatOnchainDate(onchainCase.resolvedAt) : "-",
                ],
                [
                  "Dismissed",
                  onchainCase.dismissedAt ? formatOnchainDate(onchainCase.dismissedAt) : "-",
                ],
              ]}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EvidencePanel
              title="Source pointers"
              items={[
                ["Source type", getOnchainSourceLabel(onchainCase.sourceType)],
                ["Source id", onchainCase.sourceId ?? "-"],
                ["Case id", onchainCase.id],
                ["Dedupe key", onchainCase.dedupeKey ?? "-"],
              ]}
            />
            <EvidencePanel
              title="Case metadata"
              preformatted={
                onchainCase.metadata ? JSON.stringify(onchainCase.metadata, null, 2) : undefined
              }
              emptyCopy="No case metadata has been recorded yet."
            />
          </div>

          {onchainCase.rawPayload ? (
            <EvidencePanel
              title="Raw on-chain payload"
              preformatted={JSON.stringify(onchainCase.rawPayload, null, 2)}
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
                placeholder="Add recovery notes, provider context or project follow-through..."
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
  emptyCopy,
}: {
  title: string;
  items?: Array<[string, string]>;
  preformatted?: string;
  emptyCopy?: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{title}</p>
      {preformatted ? (
        <pre className="mt-4 whitespace-pre-wrap break-all rounded-[20px] border border-line bg-card px-4 py-4 text-xs leading-6 text-sub">
          {preformatted}
        </pre>
      ) : items && items.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-[20px] border border-line bg-card px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
              <p className="mt-2 break-all text-sm leading-6 text-text">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-line bg-card px-4 py-4 text-sm text-sub">
          {emptyCopy ?? "No detail recorded yet."}
        </div>
      )}
    </div>
  );
}
