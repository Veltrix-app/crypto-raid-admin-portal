"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Compass,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ProjectOnboardingPriority = "required" | "recommended" | "later" | "complete";

export type ProjectOnboardingStep = {
  title: string;
  description: string;
  priority: ProjectOnboardingPriority;
};

export const PROJECT_OWNER_LANGUAGE = {
  required: "Needed for launch",
  recommended: "Recommended",
  later: "Can wait",
  complete: "Ready",
  nextMove: "Next best step",
  preview: "Preview as users will see it",
} as const;

export const PROJECT_INTAKE_STEPS: ProjectOnboardingStep[] = [
  {
    title: "Project basics",
    description: "Name, slug, chain, category and one short description so the workspace has a clear identity.",
    priority: "required",
  },
  {
    title: "Contact and community links",
    description: "Website, X, Telegram, Discord or docs so Veltrix can route users to the right places.",
    priority: "required",
  },
  {
    title: "Public profile polish",
    description: "Banner, brand accent, longer story and visibility settings for a stronger first impression.",
    priority: "recommended",
  },
  {
    title: "Token and launch context",
    description: "Contracts, launch post, wallet and waitlist data. Useful for richer automation, but not required to start.",
    priority: "later",
  },
];

export const PROJECT_FIRST_RUN_STEPS: ProjectOnboardingStep[] = [
  {
    title: "Finish the project profile",
    description: "Make the public page credible before members arrive.",
    priority: "required",
  },
  {
    title: "Connect community channels",
    description: "Link X, Telegram, Discord or docs so missions can route traffic cleanly.",
    priority: "required",
  },
  {
    title: "Prepare Showcase",
    description: "Check the premium project page modules, token context and public trust signals.",
    priority: "recommended",
  },
  {
    title: "Create the first campaign",
    description: "Give the project one launch lane before creating quests, raids and rewards around it.",
    priority: "required",
  },
  {
    title: "Add a quest or raid",
    description: "Turn the campaign into a clear member action with proof, timing and XP.",
    priority: "required",
  },
  {
    title: "Attach a reward",
    description: "Make the payoff visible so contributors know what they are working toward.",
    priority: "recommended",
  },
];

const priorityStyles: Record<
  ProjectOnboardingPriority,
  {
    label: string;
    className: string;
    icon: LucideIcon;
  }
> = {
  required: {
    label: PROJECT_OWNER_LANGUAGE.required,
    className: "border-primary/24 bg-primary/[0.08] text-primary",
    icon: CircleDot,
  },
  recommended: {
    label: PROJECT_OWNER_LANGUAGE.recommended,
    className: "border-sky-300/18 bg-sky-300/[0.06] text-sky-200",
    icon: Sparkles,
  },
  later: {
    label: PROJECT_OWNER_LANGUAGE.later,
    className: "border-white/[0.03] bg-white/[0.018] text-sub",
    icon: Clock3,
  },
  complete: {
    label: PROJECT_OWNER_LANGUAGE.complete,
    className: "border-emerald-300/18 bg-emerald-300/[0.075] text-emerald-200",
    icon: CheckCircle2,
  },
};

export function ProjectOnboardingPriorityPill({
  priority,
  children,
}: {
  priority: ProjectOnboardingPriority;
  children?: ReactNode;
}) {
  const style = priorityStyles[priority];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]",
        style.className
      )}
    >
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{children ?? style.label}</span>
    </span>
  );
}

export function ProjectOnboardingHero({
  title,
  description,
  modeLabel,
  outcomeLabel,
  children,
}: {
  title: string;
  description: string;
  modeLabel: string;
  outcomeLabel: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_18%_10%,rgba(186,255,59,0.12),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(87,189,255,0.09),transparent_24%),linear-gradient(180deg,rgba(13,17,24,0.98),rgba(7,9,14,0.97))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.22)] md:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-primary/[0.055] blur-3xl" />
      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.026] bg-black/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            <Compass size={13} />
            Project owner path
          </div>
          <h2 className="mt-4 max-w-3xl text-[1.38rem] font-semibold tracking-[-0.035em] text-text md:text-[1.7rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-sub">{description}</p>
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-black/24 p-3.5">
          <div className="grid gap-2.5">
            <ProjectOnboardingSignal label="Mode" value={modeLabel} />
            <ProjectOnboardingSignal label="After submit" value={outcomeLabel} />
          </div>
          {children ? <div className="mt-3.5">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ProjectOnboardingSignal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.02] bg-white/[0.014] px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 break-words text-[12px] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

export function ProjectOnboardingStepGrid({
  steps,
}: {
  steps: ProjectOnboardingStep[];
}) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="group relative overflow-hidden rounded-[17px] border border-white/[0.024] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] p-3.5 transition hover:border-primary/20 hover:bg-white/[0.024]"
        >
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/[0.05]" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sub">
                Step {index + 1}
              </p>
              <h3 className="mt-2 break-words text-[0.95rem] font-semibold tracking-[-0.02em] text-text [overflow-wrap:anywhere]">
                {step.title}
              </h3>
            </div>
            <ProjectOnboardingPriorityPill priority={step.priority} />
          </div>
          <p className="mt-2.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
            {step.description}
          </p>
        </article>
      ))}
    </div>
  );
}

export function ProjectOnboardingRail({
  title,
  description,
  steps,
  action,
}: {
  title: string;
  description: string;
  steps: ProjectOnboardingStep[];
  action?: ReactNode;
}) {
  return (
    <aside className="space-y-3">
      <section className="rounded-[20px] border border-white/[0.024] bg-[linear-gradient(180deg,rgba(12,15,22,0.96),rgba(8,10,15,0.94))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
          Guided setup
        </p>
        <h2 className="mt-2 text-[1rem] font-semibold tracking-[-0.02em] text-text">{title}</h2>
        <p className="mt-2 text-[12px] leading-5 text-sub">{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </section>

      <section className="rounded-[20px] border border-white/[0.024] bg-[linear-gradient(180deg,rgba(11,14,20,0.94),rgba(7,9,14,0.92))] p-2.5">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[15px] bg-white/[0.014] p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.026] bg-black/24 text-[11px] font-black text-sub">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-text">{step.title}</p>
                    <ProjectOnboardingPriorityPill priority={step.priority} />
                  </div>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function ProjectOnboardingActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.075] px-3.5 py-2 text-[12px] font-black text-primary transition hover:bg-primary/14"
    >
      {children}
      <ArrowUpRight size={13} />
    </Link>
  );
}
