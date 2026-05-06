export type LootboxStudioTierId = "common" | "rare" | "epic" | "legendary" | "mythic";
export type LootboxStudioRarity = LootboxStudioTierId;

export type LootboxStudioTier = {
  id: LootboxStudioTierId;
  label: string;
  priceShards: number;
  assetPath: string;
  minLevel: number;
  featuredCompletionsRequired?: number;
  requiresCleanTrust: boolean;
  requiresSeasonWindow: boolean;
  odds: Record<LootboxStudioRarity, number>;
};

export type LootboxStudioPoolItem = {
  tierId: LootboxStudioTierId;
  rarity: LootboxStudioRarity;
  label: string;
  itemType: string;
  weight: number;
  unlimitedStock: boolean;
  payloadLabel: string;
};

export type LootboxTierReadiness = {
  tier: LootboxStudioTier;
  outcomeCount: number;
  totalWeight: number;
  dominantRarity: LootboxStudioRarity;
  rarestRarity: LootboxStudioRarity;
  lockedBy: string[];
};

export const SHARD_STUDIO_ASSET_PATH = "/assets/lootboxes/shard.webp";

export const LOOTBOX_STUDIO_TIERS: LootboxStudioTier[] = [
  {
    id: "common",
    label: "Common Lootbox",
    priceShards: 250,
    assetPath: "/assets/lootboxes/common-lootbox.webp",
    minLevel: 0,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 70, rare: 22, epic: 6, legendary: 1.8, mythic: 0.2 },
  },
  {
    id: "rare",
    label: "Rare Lootbox",
    priceShards: 750,
    assetPath: "/assets/lootboxes/rare-lootbox.webp",
    minLevel: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 35, rare: 45, epic: 15, legendary: 4.5, mythic: 0.5 },
  },
  {
    id: "epic",
    label: "Epic Lootbox",
    priceShards: 2000,
    assetPath: "/assets/lootboxes/epic-lootbox.webp",
    minLevel: 8,
    featuredCompletionsRequired: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 35, epic: 45, legendary: 17, mythic: 3 },
  },
  {
    id: "legendary",
    label: "Legendary Lootbox",
    priceShards: 6000,
    assetPath: "/assets/lootboxes/legendary-lootbox.webp",
    minLevel: 15,
    requiresCleanTrust: true,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 0, epic: 45, legendary: 48, mythic: 7 },
  },
  {
    id: "mythic",
    label: "Mythic Lootbox",
    priceShards: 18000,
    assetPath: "/assets/lootboxes/mythic-lootbox.webp",
    minLevel: 25,
    requiresCleanTrust: true,
    requiresSeasonWindow: true,
    odds: { common: 0, rare: 0, epic: 0, legendary: 55, mythic: 45 },
  },
];

export const LOOTBOX_STUDIO_POOL_ITEMS: LootboxStudioPoolItem[] = [
  { tierId: "common", rarity: "common", label: "Shard Hunter Title", itemType: "title", weight: 70, unlimitedStock: true, payloadLabel: "Title: Shard Hunter" },
  { tierId: "common", rarity: "rare", label: "10 Percent Shard Refund", itemType: "shard_refund_percent", weight: 22, unlimitedStock: true, payloadLabel: "10% refund" },
  { tierId: "common", rarity: "epic", label: "Streak Protector", itemType: "streak_protector", weight: 6, unlimitedStock: true, payloadLabel: "1 use" },
  { tierId: "common", rarity: "legendary", label: "Raid Catalyst Title", itemType: "title", weight: 1.8, unlimitedStock: true, payloadLabel: "Title: Raid Catalyst" },
  { tierId: "common", rarity: "mythic", label: "Mythic Window Token", itemType: "season_access", weight: 0.2, unlimitedStock: true, payloadLabel: "Mythic preview" },
  { tierId: "rare", rarity: "common", label: "Shard Hunter Title", itemType: "title", weight: 35, unlimitedStock: true, payloadLabel: "Title: Shard Hunter" },
  { tierId: "rare", rarity: "rare", label: "25 Percent Shard Refund", itemType: "shard_refund_percent", weight: 45, unlimitedStock: true, payloadLabel: "25% refund" },
  { tierId: "rare", rarity: "epic", label: "Vault Runner Title", itemType: "title", weight: 15, unlimitedStock: true, payloadLabel: "Title: Vault Runner" },
  { tierId: "rare", rarity: "legendary", label: "Profile Glow", itemType: "profile_cosmetic", weight: 4.5, unlimitedStock: true, payloadLabel: "Gold profile glow" },
  { tierId: "rare", rarity: "mythic", label: "Mythic Window Token", itemType: "season_access", weight: 0.5, unlimitedStock: true, payloadLabel: "Mythic preview" },
  { tierId: "epic", rarity: "rare", label: "Rare Shard Refund", itemType: "shard_refund_percent", weight: 35, unlimitedStock: true, payloadLabel: "20% refund" },
  { tierId: "epic", rarity: "epic", label: "Vault Runner Profile Frame", itemType: "profile_cosmetic", weight: 45, unlimitedStock: true, payloadLabel: "Vault Runner frame" },
  { tierId: "epic", rarity: "legendary", label: "Streak Protector Pack", itemType: "streak_protector", weight: 17, unlimitedStock: true, payloadLabel: "3 uses" },
  { tierId: "epic", rarity: "mythic", label: "Mythic Preview Key", itemType: "season_access", weight: 3, unlimitedStock: true, payloadLabel: "Mythic preview" },
  { tierId: "legendary", rarity: "epic", label: "Epic Shard Refund", itemType: "shard_refund_percent", weight: 45, unlimitedStock: true, payloadLabel: "30% refund" },
  { tierId: "legendary", rarity: "legendary", label: "Legend Profile Glow", itemType: "profile_cosmetic", weight: 48, unlimitedStock: true, payloadLabel: "Legend profile glow" },
  { tierId: "legendary", rarity: "mythic", label: "Season Catalyst", itemType: "season_access", weight: 7, unlimitedStock: true, payloadLabel: "Season catalyst" },
  { tierId: "mythic", rarity: "legendary", label: "Legendary Shard Refund", itemType: "shard_refund_percent", weight: 55, unlimitedStock: true, payloadLabel: "40% refund" },
  { tierId: "mythic", rarity: "mythic", label: "Mythic Founder Aura", itemType: "profile_cosmetic", weight: 45, unlimitedStock: true, payloadLabel: "Founder aura" },
];

export function getLootboxStudioTier(id: LootboxStudioTierId) {
  const tier = LOOTBOX_STUDIO_TIERS.find((item) => item.id === id);
  if (!tier) {
    throw new Error(`Unknown lootbox studio tier: ${id}`);
  }
  return tier;
}

export function getLootboxPoolItemsForTier(tierId: LootboxStudioTierId) {
  return LOOTBOX_STUDIO_POOL_ITEMS.filter((item) => item.tierId === tierId);
}

export function buildLootboxTierReadiness(tier: LootboxStudioTier): LootboxTierReadiness {
  const outcomes = getLootboxPoolItemsForTier(tier.id);
  const oddsEntries = Object.entries(tier.odds).filter(([, value]) => value > 0) as Array<
    [LootboxStudioRarity, number]
  >;
  const sortedByOdds = [...oddsEntries].sort((left, right) => right[1] - left[1]);
  const lockedBy = [
    tier.minLevel > 0 ? `Level ${tier.minLevel}` : null,
    tier.featuredCompletionsRequired
      ? `${tier.featuredCompletionsRequired} featured actions`
      : null,
    tier.requiresCleanTrust ? "Clean trust" : null,
    tier.requiresSeasonWindow ? "Season window" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    tier,
    outcomeCount: outcomes.length,
    totalWeight: outcomes.reduce((sum, item) => sum + item.weight, 0),
    dominantRarity: sortedByOdds[0]?.[0] ?? "common",
    rarestRarity: sortedByOdds[sortedByOdds.length - 1]?.[0] ?? "common",
    lockedBy,
  };
}

export function buildLootboxStudioReadiness() {
  return LOOTBOX_STUDIO_TIERS.map(buildLootboxTierReadiness);
}

export function getLootboxRarityTone(rarity: LootboxStudioRarity) {
  switch (rarity) {
    case "mythic":
      return "border-rose-300/24 bg-rose-300/[0.08] text-rose-100";
    case "legendary":
      return "border-amber-300/24 bg-amber-300/[0.08] text-amber-100";
    case "epic":
      return "border-violet-300/24 bg-violet-300/[0.08] text-violet-100";
    case "rare":
      return "border-sky-300/24 bg-sky-300/[0.08] text-sky-100";
    case "common":
    default:
      return "border-white/[0.035] bg-white/[0.018] text-slate-200";
  }
}

export function formatOdds(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}
