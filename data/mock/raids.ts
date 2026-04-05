import { AdminRaid } from "@/types/entities/raid";

export const mockRaids: AdminRaid[] = [
  {
    id: "r1",
    title: "Push teaser thread",
    campaignId: "c1",
    status: "live",
    participants: 382,
    rewardXp: 40
  },
  {
    id: "r2",
    title: "Quote rumor thread",
    campaignId: "c2",
    status: "scheduled",
    participants: 0,
    rewardXp: 60
  }
];