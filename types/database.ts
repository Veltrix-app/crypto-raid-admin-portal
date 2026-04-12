export type ProjectStatus = "draft" | "active" | "paused";
export type OnboardingStatus = "draft" | "pending" | "approved";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type RaidStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

export type QuestStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived";

  export type RewardType =
  | "token"
  | "nft"
  | "role"
  | "allowlist"
  | "access"
  | "badge"
  | "physical"
  | "custom";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type TeamRole = "owner" | "admin" | "reviewer" | "analyst";
export type TeamStatus = "active" | "invited";

export type DbProject = {
  id: string;
  name: string;
  slug: string | null;

  chain: string;
  category: string | null;

  status: string;
  onboarding_status: string;

  description: string;
  long_description: string | null;

  members: number;
  campaigns: number;

  logo: string;
  banner_url: string | null;

  website: string | null;
  x_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;

  contact_email: string | null;

  is_featured: boolean | null;
  is_public: boolean | null;

  created_at?: string;
  updated_at?: string;
};

export type DbCampaign = {
  id: string;
  project_id: string;

  title: string;
  slug: string | null;

  short_description: string | null;
  long_description: string | null;

  banner_url: string | null;
  thumbnail_url: string | null;

  campaign_type: string;
  xp_budget: number;
  participants: number;
  completion_rate: number;

  visibility: string;
  featured: boolean | null;

  starts_at: string | null;
  ends_at: string | null;

  status: string;

  created_at?: string;
  updated_at?: string;
};

export type DbRaid = {
  id: string;

  project_id: string | null;
  campaign_id: string;

  title: string;
  short_description: string | null;
  community: string | null;
  target: string | null;

  banner: string | null;

  reward_xp: number | null;
  participants: number;
  progress: number | null;
  timer: string | null;

  platform: string | null;

  target_url: string | null;
  target_post_id: string | null;
  target_account_handle: string | null;

  verification_type: string | null;
  verification_config: Record<string, any> | null;

  instructions: string[] | null;

  starts_at: string | null;
  ends_at: string | null;

  status: string;

  created_at?: string;
  updated_at?: string;
};

export type DbQuest = {
  id: string;

  project_id: string | null;
  campaign_id: string;

  title: string;
  description: string | null;
  short_description: string | null;

  type: string | null;
  quest_type: string | null;
  platform: string | null;

  xp: number;
  action_label: string | null;
  action_url: string | null;

  proof_required: boolean | null;
  proof_type: string | null;

  auto_approve: boolean | null;
  verification_type: string | null;
  verification_config: Record<string, any> | null;

  is_repeatable: boolean | null;
  cooldown_seconds: number | null;
  max_completions_per_user: number | null;
  sort_order: number | null;

  starts_at: string | null;
  ends_at: string | null;

  status: string;

  created_at?: string;
  updated_at?: string;
};

export type DbReward = {
  id: string;

  project_id: string | null;
  campaign_id: string | null;

  title: string;
  description: string | null;

  type: string | null;
  reward_type: string | null;

  rarity: string;
  cost: number;

  claimable: boolean | null;
  visible: boolean | null;

  icon: string | null;
  image_url: string | null;

  stock: number | null;
  unlimited_stock: boolean | null;

  claim_method: string | null;
  delivery_config: Record<string, any> | null;

  status: string | null;

  created_at?: string;
  updated_at?: string;
};

export type DbSubmission = {
  id: string;
  auth_user_id: string;
  quest_id: string;
  proof_text: string;
  created_at: string;
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

export type DbClaim = {
  id: string;

  auth_user_id: string | null;
  username: string | null;

  reward_id: string | null;
  reward_title: string | null;

  project_id: string | null;
  project_name: string | null;

  campaign_id: string | null;
  campaign_title: string | null;

  claim_method: string | null;
  status: string | null;

  created_at: string;
};
