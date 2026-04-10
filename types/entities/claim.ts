export type AdminClaim = {
  id: string;

  authUserId: string;
  username: string;

  rewardId: string;
  rewardTitle: string;

  projectId?: string;
  projectName?: string;

  campaignId?: string;
  campaignTitle?: string;

  claimMethod: string;

  status: "pending" | "processing" | "fulfilled" | "rejected";

  createdAt: string;
};