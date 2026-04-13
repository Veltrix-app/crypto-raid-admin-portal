"use client";

import type { ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function OpsHero({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(180,255,20,0.16),transparent_32%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,22,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:-translate-y-0.5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">{description}</p>
        </div>

        {aside ? (
          <div className="min-w-[240px] rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
            {aside}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function OpsPanel({
  eyebrow,
  title,
  description,
  action,
  children,
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: "default" | "accent";
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)]",
        tone === "accent"
          ? "border-primary/30 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(17,24,39,0.95))]"
          : "border-line bg-card",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-sub">{description}</p> : null}
        </div>
        {action}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function OpsMetricCard({
  label,
  value,
  sub,
  emphasis = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  emphasis?: "default" | "primary" | "warning";
}) {
  return (
    <div
      className={cx(
        "rounded-[24px] border px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20",
        emphasis === "primary"
          ? "border-primary/35 bg-[linear-gradient(180deg,rgba(186,255,59,0.13),rgba(15,23,42,0.96))]"
          : emphasis === "warning"
            ? "border-amber-400/30 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(15,23,42,0.96))]"
            : "border-line bg-card"
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-text">{value}</p>
      {sub ? <p className="mt-3 text-sm leading-6 text-primary">{sub}</p> : null}
    </div>
  );
}

export function OpsSnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

export function OpsPriorityLink({
  href,
  title,
  body,
  cta,
  emphasis = false,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  emphasis?: boolean;
}) {
  return (
    <a
      href={href}
      className={cx(
        "block rounded-[24px] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40",
        emphasis ? "border-primary/35 bg-primary/10" : "border-line bg-card2"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-bold text-text">{title}</p>
          <p className="mt-3 text-sm leading-6 text-sub">{body}</p>
        </div>
        <span className="text-sm font-semibold text-primary">{cta}</span>
      </div>
    </a>
  );
}

export function OpsFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-white/12">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">{children}</div>
    </div>
  );
}

export function OpsSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel = "Search",
  name = "search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  name?: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[20px] border border-line bg-card2 px-4 py-3 transition-all duration-200 hover:border-white/12 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/30">
      <span className="text-sub">Search</span>
      <input
        type="search"
        name={name}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-text placeholder:text-sub/70 focus:outline-none"
      />
    </label>
  );
}

export function OpsSelect({
  value,
  onChange,
  children,
  ariaLabel,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  ariaLabel: string;
  name?: string;
}) {
  return (
    <select
      name={name}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-text transition-all duration-200 hover:border-white/12 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {children}
    </select>
  );
}

export function OpsStatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]",
        tone === "success"
          ? "bg-emerald-500/15 text-emerald-300"
          : tone === "warning"
            ? "bg-amber-500/15 text-amber-300"
            : tone === "danger"
              ? "bg-rose-500/15 text-rose-300"
              : "border border-line bg-card2 text-sub"
      )}
    >
      {children}
    </span>
  );
}
