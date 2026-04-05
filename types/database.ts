export type ProjectStatus = "draft" | "active" | "paused";
export type OnboardingStatus = "draft" | "pending" | "approved";
export type CampaignStatus = "draft" | "active" | "completed";
export type RaidStatus = "live" | "scheduled" | "ended";
export type QuestType = "social" | "proof" | "on-chain" | "referral";
export type QuestStatus = "active" | "draft";
export type RewardType = "access" | "token" | "badge" | "role";
export type RewardRarity = "common" | "rare" | "epic" | "legendary";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type TeamRole = "owner" | "admin" | "reviewer" | "analyst";
export type TeamStatus = "active" | "invited";

export type DbProject = {
  id: string;
  name: string;
  chain: string;
  status: ProjectStatus;
  members: number;
  campaigns: number;
  logo: string;
  website: string;
  contact_email: string;
  description: string;
  onboarding_status: OnboardingStatus;
  owner_user_id: string | null;
  created_at: string;
};

export type DbCampaign = {
  id: string;
  title: string;
  project_id: string;
  status: CampaignStatus;
  participants: number;
  completion_rate: number;
  xp_budget: number;
  created_at: string;
};

export type DbRaid = {
  id: string;
  title: string;
  campaign_id: string;
  status: RaidStatus;
  participants: number;
  reward_xp: number;
  created_at: string;
};

export type DbQuest = {
  id: string;
  title: string;
  campaign_id: string;
  type: QuestType;
  status: QuestStatus;
  xp: number;
  created_at: string;
};

export type DbReward = {
  id: string;
  title: string;
  type: RewardType;
  rarity: RewardRarity;
  cost: number;
  stock: number;
  created_at: string;
};

export type DbSubmission = {
  id: string;
  user_id: string | null;
  username: string;
  quest_id: string;
  quest_title: string;
  campaign_id: string;
  campaign_title: string;
  proof: string;
  submitted_at: string;
  status: SubmissionStatus;
};

export type DbTeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  created_at: string;
};

export type DbBillingPlan = {
  id: string;
  name: string;
  price_monthly: number;
  projects_limit: number;
  campaigns_limit: number;
  features: string[];
  current: boolean;
};