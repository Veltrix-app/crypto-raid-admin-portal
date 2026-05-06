import type { LootboxStudioRarity, LootboxStudioTierId } from "./lootbox-studio-catalog";
import type { LootboxPoolDraftRow } from "./lootbox-pool-draft";

export type LootboxPoolPersistenceRow = {
  tierId: LootboxStudioTierId;
  rarity: LootboxStudioRarity;
  label: string;
  itemType: string;
  weight: number;
  active: boolean;
  unlimitedStock: boolean;
  stock: number | null;
};

export type LootboxPoolPersistencePayload = {
  tierId: LootboxStudioTierId;
  odds: Record<LootboxStudioRarity, number>;
  rows: LootboxPoolPersistenceRow[];
};

const rarityOrder: LootboxStudioRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export function buildLootboxPoolPersistencePayload(params: {
  tierId: LootboxStudioTierId;
  rows: LootboxPoolDraftRow[];
}): LootboxPoolPersistencePayload {
  const enabledRows = params.rows.filter((row) => row.enabled);

  if (enabledRows.length === 0) {
    throw new Error("Enable at least one reward outcome.");
  }

  if (enabledRows.some((row) => row.draftWeight <= 0)) {
    throw new Error("Give enabled outcomes a positive weight.");
  }

  for (const row of params.rows) {
    if (row.tierId !== params.tierId) {
      throw new Error(`${row.label} does not belong to ${params.tierId}.`);
    }
  }

  const totalWeight = enabledRows.reduce((sum, row) => sum + row.draftWeight, 0);
  const odds = rarityOrder.reduce(
    (nextOdds, rarity) => {
      const rarityWeight = enabledRows
        .filter((row) => row.rarity === rarity)
        .reduce((sum, row) => sum + row.draftWeight, 0);
      nextOdds[rarity] = totalWeight > 0 ? roundToTenth((rarityWeight / totalWeight) * 100) : 0;
      return nextOdds;
    },
    {} as Record<LootboxStudioRarity, number>
  );

  return {
    tierId: params.tierId,
    odds,
    rows: params.rows.map((row) => ({
      tierId: params.tierId,
      rarity: row.rarity,
      label: row.label,
      itemType: row.itemType,
      weight: row.enabled ? roundToTenth(row.draftWeight) : Math.max(0.1, roundToTenth(row.draftWeight)),
      active: row.enabled,
      unlimitedStock: row.stockLimit === null,
      stock: row.stockLimit,
    })),
  };
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
