"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

export default function QueueBacklogPanel({
  queueBacklogCount,
  supportEscalationCount,
  openTrustCaseCount,
  openPayoutCaseCount,
  openOnchainCaseCount,
}: {
  queueBacklogCount: number;
  supportEscalationCount: number;
  openTrustCaseCount: number;
  openPayoutCaseCount: number;
  openOnchainCaseCount: number;
}) {
  return (
    <OpsPanel
      eyebrow="Queue pressure"
      title="Backlog and escalations"
      description="Use this as the routing rail when pressure starts to spread across trust, payouts, on-chain, or support."
      action={
        <OpsStatusPill tone={queueBacklogCount > 0 || supportEscalationCount > 0 ? "warning" : "success"}>
          {queueBacklogCount > 0 || supportEscalationCount > 0 ? "Queue pressure" : "Queues stable"}
        </OpsStatusPill>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QueueTile
          label="Total backlog"
          value={queueBacklogCount}
          description="Combined unresolved trust, payout, on-chain and provider pressure."
        />
        <QueueTile
          label="Trust"
          value={openTrustCaseCount}
          description="Cases that still need review or project input."
        />
        <QueueTile
          label="Payouts"
          value={openPayoutCaseCount}
          description="Claims, delivery, and finalization safety work."
        />
        <QueueTile
          label="On-chain"
          value={openOnchainCaseCount}
          description="Ingest, enrichment, sync, and project-safe recovery work."
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <PriorityLink href="/moderation" label="Open trust console" />
        <PriorityLink href="/claims" label="Open payout ops" />
        <PriorityLink href="/onchain" label="Open on-chain ops" />
      </div>
    </OpsPanel>
  );
}

function QueueTile({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{value}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
    </div>
  );
}

function PriorityLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/30 hover:bg-primary/8"
    >
      <span>{label}</span>
      <ArrowRight size={14} className="text-primary" />
    </Link>
  );
}
