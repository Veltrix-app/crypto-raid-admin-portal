export type AdminReward = {
  id: string;
  title: string;
  type: "access" | "token" | "badge" | "role";
  rarity: "common" | "rare" | "epic" | "legendary";
  cost: number;
  stock: number;
};