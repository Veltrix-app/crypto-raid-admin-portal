import { AdminReward } from "@/types/entities/reward";

export const mockRewards: AdminReward[] = [
  {
    id: "rw1",
    title: "Whitelist Spot",
    type: "access",
    rarity: "rare",
    cost: 500,
    stock: 120
  },
  {
    id: "rw2",
    title: "$25 USDC",
    type: "token",
    rarity: "legendary",
    cost: 1500,
    stock: 45
  },
  {
    id: "rw3",
    title: "OG Raider Badge",
    type: "badge",
    rarity: "epic",
    cost: 300,
    stock: 9999
  }
];