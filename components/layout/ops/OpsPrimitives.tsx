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
    <div className="relative overflow-hidden rounded-[34px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.10),transparent_28%),linear-gradient(180deg,rgba(13,18,27,0.98),rgba(9,12,19,0.96))] px-6 py-7">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/6" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-text md:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-sub">{description}</p>
        </div>

        {aside ? (
          <div className="min-w-[240px] rounded-[24px] border border-white/6 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
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
        "relative overflow-hidden rounded-[30px] border p-6",
        tone === "accent"
          ? "border-primary/16 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.07),transparent_24%),linear-gradient(180deg,rgba(14,19,28,0.98),rgba(10,14,22,0.96))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(13,18,27,0.96),rgba(10,14,21,0.94))]",
        className
      )}
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-text">{title}</h2>
          {description ? <p className="mt-3 text-sm leading-6 text-sub">{description}</p> : null}
        </div>
        {action}
      </div>

      <div className="relative z-10 mt-6">{children}</div>
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
        "relative overflow-hidden rounded-[24px] border px-5 py-5",
        emphasis === "primary"
          ? "border-primary/20 bg-[linear-gradient(180deg,rgba(186,255,59,0.09),rgba(14,19,28,0.94))]"
          : emphasis === "warning"
            ? "border-amber-400/16 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(14,19,28,0.94))]"
            : "border-white/6 bg-[linear-gradient(180deg,rgba(16,22,33,0.9),rgba(12,17,25,0.9))]"
      )}
    >
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">{label}</p>
        <p className="mt-3 text-[1.95rem] font-extrabold tracking-[-0.03em] text-text">{value}</p>
        {sub ? <p className="mt-3 text-sm leading-6 text-sub">{sub}</p> : null}
      </div>
    </div>
  );
}

export function OpsSnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-text">{value}</p>
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
        "block rounded-[24px] border p-5 transition-colors duration-200 hover:border-primary/28",
        emphasis ? "border-primary/20 bg-primary/[0.08]" : "border-white/6 bg-white/[0.025]"
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
    <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,18,27,0.94),rgba(10,14,21,0.92))] p-4">
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
    <label className="flex items-center gap-3 rounded-[20px] border border-white/6 bg-white/[0.025] px-4 py-3 transition-colors duration-200 hover:border-white/12 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Search</span>
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
      className="rounded-[20px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-text transition-colors duration-200 hover:border-white/12 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-xl",
        tone === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
          : tone === "warning"
            ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
            : tone === "danger"
              ? "border-rose-400/20 bg-rose-500/15 text-rose-300"
              : "border-white/6 bg-white/[0.025] text-sub"
      )}
    >
      {children}
    </span>
  );
}
