export type AdminReward = {
  id: string;

  projectId: string;
  campaignId?: string;

  title: string;
  description: string;

  type: string;

  rewardType:
    | "token"
    | "nft"
    | "role"
    | "allowlist"
    | "access"
    | "badge"
    | "physical"
    | "custom";

  rarity: "common" | "rare" | "epic" | "legendary";

  cost: number;
  claimable: boolean;
  visible: boolean;

  icon?: string;
  imageUrl?: string;

  stock?: number;
  unlimitedStock: boolean;

  claimMethod:
    | "instant_auto"
    | "manual_fulfillment"
    | "wallet_airdrop"
    | "role_assignment"
    | "code_distribution";

  deliveryConfig?: string;

  status: "draft" | "active" | "paused" | "archived";
};