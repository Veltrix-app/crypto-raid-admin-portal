export type AdminReviewFlag = {
  id: string;
  authUserId?: string;
  projectId?: string;
  sourceTable: string;
  sourceId: string;
  flagType: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved" | "dismissed";
  reason: string;
  createdAt: string;
  updatedAt: string;
  username?: string;
  metadata?: string;
};
