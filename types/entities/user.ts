export type AdminUser = {
  id: string;
  authUserId?: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  trustScore: number;
  sybilScore: number;
  contributionTier: string;
  reputationRank: number;
  questsCompleted: number;
  raidsCompleted: number;
  rewardsClaimed: number;
  title?: string;
  avatarUrl?: string;
  status: "active" | "flagged";
};
