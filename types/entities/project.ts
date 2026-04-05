export type AdminProject = {
  id: string;
  name: string;
  chain: string;
  status: "draft" | "active" | "paused";
  members: number;
  campaigns: number;
  logo: string;
  website: string;
  contactEmail: string;
  description: string;
  onboardingStatus: "draft" | "pending" | "approved";
};