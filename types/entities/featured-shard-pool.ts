export type AdminFeaturedShardPoolStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

export type AdminFeaturedShardPool = {
  id: string;
  projectId: string;
  campaignId: string | null;
  questId: string | null;
  raidId: string | null;
  label: string;
  poolSize: number;
  remainingShards: number;
  bonusMin: number;
  bonusMax: number;
  perUserCap?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: AdminFeaturedShardPoolStatus;
  createdByAuthUserId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeaturedShardPoolDraft = Omit<
  AdminFeaturedShardPool,
  "id" | "createdAt" | "updatedAt"
>;
