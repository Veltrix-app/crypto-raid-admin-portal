"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import WorkspaceSettingsFrame from "@/components/layout/shell/WorkspaceSettingsFrame";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
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
import {
  fetchPortalCustomerBillingWorkspace,
} from "@/lib/billing/portal-billing";
import { SupportSurfaceContextPanel } from "@/components/support/SupportSurfaceContextPanel";
import type {
  PortalBillingUsageItem,
  PortalCustomerBillingWorkspace,
} from "@/lib/billing/account-billing";

function formatDateLabel(value?: string) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function usagePressureTone(pressure: PortalBillingUsageItem["pressure"]) {
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

function usagePressureLabel(pressure: PortalBillingUsageItem["pressure"]) {
  switch (pressure) {
    case "blocked":
      return "Blocked";
    case "upgrade_recommended":
      return "Upgrade now";
    case "watching":
      return "Watching";
    default:
      return "Comfortable";
  }
}

function overallPressureLabel(pressure: PortalCustomerBillingWorkspace["overallPressure"]) {
  switch (pressure) {
    case "blocked":
      return "Growth is blocked";
    case "upgrade_recommended":
      return "Upgrade recommended";
    case "watching":
      return "Healthy but growing";
    default:
      return "Capacity looks comfortable";
  }
}

function paymentMethodTone(status?: string) {
  switch (status) {
    case "requires_attention":
      return "warning";
    case "ready":
      return "success";
    default:
      return "default";
  }
}

function paymentMethodLabel(status?: string) {
  switch (status) {
    case "requires_attention":
      return "Needs attention";
    case "ready":
      return "Payment method ready";
    default:
      return "Payment method missing";
  }
}

function subscriptionLabel(status?: string) {
  switch (status) {
    case "past_due":
      return "Past due";
    case "trialing":
      return "Trialing";
    case "enterprise_managed":
      return "Enterprise managed";
    case "active":
      return "Active";
    case "canceled":
      return "Canceled";
    case "grace":
      return "Grace";
    default:
      return "Free";
  }
}

function invoiceStatusTone(status: string) {
  switch (status) {
    case "paid":
      return "success";
    case "open":
    case "uncollectible":
      return "warning";
    case "void":
      return "default";
    default:
      return "default";
  }
}

function UsageRow({ item }: { item: PortalBillingUsageItem }) {
  return (
    <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-text">{item.label}</p>
            <OpsStatusPill tone={usagePressureTone(item.pressure)}>
              {usagePressureLabel(item.pressure)}
            </OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">{item.hint}</p>
        </div>
        <p className="text-lg font-extrabold text-text">
          {item.current} / {item.limit}
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
        <div
          className={`h-full rounded-full ${
            item.pressure === "blocked"
              ? "bg-rose-400"
              : item.pressure === "upgrade_recommended"
                ? "bg-amber-300"
                : item.pressure === "watching"
                  ? "bg-primary/80"
                  : "bg-emerald-400"
          }`}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}

function SettingsBillingContent() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const [workspace, setWorkspace] = useState<PortalCustomerBillingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!primaryAccount?.id) {
        setWorkspace(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextWorkspace = await fetchPortalCustomerBillingWorkspace(primaryAccount.id);
        if (!cancelled) {
          setWorkspace(nextWorkspace);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load workspace billing surface."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [primaryAccount?.id, refreshNonce]);

  const nextBillingDate = useMemo(() => {
    if (!workspace?.subscription) {
      return null;
    }

    return (
      workspace.subscription.trialEndsAt ??
      workspace.subscription.currentPeriodEnd ??
      workspace.subscription.graceUntil ??
      null
    );
  }, [workspace?.subscription]);

  const openInvoiceCount = useMemo(
    () =>
      workspace?.invoices.filter(
        (invoice) => invoice.status === "open" || invoice.status === "uncollectible"
      ).length ?? 0,
    [workspace?.invoices]
  );

  if (!primaryAccount) {
    return (
      <StatePanel
        title="No workspace account is attached yet"
        description="Billing follows the workspace account layer. Create or accept a workspace first, then this billing surface can load the live plan and invoice posture."
        tone="warning"
        actions={
          <Link
            href="/getting-started"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
          >
            Open getting started
          </Link>
        }
      />
    );
  }

  if (loading) {
    return (
      <LoadingState
        title="Loading billing workspace"
        description="Veltrix is resolving plan posture, invoice history and usage pressure for the current workspace account."
      />
    );
  }

  if (error || !workspace) {
    return (
      <StatePanel
        title="Billing workspace could not load"
        description={
          error ??
          "The billing workspace did not return a current plan or account payload for this surface."
        }
        tone="warning"
        actions={
          <button
            type="button"
            onClick={() => {
              setRefreshNonce((value) => value + 1);
            }}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <WorkspaceSettingsFrame
      title="Billing"
      description="Run the commercial posture of this workspace from one place: current plan, capacity pressure, invoice history and the next safe upgrade route."
      workspaceName={workspace.accountName}
      healthPills={[
        {
          label: workspace.currentPlan?.name ?? "No plan",
          tone: workspace.currentPlan ? "default" : "warning",
        },
        {
          label: overallPressureLabel(workspace.overallPressure),
          tone:
            workspace.overallPressure === "blocked"
              ? "danger"
              : workspace.overallPressure === "upgrade_recommended"
                ? "warning"
                : workspace.overallPressure === "watching"
                  ? "default"
                  : "success",
        },
        {
          label: paymentMethodLabel(workspace.billingProfile?.paymentMethodStatus),
          tone: paymentMethodTone(workspace.billingProfile?.paymentMethodStatus),
        },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetricCard
          label="Current plan"
          value={workspace.currentPlan?.name ?? "Free"}
          emphasis="primary"
        />
        <OpsMetricCard
          label="Subscription"
          value={subscriptionLabel(workspace.subscription?.status)}
          sub={`Next window: ${formatDateLabel(nextBillingDate ?? undefined)}`}
          emphasis={
            workspace.subscription?.status === "past_due" ||
            workspace.subscription?.status === "canceled"
              ? "warning"
              : "default"
          }
        />
        <OpsMetricCard
          label="Open invoices"
          value={openInvoiceCount}
          sub={
            openInvoiceCount
              ? "There is invoice follow-up waiting."
              : "Collections look clean right now."
          }
          emphasis={openInvoiceCount ? "warning" : "default"}
        />
        <OpsMetricCard
          label="Billable seats"
          value={
            workspace.entitlements
              ? `${workspace.entitlements.currentBillableSeats} / ${workspace.entitlements.includedBillableSeats}`
              : "0 / 0"
          }
          emphasis={
            workspace.usage.find((item) => item.key === "seats")?.pressure === "upgrade_recommended" ||
            workspace.usage.find((item) => item.key === "seats")?.pressure === "blocked"
              ? "warning"
              : "default"
          }
        />
      </div>

      <div className="grid gap-4 xl:items-start xl:grid-cols-[1.05fr_0.95fr]">
        <OpsPanel
          eyebrow="Usage overview"
          title="Capacity posture"
          description="Track exactly where this workspace is pushing into plan ceilings before a builder flow or invite action gets blocked."
        >
          <div className="space-y-4">
            {workspace.usage.map((item) => (
              <UsageRow key={item.key} item={item} />
            ))}
          </div>
        </OpsPanel>

        <div className="space-y-4">
          <OpsPriorityLink
            href={workspace.upgradeUrl ?? workspace.pricingUrl}
            title={
              workspace.nextPlan
                ? `Move to ${workspace.nextPlan.name}`
                : "Open pricing workspace"
            }
            body={workspace.recommendedAction}
            cta={
              workspace.nextPlan
                ? workspace.nextPlan.isEnterprise
                  ? "Talk to us"
                  : "Upgrade now"
                : "View pricing"
            }
            emphasis={workspace.overallPressure !== "comfortable"}
          />

          <OpsPanel
            eyebrow="Posture summary"
            title="Billing signal"
            description="A fast commercial read on whether the current plan, payment posture and renewal window still fit the workspace."
            tone="accent"
          >
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-text">Commercial posture</p>
                  <OpsStatusPill
                    tone={
                      workspace.overallPressure === "blocked"
                        ? "danger"
                        : workspace.overallPressure === "upgrade_recommended"
                          ? "warning"
                          : workspace.overallPressure === "watching"
                            ? "default"
                            : "success"
                    }
                  >
                    {overallPressureLabel(workspace.overallPressure)}
                  </OpsStatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{workspace.recommendedAction}</p>
              </div>

              <OpsSnapshotRow
                label="Subscription status"
                value={subscriptionLabel(workspace.subscription?.status)}
              />
              <OpsSnapshotRow
                label="Payment method"
                value={paymentMethodLabel(workspace.billingProfile?.paymentMethodStatus)}
              />
              <OpsSnapshotRow
                label="Next billing window"
                value={formatDateLabel(nextBillingDate ?? undefined)}
              />
            </div>
          </OpsPanel>

          <SupportSurfaceContextPanel
            title="Billing-linked support handoffs"
            description="Tickets land here once generic support becomes invoice follow-up, payment method recovery or commercial account work."
            handoffType="billing"
            customerAccountId={workspace.accountId}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:items-start xl:grid-cols-[1.02fr_0.98fr]">
        <OpsPanel
          eyebrow="Invoice history"
          title="Recent invoices"
          description="Track the last billing events, payment state and which invoice needs follow-up."
        >
          {workspace.invoices.length ? (
            <div className="space-y-3">
              {workspace.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-text">
                          {invoice.invoiceNumber || invoice.stripeInvoiceId || "Invoice"}
                        </p>
                        <OpsStatusPill tone={invoiceStatusTone(invoice.status)}>
                          {invoice.status}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        Due {formatDateLabel(invoice.dueAt)} | Paid {formatDateLabel(invoice.paidAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-text">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-sub">
                        {invoice.collectionStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>

                  {invoice.hostedInvoiceUrl || invoice.invoicePdfUrl ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
                        >
                          Open hosted invoice
                        </a>
                      ) : null}
                      {invoice.invoicePdfUrl ? (
                        <a
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
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
              description="Invoices will appear here once Stripe billing is active for this workspace account."
            />
          )}
        </OpsPanel>

        <OpsPanel
          eyebrow="Plan ladder"
          title="Available tiers"
          description="See the current plan plus the next self-serve or enterprise route this workspace can grow into."
        >
          <div className="space-y-3">
            {workspace.plans.map((plan) => {
              const isCurrent = plan.id === workspace.currentPlan?.id;
              const isNext = plan.id === workspace.nextPlan?.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-[22px] border p-4 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : isNext
                        ? "border-amber-300/40 bg-amber-300/10"
                        : "border-white/[0.04] bg-white/[0.025]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-extrabold text-text">{plan.name}</p>
                        <OpsStatusPill
                          tone={isCurrent ? "success" : isNext ? "warning" : "default"}
                        >
                          {isCurrent ? "Current" : isNext ? "Next" : "Available"}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-2 text-sm text-sub">
                        {plan.isEnterprise
                          ? "Custom commercial posture"
                          : `${formatCurrency(plan.priceMonthly)}/month`}
                      </p>
                    </div>

                    {!isCurrent ? (
                      <a
                        href={
                          plan.isEnterprise
                            ? workspace.supportUrl
                            : `${workspace.pricingUrl}&plan=${plan.id}`
                        }
                        className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
                      >
                        {plan.isEnterprise ? "Contact enterprise" : "Review plan"}
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-sub md:grid-cols-2">
                    <p>Projects: {plan.projectsLimit}</p>
                    <p>Campaigns: {plan.campaignsLimit}</p>
                    <p>Quests: {plan.questsLimit}</p>
                    <p>Raids: {plan.raidsLimit}</p>
                    <p>Providers: {plan.providersLimit}</p>
                    <p>Billable seats: {plan.includedBillableSeats}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </OpsPanel>
      </div>
    </WorkspaceSettingsFrame>
  );
}

export default function SettingsBillingPage() {
  return (
    <AdminShell>
      <SettingsBillingContent />
    </AdminShell>
  );
}
