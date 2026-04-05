export type AdminQuest = {
  id: string;
  title: string;
  campaignId: string;
  type: "social" | "proof" | "on-chain" | "referral";
  status: "active" | "draft";
  xp: number;
};