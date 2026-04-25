"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Clock3 } from "lucide-react";
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
      href: "/projects",
      label: "Create first project",
      body: "The fastest path from account setup into the operational product is creating the first project workspace now.",
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
    href: "/projects",
    label: "Open projects",
    body: "Browse the current project workspaces connected to this account.",
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

  return (
    <OpsPanel
      eyebrow="Getting started checklist"
      title="Move from account setup into launch operations"
      description="This is the operational spine: complete the ordered steps, then use the single next move on the right."
      action={
        <Link
          href={nextAction.href}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[12px] font-black text-black transition hover:brightness-105"
        >
          {nextAction.label}
          <ArrowUpRight size={13} />
        </Link>
      }
    >
      <div className="grid gap-3 xl:items-start xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-2.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="rounded-[14px] border border-white/[0.035] bg-white/[0.018] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
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
                      <p className="mt-1.5 text-[12px] leading-5 text-sub">{item.description}</p>
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

        <div className="grid gap-2.5">
          <OpsSnapshotRow
            label="Next move"
            value={nextAction.body}
          />
          <OpsSnapshotRow
            label="Current step"
            value={primaryAccount?.currentStep ?? "create_workspace"}
          />
          <OpsSnapshotRow
            label="Workspace status"
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
