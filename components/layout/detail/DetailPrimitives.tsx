"use client";

import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

export function DetailHero({
  eyebrow,
  title,
  description,
  badges,
  metrics,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  metrics?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.08),transparent_18%),radial-gradient(circle_at_12%_18%,rgba(74,217,255,0.06),transparent_18%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.985))] p-3.5 shadow-[0_16px_42px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_34%)]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.55)]" />
            {eyebrow}
          </div>
          <h1 className="mt-2.5 text-[1.05rem] font-semibold tracking-[-0.03em] text-text sm:text-[1.25rem]">
            {title}
          </h1>
          {description ? <p className="mt-2 max-w-2xl text-[12px] leading-5 text-sub">{description}</p> : null}
          {badges ? <div className="mt-2.5 flex flex-wrap gap-1.5">{badges}</div> : null}
        </div>

        {actions ? (
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 xl:justify-self-end">
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>
        ) : null}
      </div>

      {metrics ? <div className="mt-3.5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">{metrics}</div> : null}
    </section>
  );
}

export function DetailMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[15px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,20,28,0.92),rgba(9,12,18,0.94))] px-3 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.12)]">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[0.84rem] font-semibold tracking-[-0.02em] text-text">{value}</p>
      {hint ? <p className="mt-1 text-[10px] leading-5 text-sub">{hint}</p> : null}
    </div>
  );
}

export function DetailSurface({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,15,21,0.985),rgba(8,10,15,0.985))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.025),transparent_34%)]" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-[0.9rem] font-semibold tracking-[-0.02em] text-text">{title}</h2>
          {description ? <p className="mt-1.5 text-[12px] leading-5 text-sub">{description}</p> : null}
        </div>
        {aside ? (
          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-2.5 xl:justify-self-end">
            {aside}
          </div>
        ) : null}
      </div>

      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function DetailSidebarSurface({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,15,21,0.985),rgba(8,10,15,0.985))] p-3 shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
      <h3 className="text-[0.84rem] font-semibold tracking-[-0.02em] text-text">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function DetailMetaRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1 break-all text-[11px] font-semibold text-text">{value}</p>
    </div>
  );
}

export function DetailStatusRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "warning" | "danger";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/6 bg-white/[0.025] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
        <p className="mt-1 text-[11px] font-semibold text-text">{value}</p>
      </div>
      <DetailBadge tone={tone}>
        {tone === "primary"
          ? "Ready"
          : tone === "warning"
            ? "Needs attention"
            : tone === "danger"
              ? "At risk"
              : "Stable"}
      </DetailBadge>
    </div>
  );
}

export function DetailActionTile({
  label,
  description,
  href,
  action,
}: {
  label: string;
  description: string;
  href?: string;
  action?: ReactNode;
}) {
  const content = (
    <div className="rounded-[16px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,20,28,0.9),rgba(10,13,19,0.92))] p-3 transition-all duration-200 hover:border-primary/18 hover:bg-primary/5 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-text">{label}</p>
          <p className="mt-1 text-[10px] leading-5 text-sub">{description}</p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      </div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

export function DetailBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "primary" | "warning" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/20 bg-primary/10 text-primary"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : tone === "danger"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
          : "border-white/8 bg-white/[0.04] text-text";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold transition-all duration-200 hover:brightness-110 ${toneClass}`}>
      {children}
    </span>
  );
}
