"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Clock3, Route } from "lucide-react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import {
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";

function getNextAction(props: {
  currentStep: string | undefined;
  firstProjectId: string | null | undefined;
}) {
  if (props.currentStep === "create_project") {
    return {
      href: "/projects/new",
      label: "Create first project",
      body: "Create the first project workspace and continue into launch setup from there.",
    };
  }

  if (props.currentStep === "invite_team") {
    return {
      href: "/account/team",
      label: "Invite first teammate",
      body: "The workspace layer now exists above projects, so the first invite can be managed without dropping into deeper project settings.",
    };
  }

  if (props.currentStep === "open_launch_workspace" && props.firstProjectId) {
    return {
      href: `/projects/${props.firstProjectId}/launch`,
      label: "Open launch workspace",
      body: "Jump into launch setup instead of navigating through the full portal tree first.",
    };
  }

  if (props.firstProjectId) {
    return {
      href: `/projects/${props.firstProjectId}`,
      label: "Open project workspace",
      body: "Continue from the project workspace that is already linked to this account.",
    };
  }

  return {
    href: "#workspace-bootstrap",
    label: "Create workspace",
    body: "Name the workspace account first. Projects, team access and launch setup unlock after that.",
  };
}

export default function AccountOnboardingChecklist() {
  const { accessState } = useAccountEntryGuard();
  const primaryAccount = accessState?.primaryAccount ?? null;
  const checklist = accessState?.checklist ?? [];
  const nextAction = getNextAction({
    currentStep: primaryAccount?.currentStep,
    firstProjectId: primaryAccount?.firstProjectId,
  });
  const completedCount = checklist.filter((item) => item.status === "complete").length;
  const progressPercent = checklist.length
    ? Math.round((completedCount / checklist.length) * 100)
    : 0;

  return (
    <OpsPanel
      eyebrow="Start here"
      title={nextAction.label}
      description={nextAction.body}
      action={
        <Link
          href={nextAction.href}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[12px] font-black text-black transition hover:brightness-105"
        >
          {nextAction.label}
          <ArrowUpRight size={13} />
        </Link>
      }
      tone="accent"
    >
      <div className="grid gap-3 xl:items-start xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <div className="grid gap-2.5 lg:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="rounded-[14px] border border-white/[0.035] bg-white/[0.018] px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300/90" />
                    ) : item.status === "active" ? (
                      <Clock3 className="h-4 w-4 text-amber-300/90" />
                    ) : (
                      <Circle className="h-4 w-4 text-sub" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-text">{item.label}</p>
                    <p className="mt-1 text-[12px] leading-5 text-sub">{item.description}</p>
                  </div>
                </div>
                <OpsStatusPill
                  tone={
                    item.status === "complete"
                      ? "success"
                      : item.status === "active"
                      ? "warning"
                      : "default"
                  }
                >
                  {item.status}
                </OpsStatusPill>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2.5 rounded-[16px] border border-white/[0.024] bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Onboarding route
              </p>
              <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                {completedCount}/{checklist.length || 4} complete
              </p>
            </div>
            <Route size={17} className="shrink-0 text-primary" />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.82),rgba(0,255,163,0.82))]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <OpsSnapshotRow
            label="Current step"
            value={(primaryAccount?.currentStep ?? "create_workspace").replaceAll("_", " ")}
          />
          <OpsSnapshotRow
            label="Workspace"
            value={
              primaryAccount
                ? `${primaryAccount.status} / ${primaryAccount.role}`
                : "Not created yet"
            }
          />
          {primaryAccount?.currentStep === "invite_team" ? (
            <Link
              href="/account/team"
              className="rounded-[14px] border border-white/[0.035] bg-white/[0.018] px-3 py-2.5 text-[12px] font-semibold text-primary transition hover:border-primary/20"
            >
              Open team and invites
            </Link>
          ) : null}
        </div>
      </div>
    </OpsPanel>
  );
}
