export type AdminSubmission = {
  id: string;
  userId: string;
  username: string;
  questId: string;
  questTitle: string;
  campaignId: string;
  campaignTitle: string;
  proof: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes?: string;
  reviewedByAuthUserId?: string;
  reviewedAt?: string;
  updatedAt?: string;
};
