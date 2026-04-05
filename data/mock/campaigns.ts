import { AdminCampaign } from "@/types/entities/campaign";

export const mockCampaigns: AdminCampaign[] = [
  {
    id: "c1",
    title: "Weekly Meme Push",
    projectId: "p1",
    status: "active",
    participants: 1421,
    completionRate: 64,
    xpBudget: 12000,
  },
  {
    id: "c2",
    title: "Launch Warmup",
    projectId: "p2",
    status: "active",
    participants: 882,
    completionRate: 38,
    xpBudget: 9000,
  },
  {
    id: "c3",
    title: "Ambassador Sprint",
    projectId: "p3",
    status: "draft",
    participants: 0,
    completionRate: 0,
    xpBudget: 18000,
  },
];