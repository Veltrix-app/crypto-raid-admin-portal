import type { LootboxStudioPoolItem } from "./lootbox-studio-catalog";

export type LootboxPoolDraftReadiness = "ready" | "needs_outcome" | "needs_weight";

export type LootboxPoolDraftOverride = {
  key: string;
  enabled?: boolean;
  weight?: number;
  stockLimit?: number | null;
};

export type LootboxPoolDraftRow = LootboxStudioPoolItem & {
  key: string;
  enabled: boolean;
  draftWeight: number;
  stockLimit: number | null;
  oddsPercent: number;
};

export type LootboxPoolDraftSummary = {
  enabledCount: number;
  finiteStockCount: number;
  totalWeight: number;
  readiness: LootboxPoolDraftReadiness;
  warnings: string[];
  strongestOutcome: Pick<LootboxPoolDraftRow, "key" | "label" | "rarity" | "oddsPercent"> | null;
};

export type LootboxPoolDraft = {
  rows: LootboxPoolDraftRow[];
  summary: LootboxPoolDraftSummary;
};

export function getLootboxPoolDraftKey(item: LootboxStudioPoolItem) {
  return `${item.tierId}:${item.rarity}:${item.itemType}:${item.label}`;
}

export function buildLootboxPoolDraft(
  items: LootboxStudioPoolItem[],
  overrides: LootboxPoolDraftOverride[] = []
): LootboxPoolDraft {
  const overrideByKey = new Map(overrides.map((override) => [override.key, override]));
  const baseRows = items.map((item) => {
    const key = getLootboxPoolDraftKey(item);
    const override = overrideByKey.get(key);
    const enabled = override?.enabled ?? true;
    const draftWeight = sanitizeDraftWeight(override?.weight ?? item.weight);
    const stockLimit = sanitizeStockLimit(override?.stockLimit);

    return {
      ...item,
      key,
      enabled,
      draftWeight,
      stockLimit,
      oddsPercent: 0,
    };
  });

  const totalWeight = roundToTenth(
    baseRows.reduce((sum, row) => sum + (row.enabled ? row.draftWeight : 0), 0)
  );
  const rows = baseRows.map((row) => ({
    ...row,
    oddsPercent:
      row.enabled && totalWeight > 0 ? roundToTenth((row.draftWeight / totalWeight) * 100) : 0,
  }));
  const enabledCount = rows.filter((row) => row.enabled).length;
  const warnings = buildDraftWarnings(enabledCount, totalWeight);
  const strongestOutcome = [...rows]
    .filter((row) => row.enabled && row.oddsPercent > 0)
    .sort((left, right) => right.oddsPercent - left.oddsPercent)[0];

  return {
    rows,
    summary: {
      enabledCount,
      finiteStockCount: rows.filter((row) => row.stockLimit !== null).length,
      totalWeight,
      readiness:
        enabledCount === 0 ? "needs_outcome" : totalWeight <= 0 ? "needs_weight" : "ready",
      warnings,
      strongestOutcome: strongestOutcome
        ? {
            key: strongestOutcome.key,
            label: strongestOutcome.label,
            rarity: strongestOutcome.rarity,
            oddsPercent: strongestOutcome.oddsPercent,
          }
        : null,
    },
  };
}

function buildDraftWarnings(enabledCount: number, totalWeight: number) {
  if (enabledCount === 0) {
    return ["Enable at least one reward outcome."];
  }

  if (totalWeight <= 0) {
    return ["Give enabled outcomes a positive weight."];
  }

  return [];
}

function sanitizeDraftWeight(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return roundToTenth(Math.max(0, value));
}

function sanitizeStockLimit(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
