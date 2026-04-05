export type AdminRaid = {
  id: string;
  title: string;
  campaignId: string;
  status: "live" | "scheduled" | "ended";
  participants: number;
  rewardXp: number;
};