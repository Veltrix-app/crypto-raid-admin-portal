"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import {
  InlineEmptyNotice,
  LoadingState,
  StatePanel,
} from "@/components/layout/state/StatePrimitives";
import {
  OpsMetricCard,
  OpsPanel,
  OpsPriorityLink,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { fetchBusinessControlOverview } from "@/lib/billing/business-dashboard";
import type {
  BusinessControlAccountSummary,
  BusinessControlOverview,
} from "@/lib/billing/business-control";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function healthTone(value: BusinessControlAccountSummary["commercialHealth"]) {
  switch (value) {
    case "blocked":
      return "danger";
    case "payment_risk":
    case "upgrade_ready":
      return "warning";
    case "churn_risk":
    case "watching":
      return "default";
    default:
      return "success";
  }
}

function collectionTone(value: BusinessControlAccountSummary["collectionStatus"]) {
  switch (value) {
    case "payment_failed":
    case "action_required":
      return "warning";
    case "renewing_soon":
      return "default";
    case "refunded":
      return "danger";
    default:
      return "success";
  }
}

function QueueList({
  title,
  description,
  accounts,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  accounts: BusinessControlAccountSummary[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <OpsPanel eyebrow="Queue" title={title} description={description}>
      {accounts.length ? (
        <div className="space-y-3">
          {accounts.slice(0, 5).map((account) => (
            <Link
              key={account.accountId}
              href={`/business/accounts/${account.accountId}`}
              className="block rounded-[22px] border border-line bg-card2 p-4 transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text">{account.accountName}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {account.planName} | {account.billingStatus} | next window{" "}
                    {formatDateLabel(account.nextBillingAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <OpsStatusPill tone={healthTone(account.commercialHealth)}>
                    {account.commercialHealth.replaceAll("_", " ")}
                  </OpsStatusPill>
                  <OpsStatusPill tone={collectionTone(account.collectionStatus)}>
                    {account.collectionStatus.replaceAll("_", " ")}
                  </OpsStatusPill>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <InlineEmptyNotice title={emptyTitle} description={emptyDescription} />
      )}
    </OpsPanel>
  );
}

export default function BusinessPage() {
  const role = useAdminAuthStore((s) => s.role);
  const [overview, setOverview] = useState<BusinessControlOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);
        const nextOverview = await fetchBusinessControlOverview();
        if (!cancelled) {
          setOverview(nextOverview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load business control overview."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void loadOverview();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshNonce, role]);

  const highestPressureAccounts = useMemo(
    () => overview?.accounts.slice(0, 8) ?? [],
    [overview?.accounts]
  );

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Business Control is internal-only"
          description="This cockpit is reserved for Veltrix super admins because it exposes cross-account revenue, collections and commercial health."
          tone="warning"
          actions={
            <Link
              href="/overview"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to overview
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading business cockpit"
          description="Veltrix is pulling revenue, billing ops, collections and account health into the control panel."
        />
      </AdminShell>
    );
  }

  if (error || !overview) {
    return (
      <AdminShell>
        <StatePanel
          title="Business cockpit could not load"
          description={
            error ??
            "The internal business control panel did not return an overview payload for this session."
          }
          tone="warning"
          actions={
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Retry
            </button>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Business control"
        title="Business"
        description="Run the commercial machine from one internal cockpit: revenue posture, billing ops, collections and the accounts that need attention next."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
              Veltrix internal
            </p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone="success">{overview.revenue.activePaidAccounts} paid</OpsStatusPill>
              <OpsStatusPill tone="default">{overview.revenue.trialingAccounts} trialing</OpsStatusPill>
              <OpsStatusPill tone="warning">
                {overview.collections.failedPaymentCount} failed payments
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="MRR" value={formatCurrency(overview.revenue.mrr)} emphasis="primary" />
            <OpsMetricCard label="ARR run rate" value={formatCurrency(overview.revenue.arrRunRate)} />
            <OpsMetricCard label="Past due exposure" value={formatCurrency(overview.collections.pastDueExposure)} emphasis={overview.collections.pastDueExposure > 0 ? "warning" : "default"} />
            <OpsMetricCard label="Upgrade candidates" value={overview.queues.upgradeCandidates.length} emphasis={overview.queues.upgradeCandidates.length > 0 ? "warning" : "default"} />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <OpsPanel
            eyebrow="Revenue overview"
            title="Commercial mix"
            description="Track the high-level commercial posture before drilling into queues or individual accounts."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <OpsMetricCard label="Active paid" value={overview.revenue.activePaidAccounts} />
              <OpsMetricCard label="Trialing" value={overview.revenue.trialingAccounts} />
              <OpsMetricCard label="Free" value={overview.revenue.freeAccounts} />
              <OpsMetricCard label="New conversions" value={overview.revenue.newConversions} />
              <OpsMetricCard label="Upgrades" value={overview.revenue.upgrades} />
              <OpsMetricCard label="Churned" value={overview.revenue.churnedAccounts} emphasis={overview.revenue.churnedAccounts > 0 ? "warning" : "default"} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {overview.planMix.map((entry) => (
                <div key={entry.planId} className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{entry.label}</p>
                  <p className="mt-2 text-xl font-extrabold text-text">{entry.count}</p>
                </div>
              ))}
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Collections snapshot"
            title="Cash and renewal pressure"
            description="See what collected this month, where money is at risk and which renewals are close."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <OpsMetricCard label="Gross collected" value={formatCurrency(overview.collections.grossCollectedThisMonth)} />
              <OpsMetricCard label="Refunds" value={formatCurrency(overview.collections.refundTotalThisMonth)} emphasis={overview.collections.refundTotalThisMonth > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Net collected" value={formatCurrency(overview.collections.netCollectedThisMonth)} emphasis="primary" />
              <OpsMetricCard label="Upcoming renewals" value={overview.collections.upcomingRenewals} />
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <QueueList
            title="Billing ops queue"
            description="Accounts where collections or subscription posture need direct intervention."
            accounts={overview.queues.failedPayments.concat(
              overview.queues.pastDueAndGrace.filter(
                (account) =>
                  !overview.queues.failedPayments.some(
                    (failed) => failed.accountId === account.accountId
                  )
              )
            )}
            emptyTitle="Billing ops queue is clear"
            emptyDescription="There are no failed payments or past-due accounts needing immediate billing follow-up."
          />

          <QueueList
            title="Upgrade pressure"
            description="Accounts already near or past plan limits and most likely to hit Upgrade now / Pay and continue."
            accounts={overview.queues.upgradeCandidates}
            emptyTitle="No upgrade pressure right now"
            emptyDescription="No account is currently pushing hard enough into plan ceilings to require immediate commercial follow-up."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <OpsPanel
            eyebrow="Account health"
            title="Activation and underuse"
            description="Catch accounts that are paying but not activating, or that never made it through the first meaningful setup steps."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <OpsMetricCard label="No first project" value={overview.health.accountsWithoutFirstProject} emphasis={overview.health.accountsWithoutFirstProject > 0 ? "warning" : "default"} />
              <OpsMetricCard label="No live campaign" value={overview.health.accountsWithoutFirstLiveCampaign} emphasis={overview.health.accountsWithoutFirstLiveCampaign > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Paid but underused" value={overview.health.paidButUnderusedAccounts} emphasis={overview.health.paidButUnderusedAccounts > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Grace state" value={overview.health.graceStateAccounts} />
              <OpsMetricCard label="Blocked by entitlement" value={overview.health.accountsBlockedByEntitlement} emphasis={overview.health.accountsBlockedByEntitlement > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Enterprise review" value={overview.health.enterpriseReviewAccounts} />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Pressure map"
            title="Where limits are tightening"
            description="A quick count of accounts crossing the warning threshold on each commercial limit."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <OpsMetricCard label="Projects" value={overview.growthPressure.nearProjectLimit} />
              <OpsMetricCard label="Campaigns" value={overview.growthPressure.nearCampaignLimit} />
              <OpsMetricCard label="Quests" value={overview.growthPressure.nearQuestLimit} />
              <OpsMetricCard label="Raids" value={overview.growthPressure.nearRaidLimit} />
              <OpsMetricCard label="Seats" value={overview.growthPressure.nearSeatLimit} />
              <OpsMetricCard label="Providers" value={overview.growthPressure.nearProviderLimit} />
            </div>
          </OpsPanel>
        </div>

        <OpsPanel
          eyebrow="Accounts"
          title="Accounts needing the next look"
          description="The first rows here are the most urgent commercial accounts in the current operating window."
        >
          {highestPressureAccounts.length ? (
            <div className="space-y-3">
              {highestPressureAccounts.map((account) => (
                <Link
                  key={account.accountId}
                  href={`/business/accounts/${account.accountId}`}
                  className="block rounded-[22px] border border-line bg-card2 p-4 transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-text">{account.accountName}</p>
                        <OpsStatusPill tone={healthTone(account.commercialHealth)}>
                          {account.commercialHealth.replaceAll("_", " ")}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        {account.planName} | {account.billingStatus} | renewal {formatDateLabel(account.nextBillingAt)}
                      </p>
                    </div>

                    <div className="grid min-w-[260px] gap-2 text-right text-sm text-sub md:grid-cols-2">
                      <p>
                        Projects {account.usage.projects}/{account.limits.projects}
                      </p>
                      <p>
                        Campaigns {account.usage.activeCampaigns}/{account.limits.campaigns}
                      </p>
                      <p>
                        Seats {account.usage.billableSeats}/{account.limits.seats}
                      </p>
                      <p>{formatCurrency(account.currentMrrContribution)} MRR</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <InlineEmptyNotice
              title="No accounts need review"
              description="The commercial queues are currently quiet and there are no accounts bubbling up into the first review set."
            />
          )}
        </OpsPanel>
      </PortalPageFrame>
    </AdminShell>
  );
}
