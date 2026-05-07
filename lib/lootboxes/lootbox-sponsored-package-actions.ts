import type {
  LootboxSponsoredPackageBrief,
  LootboxSponsoredPackageStatus,
} from "./lootbox-sponsored-package-briefs";

export type LootboxSponsoredPackageActionBrief = LootboxSponsoredPackageBrief;
export type LootboxSponsoredPackageActionState = "ready" | "prep" | "locked";
export type LootboxSponsoredPackageActionId =
  | "copy_sponsor_brief"
  | "copy_audit_note"
  | "share_packet"
  | "open_campaign";

export type LootboxSponsoredPackageOperatorAction = {
  id: LootboxSponsoredPackageActionId;
  label: string;
  detail: string;
  state: LootboxSponsoredPackageActionState;
};

export type LootboxSponsoredPackageActionPack = {
  campaignId: string;
  projectName: string;
  campaignTitle: string;
  packageTier: LootboxSponsoredPackageBrief["packageTier"];
  status: LootboxSponsoredPackageStatus;
  actionState: LootboxSponsoredPackageActionState;
  exportTitle: string;
  sponsorBriefText: string;
  auditNoteTemplate: string;
  actions: LootboxSponsoredPackageOperatorAction[];
};

export type LootboxSponsoredPackageActionDesk = {
  summary: {
    total: number;
    readyToShare: number;
    needsSetup: number;
    locked: number;
    copyReady: number;
  };
  packs: LootboxSponsoredPackageActionPack[];
  recommendedPack: LootboxSponsoredPackageActionPack | null;
};

export function buildLootboxSponsoredPackageActionDesk(
  briefs: LootboxSponsoredPackageActionBrief[]
): LootboxSponsoredPackageActionDesk {
  const packs = briefs.map(buildSponsoredPackageActionPack);
  const summary = {
    total: packs.length,
    readyToShare: packs.filter((pack) => pack.status === "pitch_ready").length,
    needsSetup: packs.filter((pack) => pack.actionState === "prep").length,
    locked: packs.filter((pack) => pack.actionState === "locked").length,
    copyReady: packs.reduce(
      (count, pack) =>
        count +
        pack.actions.filter((action) => action.id.startsWith("copy_") && action.state === "ready")
          .length,
      0
    ),
  };
  const recommendedPack =
    packs.find((pack) => pack.actionState === "ready") ??
    packs.find((pack) => pack.actionState === "prep") ??
    null;

  return {
    summary,
    packs,
    recommendedPack,
  };
}

function buildSponsoredPackageActionPack(
  brief: LootboxSponsoredPackageActionBrief
): LootboxSponsoredPackageActionPack {
  const actionState = getActionState(brief.status);

  return {
    campaignId: brief.campaignId,
    projectName: brief.projectName,
    campaignTitle: brief.campaignTitle,
    packageTier: brief.packageTier,
    status: brief.status,
    actionState,
    exportTitle: `${brief.projectName} ${toTitleCase(brief.packageTier)} Sponsor Package`,
    sponsorBriefText: buildSponsorBriefText(brief),
    auditNoteTemplate: buildAuditNoteTemplate(brief),
    actions: getPackageActions(brief, actionState),
  };
}

function getActionState(
  status: LootboxSponsoredPackageStatus
): LootboxSponsoredPackageActionState {
  switch (status) {
    case "pitch_ready":
      return "ready";
    case "prep_needed":
      return "prep";
    case "locked":
    default:
      return "locked";
  }
}

function getPackageActions(
  brief: LootboxSponsoredPackageActionBrief,
  actionState: LootboxSponsoredPackageActionState
): LootboxSponsoredPackageOperatorAction[] {
  const isReady = actionState === "ready";
  const isLocked = actionState === "locked";

  return [
    {
      id: "copy_sponsor_brief",
      label: "Copy sponsor brief",
      detail: isReady
        ? "Copy the sponsor-facing package text for a sales or partner thread."
        : isLocked
          ? "Unlock campaign visibility before sponsor copy is useful."
          : "Finish setup before sponsor copy is shared externally.",
      state: isReady ? "ready" : actionState,
    },
    {
      id: "copy_audit_note",
      label: "Copy operator note",
      detail: isLocked
        ? "Audit note waits until the campaign route is visible."
        : "Copy a manual operator note for CRM or an internal release checklist.",
      state: isLocked ? "locked" : "ready",
    },
    {
      id: "share_packet",
      label: "Share packet",
      detail: isReady
        ? "Ready to share after the operator confirms owner, cap and fulfillment lane."
        : isLocked
          ? "Campaign route is locked, so sharing stays blocked."
          : `Setup needed first: ${brief.nextOperatorStep}`,
      state: isReady ? "ready" : actionState,
    },
    {
      id: "open_campaign",
      label: "Open campaign route",
      detail: isLocked
        ? "Fix campaign visibility before this becomes an operator action."
        : "Use the campaign route to verify context before any external promise.",
      state: isLocked ? "locked" : "ready",
    },
  ];
}

function buildSponsorBriefText(brief: LootboxSponsoredPackageActionBrief) {
  const deliverables = brief.deliverables
    .map((deliverable) => `- ${deliverable.label}: ${deliverable.detail}`)
    .join("\n");

  return [
    `${brief.projectName} ${toTitleCase(brief.packageTier)} Sponsor Package`,
    `Campaign: ${brief.campaignTitle}`,
    `Status: ${brief.status.replace(/_/g, " ")}`,
    `Budget: ${brief.budgetLabel}`,
    `Pressure: ${brief.pressureLabel}`,
    "",
    "Pitch:",
    brief.operatorPitch,
    "",
    "Deliverables:",
    deliverables,
    "",
    "Next operator step:",
    brief.nextOperatorStep,
    "",
    "Guardrails:",
    "- No reward is granted by this brief.",
    "- Payment, billing, fulfillment and payout stay manual until approved.",
  ].join("\n");
}

function buildAuditNoteTemplate(brief: LootboxSponsoredPackageActionBrief) {
  return [
    `Sponsor package brief staged for ${brief.projectName}.`,
    `Campaign: ${brief.campaignTitle}.`,
    `Tier: ${brief.packageTier}.`,
    `Status: ${brief.status.replace(/_/g, " ")}.`,
    `Next step: ${brief.nextOperatorStep}`,
    "No reward delivery, payment or billing action was triggered.",
  ].join(" ");
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
