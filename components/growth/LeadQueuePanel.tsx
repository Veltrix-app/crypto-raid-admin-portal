"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import {
  humanizeCommercialLabel,
  leadStateTone,
  sourceTone,
} from "@/lib/growth/growth-contract";
import type {
  AdminGrowthLeadSummary,
  AdminGrowthOverview,
} from "@/types/entities/growth-sales";

export function LeadQueuePanel({
  overview,
  loading,
}: {
  overview: AdminGrowthOverview | null;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const leads = useMemo(() => {
    const source = overview?.leads ?? [];
    return source.filter((lead) => {
      const matchesState = !stateFilter || lead.leadState === stateFilter;
      const haystack = [
        lead.contactName,
        lead.contactEmail,
        lead.companyName,
        lead.accountName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search.trim().toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [overview?.leads, search, stateFilter]);

  return (
    <OpsPanel
      eyebrow="Lead queue"
      title="Internal commercial queue"
      description="New interest, active conversations and converted context all stay in one internal surface."
    >
      <OpsFilterBar>
        <OpsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or company"
        />
        <OpsSelect value={stateFilter} onChange={setStateFilter} ariaLabel="Lead state filter">
          <option value="">All lead states</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="watching">Watching</option>
          <option value="engaged">Engaged</option>
          <option value="evaluation">Evaluation</option>
          <option value="converted">Converted</option>
          <option value="cooling_off">Cooling off</option>
          <option value="lost">Lost</option>
        </OpsSelect>
        <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-4 py-3 text-sm text-sub">
          {loading ? "Loading queue..." : `${leads.length} leads in view`}
        </div>
      </OpsFilterBar>

      <div className="mt-5 space-y-3">
        {leads.length ? (
          leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
        ) : (
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5 text-sm leading-6 text-sub">
            The growth queue is currently quiet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}

function LeadRow({ lead }: { lead: AdminGrowthLeadSummary }) {
  return (
    <Link
      href={`/growth/leads/${lead.id}`}
      className="block rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5 transition hover:border-primary/35"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-text">
              {lead.companyName || lead.contactName || lead.contactEmail}
            </p>
            <OpsStatusPill tone={leadStateTone(lead.leadState)}>
              {humanizeCommercialLabel(lead.leadState)}
            </OpsStatusPill>
            <OpsStatusPill tone={sourceTone(lead.source)}>
              {humanizeCommercialLabel(lead.source)}
            </OpsStatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-sub">
            {lead.contactName} | {lead.contactEmail}
            {lead.accountName ? ` | linked to ${lead.accountName}` : ""}
          </p>
          <p className="mt-3 text-sm leading-6 text-sub">{lead.intentSummary}</p>
        </div>

        <div className="grid min-w-[220px] gap-2 text-right text-sm text-sub md:grid-cols-1">
          <p>{lead.taskCounts.open} open tasks</p>
          <p>{lead.taskCounts.dueNow} due now</p>
          <p>{lead.taskCounts.overdue} overdue</p>
        </div>
      </div>
    </Link>
  );
}
