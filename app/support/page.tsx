"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { OpsMetricCard, OpsPanel, OpsPriorityLink, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { IncidentCommandPanel } from "@/components/support/IncidentCommandPanel";
import { SupportOverviewPanel } from "@/components/support/SupportOverviewPanel";
import { SupportQueueTable, type SupportQueueFilters } from "@/components/support/SupportQueueTable";
import type { AdminSupportOverview, AdminSupportTicketSummary } from "@/types/entities/support";

const defaultFilters: SupportQueueFilters = {
  search: "",
  ticketType: "",
  priority: "",
  status: "",
  waitingState: "",
};

export default function SupportPage() {
  const [overview, setOverview] = useState<AdminSupportOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicketSummary[]>([]);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupportQueueFilters>(defaultFilters);

  async function loadOverview() {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const response = await fetch("/api/support/overview", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; overview?: AdminSupportOverview; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.overview) {
        throw new Error(payload?.error ?? "Failed to load support overview.");
      }

      setOverview(payload.overview);
    } catch (loadError) {
      setOverview(null);
      setOverviewError(loadError instanceof Error ? loadError.message : "Failed to load support overview.");
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadTickets(nextFilters: SupportQueueFilters) {
    try {
      setTicketLoading(true);
      setTicketError(null);
      const searchParams = new URLSearchParams();

      if (nextFilters.search) searchParams.set("search", nextFilters.search);
      if (nextFilters.ticketType) searchParams.set("ticketType", nextFilters.ticketType);
      if (nextFilters.priority) searchParams.set("priority", nextFilters.priority);
      if (nextFilters.status) searchParams.set("status", nextFilters.status);
      if (nextFilters.waitingState) searchParams.set("waitingState", nextFilters.waitingState);

      const response = await fetch(`/api/support/tickets?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; tickets?: AdminSupportTicketSummary[]; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load support queue.");
      }

      setTickets(payload.tickets ?? []);
    } catch (loadError) {
      setTickets([]);
      setTicketError(loadError instanceof Error ? loadError.message : "Failed to load support queue.");
    } finally {
      setTicketLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    void loadTickets(filters);
  }, [filters]);

  const topQueueTicket = tickets[0] ?? null;
  const escalatedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "escalated").length,
    [tickets]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Internal support"
        title="Support"
        description="Run the internal support machine from one place: incoming ticket ownership, public incident command and bounded handoffs into billing, trust, payouts and on-chain recovery."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">Support posture</p>
            <p className="text-base font-extrabold text-text">
              {overview?.counts.totalOpen ?? 0} live tickets
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone={(overview?.counts.activeIncidents ?? 0) > 0 ? "warning" : "success"}>
                {(overview?.counts.activeIncidents ?? 0) > 0 ? "Incidents active" : "No live incidents"}
              </OpsStatusPill>
              <OpsStatusPill tone={escalatedCount > 0 ? "warning" : "default"}>
                {escalatedCount > 0 ? `${escalatedCount} escalated` : "Queue stable"}
              </OpsStatusPill>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Open tickets" value={overviewLoading ? "..." : overview?.counts.totalOpen ?? 0} />
              <OpsMetricCard
                label="Escalated"
                value={overviewLoading ? "..." : overview?.counts.escalated ?? 0}
                emphasis={(overview?.counts.escalated ?? 0) > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Waiting on customer"
                value={overviewLoading ? "..." : overview?.counts.waitingOnCustomer ?? 0}
              />
              <OpsMetricCard
                label="Active incidents"
                value={overviewLoading ? "..." : overview?.counts.activeIncidents ?? 0}
                emphasis={(overview?.counts.activeIncidents ?? 0) > 0 ? "warning" : "default"}
              />
            </div>

            <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.82),rgba(12,16,24,0.92))] px-3.5 py-3.5 shadow-[0_10px_34px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Support command read
                  </p>
                  <h2 className="mt-1.5 text-[0.94rem] font-semibold tracking-tight text-text">
                    Read queue pressure first, then decide whether the next move is ownership, escalation, or incident command.
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-sub">
                    This cockpit should show whether support is still a ticket problem, has become a cross-system incident, or needs a clean handoff into Business, Trust, Payouts, or On-chain ops.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={(overview?.counts.activeIncidents ?? 0) > 0 ? "warning" : "success"}>
                    {overview?.counts.activeIncidents ?? 0} incidents
                  </OpsStatusPill>
                  <OpsStatusPill tone={escalatedCount > 0 ? "warning" : "default"}>
                    {escalatedCount} escalated
                  </OpsStatusPill>
                  <OpsStatusPill tone={(overview?.counts.waitingOnCustomer ?? 0) > 0 ? "default" : "success"}>
                    {overview?.counts.waitingOnCustomer ?? 0} waiting
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-3.5 grid gap-2.5 lg:grid-cols-3">
                <OpsSnapshotRow
                  label="Now"
                  value={
                    (overview?.counts.activeIncidents ?? 0) > 0
                      ? `${overview?.counts.activeIncidents ?? 0} incidents are active across the support surface`
                      : "No live incident is active right now"
                  }
                />
                <OpsSnapshotRow
                  label="Next"
                  value={
                    topQueueTicket
                      ? `Claim ${topQueueTicket.ticketRef} as the next support owner move`
                      : "The active support queue is calm"
                  }
                />
                <OpsSnapshotRow
                  label="Watch"
                  value={
                    escalatedCount > 0
                      ? `${escalatedCount} queue items are already escalated`
                      : "Escalation pressure is low"
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <SupportOverviewPanel overview={overview} loading={overviewLoading} error={overviewError} />

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SupportQueueTable tickets={tickets} loading={ticketLoading} filters={filters} onFiltersChange={setFilters} />

          <OpsPanel
            eyebrow="Operator priorities"
            title="What needs the next named owner"
            description="Keep the next moves explicit so support does not collapse into a generic inbox."
          >
            <div className="grid gap-4">
              <OpsPriorityLink
                href={topQueueTicket ? `/support/tickets/${topQueueTicket.id}` : "/support"}
                title="Claim the next queue item"
                body={
                  topQueueTicket
                    ? `${topQueueTicket.ticketRef} is currently the freshest unresolved ticket in the queue.`
                    : "The current queue is clear."
                }
                cta={topQueueTicket ? "Open ticket" : "Queue clear"}
                emphasis={Boolean(topQueueTicket)}
              />
              <OpsPriorityLink
                href="/support"
                title="Declare an incident when the issue is broader than one ticket"
                body="Use incident command only when the problem crosses accounts, projects or service components and needs public wording."
                cta="Open incident command"
              />
              <OpsPriorityLink
                href="/business"
                title="Move billing issues into the commercial cockpit"
                body="Billing tickets should become explicit handoffs once they need grace actions, invoice review or collections follow-through."
                cta="Open business"
              />
            </div>

            {ticketError ? (
              <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {ticketError}
              </div>
            ) : null}
          </OpsPanel>
        </div>

        <IncidentCommandPanel />
      </PortalPageFrame>
    </AdminShell>
  );
}
