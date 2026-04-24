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
import {
  createPortalBusinessNote,
  extendPortalBusinessGrace,
  fetchBusinessControlAccountDetail,
} from "@/lib/billing/business-dashboard";
import type {
  BusinessControlAccountDetail,
  BusinessControlAccountSummary,
} from "@/lib/billing/business-control";
import type { PortalBillingUsageItem } from "@/lib/billing/account-billing";
import type { AdminCustomerAccountBusinessNote } from "@/types/entities/billing-subscription";
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

const noteTypeOptions: Array<{
  value: AdminCustomerAccountBusinessNote["noteType"];
  label: string;
}> = [
  { value: "general", label: "General" },
  { value: "upgrade_candidate", label: "Upgrade candidate" },
  { value: "churn_risk", label: "Churn risk" },
  { value: "follow_up", label: "Follow-up" },
  { value: "billing_exception", label: "Billing exception" },
];

function formatBillingEventLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function BusinessAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const role = useAdminAuthStore((s) => s.role);
  const [detail, setDetail] = useState<BusinessControlAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [noteType, setNoteType] = useState<AdminCustomerAccountBusinessNote["noteType"]>("general");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [graceSaving, setGraceSaving] = useState<3 | 7 | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleCreateNote() {
    if (!params?.id || noteSaving) {
      return;
    }

    try {
      setNoteSaving(true);
      setActionError(null);
      setActionFeedback(null);

      const note = await createPortalBusinessNote({
        accountId: params.id,
        noteType,
        title: noteTitle,
        body: noteBody,
      });

      setDetail((current) =>
        current
          ? {
              ...current,
              businessNotes: [note, ...current.businessNotes],
            }
          : current
      );
      setRefreshNonce((value) => value + 1);
      setNoteTitle("");
      setNoteBody("");
      setNoteType("general");
      setActionFeedback("Internal business note added.");
    } catch (noteError) {
      setActionError(
        noteError instanceof Error ? noteError.message : "The business note could not be saved."
      );
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleExtendGrace(days: 3 | 7) {
    if (!params?.id || graceSaving) {
      return;
    }

    try {
      setGraceSaving(days);
      setActionError(null);
      setActionFeedback(null);
      const result = await extendPortalBusinessGrace({
        accountId: params.id,
        days,
      });
      setActionFeedback(
        `Grace extended by ${result.days} day${result.days === 1 ? "" : "s"} until ${formatDateLabel(result.graceUntil)}.`
      );
      setRefreshNonce((value) => value + 1);
    } catch (graceError) {
      setActionError(
        graceError instanceof Error ? graceError.message : "Grace could not be extended."
      );
    } finally {
      setGraceSaving(null);
    }
  }

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
            <Link
              href="/business"
              className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
            >
              Back to business
            </Link>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Plan" value={detail.account.planName} emphasis="primary" />
              <OpsMetricCard label="Billing status" value={detail.account.billingStatus} />
              <OpsMetricCard label="MRR contribution" value={formatCurrency(detail.account.currentMrrContribution)} emphasis={detail.account.currentMrrContribution > 0 ? "primary" : "default"} />
              <OpsMetricCard label="Open invoices" value={detail.account.openInvoiceCount} emphasis={detail.account.openInvoiceCount > 0 ? "warning" : "default"} />
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.92))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Account command read
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                    Read usage and invoice pressure first, then decide whether the next move is upgrade, grace, or activation cleanup.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    This drilldown should keep commercial pressure, payment posture and the recommended operator move visible before you dive into invoices or notes.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={healthTone(detail.account.commercialHealth)}>
                    {detail.account.commercialHealth.replaceAll("_", " ")}
                  </OpsStatusPill>
                  <OpsStatusPill tone={collectionTone(detail.account.collectionStatus)}>
                    {detail.account.collectionStatus.replaceAll("_", " ")}
                  </OpsStatusPill>
                  <OpsStatusPill tone={detail.account.openInvoiceCount > 0 ? "warning" : "success"}>
                    {detail.account.openInvoiceCount} open invoices
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <OpsSnapshotRow label="Now" value={detail.workspace.recommendedAction} />
                <OpsSnapshotRow label="Next" value={detail.workspace.nextPlan ? `Review move to ${detail.workspace.nextPlan.name}` : "Keep current plan and monitor pressure"} />
                <OpsSnapshotRow label="Watch" value={detail.account.openInvoiceCount > 0 ? `${detail.account.openInvoiceCount} invoices still need attention` : "Invoice posture is currently calm"} />
              </div>
            </div>
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

            {actionFeedback ? (
              <div className="mt-4 rounded-[20px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {actionFeedback}
              </div>
            ) : null}

            {actionError ? (
              <div className="mt-4 rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {actionError}
              </div>
            ) : null}

            {detail.account.planId !== "free" ? (
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Safe operator actions</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleExtendGrace(3)}
                    disabled={graceSaving !== null}
                    className="inline-flex items-center rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {graceSaving === 3 ? "Extending..." : "Extend grace 3d"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExtendGrace(7)}
                    disabled={graceSaving !== null}
                    className="inline-flex items-center rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {graceSaving === 7 ? "Extending..." : "Extend grace 7d"}
                  </button>
                </div>
              </div>
            ) : null}
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

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <OpsPanel
            eyebrow="Business notes"
            title="Internal commercial notes"
            description="Keep the business follow-up, upgrade signal and exception context on the account itself."
          >
            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Note type
                  <select
                    value={noteType}
                    onChange={(event) =>
                      setNoteType(event.target.value as AdminCustomerAccountBusinessNote["noteType"])
                    }
                    className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm font-medium text-text outline-none transition focus:border-primary/35"
                  >
                    {noteTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Title
                  <input
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="What should the next operator know?"
                    className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
                  />
                </label>
              </div>

              <label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-sub">
                Note body
                <textarea
                  value={noteBody}
                  onChange={(event) => setNoteBody(event.target.value)}
                  placeholder="Add the commercial context, risk or next move."
                  rows={4}
                  className="mt-2 w-full rounded-[22px] border border-line bg-card px-3 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary/35"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleCreateNote()}
                disabled={noteSaving}
                className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {noteSaving ? "Saving note..." : "Add internal note"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {detail.businessNotes.length ? (
                detail.businessNotes.map((note) => (
                  <div key={note.id} className="rounded-[22px] border border-line bg-card2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text">{note.title}</p>
                          <OpsStatusPill tone={note.status === "open" ? "warning" : "default"}>
                            {note.noteType.replaceAll("_", " ")}
                          </OpsStatusPill>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-sub">{note.body}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-sub">
                        {formatDateLabel(note.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <InlineEmptyNotice
                  title="No business notes yet"
                  description="Add your first internal note so account context lives with the billing and growth posture."
                />
              )}
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Billing events"
            title="Recent commercial audit"
            description="This is the recent billing and commercial trail for the account."
          >
            {detail.billingEvents.length ? (
              <div className="space-y-3">
                {detail.billingEvents.map((event) => (
                  <div key={event.id} className="rounded-[22px] border border-line bg-card2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text">
                            {event.summary || formatBillingEventLabel(event.eventType)}
                          </p>
                          <OpsStatusPill tone={event.eventSource === "portal_admin" ? "warning" : "default"}>
                            {formatBillingEventLabel(event.eventSource)}
                          </OpsStatusPill>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sub">
                          {formatBillingEventLabel(event.eventType)}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-sub">
                        {formatDateLabel(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <InlineEmptyNotice
                title="No billing events yet"
                description="Stripe and portal-admin billing events will show up here as the commercial history grows."
              />
            )}
          </OpsPanel>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
