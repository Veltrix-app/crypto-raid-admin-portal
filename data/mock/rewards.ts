import { AdminReward } from "@/types/entities/reward";

export const mockRewards: AdminReward[] = [
  {
    id: "rw1",

    projectId: "p1",
    campaignId: "c1",

    title: "Whitelist Spot",
    description: "Priority access to the next allowlist event.",

    type: "access",
    rewardType: "access",

    rarity: "rare",

    cost: 500,
    claimable: true,
    visible: true,

    icon: "",
    imageUrl: "",

    stock: 120,
    unlimitedStock: false,

    claimMethod: "manual_fulfillment",
    deliveryConfig: "",

    status: "active",
  },
  {
    id: "rw2",

    projectId: "p2",
    campaignId: "c2",

    title: "$25 USDC",
    description: "Manual stablecoin payout for top contributors.",

    type: "token",
    rewardType: "token",

    rarity: "legendary",

    cost: 1500,
    claimable: true,
    visible: true,

    icon: "",
    imageUrl: "",

    stock: 45,
    unlimitedStock: false,

    claimMethod: "wallet_airdrop",
    deliveryConfig: "",

    status: "active",
  },
  {
    id: "rw3",

    projectId: "p1",
    campaignId: "",

    title: "OG Raider Badge",
    description: "Permanent profile badge for early top participants.",

    type: "badge",
    rewardType: "badge",

    rarity: "epic",

    cost: 300,
    claimable: true,
    visible: true,

    icon: "",
    imageUrl: "",

    stock: 9999,
    unlimitedStock: false,

    claimMethod: "instant_auto",
    deliveryConfig: "",

    status: "active",
  },
];