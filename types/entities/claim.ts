export type AdminClaim = {
  id: string;

  authUserId: string;
  username: string;

  rewardId: string;
  rewardTitle: string;
  rewardType?: string;
  rewardCost?: number;

  projectId?: string;
  projectName?: string;

  campaignId?: string;
  campaignTitle?: string;

  claimMethod: string;

  status: "pending" | "processing" | "fulfilled" | "rejected";
  fulfillmentNotes?: string;
  deliveryPayload?: string;
  reviewedAt?: string;
  updatedAt?: string;

  createdAt: string;
};
