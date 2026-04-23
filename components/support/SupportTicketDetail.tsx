"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type {
  AdminSupportHandoffType,
  AdminSupportTicketDetail,
  AdminSupportTicketPriority,
  AdminSupportTicketStatus,
  AdminSupportWaitingState,
} from "@/types/entities/support";

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function priorityTone(priority: AdminSupportTicketPriority) {
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

function statusTone(status: string) {
  switch (status) {
    case "resolved":
    case "accepted":
      return "success" as const;
    case "escalated":
    case "open":
    case "waiting_on_customer":
    case "waiting_on_internal":
      return "warning" as const;
    case "closed":
    case "canceled":
      return "default" as const;
    default:
      return "default" as const;
  }
}

export function SupportTicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<AdminSupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminSupportTicketStatus>("triaging");
  const [waitingStateDraft, setWaitingStateDraft] = useState<AdminSupportWaitingState>("none");
  const [internalNote, setInternalNote] = useState("");
  const [customerUpdate, setCustomerUpdate] = useState("");
  const [handoffType, setHandoffType] = useState<AdminSupportHandoffType>("general_support");
  const [handoffSummary, setHandoffSummary] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/support/tickets/${ticketId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; ticket?: AdminSupportTicketDetail; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.ticket) {
        throw new Error(payload?.error ?? "Failed to load support ticket.");
      }

      setTicket(payload.ticket);
      setStatusDraft(payload.ticket.status);
      setWaitingStateDraft(payload.ticket.waitingState);
      setHandoffType(
        payload.ticket.ticketType === "billing_issue"
          ? "billing"
          : payload.ticket.ticketType === "trust_or_abuse_report"
            ? "trust"
            : payload.ticket.ticketType === "reward_or_claim_issue"
              ? "payout"
              : payload.ticket.ticketType === "provider_or_integration_issue"
                ? "onchain"
                : "general_support"
      );
    } catch (loadError) {
      setTicket(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load support ticket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  const latestPublicUpdate = useMemo(
    () => ticket?.events.find((event) => event.visibilityScope === "both") ?? null,
    [ticket?.events]
  );

  async function runAction(
    action: "claim" | "change_status" | "internal_note" | "customer_update" | "handoff"
  ) {
    try {
      setBusy(action);
      setError(null);

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          action === "claim"
            ? { action }
            : action === "change_status"
              ? { action, status: statusDraft, waitingState: waitingStateDraft }
              : action === "internal_note"
                ? { action, note: internalNote }
                : action === "customer_update"
                  ? { action, note: customerUpdate }
                  : {
                      action,
                      handoffType,
                      summary: handoffSummary,
                      customerAccountId: ticket?.customerAccountId,
                      targetProjectId: ticket?.projectId,
                    }
        ),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; ticket?: AdminSupportTicketDetail; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.ticket) {
        throw new Error(payload?.error ?? "Failed to update support ticket.");
      }

      setTicket(payload.ticket);
      setStatusDraft(payload.ticket.status);
      setWaitingStateDraft(payload.ticket.waitingState);
      if (action === "internal_note") {
        setInternalNote("");
      }
      if (action === "customer_update") {
        setCustomerUpdate("");
      }
      if (action === "handoff") {
        setHandoffSummary("");
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update support ticket.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <OpsPanel title="Loading support ticket" description="Veltrix is resolving the ticket history, status posture and handoff state.">
        <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
          Loading support ticket...
        </div>
      </OpsPanel>
    );
  }

  if (error && !ticket) {
    return (
      <OpsPanel title="Support ticket could not load" description={error} tone="accent">
        <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
          Retry the route once the support APIs are available again.
        </div>
      </OpsPanel>
    );
  }

  if (!ticket) {
    return (
      <OpsPanel title="Support ticket not found" description="This ticket is no longer available in the internal support queue.">
        <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
          The ticket may have been removed from the workspace or never existed.
        </div>
      </OpsPanel>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetricCard label="Ticket" value={ticket.ticketRef} emphasis="primary" />
        <OpsMetricCard label="Priority" value={humanize(ticket.priority)} emphasis={ticket.priority === "urgent" || ticket.priority === "high" ? "warning" : "default"} />
        <OpsMetricCard label="Status" value={humanize(ticket.status)} emphasis={ticket.status === "escalated" ? "warning" : "default"} />
        <OpsMetricCard
          label="Waiting"
          value={ticket.waitingState === "none" ? "No wait" : humanize(ticket.waitingState)}
          sub={ticket.assignedAdminAuthUserId ? "Operator is assigned." : "Ticket is still unclaimed."}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <OpsPanel
          eyebrow="Ticket context"
          title={ticket.subject}
          description="Keep the original requester context visible before the ticket is pushed into another workspace or changed into a waiting state."
        >
          <div className="flex flex-wrap gap-2">
            <OpsStatusPill tone={priorityTone(ticket.priority)}>{ticket.priority}</OpsStatusPill>
            <OpsStatusPill tone={statusTone(ticket.status)}>{humanize(ticket.status)}</OpsStatusPill>
            {ticket.waitingState !== "none" ? (
              <OpsStatusPill tone="warning">{humanize(ticket.waitingState)}</OpsStatusPill>
            ) : null}
            <OpsStatusPill>{humanize(ticket.ticketType)}</OpsStatusPill>
          </div>

          <p className="mt-4 text-sm leading-7 text-sub">{ticket.message}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ContextRow label="Requester" value={`${ticket.requesterName} (${ticket.requesterEmail})`} />
            <ContextRow label="Workspace account" value={ticket.customerAccountName ?? "No linked account"} />
            <ContextRow label="Project" value={ticket.projectName ?? "No linked project"} />
            <ContextRow label="Assigned operator" value={ticket.assignedAdminAuthUserId ?? "Unclaimed"} />
            <ContextRow label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
            <ContextRow label="Updated" value={new Date(ticket.updatedAt).toLocaleString()} />
          </div>

          {ticket.linkedIncidentId ? (
            <div className="mt-5 rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Linked incident
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    This ticket is already tied to an active service incident and should keep its public wording aligned.
                  </p>
                </div>
                <Link
                  href={`/support/incidents/${ticket.linkedIncidentId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:border-primary/45 hover:bg-primary/15"
                >
                  Open incident
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          ) : null}

          {latestPublicUpdate ? (
            <div className="mt-5 rounded-[22px] border border-line bg-card2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Latest customer-facing update
              </p>
              <p className="mt-3 text-sm leading-6 text-sub">{latestPublicUpdate.body}</p>
            </div>
          ) : null}
        </OpsPanel>

        <div className="space-y-6">
          <OpsPanel
            eyebrow="Ownership"
            title="Move the ticket"
            description="Claim it, change the queue posture, or move it into another bounded surface when the problem is no longer generic support."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runAction("claim")}
                disabled={busy !== null}
                className="rounded-[18px] border border-primary/35 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "claim" ? "Claiming..." : "Claim ticket"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as AdminSupportTicketStatus)}
                className="rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="new">New</option>
                <option value="triaging">Triaging</option>
                <option value="waiting_on_customer">Waiting on customer</option>
                <option value="waiting_on_internal">Waiting on internal</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={waitingStateDraft}
                onChange={(event) => setWaitingStateDraft(event.target.value as AdminSupportWaitingState)}
                className="rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="none">No waiting state</option>
                <option value="customer">Waiting on customer</option>
                <option value="internal">Waiting on internal</option>
                <option value="provider">Waiting on provider</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void runAction("change_status")}
              disabled={busy !== null}
              className="mt-3 rounded-[18px] border border-line px-4 py-2 text-sm font-semibold text-text transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "change_status" ? "Saving..." : "Update status"}
            </button>
          </OpsPanel>

          <OpsPanel
            eyebrow="Operator notes"
            title="Internal and customer updates"
            description="Keep internal reasoning and customer-facing wording separate so the queue stays explainable."
          >
            <div className="space-y-3">
              <textarea
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                rows={4}
                className="w-full rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Add an internal note for operators."
              />
              <button
                type="button"
                onClick={() => void runAction("internal_note")}
                disabled={busy !== null}
                className="rounded-[18px] border border-line px-4 py-2 text-sm font-semibold text-text transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "internal_note" ? "Saving..." : "Add internal note"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <textarea
                value={customerUpdate}
                onChange={(event) => setCustomerUpdate(event.target.value)}
                rows={4}
                className="w-full rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Write the next customer-facing update."
              />
              <button
                type="button"
                onClick={() => void runAction("customer_update")}
                disabled={busy !== null}
                className="rounded-[18px] border border-primary/35 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "customer_update" ? "Sending..." : "Add customer update"}
              </button>
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Bounded handoff"
            title="Push into a specialist surface"
            description="Create an explicit support handoff when the ticket should continue in billing, trust, payout, on-chain or project ops."
          >
            <div className="space-y-3">
              <select
                value={handoffType}
                onChange={(event) => setHandoffType(event.target.value as AdminSupportHandoffType)}
                className="w-full rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="general_support">General support</option>
                <option value="billing">Billing</option>
                <option value="trust">Trust</option>
                <option value="payout">Payout</option>
                <option value="onchain">On-chain</option>
                <option value="product_ops">Product ops</option>
              </select>
              <textarea
                value={handoffSummary}
                onChange={(event) => setHandoffSummary(event.target.value)}
                rows={4}
                className="w-full rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Explain why this ticket is moving into another surface."
              />
              <button
                type="button"
                onClick={() => void runAction("handoff")}
                disabled={busy !== null}
                className="rounded-[18px] border border-line px-4 py-2 text-sm font-semibold text-text transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "handoff" ? "Creating..." : "Create handoff"}
              </button>
            </div>
          </OpsPanel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <OpsPanel
          eyebrow="Ticket history"
          title="Event timeline"
          description="Every ownership, waiting-state and customer-facing step stays visible here."
        >
          <div className="space-y-3">
            {ticket.events.map((event) => (
              <div key={event.id} className="rounded-[22px] border border-line bg-card2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text">{event.title ?? humanize(event.eventType)}</p>
                    <OpsStatusPill>{event.visibilityScope}</OpsStatusPill>
                  </div>
                  <p className="text-xs text-sub">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">{event.body}</p>
              </div>
            ))}
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Surface handoffs"
          title="Escalation trail"
          description="When a ticket leaves generic support, keep the exact destination and the reason visible."
        >
          <div className="space-y-3">
            {ticket.handoffs.length === 0 ? (
              <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
                This ticket has not been handed into another specialist surface yet.
              </div>
            ) : (
              ticket.handoffs.map((handoff) => (
                <div key={handoff.id} className="rounded-[22px] border border-line bg-card2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text">{humanize(handoff.handoffType)}</p>
                      <OpsStatusPill tone={statusTone(handoff.status)}>{humanize(handoff.status)}</OpsStatusPill>
                    </div>
                    <p className="text-xs text-sub">{new Date(handoff.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{handoff.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {handoff.targetRoute ? (
                      <Link
                        href={handoff.targetRoute}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:border-primary/45 hover:bg-primary/15"
                      >
                        Open destination
                        <ArrowUpRight size={12} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </OpsPanel>
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-card2 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}
