import { AdminQuest } from "@/types/entities/quest";

export const mockQuests: AdminQuest[] = [
  {
    id: "q1",
    title: "Follow X account",
    campaignId: "c1",
    type: "social",
    status: "active",
    xp: 30
  },
  {
    id: "q2",
    title: "Upload meme proof",
    campaignId: "c1",
    type: "proof",
    status: "active",
    xp: 60
  },
  {
    id: "q3",
    title: "Connect wallet",
    campaignId: "c2",
    type: "on-chain",
    status: "draft",
    xp: 40
  }
];