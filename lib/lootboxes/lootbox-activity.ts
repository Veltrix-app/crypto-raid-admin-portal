import type { LootboxInventoryStatus } from "./lootbox-inventory-actions";

type LootboxInventoryCommandStatus = Extract<
  LootboxInventoryStatus,
  "pending_review" | "claimed" | "expired"
>;

const INVENTORY_COMMAND_STATUSES = [
  "pending_review",
  "claimed",
  "expired",
] as const satisfies readonly LootboxInventoryCommandStatus[];

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

export type LootboxInventoryAuditRow = {
  id: string;
  auth_user_id: string | null;
  source_table: string;
  source_id: string;
  action: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
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
  inventoryTable: Array<{
    id: string;
    lootboxOpenId: string | null;
    memberLabel: string;
    label: string;
    rarity: string;
    itemType: string;
    payloadSummary: string;
    payloadEntries: Array<{ label: string; value: string }>;
    status: string;
    statusTone: "success" | "warning" | "danger" | "default";
    auditCount: number;
    auditTrail: Array<{
      id: string;
      actorLabel: string;
      action: string;
      summary: string;
      previousStatus: string;
      nextStatus: string;
      note: string | null;
      reference: string | null;
      createdAt: string;
    }>;
    fulfillment: {
      label: string;
      nextStep: string;
      auditHint: string;
    };
    createdAt: string;
    updatedAt: string | null;
    actionStatuses: LootboxInventoryCommandStatus[];
  }>;
};

export type LootboxInventoryCommandFilter =
  | "all"
  | "pending_review"
  | "owned"
  | "claimed"
  | "expired"
  | "high_rarity";

export type LootboxInventoryCommandCounts = Record<LootboxInventoryCommandFilter, number>;
export type LootboxInventoryCommandRow = LootboxActivityRead["inventoryTable"][number];

export function buildLootboxActivityRead(params: {
  openRows: LootboxOpenRow[];
  inventoryRows: LootboxInventoryRow[];
  auditRows?: LootboxInventoryAuditRow[];
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
  const sortedInventoryRows = [...params.inventoryRows]
    .sort((left, right) => compareInventoryRows(left, right))
    .slice(0, 12);
  const inventoryQueue = sortedInventoryRows.map((row) => ({
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
  const inventoryTable = sortedInventoryRows.map((row) => {
    const auditTrail = getAuditTrailForInventoryItem(params.auditRows ?? [], row.id);

    return {
      id: row.id,
      lootboxOpenId: row.lootbox_open_id,
      memberLabel: formatMemberLabel(row.auth_user_id),
      label: row.label || "Lootbox reward",
      rarity: row.rarity || "common",
      itemType: row.item_type || "unknown",
      payloadSummary: summarizePayload(row.payload),
      payloadEntries: formatPayloadEntries(row.payload),
      status: row.status ?? "owned",
      statusTone: getInventoryStatusTone(row.status),
      auditCount: auditTrail.length,
      auditTrail,
      fulfillment: getFulfillmentGuidance(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      actionStatuses: [...INVENTORY_COMMAND_STATUSES],
    };
  });
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
    inventoryTable,
  };
}

function getAuditTrailForInventoryItem(
  auditRows: LootboxInventoryAuditRow[],
  inventoryItemId: string
) {
  return auditRows
    .filter((row) => row.source_table === "user_inventory" && row.source_id === inventoryItemId)
    .sort((left, right) => compareIsoDesc(left.created_at, right.created_at))
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      actorLabel: formatMemberLabel(row.auth_user_id ?? ""),
      action: row.action || "audit_event",
      summary: row.summary || "Inventory audit event recorded.",
      previousStatus: formatMetadataString(row.metadata?.previousStatus),
      nextStatus: formatMetadataString(row.metadata?.nextStatus),
      note: formatOptionalMetadataString(row.metadata?.note),
      reference: formatOptionalMetadataString(row.metadata?.reference),
      createdAt: row.created_at,
    }));
}

export function buildLootboxInventoryCommandCounts(
  rows: LootboxInventoryCommandRow[]
): LootboxInventoryCommandCounts {
  return {
    all: rows.length,
    pending_review: rows.filter((row) => row.status === "pending_review").length,
    owned: rows.filter((row) => row.status === "owned").length,
    claimed: rows.filter((row) => row.status === "claimed").length,
    expired: rows.filter((row) => row.status === "expired").length,
    high_rarity: rows.filter((row) => isHighRarity(row.rarity)).length,
  };
}

export function filterLootboxInventoryCommandRows(
  rows: LootboxInventoryCommandRow[],
  params: { filter: LootboxInventoryCommandFilter; query: string }
) {
  const query = params.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (params.filter === "high_rarity" && !isHighRarity(row.rarity)) {
      return false;
    }

    if (
      params.filter !== "all" &&
      params.filter !== "high_rarity" &&
      row.status !== params.filter
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      row.label,
      row.memberLabel,
      row.payloadSummary,
      row.rarity,
      row.itemType,
      row.status,
      ...row.auditTrail.flatMap((event) => [
        event.summary,
        event.note ?? "",
        event.reference ?? "",
      ]),
    ].some((value) => value.toLowerCase().includes(query));
  });
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

function summarizePayload(payload: Record<string, unknown> | null) {
  if (!payload || Object.keys(payload).length === 0) {
    return "No payload";
  }

  if (typeof payload.title === "string") {
    return `title: ${payload.title}`;
  }

  if (typeof payload.cosmetic === "string") {
    return `cosmetic: ${payload.cosmetic}`;
  }

  if (typeof payload.refundPercent === "number" || typeof payload.refundPercent === "string") {
    return `refund: ${payload.refundPercent}%`;
  }

  if (typeof payload.uses === "number" || typeof payload.uses === "string") {
    return `uses: ${payload.uses}`;
  }

  if (typeof payload.window === "string") {
    return `window: ${payload.window}`;
  }

  const [key, value] = Object.entries(payload)[0] ?? ["payload", "available"];
  return `${key}: ${formatPayloadValue(value)}`;
}

function formatPayloadEntries(payload: Record<string, unknown> | null) {
  if (!payload || Object.keys(payload).length === 0) {
    return [{ label: "payload", value: "No payload" }];
  }

  return Object.entries(payload).map(([label, value]) => ({
    label,
    value: formatPayloadValue(value),
  }));
}

function formatPayloadValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (value && typeof value === "object") {
    return "configured";
  }

  return "available";
}

function formatMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "unknown";
}

function formatOptionalMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function getFulfillmentGuidance(status: string | null) {
  switch (status) {
    case "pending_review":
      return {
        label: "Manual review required",
        nextStep:
          "Validate payload, member eligibility and reward budget before marking this reward claimed.",
        auditHint: "Use the status action only after the manual check is complete.",
      };
    case "claimed":
      return {
        label: "Fulfilled",
        nextStep: "Reward is marked claimed. Keep this record as the fulfillment reference.",
        auditHint: "Future changes should be exceptional and visible in audit logs.",
      };
    case "expired":
      return {
        label: "Closed",
        nextStep: "Reward is expired. Send it back to review only when there is a clear reason.",
        auditHint: "Expired rewards should not be delivered without a new review pass.",
      };
    case "owned":
    default:
      return {
        label: "Ready for fulfillment",
        nextStep: "Confirm the reward route, then mark claimed after manual delivery is complete.",
        auditHint: "Claiming this reward writes the status change to the admin audit log.",
      };
  }
}

function isHighRarity(rarity: string) {
  return ["legendary", "mythic"].includes(rarity.toLowerCase());
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
