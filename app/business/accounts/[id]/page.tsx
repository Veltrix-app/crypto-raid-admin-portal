"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { fetchBusinessControlAccountDetail } from "@/lib/billing/business-dashboard";
import type {
  BusinessControlAccountDetail,
  BusinessControlAccountSummary,
} from "@/lib/billing/business-control";
import type { PortalBillingUsageItem } from "@/lib/billing/account-billing";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(value: string | null | undefined) {
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
    case "refunded":
      return "danger";
    case "renewing_soon":
      return "default";
    default:
      return "success";
  }
}

function usageTone(pressure: PortalBillingUsageItem["pressure"]) {
  switch (pressure) {
    case "blocked":
      return "danger";
    case "upgrade_recommended":
      return "warning";
    case "watching":
      return "default";
    default:
      return "success";
  }
}

function UsageRow({ item }: { item: PortalBillingUsageItem }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-text">{item.label}</p>
            <OpsStatusPill tone={usageTone(item.pressure)}>
              {item.pressure.replaceAll("_", " ")}
            </OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">{item.hint}</p>
        </div>
        <p className="text-lg font-extrabold text-text">
          {item.current} / {item.limit}
        </p>
      </div>
    </div>
  );
}

export default function BusinessAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const role = useAdminAuthStore((s) => s.role);
  const [detail, setDetail] = useState<BusinessControlAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!params?.id || role !== "super_admin") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextDetail = await fetchBusinessControlAccountDetail(params.id);
        if (!cancelled) {
          setDetail(nextDetail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetail(null);
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load business account detail."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [params?.id, refreshNonce, role]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Business account drilldown is internal-only"
          description="Only Veltrix super admins can inspect cross-account billing, revenue and invoice posture at this depth."
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
          title="Loading business account detail"
          description="Veltrix is resolving plan posture, collections and commercial health for the selected account."
        />
      </AdminShell>
    );
  }

  if (error || !detail) {
    return (
      <AdminShell>
        <StatePanel
          title="Business account detail could not load"
          description={
            error ?? "This account detail did not return a valid business payload."
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
        eyebrow="Business account"
        title={detail.account.accountName}
        description="Inspect the full commercial posture of this workspace account: plan, invoices, pressure and the current next move."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Commercial health</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={healthTone(detail.account.commercialHealth)}>
                {detail.account.commercialHealth.replaceAll("_", " ")}
              </OpsStatusPill>
              <OpsStatusPill tone={collectionTone(detail.account.collectionStatus)}>
                {detail.account.collectionStatus.replaceAll("_", " ")}
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="Plan" value={detail.account.planName} emphasis="primary" />
            <OpsMetricCard label="Billing status" value={detail.account.billingStatus} />
            <OpsMetricCard label="MRR contribution" value={formatCurrency(detail.account.currentMrrContribution)} emphasis={detail.account.currentMrrContribution > 0 ? "primary" : "default"} />
            <OpsMetricCard label="Open invoices" value={detail.account.openInvoiceCount} emphasis={detail.account.openInvoiceCount > 0 ? "warning" : "default"} />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <OpsPanel
            eyebrow="Usage"
            title="Entitlement posture"
            description="See exactly where this account is pushing into the current plan limits."
          >
            <div className="space-y-4">
              {detail.workspace.usage.map((item) => (
                <UsageRow key={item.key} item={item} />
              ))}
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Account summary"
            title="Commercial read"
            description="This is the fast founder/operator summary for the current account."
            tone="accent"
          >
            <div className="space-y-3">
              <OpsSnapshotRow label="Activation status" value={detail.account.activationStatus.replaceAll("_", " ")} />
              <OpsSnapshotRow label="Payment method" value={detail.account.paymentMethodStatus.replaceAll("_", " ")} />
              <OpsSnapshotRow label="Renewal window" value={formatDateLabel(detail.account.nextBillingAt)} />
              <OpsSnapshotRow label="Outstanding exposure" value={formatCurrency(detail.account.amountRemaining)} />
            </div>

            <div className="mt-5 grid gap-3">
              <OpsPriorityLink
                href={detail.workspace.upgradeUrl ?? detail.workspace.pricingUrl}
                title={detail.workspace.nextPlan ? `Move to ${detail.workspace.nextPlan.name}` : "Open pricing"}
                body={detail.workspace.recommendedAction}
                cta={detail.workspace.nextPlan?.isEnterprise ? "Talk to us" : "Review upgrade"}
                emphasis={detail.account.commercialHealth !== "healthy"}
              />
            </div>
          </OpsPanel>
        </div>

        <OpsPanel
          eyebrow="Invoices"
          title="Recent invoice history"
          description="Use invoice history to confirm payment posture before changing plan or support treatment."
        >
          {detail.workspace.invoices.length ? (
            <div className="space-y-3">
              {detail.workspace.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-[22px] border border-line bg-card2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-text">
                          {invoice.invoiceNumber || invoice.stripeInvoiceId || "Invoice"}
                        </p>
                        <OpsStatusPill tone={collectionTone(invoice.collectionStatus)}>
                          {invoice.collectionStatus.replaceAll("_", " ")}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        Due {formatDateLabel(invoice.dueAt)} | Paid {formatDateLabel(invoice.paidAt)}
                      </p>
                    </div>

                    <p className="text-lg font-extrabold text-text">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>

                  {invoice.hostedInvoiceUrl || invoice.invoicePdfUrl ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
                        >
                          Open hosted invoice
                        </a>
                      ) : null}
                      {invoice.invoicePdfUrl ? (
                        <a
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
                        >
                          Open PDF
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyNotice
              title="No synced invoices yet"
              description="Invoices will appear here once this workspace account starts collecting through Stripe."
            />
          )}
        </OpsPanel>
      </PortalPageFrame>
    </AdminShell>
  );
}
