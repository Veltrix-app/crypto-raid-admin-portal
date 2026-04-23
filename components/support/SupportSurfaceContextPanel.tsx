"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { AdminSupportHandoffStatus, AdminSupportHandoffType, AdminSupportTicketPriority, AdminSupportTicketStatus } from "@/types/entities/support";

type SupportSurfaceContextRow = {
  handoffId: string;
  ticketId: string;
  ticketRef: string;
  subject: string;
  status: AdminSupportTicketStatus;
  priority: AdminSupportTicketPriority;
  handoffStatus: AdminSupportHandoffStatus;
  summary: string;
  targetRoute?: string;
  projectName?: string;
  createdAt: string;
};

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

function statusTone(status: AdminSupportTicketStatus | AdminSupportHandoffStatus) {
  switch (status) {
    case "escalated":
    case "open":
      return "warning" as const;
    case "resolved":
    case "accepted":
      return "success" as const;
    case "closed":
    case "canceled":
      return "default" as const;
    default:
      return "default" as const;
  }
}

export function SupportSurfaceContextPanel({
  title,
  description,
  handoffType,
  customerAccountId,
  targetProjectId,
  targetRecordId,
  includeResolved = false,
}: {
  title: string;
  description: string;
  handoffType: AdminSupportHandoffType;
  customerAccountId?: string | null;
  targetProjectId?: string | null;
  targetRecordId?: string | null;
  includeResolved?: boolean;
}) {
  const [rows, setRows] = useState<SupportSurfaceContextRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const searchParams = new URLSearchParams({
      handoffType,
      includeResolved: includeResolved ? "true" : "false",
    });

    if (customerAccountId) {
      searchParams.set("customerAccountId", customerAccountId);
    }

    if (targetProjectId) {
      searchParams.set("targetProjectId", targetProjectId);
    }

    if (targetRecordId) {
      searchParams.set("targetRecordId", targetRecordId);
    }

    return searchParams.toString();
  }, [customerAccountId, handoffType, includeResolved, targetProjectId, targetRecordId]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/support/context?${query}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; rows?: SupportSurfaceContextRow[]; error?: string }
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load support context.");
        }

        if (!active) {
          return;
        }

        setRows(payload.rows ?? []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setRows([]);
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load support context."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <OpsPanel eyebrow="Support handoffs" title={title} description={description}>
      {error ? (
        <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
            Loading support handoffs...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
            No support tickets are currently handed into this surface.
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.handoffId} className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {row.ticketRef}
                    </p>
                    <OpsStatusPill tone={priorityTone(row.priority)}>{row.priority}</OpsStatusPill>
                    <OpsStatusPill tone={statusTone(row.status)}>{humanize(row.status)}</OpsStatusPill>
                    <OpsStatusPill tone={statusTone(row.handoffStatus)}>
                      {humanize(row.handoffStatus)}
                    </OpsStatusPill>
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-text">{row.subject}</h3>
                  <p className="mt-2 text-sm leading-6 text-sub">{row.summary}</p>
                  {row.projectName ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sub">
                      {row.projectName}
                    </p>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="text-xs text-sub">{new Date(row.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/support/tickets/${row.ticketId}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-text"
                    >
                      Open ticket
                    </Link>
                    {row.targetRoute ? (
                      <Link
                        href={row.targetRoute}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:border-primary/45 hover:bg-primary/15"
                      >
                        Open surface
                        <ArrowUpRight size={12} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </OpsPanel>
  );
}
