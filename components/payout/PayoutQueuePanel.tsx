"use client";

import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import type { PayoutCaseListRow } from "./types";
import {
  formatPayoutDate,
  getPayoutCaseTypeLabel,
  getPayoutEscalationLabel,
  PayoutSeverityPill,
  PayoutStatusPill,
} from "./payout-ui";

export default function PayoutQueuePanel({
  eyebrow,
  title,
  description,
  rows,
  loading,
  selectedCaseId,
  onSelect,
  emptyState,
  scope,
}: {
  eyebrow: string;
  title: string;
  description: string;
  rows: PayoutCaseListRow[];
  loading?: boolean;
  selectedCaseId?: string | null;
  onSelect?: (caseId: string) => void;
  emptyState: string;
  scope: "internal" | "project";
}) {
  return (
    <OpsPanel eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-[24px] border border-line bg-card px-5 py-6 text-sm text-sub">
            {loading ? "Loading payout cases..." : emptyState}
          </div>
        ) : null}

        {rows.map((row) => {
          const selected = row.id === selectedCaseId;
          const Wrapper = onSelect ? "button" : "div";

          return (
            <Wrapper
              key={row.id}
              {...(onSelect
                ? {
                    type: "button" as const,
                    onClick: () => onSelect(row.id),
                  }
                : {})}
              className={`rounded-[24px] border px-5 py-5 text-left transition-all duration-200 ${
                selected
                  ? "border-primary/45 bg-primary/10 shadow-[0_18px_50px_rgba(186,255,59,0.12)]"
                  : "border-line bg-card2 hover:border-white/12 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold text-text">{getPayoutCaseTypeLabel(row.caseType)}</p>
                    <PayoutSeverityPill severity={row.severity} />
                    <PayoutStatusPill status={row.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{row.summary}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                  {getPayoutEscalationLabel(row.escalationState)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {scope === "internal" ? (
                  <QueueMeta label="Project" value={row.projectName ?? "Project"} />
                ) : null}
                <QueueMeta label="Reward" value={row.rewardTitle ?? "Restricted"} />
                <QueueMeta label="Contributor" value={row.username ?? "Restricted"} />
                <QueueMeta label="Opened" value={formatPayoutDate(row.openedAt)} />
              </div>

              {row.evidenceSummary ? (
                <div className="mt-4 rounded-[20px] border border-line bg-card px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    Evidence summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">{row.evidenceSummary}</p>
                </div>
              ) : null}
            </Wrapper>
          );
        })}
      </div>
    </OpsPanel>
  );
}

function QueueMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-card px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
