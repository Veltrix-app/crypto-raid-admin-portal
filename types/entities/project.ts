export type AdminProject = {
  id: string;

  name: string;
  slug: string;

  chain: string;
  category?: string;

  status: "draft" | "active" | "paused";
  onboardingStatus: "draft" | "pending" | "approved";

  description: string;
  longDescription?: string;

  members: number;
  campaigns: number;

  logo: string;
  bannerUrl?: string;

  website?: string;
  xUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;

  contactEmail?: string;

  isFeatured?: boolean;
  isPublic?: boolean;
};