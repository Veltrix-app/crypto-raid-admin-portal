"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import {
  OpsPanel,
  OpsPriorityLink,
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
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <OpsPanel
          eyebrow="Getting started checklist"
          title="Move from account setup into launch operations"
          description="This stays intentionally calm: one clean sequence, one next move, no buried settings or portal sprawl."
        >
          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-3.5 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.status === "complete" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : item.status === "active" ? (
                        <Clock3 className="h-4 w-4 text-amber-300" />
                      ) : (
                        <Circle className="h-4 w-4 text-sub" />
                      )}
                    </div>
                    <div>
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
        </OpsPanel>

        <div className="space-y-4">
          <OpsPanel
            eyebrow="Next move"
            title={nextAction.label}
            description={nextAction.body}
            tone="accent"
            action={
              <Link
                href={nextAction.href}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
              >
                Open
                <ArrowUpRight size={14} />
              </Link>
            }
          >
            <div className="space-y-3">
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
            </div>
          </OpsPanel>

          {primaryAccount?.currentStep === "invite_team" ? (
            <OpsPanel
              eyebrow="Workspace team"
              title="Team setup is still open"
              description="Invite management now lives on its own account surface, so the owner can add the first teammate without leaving the onboarding rail."
            >
              <OpsPriorityLink
                href="/account/team"
                title="Open team and invites"
                body="Send the first invite, review current members and keep workspace roles simple while the deeper grant model comes later."
                cta="Open team"
                emphasis
              />
            </OpsPanel>
          ) : null}

          <OpsPriorityLink
            href={nextAction.href}
            title="Continue"
            body="The portal now keeps a dedicated first-run rail alive until the account is far enough along to operate like a mature workspace."
            cta="Continue"
            emphasis
          />
        </div>
      </div>
    </div>
  );
}
