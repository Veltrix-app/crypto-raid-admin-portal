"use client";

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
    <section className="overflow-hidden rounded-[32px] border border-white/6 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.07),transparent_18%),linear-gradient(180deg,rgba(14,19,29,0.98),rgba(9,12,19,0.96))] p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-text sm:text-[2.5rem]">
            {title}
          </h1>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-7 text-sub">{description}</p> : null}
          {badges ? <div className="mt-4 flex flex-wrap gap-2">{badges}</div> : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>

      {metrics ? <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics}</div> : null}
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
    <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">{label}</p>
      <p className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-text">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-sub">{hint}</p> : null}
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
    <section className="rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,18,27,0.98),rgba(10,13,20,0.96))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-text">{title}</h2>
          {description ? <p className="mt-3 text-sm leading-7 text-sub">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
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
    <section className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,18,27,0.98),rgba(10,13,20,0.96))] p-5">
      <h3 className="text-lg font-extrabold tracking-[-0.02em] text-text">{title}</h3>
      <div className="mt-4">{children}</div>
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
    <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">{label}</p>
        <p className="mt-2 text-sm font-semibold text-text">{value}</p>
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
    <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4 transition-colors duration-200 hover:border-primary/22 hover:bg-primary/5">
      <p className="font-bold text-text">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
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
    <span className={`rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:brightness-110 ${toneClass}`}>
      {children}
    </span>
  );
}
