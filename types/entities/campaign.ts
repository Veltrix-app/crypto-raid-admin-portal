export type AdminCampaign = {
  id: string;

  projectId: string;

  title: string;
  slug: string;

  shortDescription: string;
  longDescription?: string;

  bannerUrl?: string;
  thumbnailUrl?: string;

  campaignType:
    | "social_growth"
    | "community_growth"
    | "onchain"
    | "referral"
    | "content"
    | "hybrid";

  xpBudget: number;
  participants: number;
  completionRate: number;

  visibility: "public" | "private" | "gated";
  featured: boolean;

  startsAt?: string;
  endsAt?: string;

  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "archived";
};