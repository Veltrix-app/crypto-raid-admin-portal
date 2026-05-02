"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import type { DefiXpReviewRead, DefiXpReviewRow } from "@/lib/xp/defi-xp-review";

type DecisionFilter = "all" | "clear" | "review" | "blocked";

export default function XpReviewPage() {
  const [review, setReview] = useState<DefiXpReviewRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<DecisionFilter>("all");

  async function loadReview() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/xp/defi-review", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load DeFi XP review.");
      }

      setReview(payload.review as DefiXpReviewRead);
    } catch (loadError) {
      setReview(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load DeFi XP review.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReview();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (review?.rows ?? []).filter((row) => {
      const matchesDecision = decision === "all" || row.decision === decision;
      const haystack = [row.userLabel, row.walletLabel, row.sourceLabel, row.reason, row.sourceRef]
        .join(" ")
        .toLowerCase();

      return matchesDecision && (!term || haystack.includes(term));
    });
  }, [decision, review?.rows, search]);

  const suspiciousRows = (review?.rows ?? []).filter((row) => row.decision !== "clear");

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="XP economy control"
        title="XP Review"
        description="Review DeFi XP events, suspicious claim pressure, user history and the guardrails that keep the economy safe."
        actions={
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">
              DeFi posture
            </p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={review?.status === "watch" ? "warning" : "success"}>
                {review?.status ?? "loading"}
              </OpsStatusPill>
              <button
                type="button"
                onClick={() => void loadReview()}
                className="rounded-full border border-white/[0.032] bg-white/[0.016] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text transition hover:border-primary/20 hover:text-primary"
              >
                Refresh
              </button>
            </div>
          </div>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-5">
            <OpsMetricCard label="Events" value={review?.summary.totalEvents ?? 0} />
            <OpsMetricCard label="XP issued" value={review?.summary.totalXp ?? 0} />
            <OpsMetricCard
              label="Suspicious"
              value={review?.summary.suspiciousClaims ?? 0}
              emphasis={(review?.summary.suspiciousClaims ?? 0) > 0 ? "warning" : "default"}
            />
            <OpsMetricCard
              label="Blocked"
              value={review?.summary.blockedClaims ?? 0}
              emphasis={(review?.summary.blockedClaims ?? 0) > 0 ? "warning" : "default"}
            />
            <OpsMetricCard label="Users" value={review?.summary.uniqueUsers ?? 0} />
          </div>
        }
      >
        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search user, wallet, source or reason..."
            ariaLabel="Search DeFi XP review"
            name="xp-review-search"
          />
          <OpsSelect
            value={decision}
            onChange={(value) => setDecision(value as DecisionFilter)}
            ariaLabel="Filter DeFi XP events by decision"
            name="xp-review-decision"
          >
            <option value="all">all decisions</option>
            <option value="clear">clear</option>
            <option value="review">review</option>
            <option value="blocked">blocked</option>
          </OpsSelect>
          <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5 text-[12px] text-sub">
            {loading ? "Loading review..." : error || `${filteredRows.length} events in view`}
          </div>
        </OpsFilterBar>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <OpsPanel
            eyebrow="Event stream"
            title="DeFi XP claims"
            description="Every DeFi XP event is scored against policy: tracking proof, sybil pressure and the no-borrow-volume rule."
            tone="accent"
          >
            <div className="grid gap-3">
              {filteredRows.map((row) => (
                <XpEventCard key={row.id} row={row} />
              ))}
              {!loading && filteredRows.length === 0 ? (
                <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-4 text-[12px] text-sub">
                  No DeFi XP events match the current filters.
                </div>
              ) : null}
            </div>
          </OpsPanel>

          <div className="grid gap-4">
            <OpsPanel
              eyebrow="Policy guardrails"
              title="What operators should watch"
              description="Keep this short enough to scan: borrow farming is blocked, sybil pressure pauses XP, and tracking proof must exist."
            >
              <div className="grid gap-3">
                {(review?.guardrails ?? []).map((guardrail) => (
                  <div
                    key={guardrail.label}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">
                        {guardrail.label}
                      </p>
                      <p className="mt-1.5 text-[12px] font-semibold text-text">
                        {guardrail.value}
                      </p>
                    </div>
                    <OpsStatusPill tone={guardrail.tone}>{guardrail.tone}</OpsStatusPill>
                  </div>
                ))}
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Review pressure"
              title="Suspicious claims"
              description="Claims that need human attention before we treat the XP economy as clean."
            >
              <div className="grid gap-3">
                {suspiciousRows.slice(0, 6).map((row) => (
                  <CompactReviewRow key={row.id} row={row} />
                ))}
                {!loading && suspiciousRows.length === 0 ? (
                  <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-3 text-[12px] text-sub">
                    No suspicious DeFi XP claims in the latest event window.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        </div>

        <OpsPanel
          eyebrow="User history"
          title="XP history by member"
          description="Compact user-level history so operators can see whether one wallet is stacking claims too aggressively."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {(review?.userHistories ?? []).map((history) => (
              <div
                key={history.authUserId}
                className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-text">{history.userLabel}</h3>
                    <p className="mt-1 text-[12px] text-sub">{history.walletLabel}</p>
                  </div>
                  <OpsStatusPill tone={history.sybilScore >= 90 ? "danger" : "default"}>
                    Sybil {history.sybilScore}
                  </OpsStatusPill>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniMetric label="Level" value={history.level} />
                  <MiniMetric label="Total XP" value={history.totalXp} />
                  <MiniMetric label="Trust" value={history.trustScore} />
                </div>
                <div className="mt-3 grid gap-2">
                  {history.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.035] bg-black/10 px-3 py-2"
                    >
                      <span className="text-[12px] text-sub">{event.sourceLabel}</span>
                      <span className="text-[12px] font-semibold text-text">{event.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </OpsPanel>
      </PortalPageFrame>
    </AdminShell>
  );
}

function XpEventCard({ row }: { row: DefiXpReviewRow }) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[0.98rem] font-semibold text-text">{row.userLabel}</h2>
            <OpsStatusPill tone={row.tone}>{row.decision}</OpsStatusPill>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-sub">{row.reason}</p>
        </div>
        <div className="text-right">
          <p className="text-[1rem] font-semibold text-text">{row.xp} XP</p>
          <p className="mt-1 text-[11px] text-sub">{formatDate(row.createdAt)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <MiniMetric label="Source" value={row.sourceLabel} />
        <MiniMetric label="Wallet" value={row.walletLabel} />
        <MiniMetric label="Trust" value={row.trustScore} />
        <MiniMetric label="Sybil" value={row.sybilScore} />
      </div>
    </div>
  );
}

function CompactReviewRow({ row }: { row: DefiXpReviewRow }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-text">{row.userLabel}</p>
          <p className="mt-1 text-[11px] leading-5 text-sub">{row.reason}</p>
        </div>
        <OpsStatusPill tone={row.tone}>{row.decision}</OpsStatusPill>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] border border-white/[0.035] bg-black/10 px-3 py-2">
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 break-words text-[12px] font-semibold text-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
