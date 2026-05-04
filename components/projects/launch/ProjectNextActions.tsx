"use client";

import Link from "next/link";
import { ArrowUpRight, FolderPlus, Rocket, Sparkles } from "lucide-react";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { cn } from "@/lib/utils/cn";

type LaunchAction = {
  title: string;
  summary: string;
  href: string;
  tone?: "primary" | "default";
};

type SupportLink = {
  label: string;
  description: string;
  href: string;
};

export default function ProjectNextActions({
  actions,
  supportLinks,
}: {
  actions: LaunchAction[];
  supportLinks: SupportLink[];
}) {
  const primaryAction = actions[0] ?? null;
  const secondaryActions = actions.slice(1);

  return (
    <aside className="space-y-3 2xl:sticky 2xl:top-24">
      <section className="overflow-hidden rounded-[20px] border border-white/[0.024] bg-[radial-gradient(circle_at_18%_0%,rgba(199,255,0,0.07),transparent_28%),linear-gradient(180deg,rgba(13,18,27,0.98),rgba(7,10,16,0.96))] p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Action dock
            </p>
            <h3 className="mt-1.5 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
              Do one thing next
            </h3>
            <p className="mt-1.5 text-[11px] leading-5 text-sub">
              The first action is the recommended route. Everything below is a shortcut, not another task list.
            </p>
          </div>
          <OpsStatusPill tone={primaryAction ? "success" : "warning"}>
            {primaryAction ? "Ready" : "Review"}
          </OpsStatusPill>
        </div>

        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="mt-3 block rounded-[16px] border border-primary/[0.16] bg-primary/[0.07] px-3.5 py-3 transition hover:bg-primary/[0.11]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-primary/[0.1] text-primary">
                    <Rocket size={16} />
                  </span>
                  <p className="text-[13px] font-black text-text">{primaryAction.title}</p>
                </div>
                <p className="mt-2 line-clamp-3 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
                  {primaryAction.summary}
                </p>
              </div>
              <ArrowUpRight className="shrink-0 text-primary" size={16} />
            </div>
          </Link>
        ) : null}

        {secondaryActions.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {secondaryActions.map((action) => (
              <Link
                key={`${action.title}:${action.href}`}
                href={action.href}
                className={cn(
                  "block rounded-[14px] border px-3 py-2.5 transition-colors duration-200",
                  action.tone === "primary"
                    ? "border-primary/[0.14] bg-primary/[0.045] hover:bg-primary/[0.08]"
                    : "border-transparent bg-white/[0.014] hover:border-white/[0.024] hover:bg-white/[0.028]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Sparkles size={14} className="shrink-0 text-sub" />
                    <p className="truncate text-[12px] font-bold text-text">{action.title}</p>
                  </div>
                  <ArrowUpRight className="shrink-0 text-sub" size={14} />
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[20px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(12,16,24,0.965),rgba(7,10,16,0.95))] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
            Studio shortcuts
          </p>
          <FolderPlus size={15} className="text-sub" />
        </div>

        <div className="mt-2 grid gap-2">
          {supportLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-[14px] border border-transparent bg-white/[0.012] px-3 py-2.5 transition-colors duration-200 hover:border-white/[0.024] hover:bg-white/[0.026]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <FolderPlus size={14} className="shrink-0 text-sub" />
                    <p className="truncate text-[12px] font-bold text-text">{link.label}</p>
                  </div>
                  <p className="mt-1.5 line-clamp-2 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
                    {link.description}
                  </p>
                </div>
                <ArrowUpRight className="shrink-0 text-sub" size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
