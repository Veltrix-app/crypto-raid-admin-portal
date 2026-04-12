import { AdminUser } from "@/types/entities/user";

export const mockUsers: AdminUser[] = [
  {
    id: "u1",
    username: "RaidKing",
    xp: 12440,
    level: 12,
    streak: 7,
    trustScore: 82,
    sybilScore: 8,
    contributionTier: "legend",
    reputationRank: 1,
    questsCompleted: 42,
    raidsCompleted: 18,
    rewardsClaimed: 9,
    title: "Alpha Raider",
    avatarUrl: "",
    status: "active"
  },
  {
    id: "u2",
    username: "MoonMila",
    xp: 11120,
    level: 11,
    streak: 5,
    trustScore: 76,
    sybilScore: 14,
    contributionTier: "champion",
    reputationRank: 2,
    questsCompleted: 37,
    raidsCompleted: 12,
    rewardsClaimed: 6,
    title: "Community Closer",
    avatarUrl: "",
    status: "active"
  },
  {
    id: "u3",
    username: "NovaWolf",
    xp: 8410,
    level: 8,
    streak: 2,
    trustScore: 39,
    sybilScore: 74,
    contributionTier: "contender",
    reputationRank: 3,
    questsCompleted: 18,
    raidsCompleted: 4,
    rewardsClaimed: 2,
    title: "Watchlisted",
    avatarUrl: "",
    status: "flagged"
  }
];
