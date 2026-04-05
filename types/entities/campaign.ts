export type AdminCampaign = {
  id: string;
  title: string;
  projectId: string;
  status: "draft" | "active" | "completed";
  participants: number;
  completionRate: number;
  xpBudget: number;
};