export const LOOTBOX_INVENTORY_STATUSES = [
  "owned",
  "pending_review",
  "claimed",
  "expired",
] as const;

export type LootboxInventoryStatus = (typeof LOOTBOX_INVENTORY_STATUSES)[number];

export function isLootboxInventoryStatus(value: unknown): value is LootboxInventoryStatus {
  return (
    typeof value === "string" &&
    (LOOTBOX_INVENTORY_STATUSES as readonly string[]).includes(value)
  );
}

export function buildLootboxInventoryStatusPatch(params: {
  status: LootboxInventoryStatus;
  now?: string;
}) {
  return {
    status: params.status,
    updated_at: params.now ?? new Date().toISOString(),
  };
}

export function getLootboxInventoryStatusActionLabel(status: LootboxInventoryStatus) {
  switch (status) {
    case "pending_review":
      return "Send to review";
    case "claimed":
      return "Mark claimed";
    case "expired":
      return "Expire reward";
    case "owned":
    default:
      return "Mark owned";
  }
}
