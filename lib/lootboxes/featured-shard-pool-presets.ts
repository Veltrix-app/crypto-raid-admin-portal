import type {
  AdminFeaturedShardPoolDraft,
  AdminFeaturedShardPoolStatus,
} from "@/types/entities/featured-shard-pool";

export type FeaturedShardPoolPresetId = "none" | "base_featured" | "boost";

export type FeaturedShardPoolPreset = {
  id: FeaturedShardPoolPresetId;
  label: string;
  description: string;
  poolSize: number;
  bonusMin: number;
  bonusMax: number;
};

export const FEATURED_SHARD_POOL_PRESETS: FeaturedShardPoolPreset[] = [
  {
    id: "none",
    label: "No boost",
    description: "Launch without extra shard urgency.",
    poolSize: 0,
    bonusMin: 0,
    bonusMax: 0,
  },
  {
    id: "base_featured",
    label: "Base Featured Pool",
    description: "10,000 shards with +25 to +40 boost per verified action.",
    poolSize: 10000,
    bonusMin: 25,
    bonusMax: 40,
  },
  {
    id: "boost",
    label: "Boost Pool",
    description: "25,000 shards with +40 to +70 boost per verified action.",
    poolSize: 25000,
    bonusMin: 40,
    bonusMax: 70,
  },
];

export function getFeaturedShardPoolPreset(id: FeaturedShardPoolPresetId) {
  return FEATURED_SHARD_POOL_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function buildFeaturedShardPoolDraft(params: {
  presetId: FeaturedShardPoolPresetId;
  projectId: string;
  campaignId: string;
  createdByAuthUserId: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: AdminFeaturedShardPoolStatus;
}): AdminFeaturedShardPoolDraft | null {
  const preset = getFeaturedShardPoolPreset(params.presetId);
  if (!preset || preset.id === "none") {
    return null;
  }

  return {
    projectId: params.projectId,
    campaignId: params.campaignId,
    questId: null,
    raidId: null,
    label: preset.label,
    poolSize: preset.poolSize,
    remainingShards: preset.poolSize,
    bonusMin: preset.bonusMin,
    bonusMax: preset.bonusMax,
    perUserCap: null,
    startsAt: params.startsAt || null,
    endsAt: params.endsAt || null,
    status: params.status ?? "active",
    createdByAuthUserId: params.createdByAuthUserId,
    metadata: {
      presetId: preset.id,
      source: "campaign_studio",
    },
  };
}
