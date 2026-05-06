export type LootboxOpenRow = {
  id: string;
  auth_user_id: string;
  tier_id: string;
  shard_spend: number | null;
  pool_item_id: string | null;
  status: string | null;
  result_snapshot: Record<string, unknown> | null;
  created_at: string;
};

export type LootboxInventoryRow = {
  id: string;
  auth_user_id: string;
  lootbox_open_id: string | null;
  item_type: string;
  rarity: string;
  label: string;
  payload: Record<string, unknown> | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

export type LootboxActivityRead = {
  summary: {
    totalOpens: number;
    totalShardSpend: number;
    uniqueMembers: number;
    highRarityWins: number;
    pendingReviewInventory: number;
    openInventory: number;
  };
  recentOpens: Array<{
    id: string;
    memberLabel: string;
    tierId: string;
    rewardLabel: string;
    rarity: string;
    itemType: string;
    shardSpend: number;
    status: string;
    openedAt: string;
  }>;
  inventoryQueue: Array<{
    id: string;
    memberLabel: string;
    label: string;
    rarity: string;
    itemType: string;
    status: string;
    statusTone: "success" | "warning" | "danger" | "default";
    createdAt: string;
    updatedAt: string | null;
  }>;
};

export function buildLootboxActivityRead(params: {
  openRows: LootboxOpenRow[];
  inventoryRows: LootboxInventoryRow[];
}): LootboxActivityRead {
  const memberIds = new Set([
    ...params.openRows.map((row) => row.auth_user_id).filter(Boolean),
    ...params.inventoryRows.map((row) => row.auth_user_id).filter(Boolean),
  ]);

  const recentOpens = [...params.openRows]
    .sort((left, right) => compareIsoDesc(left.created_at, right.created_at))
    .slice(0, 12)
    .map((row) => {
      const result = normalizeResultSnapshot(row.result_snapshot);
      return {
        id: row.id,
        memberLabel: formatMemberLabel(row.auth_user_id),
        tierId: row.tier_id,
        rewardLabel: result.label,
        rarity: result.rarity,
        itemType: result.itemType,
        shardSpend: Number(row.shard_spend ?? 0),
        status: row.status ?? "unknown",
        openedAt: row.created_at,
      };
    });
  const inventoryQueue = [...params.inventoryRows]
    .sort((left, right) => compareInventoryRows(left, right))
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      memberLabel: formatMemberLabel(row.auth_user_id),
      label: row.label || "Lootbox reward",
      rarity: row.rarity || "common",
      itemType: row.item_type || "unknown",
      status: row.status ?? "owned",
      statusTone: getInventoryStatusTone(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  const highRarityInventory = params.inventoryRows.filter((row) =>
    ["legendary", "mythic"].includes((row.rarity ?? "").toLowerCase())
  );

  return {
    summary: {
      totalOpens: params.openRows.length,
      totalShardSpend: params.openRows.reduce(
        (sum, row) => sum + Number(row.shard_spend ?? 0),
        0
      ),
      uniqueMembers: memberIds.size,
      highRarityWins: highRarityInventory.length,
      pendingReviewInventory: params.inventoryRows.filter(
        (row) => row.status === "pending_review"
      ).length,
      openInventory: params.inventoryRows.filter((row) =>
        ["owned", "pending_review"].includes(row.status ?? "owned")
      ).length,
    },
    recentOpens,
    inventoryQueue,
  };
}

function normalizeResultSnapshot(snapshot: Record<string, unknown> | null) {
  return {
    label: typeof snapshot?.label === "string" ? snapshot.label : "Lootbox reward",
    rarity: typeof snapshot?.rarity === "string" ? snapshot.rarity : "common",
    itemType: typeof snapshot?.itemType === "string" ? snapshot.itemType : "unknown",
  };
}

function getInventoryStatusTone(
  status: string | null
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "owned":
    case "claimed":
      return "success";
    case "pending_review":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "default";
  }
}

function compareInventoryRows(left: LootboxInventoryRow, right: LootboxInventoryRow) {
  const leftPriority = left.status === "pending_review" ? 1 : 0;
  const rightPriority = right.status === "pending_review" ? 1 : 0;
  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }

  return compareIsoDesc(left.created_at, right.created_at);
}

function compareIsoDesc(left: string, right: string) {
  return new Date(right).getTime() - new Date(left).getTime();
}

function formatMemberLabel(authUserId: string) {
  if (!authUserId) {
    return "unknown";
  }

  if (authUserId.length <= 12) {
    return authUserId;
  }

  return `${authUserId.slice(0, 8)}...${authUserId.slice(-4)}`;
}
