"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, SearchX, Sparkles } from "lucide-react";

function toneClasses(tone: "default" | "success" | "warning" | "danger") {
  if (tone === "success") {
    return "border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_30%),linear-gradient(180deg,rgba(10,18,16,0.98),rgba(8,13,12,0.96))] text-emerald-300";
  }
  if (tone === "warning") {
    return "border-amber-400/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_30%),linear-gradient(180deg,rgba(22,16,8,0.98),rgba(14,10,7,0.96))] text-amber-300";
  }
  if (tone === "danger") {
    return "border-rose-400/20 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.16),transparent_30%),linear-gradient(180deg,rgba(26,10,14,0.98),rgba(16,8,10,0.96))] text-rose-300";
  }
  return "border-white/10 bg-[radial-gradient(circle_at_top,rgba(186,255,59,0.08),transparent_28%),linear-gradient(180deg,rgba(14,18,27,0.98),rgba(10,13,20,0.96))] text-primary";
}

export function StatePanel({
  icon,
  eyebrow,
  title,
  description,
  tone = "default",
  actions,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  tone?: "default" | "success" | "warning" | "danger";
  actions?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[18px] border p-5 shadow-[0_18px_54px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_62px_rgba(0,0,0,0.24)] ${toneClasses(tone)}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_26%)]" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-current/15 bg-black/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {icon}
          </div>
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sub">{eyebrow}</p>
            ) : null}
            <h2 className="mt-1.5 text-[1.45rem] font-extrabold tracking-[-0.02em] text-text">{title}</h2>
            <p className="mt-2.5 text-sm leading-6 text-sub">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}

export function LoadingState({
  title = "Loading portal surface",
  description = "Veltrix is pulling workspace context, trust signals and operator data into the current view.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <StatePanel
      icon={<LoaderCircle className="animate-spin" size={20} />}
      eyebrow="Loading"
      title={title}
      description={description}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <StatePanel
      icon={<Sparkles size={20} />}
      eyebrow="Empty state"
      title={title}
      description={description}
      actions={action}
    />
  );
}

export function NotFoundState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <StatePanel
      icon={<SearchX size={20} />}
      eyebrow="Not found"
      title={title}
      description={description}
      tone="warning"
      actions={action}
    />
  );
}

export function SuccessState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <StatePanel
      icon={<CheckCircle2 size={20} />}
      eyebrow="Success"
      title={title}
      description={description}
      tone="success"
      actions={action}
    />
  );
}

export function InlineEmptyNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(18,26,38,0.82),rgba(13,19,29,0.88))] p-4 transition-all duration-300 hover:border-primary/18 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[14px] border border-white/10 bg-black/15 text-sub">
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="font-bold text-text">{title}</p>
          <p className="mt-2 text-sm leading-5.5 text-sub">{description}</p>
        </div>
      </div>
    </div>
  );
}
