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
  OpsCommandRead,
  OpsMetricCard,
  OpsPanel,
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
  const billingOpsAccounts = useMemo(() => {
    if (!overview) return [];

    return overview.queues.failedPayments.concat(
      overview.queues.pastDueAndGrace.filter(
        (account) =>
          !overview.queues.failedPayments.some((failed) => failed.accountId === account.accountId)
      )
    );
  }, [overview]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Business Control is internal-only"
          description="This cockpit is reserved for VYNTRO super admins because it exposes cross-account revenue, collections and commercial health."
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
          description="VYNTRO is pulling revenue, billing ops, collections and account health into the control panel."
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
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-2.5 md:grid-cols-4">
              <OpsMetricCard label="MRR" value={formatCurrency(overview.revenue.mrr)} />
              <OpsMetricCard label="ARR run rate" value={formatCurrency(overview.revenue.arrRunRate)} />
              <OpsMetricCard label="Past due exposure" value={formatCurrency(overview.collections.pastDueExposure)} />
              <OpsMetricCard label="Upgrade candidates" value={overview.queues.upgradeCandidates.length} />
            </div>

            <OpsCommandRead
              eyebrow="Commercial command read"
              title="Read revenue pressure first, then choose collections, activation, or expansion."
              description="This page should answer what is moving now, which account needs a human move next, and where hidden billing or activation drag is building beneath the topline."
              now={
                overview.collections.failedPaymentCount > 0
                  ? `${overview.collections.failedPaymentCount} payment failures need billing ops attention`
                  : "Collections look calm right now"
              }
              next={
                highestPressureAccounts[0]
                  ? `Open ${highestPressureAccounts[0].accountName} as the next commercial account`
                  : "No urgent account is bubbling to the top"
              }
              watch={
                overview.health.paidButUnderusedAccounts > 0
                  ? `${overview.health.paidButUnderusedAccounts} paid accounts are drifting in activation`
                  : "Activation drift is currently low"
              }
              rail={
                <OpsPanel
                  eyebrow="Business routes"
                  title="Internal board"
                  description="Keep related operator routes close without turning the hero into a badge wall."
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <OpsStatusPill tone="default">{overview.revenue.activePaidAccounts} paid</OpsStatusPill>
                      <OpsStatusPill tone="default">{overview.revenue.trialingAccounts} trialing</OpsStatusPill>
                      <OpsStatusPill tone="default">
                        {overview.collections.failedPaymentCount} failed payments
                      </OpsStatusPill>
                    </div>
                    <Link
                      href="/qa"
                      className="inline-flex items-center rounded-full border border-white/[0.025] bg-white/[0.014] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub transition hover:border-white/[0.045] hover:text-text"
                    >
                      QA board
                    </Link>
                  </div>
                </OpsPanel>
              }
            />
          </div>
        }
      >
        <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
          <OpsPanel
            eyebrow="Commercial model"
            title="Revenue, plan mix and collection read"
            description="Keep the money view together first: revenue posture, collection movement and plan distribution."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                  Revenue mix
                </p>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  <OpsMetricCard label="Active paid" value={overview.revenue.activePaidAccounts} />
                  <OpsMetricCard label="Trialing" value={overview.revenue.trialingAccounts} />
                  <OpsMetricCard label="Free" value={overview.revenue.freeAccounts} />
                  <OpsMetricCard label="New conversions" value={overview.revenue.newConversions} />
                  <OpsMetricCard label="Upgrades" value={overview.revenue.upgrades} />
                  <OpsMetricCard label="Churned" value={overview.revenue.churnedAccounts} />
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                  Collections
                </p>
                <OpsMetricCard label="Gross collected" value={formatCurrency(overview.collections.grossCollectedThisMonth)} />
                <OpsMetricCard label="Refunds" value={formatCurrency(overview.collections.refundTotalThisMonth)} />
                <OpsMetricCard label="Net collected" value={formatCurrency(overview.collections.netCollectedThisMonth)} />
                <OpsMetricCard label="Upcoming renewals" value={overview.collections.upcomingRenewals} />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                Plan mix
              </p>
              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                {overview.planMix.map((entry) => (
                  <div key={entry.planId} className="rounded-[14px] border border-white/[0.025] bg-white/[0.014] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{entry.label}</p>
                    <p className="mt-1.5 text-[0.96rem] font-semibold text-text">{entry.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Queue rail"
            title="Where the team acts next"
            description="Collections and upgrade pressure belong in one action rail, not two competing dashboards."
          >
            <div className="space-y-3">
              <QueueSummary
                title="Billing ops"
                count={billingOpsAccounts.length}
                body={
                  billingOpsAccounts.length
                    ? "Payment or past-due accounts need a commercial follow-up."
                    : "No failed payments or past-due accounts need immediate follow-up."
                }
              />
              <QueueSummary
                title="Upgrade pressure"
                count={overview.queues.upgradeCandidates.length}
                body={
                  overview.queues.upgradeCandidates.length
                    ? "Accounts are near plan ceilings and may need an expansion move."
                    : "No account is pressing hard into plan limits right now."
                }
              />

              <div className="space-y-2.5 border-t border-white/[0.025] pt-3">
                {overview.queues.upgradeCandidates.slice(0, 4).map((account) => (
                  <AccountMiniRow key={account.accountId} account={account} />
                ))}
                {overview.queues.upgradeCandidates.length === 0 ? (
                  <p className="text-[12px] leading-5 text-sub">
                    Upgrade pressure will appear here as accounts move closer to commercial limits.
                  </p>
                ) : null}
              </div>
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
          <OpsPanel
            eyebrow="Account health"
            title="Activation, underuse and limit pressure"
            description="This is the operating read after revenue: who is paying but not moving, and where limits are tightening."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                  Health
                </p>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  <OpsMetricCard label="No first project" value={overview.health.accountsWithoutFirstProject} />
                  <OpsMetricCard label="No live campaign" value={overview.health.accountsWithoutFirstLiveCampaign} />
                  <OpsMetricCard label="Paid but underused" value={overview.health.paidButUnderusedAccounts} />
                  <OpsMetricCard label="Grace state" value={overview.health.graceStateAccounts} />
                  <OpsMetricCard label="Blocked entitlement" value={overview.health.accountsBlockedByEntitlement} />
                  <OpsMetricCard label="Enterprise review" value={overview.health.enterpriseReviewAccounts} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                  Limit pressure
                </p>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  <OpsMetricCard label="Projects" value={overview.growthPressure.nearProjectLimit} />
                  <OpsMetricCard label="Campaigns" value={overview.growthPressure.nearCampaignLimit} />
                  <OpsMetricCard label="Quests" value={overview.growthPressure.nearQuestLimit} />
                  <OpsMetricCard label="Raids" value={overview.growthPressure.nearRaidLimit} />
                  <OpsMetricCard label="Seats" value={overview.growthPressure.nearSeatLimit} />
                  <OpsMetricCard label="Providers" value={overview.growthPressure.nearProviderLimit} />
                </div>
              </div>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Accounts"
            title="Next look"
            description="The first accounts the commercial team should open in this operating window."
          >
            {highestPressureAccounts.length ? (
              <div className="space-y-2.5">
                {highestPressureAccounts.map((account) => (
                  <AccountMiniRow key={account.accountId} account={account} showUsage />
                ))}
              </div>
            ) : (
              <InlineEmptyNotice
                title="No accounts need review"
                description="The commercial queues are currently quiet and there are no accounts bubbling up into the first review set."
              />
            )}
          </OpsPanel>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}

function QueueSummary({
  title,
  count,
  body,
}: {
  title: string;
  count: number;
  body: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.025] bg-white/[0.014] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-text">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-sub">{body}</p>
        </div>
        <span className="rounded-full border border-white/[0.025] bg-white/[0.018] px-2.5 py-1 text-[10px] font-bold text-sub">
          {count}
        </span>
      </div>
    </div>
  );
}

function AccountMiniRow({
  account,
  showUsage = false,
}: {
  account: BusinessControlAccountSummary;
  showUsage?: boolean;
}) {
  return (
    <Link
      href={`/business/accounts/${account.accountId}`}
      className="block rounded-[16px] border border-white/[0.025] bg-white/[0.014] px-3 py-3 transition hover:border-white/[0.045]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-text">{account.accountName}</p>
          <p className="mt-1 text-[11px] leading-5 text-sub">
            {account.planName} | {account.billingStatus} | renewal{" "}
            {formatDateLabel(account.nextBillingAt)}
          </p>
        </div>
        <OpsStatusPill tone="default">{account.commercialHealth.replaceAll("_", " ")}</OpsStatusPill>
      </div>

      {showUsage ? (
        <div className="mt-3 grid gap-2 border-t border-white/[0.025] pt-3 text-[11px] text-sub sm:grid-cols-2">
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
      ) : null}
    </Link>
  );
}
