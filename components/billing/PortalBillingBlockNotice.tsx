"use client";

import type { BillingLimitBlock } from "@/lib/billing/entitlement-blocks";

function formatUsageLabel(usageKey: BillingLimitBlock["usageKey"]) {
  switch (usageKey) {
    case "projects":
      return "Projects";
    case "campaigns":
      return "Active campaigns";
    case "quests":
      return "Live quests";
    case "raids":
      return "Live raids";
    case "providers":
      return "Connected providers";
    case "seats":
      return "Billable seats";
    default:
      return "Capacity";
  }
}

export function PortalBillingBlockNotice({
  block,
  title = "This action is blocked by the current plan",
}: {
  block: BillingLimitBlock;
  title?: string;
}) {
  return (
    <div className="rounded-[26px] border border-amber-400/25 bg-amber-500/10 p-5 text-amber-50">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
        Billing limit reached
      </p>
      <h3 className="mt-3 text-lg font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-amber-50/90">{block.message}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/80">
            Current plan
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{block.currentPlanName}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/80">
            {formatUsageLabel(block.usageKey)}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {block.projectedCurrent} / {block.limit}
          </p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/80">
            Next move
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {block.nextPlanName ? `Upgrade to ${block.nextPlanName}` : "Open support"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {block.payAndContinueUrl ? (
          <a
            href={block.payAndContinueUrl}
            className="inline-flex items-center rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
          >
            Pay and continue
          </a>
        ) : null}
        {block.upgradeUrl && block.upgradeUrl !== block.payAndContinueUrl ? (
          <a
            href={block.upgradeUrl}
            className="inline-flex items-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Upgrade now
          </a>
        ) : null}
        <a
          href={block.supportUrl}
          className="inline-flex items-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
        >
          Talk to Veltrix
        </a>
      </div>
    </div>
  );
}
