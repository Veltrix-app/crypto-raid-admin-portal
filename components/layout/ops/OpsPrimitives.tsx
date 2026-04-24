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
    <div className="relative overflow-hidden rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(123,92,255,0.1),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(74,217,255,0.07),transparent_20%),linear-gradient(180deg,rgba(10,12,16,0.995),rgba(5,7,10,0.995))] px-4 py-4.5 shadow-[0_16px_38px_rgba(0,0,0,0.2)] md:px-4.5 md:py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%,transparent_68%,rgba(255,255,255,0.015))]" />
      <div className="relative z-10 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_236px] xl:items-start">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.55)]" />
            {eyebrow}
          </div>
          <h1 className="mt-2.5 text-[1.42rem] font-semibold tracking-[-0.04em] text-text md:text-[1.82rem] md:leading-[0.98]">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub md:text-[0.85rem]">{description}</p>
        </div>

        {aside ? (
          <div className="rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3 py-3 backdrop-blur-xl xl:justify-self-end xl:min-w-[228px]">
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
        "relative overflow-hidden rounded-[22px] border p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]",
        tone === "accent"
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.08),transparent_22%),radial-gradient(circle_at_88%_14%,rgba(74,217,255,0.06),transparent_20%),linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.02),transparent_34%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3.5">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary/90">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1.5 text-[0.92rem] font-semibold tracking-[-0.02em] text-text sm:text-[0.98rem]">{title}</h2>
          {description ? <p className="mt-1.5 text-[12px] leading-5 text-sub">{description}</p> : null}
        </div>
        {action}
      </div>

      <div className="relative z-10 mt-3.5">{children}</div>
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
        "relative overflow-hidden rounded-[16px] border px-3 py-3 shadow-[0_10px_20px_rgba(0,0,0,0.12)]",
        emphasis === "primary"
          ? "border-primary/16 bg-[linear-gradient(180deg,rgba(186,255,59,0.1),rgba(11,14,20,0.98))]"
          : emphasis === "warning"
            ? "border-amber-400/16 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(11,14,20,0.98))]"
            : "border-white/6 bg-[linear-gradient(180deg,rgba(14,18,26,0.96),rgba(9,12,18,0.96))]"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_42%)]" />
      <div className="relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
        <p className="mt-2 text-[1.14rem] font-semibold tracking-[-0.03em] text-text">{value}</p>
        {sub ? <p className="mt-1 text-[11px] leading-5 text-sub">{sub}</p> : null}
      </div>
    </div>
  );
}

export function OpsSnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold leading-5 text-text">{value}</p>
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
        "group block rounded-[16px] border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24",
        emphasis
          ? "border-primary/16 bg-[linear-gradient(180deg,rgba(186,255,59,0.08),rgba(12,15,22,0.98))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(13,17,25,0.98),rgba(8,11,16,0.98))]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-text">{title}</p>
          <p className="mt-1.5 text-[12px] leading-5 text-sub">{body}</p>
        </div>
        <span className="text-[11px] font-semibold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
          {cta}
        </span>
      </div>
    </a>
  );
}

export function OpsFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-2.5">
      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_210px_auto]">{children}</div>
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
    <label className="flex items-center gap-3 rounded-[14px] border border-white/6 bg-white/[0.025] px-3 py-2 transition-colors duration-200 hover:border-white/12 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">Search</span>
      <input
        type="search"
        name={name}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[12px] text-text placeholder:text-sub/70 focus:outline-none"
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
      className="rounded-[14px] border border-white/6 bg-white/[0.025] px-3 py-2 text-[12px] text-text transition-colors duration-200 hover:border-white/12 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-xl",
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
