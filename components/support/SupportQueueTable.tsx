"use client";

import Link from "next/link";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import type {
  AdminSupportTicketPriority,
  AdminSupportTicketStatus,
  AdminSupportTicketSummary,
  AdminSupportTicketType,
  AdminSupportWaitingState,
} from "@/types/entities/support";

export type SupportQueueFilters = {
  search: string;
  ticketType: "" | AdminSupportTicketType;
  priority: "" | AdminSupportTicketPriority;
  status: "" | AdminSupportTicketStatus;
  waitingState: "" | AdminSupportWaitingState;
};

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function toneFromPriority(priority: AdminSupportTicketPriority) {
  switch (priority) {
    case "urgent":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "normal":
      return "default" as const;
    default:
      return "success" as const;
  }
}

export function SupportQueueTable({
  tickets,
  loading,
  filters,
  onFiltersChange,
}: {
  tickets: AdminSupportTicketSummary[];
  loading: boolean;
  filters: SupportQueueFilters;
  onFiltersChange: (next: SupportQueueFilters) => void;
}) {
  return (
    <OpsPanel
      eyebrow="Support queue"
      title="Internal ticket ownership"
      description="Filter the incoming support queue by lane, waiting posture and commercial or project context, then jump into the exact drilldown that needs ownership."
    >
      <OpsFilterBar>
        <OpsSearchInput
          value={filters.search}
          onChange={(value) => onFiltersChange({ ...filters, search: value })}
          placeholder="Search ticket ref, subject, requester, account or project..."
          ariaLabel="Search support queue"
          name="support-search"
        />
        <OpsSelect
          value={filters.ticketType}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              ticketType: value as SupportQueueFilters["ticketType"],
            })
          }
          ariaLabel="Filter support queue by ticket type"
        >
          <option value="">All lanes</option>
          <option value="product_question">Product question</option>
          <option value="technical_issue">Technical issue</option>
          <option value="billing_issue">Billing issue</option>
          <option value="account_access">Account access</option>
          <option value="reward_or_claim_issue">Reward or claim issue</option>
          <option value="trust_or_abuse_report">Trust or abuse report</option>
          <option value="provider_or_integration_issue">Provider or integration issue</option>
          <option value="general_request">General request</option>
        </OpsSelect>
        <OpsSelect
          value={filters.priority}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              priority: value as SupportQueueFilters["priority"],
            })
          }
          ariaLabel="Filter support queue by priority"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </OpsSelect>
      </OpsFilterBar>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <OpsSelect
          value={filters.status}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as SupportQueueFilters["status"],
            })
          }
          ariaLabel="Filter support queue by status"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="triaging">Triaging</option>
          <option value="waiting_on_customer">Waiting on customer</option>
          <option value="waiting_on_internal">Waiting on internal</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </OpsSelect>
        <OpsSelect
          value={filters.waitingState}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              waitingState: value as SupportQueueFilters["waitingState"],
            })
          }
          ariaLabel="Filter support queue by waiting state"
        >
          <option value="">All waiting states</option>
          <option value="none">No wait</option>
          <option value="customer">Waiting on customer</option>
          <option value="internal">Waiting on internal</option>
          <option value="provider">Waiting on provider</option>
        </OpsSelect>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-6 text-sm text-sub">
            Loading support queue...
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-6 text-sm text-sub">
            No support tickets match the current queue filters.
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/tickets/${ticket.id}`}
              className="block rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5 transition hover:border-primary/30 hover:bg-primary/8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {ticket.ticketRef}
                    </p>
                    <OpsStatusPill tone={toneFromPriority(ticket.priority)}>
                      {ticket.priority}
                    </OpsStatusPill>
                    <OpsStatusPill>{humanize(ticket.status)}</OpsStatusPill>
                    {ticket.waitingState !== "none" ? (
                      <OpsStatusPill tone="warning">{humanize(ticket.waitingState)}</OpsStatusPill>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-text">{ticket.subject}</h3>
                  <p className="mt-3 text-sm leading-6 text-sub">
                    {ticket.requesterName} • {ticket.requesterEmail}
                    {ticket.customerAccountName ? ` • ${ticket.customerAccountName}` : ""}
                    {ticket.projectName ? ` • ${ticket.projectName}` : ""}
                  </p>
                </div>

                <div className="text-right text-sm text-sub">
                  <p>{humanize(ticket.ticketType)}</p>
                  <p className="mt-2">{new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </OpsPanel>
  );
}
