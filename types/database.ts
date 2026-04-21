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
  docs_url?: string | null;
  waitlist_url?: string | null;
  launch_post_url?: string | null;
  token_contract_address?: string | null;
  nft_contract_address?: string | null;
  primary_wallet?: string | null;
  brand_accent?: string | null;
  brand_mood?: string | null;

  contact_email: string | null;

  is_featured: boolean | null;
  is_public: boolean | null;
  owner_user_id?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type DbProjectWallet = {
  id: string;
  project_id: string;
  chain: string;
  wallet_address: string;
  label: string;
  wallet_type: string;
  is_active: boolean;
  metadata: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export type DbProjectAsset = {
  id: string;
  project_id: string;
  chain: string;
  contract_address: string;
  asset_type: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  metadata: Record<string, any> | null;
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
  campaign_mode?: string | null;
  reward_type?: string | null;
  reward_pool_amount?: number | null;
  min_xp_required?: number | null;
  activity_threshold?: number | null;
  lock_days?: number | null;
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
  verification_provider?: string | null;
  completion_mode?: string | null;
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
  review_notes?: string | null;
  reviewed_by_auth_user_id?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
};

export type DbUserConnectedAccount = {
  id: string;
  auth_user_id: string;
  provider: string;
  provider_user_id: string;
  username: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  status: string;
  connected_at?: string;
  updated_at?: string;
};

export type DbProjectIntegration = {
  id: string;
  project_id: string;
  provider: string;
  status: string;
  config: Record<string, any> | null;
  connected_at?: string;
  updated_at?: string;
};

export type DbVerificationEvent = {
  id: string;
  auth_user_id: string;
  project_id: string | null;
  quest_id: string | null;
  provider: string;
  event_type: string;
  external_ref: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbQuestVerificationRun = {
  id: string;
  auth_user_id: string;
  project_id: string | null;
  quest_id: string;
  provider: string;
  result: string;
  reason: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbTeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  project_id: string | null;
  auth_user_id: string | null;
  invited_by?: string | null;
  joined_at?: string | null;
  updated_at?: string;
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

export type DbProjectCampaignTemplate = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  base_template_id: string;
  configuration: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export type DbProjectBuilderTemplate = {
  id: string;
  project_id: string;
  template_kind: string;
  name: string;
  description: string | null;
  base_template_id: string | null;
  legacy_campaign_template_id: string | null;
  configuration: Record<string, any> | null;
  created_by_auth_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DbOnboardingRequest = {
  id: string;
  requested_by_auth_user_id: string | null;
  project_name: string;
  chain: string;
  category: string;
  website: string;
  contact_email: string;
  short_description: string;
  long_description: string;
  logo: string;
  banner_url: string;
  x_url: string;
  telegram_url: string;
  discord_url: string;
  requested_plan_id: string | null;
  status: string;
  review_notes: string;
  reviewed_by_auth_user_id: string | null;
  reviewed_at: string | null;
  approved_project_id: string | null;
  created_at: string;
  updated_at: string;
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
  fulfillment_notes?: string | null;
  delivery_payload?: Record<string, any> | null;
  reviewed_by_auth_user_id?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;

  created_at: string;
};

export type DbUserProfile = {
  id: string;
  auth_user_id: string | null;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  xp: number;
  level: number;
  streak: number;
  status: string;
  title: string | null;
};

export type DbUserGlobalReputation = {
  auth_user_id: string;
  total_xp: number;
  level: number;
  streak: number;
  trust_score: number;
  sybil_score: number;
  contribution_tier: string;
  reputation_rank: number;
  quests_completed: number;
  raids_completed: number;
  rewards_claimed: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type DbUserProjectReputation = {
  id: string;
  auth_user_id: string;
  project_id: string;
  xp: number;
  level: number;
  streak: number;
  trust_score: number;
  contribution_tier: string;
  quests_completed: number;
  raids_completed: number;
  rewards_claimed: number;
  last_activity_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DbReviewFlag = {
  id: string;
  auth_user_id: string | null;
  project_id: string | null;
  source_table: string;
  source_id: string;
  flag_type: string;
  severity: string;
  status: string;
  reason: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbAuditLog = {
  id: string;
  auth_user_id: string | null;
  project_id: string | null;
  source_table: string;
  source_id: string;
  action: string;
  summary: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbOnchainEvent = {
  id: string;
  auth_user_id: string;
  project_id: string;
  wallet_link_id: string | null;
  chain: string;
  tx_hash: string;
  block_time: string;
  event_type: string;
  contract_address: string;
  token_address: string | null;
  usd_value: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbRewardDistribution = {
  id: string;
  campaign_id: string;
  auth_user_id: string;
  reward_asset: string;
  reward_amount: number;
  calculation_snapshot: Record<string, any> | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DbTrustSnapshot = {
  id: string;
  auth_user_id: string;
  score: number;
  reasons: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbTrustCase = {
  id: string;
  project_id: string;
  auth_user_id: string | null;
  wallet_address: string | null;
  case_type: string;
  severity: string;
  status: string;
  source_type: string;
  source_id: string | null;
  dedupe_key: string;
  summary: string;
  evidence_summary: string | null;
  raw_signal_payload: Record<string, any> | null;
  internal_owner_auth_user_id: string | null;
  project_owner_auth_user_id: string | null;
  resolution_notes: string | null;
  escalation_state: string;
  metadata: Record<string, any> | null;
  opened_at: string;
  resolved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbTrustCaseEvent = {
  id: string;
  trust_case_id: string;
  project_id: string;
  event_type: string;
  visibility_scope: string;
  actor_auth_user_id: string | null;
  actor_role: string | null;
  summary: string | null;
  event_payload: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbProjectTrustPermission = {
  id: string;
  project_id: string;
  subject_auth_user_id: string;
  visibility_permissions: string[];
  action_permissions: string[];
  preset_key: string | null;
  status: string;
  notes: string | null;
  granted_by_auth_user_id: string | null;
  updated_by_auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPayoutCase = {
  id: string;
  project_id: string;
  campaign_id: string | null;
  reward_id: string | null;
  claim_id: string | null;
  auth_user_id: string | null;
  wallet_address: string | null;
  case_type: string;
  severity: string;
  status: string;
  source_type: string;
  source_id: string | null;
  dedupe_key: string;
  summary: string;
  evidence_summary: string | null;
  raw_payload: Record<string, any> | null;
  internal_owner_auth_user_id: string | null;
  project_owner_auth_user_id: string | null;
  resolution_notes: string | null;
  escalation_state: string;
  metadata: Record<string, any> | null;
  opened_at: string;
  resolved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPayoutCaseEvent = {
  id: string;
  payout_case_id: string;
  project_id: string;
  event_type: string;
  visibility_scope: string;
  actor_auth_user_id: string | null;
  actor_role: string | null;
  summary: string | null;
  event_payload: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbProjectPayoutPermission = {
  id: string;
  project_id: string;
  subject_auth_user_id: string;
  visibility_permissions: string[];
  action_permissions: string[];
  preset_key: string | null;
  status: string;
  notes: string | null;
  granted_by_auth_user_id: string | null;
  updated_by_auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbVerificationResult = {
  id: string;
  auth_user_id: string | null;
  project_id: string | null;
  quest_id: string | null;
  source_table: string;
  source_id: string;
  verification_type: string;
  route: string;
  decision_status: SubmissionStatus;
  decision_reason: string;
  confidence_score: number;
  required_config_keys: string[] | null;
  missing_config_keys: string[] | null;
  duplicate_signal_types: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
};
