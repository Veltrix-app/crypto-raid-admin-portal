import type {
  LootboxSponsoredPackageActionPack,
  LootboxSponsoredPackageActionState,
} from "./lootbox-sponsored-package-actions";

export type LootboxSponsoredPackageStatusBoardInputPack = LootboxSponsoredPackageActionPack;
export type LootboxSponsoredPackageStatusBoardColumnId =
  | "ready_to_pitch"
  | "setup_queue"
  | "blocked";

export type LootboxSponsoredPackageStatusBoardItem = {
  campaignId: string;
  projectName: string;
  campaignTitle: string;
  packageTier: LootboxSponsoredPackageActionPack["packageTier"];
  actionState: LootboxSponsoredPackageActionState;
  primaryAction: string;
  detail: string;
  routeHref: string;
};

export type LootboxSponsoredPackageStatusBoardColumn = {
  id: LootboxSponsoredPackageStatusBoardColumnId;
  label: string;
  detail: string;
  items: LootboxSponsoredPackageStatusBoardItem[];
};

export type LootboxSponsoredPackageStatusBoardFocus = {
  columnId: LootboxSponsoredPackageStatusBoardColumnId;
  campaignId: string;
  title: string;
  detail: string;
};

export type LootboxSponsoredPackageStatusBoard = {
  summary: {
    total: number;
    readyToPitch: number;
    setupQueue: number;
    blocked: number;
    manualOnly: true;
  };
  columns: LootboxSponsoredPackageStatusBoardColumn[];
  focus: LootboxSponsoredPackageStatusBoardFocus | null;
  guardrails: string[];
};

const columnDetails = {
  ready_to_pitch: {
    label: "Ready to pitch",
    detail: "Sponsor packet is ready for an operator-owned sponsor conversation.",
  },
  setup_queue: {
    label: "Setup queue",
    detail: "Package has demand, but needs budget, shard pool or final context first.",
  },
  blocked: {
    label: "Blocked",
    detail: "Campaign route is not ready enough to package externally.",
  },
} satisfies Record<
  LootboxSponsoredPackageStatusBoardColumnId,
  { label: string; detail: string }
>;

export function buildLootboxSponsoredPackageStatusBoard(
  packs: LootboxSponsoredPackageStatusBoardInputPack[]
): LootboxSponsoredPackageStatusBoard {
  const columns = (["ready_to_pitch", "setup_queue", "blocked"] as const).map((id) => ({
    id,
    label: columnDetails[id].label,
    detail: columnDetails[id].detail,
    items: packs
      .filter((pack) => getColumnId(pack.actionState) === id)
      .map(toStatusBoardItem),
  }));
  const focus = getStatusBoardFocus(columns);

  return {
    summary: {
      total: packs.length,
      readyToPitch: columns[0]?.items.length ?? 0,
      setupQueue: columns[1]?.items.length ?? 0,
      blocked: columns[2]?.items.length ?? 0,
      manualOnly: true,
    },
    columns,
    focus,
    guardrails: [
      "No package status writes happen from this board.",
      "No payment, billing, reward delivery or payout action is triggered.",
      "Operators use this board for routing and human-owned sponsor follow-up only.",
    ],
  };
}

function toStatusBoardItem(
  pack: LootboxSponsoredPackageStatusBoardInputPack
): LootboxSponsoredPackageStatusBoardItem {
  return {
    campaignId: pack.campaignId,
    projectName: pack.projectName,
    campaignTitle: pack.campaignTitle,
    packageTier: pack.packageTier,
    actionState: pack.actionState,
    primaryAction: getPrimaryAction(pack.actionState),
    detail: getItemDetail(pack),
    routeHref: `/campaigns/${pack.campaignId}`,
  };
}

function getColumnId(
  state: LootboxSponsoredPackageActionState
): LootboxSponsoredPackageStatusBoardColumnId {
  switch (state) {
    case "ready":
      return "ready_to_pitch";
    case "prep":
      return "setup_queue";
    case "locked":
    default:
      return "blocked";
  }
}

function getPrimaryAction(state: LootboxSponsoredPackageActionState) {
  switch (state) {
    case "ready":
      return "Share packet";
    case "prep":
      return "Finish setup";
    case "locked":
    default:
      return "Unblock route";
  }
}

function getItemDetail(pack: LootboxSponsoredPackageStatusBoardInputPack) {
  switch (pack.actionState) {
    case "ready":
      return "Confirm owner, cap and fulfillment lane before sponsor outreach.";
    case "prep":
      return "Finish setup before this package enters sponsor outreach.";
    case "locked":
    default:
      return "Unblock the campaign route before this can become a sponsor package.";
  }
}

function getStatusBoardFocus(
  columns: LootboxSponsoredPackageStatusBoardColumn[]
): LootboxSponsoredPackageStatusBoardFocus | null {
  const focusedColumn = columns.find((column) => column.items.length > 0);
  const focusedItem = focusedColumn?.items[0];

  if (!focusedColumn || !focusedItem) {
    return null;
  }

  return {
    columnId: focusedColumn.id,
    campaignId: focusedItem.campaignId,
    title: focusedItem.campaignTitle,
    detail: `${focusedItem.primaryAction}: ${focusedItem.detail}`,
  };
}
