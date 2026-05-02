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
  OpsCommandRead,
  OpsMetricCard,
  OpsPanel,
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

function strongestUsagePressure(workspace: PortalCustomerBillingWorkspace) {
  const priority: Record<PortalBillingUsageItem["pressure"], number> = {
    blocked: 4,
    upgrade_recommended: 3,
    watching: 2,
    comfortable: 1,
  };

  return [...workspace.usage].sort(
    (a, b) => priority[b.pressure] - priority[a.pressure] || b.percent - a.percent
  )[0];
}

function planBuyerFit(plan: BillingPlan) {
  if (plan.isEnterprise) {
    return "Large launches, managed limits and custom commercial support.";
  }

  if (plan.priceMonthly === 0) {
    return "Starter workspace for proving the first campaign motion.";
  }

  if (plan.raidsLimit >= 25 || plan.campaignsLimit >= 10) {
    return "Growth teams running multiple campaigns, raids and reward flows.";
  }

  return "Small teams that need more campaign room without enterprise overhead.";
}

function planRiskLine(plan: BillingPlan, workspace: PortalCustomerBillingWorkspace) {
  if (plan.id === workspace.currentPlan?.id) {
    return "Watch limits closely before adding more live campaigns.";
  }

  if (plan.id === workspace.nextPlan?.id) {
    return "Recommended next ceiling based on current usage pressure.";
  }

  if (plan.isEnterprise) {
    return "Best when launch volume should not be capped by self-serve limits.";
  }

  return "Review when this capacity matches the next campaign window.";
}

function UsageRow({ item }: { item: PortalBillingUsageItem }) {
  return (
    <div className="rounded-[16px] border border-white/[0.025] bg-white/[0.014] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <p className="text-[13px] font-semibold text-text">{item.label}</p>
            <OpsStatusPill tone="default">
              {usagePressureLabel(item.pressure)}
            </OpsStatusPill>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-sub">{item.hint}</p>
        </div>
        <p className="text-[13px] font-semibold text-text">
          {item.current} / {item.limit}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full ${
            item.pressure === "blocked"
              ? "bg-rose-300/70"
              : item.pressure === "upgrade_recommended"
                ? "bg-primary/70"
                : item.pressure === "watching"
                  ? "bg-white/35"
                  : "bg-emerald-300/55"
          }`}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}

type BillingPlan = PortalCustomerBillingWorkspace["plans"][number];

function formatPlanPrice(plan: BillingPlan) {
  if (plan.isEnterprise) {
    return "Custom";
  }

  if (plan.priceMonthly === 0) {
    return "Free";
  }

  return `${formatCurrency(plan.priceMonthly)}/mo`;
}

function planHref(plan: BillingPlan, workspace: PortalCustomerBillingWorkspace) {
  if (plan.isEnterprise) {
    return workspace.supportUrl;
  }

  return `${workspace.pricingUrl}&plan=${plan.id}`;
}

function PlanCard({
  plan,
  workspace,
  isCurrent,
  isNext,
}: {
  plan: BillingPlan;
  workspace: PortalCustomerBillingWorkspace;
  isCurrent: boolean;
  isNext: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border p-3.5 ${
        isNext
          ? "border-primary/24 bg-[linear-gradient(180deg,rgba(186,255,59,0.055),rgba(10,13,19,0.98))]"
          : "border-white/[0.025] bg-white/[0.014]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[1rem] font-semibold tracking-[-0.02em] text-text">{plan.name}</p>
            <OpsStatusPill tone="default">
              {isCurrent ? "Current" : isNext ? "Recommended" : "Available"}
            </OpsStatusPill>
          </div>
          <p className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-text">
            {formatPlanPrice(plan)}
          </p>
        </div>

        {!isCurrent ? (
          <a
            href={planHref(plan, workspace)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
              isNext
                ? "bg-primary text-black hover:brightness-105"
                : "border border-white/[0.04] text-sub hover:border-white/[0.08] hover:text-text"
            }`}
          >
            {plan.isEnterprise ? "Contact" : isNext ? "Upgrade" : "Review"}
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 text-[11px] text-sub sm:grid-cols-2">
        <p>Projects: {plan.projectsLimit}</p>
        <p>Campaigns: {plan.campaignsLimit}</p>
        <p>Quests: {plan.questsLimit}</p>
        <p>Raids: {plan.raidsLimit}</p>
        <p>Providers: {plan.providersLimit}</p>
        <p>Seats: {plan.includedBillableSeats}</p>
      </div>

      <div className="mt-4 rounded-[14px] border border-white/[0.024] bg-white/[0.012] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
          Buyer fit
        </p>
        <p className="mt-1.5 text-[12px] leading-5 text-text">{planBuyerFit(plan)}</p>
        <p className="mt-2 text-[11px] leading-5 text-sub">{planRiskLine(plan, workspace)}</p>
      </div>
    </div>
  );
}

function BillingUpgradeHero({
  workspace,
  nextBillingDate,
  openInvoiceCount,
}: {
  workspace: PortalCustomerBillingWorkspace;
  nextBillingDate: string | null;
  openInvoiceCount: number;
}) {
  const currentPlan = workspace.currentPlan;
  const nextPlan = workspace.nextPlan;
  const upgradeHref = workspace.upgradeUrl ?? workspace.pricingUrl;
  const cta = nextPlan ? (nextPlan.isEnterprise ? "Talk to sales" : "Upgrade now") : "View plans";

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/[0.028] bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.08),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.99),rgba(7,9,14,0.99))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-stretch">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/90">
            Recommended upgrade path
          </p>
          <h2 className="mt-2 max-w-3xl text-[1.35rem] font-semibold tracking-[-0.04em] text-text md:text-[1.7rem]">
            {nextPlan
              ? `${workspace.accountName} can unlock more room with ${nextPlan.name}.`
              : `${workspace.accountName} is on the right plan for now.`}
          </h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
            {workspace.recommendedAction}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={upgradeHref}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-[12px] font-bold text-black transition hover:brightness-105"
            >
              {cta}
            </a>
            <a
              href={workspace.pricingUrl}
              className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-[12px] font-bold text-sub transition hover:border-white/[0.08] hover:text-text"
            >
              Compare plans
            </a>
          </div>
        </div>

        <div className="grid gap-2.5 rounded-[18px] border border-white/[0.025] bg-white/[0.014] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Current
            </span>
            <span className="text-[13px] font-semibold text-text">
              {currentPlan?.name ?? "Free"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Next best
            </span>
            <span className="text-[13px] font-semibold text-text">
              {nextPlan?.name ?? "No upgrade needed"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Renewal
            </span>
            <span className="text-[13px] font-semibold text-text">
              {formatDateLabel(nextBillingDate ?? undefined)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Invoices
            </span>
            <span className="text-[13px] font-semibold text-text">
              {openInvoiceCount ? `${openInvoiceCount} open` : "Clean"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CriticalUsageStrip({
  workspace,
  nextBillingDate,
  openInvoiceCount,
}: {
  workspace: PortalCustomerBillingWorkspace;
  nextBillingDate: string | null;
  openInvoiceCount: number;
}) {
  const strongestPressure = strongestUsagePressure(workspace);

  return (
    <div className="grid gap-2.5 md:grid-cols-4">
      <OpsMetricCard
        label="Current plan"
        value={workspace.currentPlan?.name ?? "Free"}
        sub={workspace.nextPlan ? `Next best: ${workspace.nextPlan.name}` : "No upgrade needed"}
        emphasis="primary"
      />
      <OpsMetricCard
        label="Capacity signal"
        value={strongestPressure ? usagePressureLabel(strongestPressure.pressure) : "Clean"}
        sub={
          strongestPressure
            ? `${strongestPressure.label}: ${strongestPressure.current} / ${strongestPressure.limit}`
            : "No usage pressure detected."
        }
        emphasis={
          strongestPressure?.pressure === "blocked" ||
          strongestPressure?.pressure === "upgrade_recommended"
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
      />
      <OpsMetricCard
        label="Renewal"
        value={formatDateLabel(nextBillingDate ?? undefined)}
        sub={paymentMethodLabel(workspace.billingProfile?.paymentMethodStatus)}
      />
    </div>
  );
}

function PlanComparisonGrid({ workspace }: { workspace: PortalCustomerBillingWorkspace }) {
  return (
    <OpsPanel
      eyebrow="Plan ladder"
      title="Pick the plan that keeps campaigns moving"
      description="Plans are shown before invoices because this is the upgrade decision surface: choose the next growth ceiling first, then validate usage pressure."
    >
      <div className="grid gap-3 xl:grid-cols-2">
        {workspace.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            workspace={workspace}
            isCurrent={plan.id === workspace.currentPlan?.id}
            isNext={plan.id === workspace.nextPlan?.id}
          />
        ))}
      </div>
    </OpsPanel>
  );
}

function BillingOpsDiagnostics({
  workspace,
  nextBillingDate,
}: {
  workspace: PortalCustomerBillingWorkspace;
  nextBillingDate: string | null;
}) {
  return (
    <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-4">
        <OpsPanel
          eyebrow="Capacity proof"
          title="What is pushing the upgrade"
          description="Usage explains why a plan change matters before the workspace hits a hard limit."
        >
          <div className="space-y-2.5">
            {workspace.usage.map((item) => (
              <UsageRow key={item.key} item={item} />
            ))}
          </div>
        </OpsPanel>

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
                  className="rounded-[16px] border border-white/[0.025] bg-white/[0.014] p-3.5"
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
                          className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-white/[0.08] hover:text-text"
                        >
                          Open hosted invoice
                        </a>
                      ) : null}
                      {invoice.invoicePdfUrl ? (
                        <a
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-white/[0.08] hover:text-text"
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
      </div>

      <div className="space-y-4">
        <OpsPanel
          eyebrow="Billing signal"
          title="Account readiness"
          description="Keep payment and renewal context close to the upgrade action."
        >
          <div className="space-y-2.5">
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
          tone: "default",
        },
        {
          label: overallPressureLabel(workspace.overallPressure),
          tone: "default",
        },
        {
          label: paymentMethodLabel(workspace.billingProfile?.paymentMethodStatus),
          tone: "default",
        },
      ]}
    >
      <BillingUpgradeHero
        workspace={workspace}
        nextBillingDate={nextBillingDate}
        openInvoiceCount={openInvoiceCount}
      />

      <OpsCommandRead
        eyebrow="Upgrade decision"
        title="Choose capacity before limits slow the next launch"
        description="Billing should sell the growth ceiling first: plan, capacity, payment readiness and the next commercial move stay in one scan."
        now={overallPressureLabel(workspace.overallPressure)}
        next={
          workspace.nextPlan
            ? `Review ${workspace.nextPlan.name} before the next campaign window`
            : "Keep monitoring usage; no immediate upgrade is needed"
        }
        watch={
          openInvoiceCount
            ? `${openInvoiceCount} open invoice handoff${openInvoiceCount === 1 ? "" : "s"}`
            : `${workspace.usage.length} usage limits are being tracked`
        }
        action={
          <a
            href={workspace.upgradeUrl ?? workspace.pricingUrl}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-black transition hover:brightness-105"
          >
            {workspace.nextPlan?.isEnterprise ? "Talk to sales" : "Review upgrade"}
          </a>
        }
      />

      <CriticalUsageStrip
        workspace={workspace}
        nextBillingDate={nextBillingDate}
        openInvoiceCount={openInvoiceCount}
      />

      <PlanComparisonGrid workspace={workspace} />

      <BillingOpsDiagnostics workspace={workspace} nextBillingDate={nextBillingDate} />
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
