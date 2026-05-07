export type LootboxSponsoredPackagePersistenceInput = {
  totalPackages: number;
  readyToPitch: number;
  setupQueue: number;
  blocked: number;
};

export type LootboxSponsoredPackagePersistenceTable = {
  name: "lootbox_sponsor_packages" | "lootbox_sponsor_package_notes";
  purpose: string;
  primaryFields: string[];
};

export type LootboxSponsoredPackagePersistenceGate = {
  label: string;
  detail: string;
  state: "planned";
};

export const lootboxSponsorPackageStatuses = [
  "draft",
  "ready_to_pitch",
  "pitched",
  "negotiating",
  "won",
  "lost",
  "blocked",
  "archived",
] as const;

export const lootboxSponsorPackageNoteTypes = [
  "operator_note",
  "sponsor_follow_up",
  "status_change",
  "decision",
] as const;

const persistenceTables: LootboxSponsoredPackagePersistenceTable[] = [
  {
    name: "lootbox_sponsor_packages",
    purpose: "Stores package status, owner, sponsor budget, follow-up date and the package snapshot.",
    primaryFields: ["project_id", "campaign_id", "status", "owner_auth_user_id", "follow_up_at"],
  },
  {
    name: "lootbox_sponsor_package_notes",
    purpose: "Stores operator notes, sponsor follow-ups, status changes and decision notes.",
    primaryFields: ["sponsor_package_id", "note_type", "note", "follow_up_at"],
  },
];

export function buildLootboxSponsoredPackagePersistenceReadiness(
  input: LootboxSponsoredPackagePersistenceInput
) {
  return {
    summary: {
      totalPackages: input.totalPackages,
      readyToPitch: input.readyToPitch,
      needsOperatorSetup: input.setupQueue + input.blocked,
      requiredTables: persistenceTables.length,
      liveWrites: false,
    },
    tables: persistenceTables,
    fields: {
      status: [...lootboxSponsorPackageStatuses],
      noteTypes: [...lootboxSponsorPackageNoteTypes],
      owner: ["owner_auth_user_id", "created_by_auth_user_id"],
      followUp: ["follow_up_at", "last_contacted_at"],
    },
    writeGates: [
      {
        label: "Create package",
        detail: "Planned API will persist one sponsor package snapshot after the Phase 2E-L SQL is live.",
        state: "planned" as const,
      },
      {
        label: "Update owner/status",
        detail: "Planned API will change owner, status and follow-up dates with audit context.",
        state: "planned" as const,
      },
      {
        label: "Add note",
        detail: "Planned API will append operator notes and sponsor follow-ups to the note table.",
        state: "planned" as const,
      },
    ] satisfies LootboxSponsoredPackagePersistenceGate[],
    guardrails: [
      "No reward inventory, lootbox open or payout table is changed by this foundation.",
      "Portal writes stay disabled until the Phase 2E-L SQL has been run successfully.",
      "Persistence starts with sponsor package status, owner, notes and follow-up only.",
    ],
    nextStep: "Run the Phase 2E-L SQL, then enable the sponsor package persistence APIs in the next phase.",
  };
}
