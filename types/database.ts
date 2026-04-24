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

export type BillingSubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "grace"
  | "canceled"
  | "enterprise_managed";

export type BillingPaymentMethodStatus =
  | "missing"
  | "ready"
  | "requires_attention";

export type BillingCollectionStatus =
  | "clear"
  | "renewing_soon"
  | "payment_failed"
  | "action_required"
  | "refunded";

export type BillingEventSource =
  | "stripe_webhook"
  | "portal_admin"
  | "system"
  | "customer";

export type BillingEventType =
  | "profile_created"
  | "subscription_started"
  | "subscription_updated"
  | "subscription_canceled"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_payment_failed"
  | "trial_extended"
  | "grace_extended"
  | "plan_changed"
  | "enterprise_managed_set"
  | "billing_synced"
  | "business_note_added";

export type SupportTicketType =
  | "product_question"
  | "technical_issue"
  | "billing_issue"
  | "account_access"
  | "reward_or_claim_issue"
  | "trust_or_abuse_report"
  | "provider_or_integration_issue"
  | "general_request";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicketStatus =
  | "new"
  | "triaging"
  | "waiting_on_customer"
  | "waiting_on_internal"
  | "escalated"
  | "resolved"
  | "closed";

export type SupportTicketWaitingState =
  | "none"
  | "customer"
  | "internal"
  | "provider";

export type SupportTicketEscalationState =
  | "none"
  | "watching"
  | "escalated"
  | "handoff_open";

export type SupportEventVisibilityScope = "internal" | "customer" | "both";

export type SupportTicketEventType =
  | "ticket_created"
  | "status_changed"
  | "claimed"
  | "internal_note"
  | "customer_update"
  | "handoff_created"
  | "incident_linked"
  | "resolved"
  | "closed"
  | "reopened";

export type SupportHandoffType =
  | "billing"
  | "trust"
  | "payout"
  | "onchain"
  | "product_ops"
  | "general_support";

export type SupportHandoffStatus = "open" | "accepted" | "resolved" | "canceled";

export type ServiceIncidentSeverity = "minor" | "major" | "critical";

export type ServiceIncidentImpactScope =
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type ServiceIncidentState =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export type ServiceIncidentUpdateType =
  | "state_change"
  | "public_update"
  | "internal_note";

export type ServiceIncidentVisibilityScope = "internal" | "public" | "both";

export type ServiceStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type ServiceStatusSnapshotSource = "system" | "incident_command" | "manual";

export type ActivationStage =
  | "workspace_created"
  | "first_project_created"
  | "provider_connected"
  | "campaign_live"
  | "member_active"
  | "live";

export type WorkspaceHealthState =
  | "not_started"
  | "activating"
  | "live"
  | "stalled";

export type SuccessHealthState =
  | "healthy"
  | "watching"
  | "expansion_ready"
  | "churn_risk";

export type SuccessNoteType =
  | "general"
  | "activation_blocker"
  | "expansion"
  | "churn_risk"
  | "member_health"
  | "follow_up";

export type SuccessNoteStatus = "open" | "resolved" | "archived";

export type SuccessTaskType =
  | "activation_follow_up"
  | "expansion_follow_up"
  | "risk_review"
  | "member_reactivation"
  | "billing_follow_up";

export type SuccessTaskStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "canceled";

export type SuccessTaskDueState =
  | "upcoming"
  | "due_now"
  | "overdue"
  | "resolved";

export type SuccessSignalType =
  | "activation_stalled"
  | "first_project_missing"
  | "first_campaign_missing"
  | "member_drift"
  | "expansion_ready"
  | "paid_low_usage"
  | "healthy_repeat_usage";

export type SuccessSignalTone = "default" | "success" | "warning" | "danger";

export type SuccessSignalStatus = "open" | "watching" | "resolved" | "dismissed";

export type ActivationLane = "onboarding" | "active" | "comeback";

export type MemberHealthState =
  | "new"
  | "active"
  | "drifting"
  | "reactivation_needed";

export type MemberReactivationEventType =
  | "prompt_shown"
  | "email_sent"
  | "member_returned"
  | "dismissed"
  | "completed";

export type ActivationNudgeTargetType = "account" | "project" | "member";

export type ActivationNudgeChannel = "in_product" | "email";

export type ActivationNudgeStatus =
  | "pending"
  | "shown"
  | "sent"
  | "dismissed"
  | "completed";

export type GrowthAnalyticsEventType =
  | "anonymous_visit"
  | "pricing_view"
  | "signup_started"
  | "signup_completed"
  | "workspace_created"
  | "first_project_created"
  | "provider_connected"
  | "first_campaign_live"
  | "checkout_started"
  | "paid_converted"
  | "renewal_succeeded"
  | "renewal_failed"
  | "expanded"
  | "downgraded"
  | "churned"
  | "member_joined"
  | "member_completed_first_quest"
  | "member_returned"
  | "reward_claimed";

export type GrowthEventSource =
  | "webapp"
  | "portal"
  | "billing"
  | "customer"
  | "system"
  | "support"
  | "success";

export type GrowthFunnelStage =
  | "anonymous_visit"
  | "pricing_view"
  | "signup_started"
  | "signup_completed"
  | "workspace_created"
  | "first_project_created"
  | "first_provider_connected"
  | "first_campaign_live"
  | "checkout_started"
  | "paid_converted"
  | "retained_30d"
  | "expanded"
  | "downgraded"
  | "churned";

export type BenchmarkLabel =
  | "below_peer_range"
  | "within_peer_range"
  | "above_peer_range"
  | "top_cohort";

export type SecurityPolicyStatus = "standard" | "enterprise_hardened";

export type SecurityAuthMethod = "password" | "sso";

export type AuthenticatorAssuranceLevel = "aal1" | "aal2";

export type SecurityRecoveryReviewState = "clear" | "watching" | "review_required";

export type SecurityRiskPosture = "standard" | "watching" | "high_risk";

export type SecurityEnforcementState =
  | "none"
  | "two_factor_required"
  | "sso_required"
  | "blocked";

export type SecuritySessionStatus = "active" | "revoked" | "expired" | "challenged";

export type SecuritySessionRiskLabel = "normal" | "watching" | "challenged";

export type DataAccessRequestType = "export" | "delete";

export type DataAccessRequestStatus =
  | "submitted"
  | "in_review"
  | "awaiting_verification"
  | "approved"
  | "rejected"
  | "completed";

export type DataAccessRequestVerificationState =
  | "pending"
  | "verified"
  | "rejected"
  | "not_needed";

export type ComplianceControlArea =
  | "identity"
  | "session_security"
  | "data_lifecycle"
  | "vendor_management"
  | "incident_response"
  | "backup_recovery"
  | "policy";

export type ComplianceControlState =
  | "implemented"
  | "monitoring"
  | "needs_work"
  | "planned";

export type ComplianceReviewState = "reviewed" | "attention_needed" | "scheduled";

export type ComplianceCadence = "monthly" | "quarterly" | "annual" | "ad_hoc";

export type ComplianceEvidenceType =
  | "note"
  | "document"
  | "link"
  | "drill"
  | "audit_log"
  | "screenshot";

export type SecurityIncidentSeverity = "low" | "medium" | "high" | "critical";

export type SecurityIncidentState =
  | "open"
  | "triaging"
  | "contained"
  | "monitoring"
  | "resolved"
  | "postmortem_due";

export type SecurityIncidentEventVisibilityScope = "internal" | "public" | "both";

export type SsoConnectionStatus = "draft" | "active" | "disabled";

export type SsoDomainVerificationStatus = "unverified" | "verified" | "blocked";

export type SubprocessorStatus = "active" | "planned" | "retired";

export type ReleaseTargetEnvironment = "local" | "preview" | "production";

export type CommercialLeadState =
  | "new"
  | "qualified"
  | "watching"
  | "engaged"
  | "evaluation"
  | "converted"
  | "cooling_off"
  | "lost";

export type CommercialLeadSource =
  | "manual"
  | "pricing"
  | "start"
  | "homepage"
  | "trust"
  | "docs"
  | "demo_request"
  | "enterprise_intake"
  | "support"
  | "billing"
  | "success"
  | "analytics"
  | "converted_account";

export type CommercialLeadEventType =
  | "lead_created"
  | "signal_captured"
  | "qualified"
  | "state_changed"
  | "note_added"
  | "task_added"
  | "task_resolved"
  | "request_linked"
  | "account_linked"
  | "converted"
  | "cooling_off"
  | "lost";

export type CommercialLeadNoteType =
  | "general"
  | "qualification"
  | "buyer_concern"
  | "enterprise_requirement"
  | "follow_up";

export type CommercialLeadNoteStatus = "open" | "resolved" | "archived";

export type CommercialFollowUpTaskType =
  | "follow_up"
  | "qualification"
  | "demo_follow_up"
  | "enterprise_review"
  | "expansion_follow_up";

export type CommercialFollowUpTaskStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "canceled";

export type CommercialFollowUpTaskDueState =
  | "upcoming"
  | "due_now"
  | "overdue"
  | "resolved";

export type CommercialRequestStatus = "new" | "qualified" | "converted" | "closed";

export type ReleaseRunState =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "deploying"
  | "smoke_pending"
  | "verified"
  | "degraded"
  | "rolled_back";

export type ReleaseDecision = "undecided" | "go" | "no_go" | "watch";

export type ReleaseServiceKey = "webapp" | "portal" | "docs" | "community_bot";

export type ReleaseServiceInclusionStatus = "included" | "not_in_scope";

export type ReleaseGateMode = "hard" | "light";

export type ReleaseServiceDeployStatus =
  | "pending"
  | "ready"
  | "deployed"
  | "degraded"
  | "rolled_back";

export type ReleaseCheckBlock =
  | "scope"
  | "environment"
  | "database"
  | "deploy"
  | "smoke"
  | "rollback";

export type ReleaseCheckResult = "not_run" | "passed" | "warning" | "failed";

export type ReleaseBlockerSeverity = "P0" | "P1" | "P2" | "P3";

export type ReleaseSmokeCategory =
  | "auth_and_entry"
  | "billing_and_account"
  | "support_and_status"
  | "security_and_trust"
  | "success_and_analytics"
  | "docs_and_public_surfaces"
  | "community_bot_readiness";

export type EnvironmentAuditStatus = "not_reviewed" | "ready" | "warning" | "critical";

export type MigrationReviewState = "not_reviewed" | "reviewed" | "approved";

export type MigrationRunState = "not_needed" | "pending" | "run" | "blocked";

export type DbBillingPlan = {
  id: string;
  name: string;
  price_monthly: number;
  projects_limit: number;
  campaigns_limit: number;
  quests_limit: number;
  raids_limit: number;
  providers_limit: number;
  included_billable_seats: number;
  features: string[];
  current: boolean;
  sort_order: number;
  trial_days: number;
  currency: string;
  billing_interval: string;
  is_public: boolean;
  is_self_serve: boolean;
  is_checkout_enabled: boolean;
  is_free_tier: boolean;
  is_enterprise: boolean;
  feature_flags: Record<string, any>;
  entitlement_metadata: Record<string, any>;
  stripe_product_id: string | null;
  stripe_monthly_price_id: string | null;
};

export type DbCustomerAccount = {
  id: string;
  legacy_project_id: string | null;
  name: string;
  status: string;
  contact_email: string;
  created_by_auth_user_id: string | null;
  primary_owner_auth_user_id: string | null;
  source_type: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountMembership = {
  id: string;
  customer_account_id: string;
  auth_user_id: string;
  role: string;
  status: string;
  invited_by_auth_user_id: string | null;
  joined_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountInvite = {
  id: string;
  customer_account_id: string;
  email: string;
  role: string;
  status: string;
  invite_token: string;
  invited_by_auth_user_id: string;
  accepted_by_auth_user_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountOnboarding = {
  customer_account_id: string;
  status: string;
  current_step: string;
  completed_steps: string[] | Record<string, any> | null;
  first_project_id: string | null;
  first_invite_sent_at: string | null;
  launch_workspace_opened_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountEvent = {
  id: string;
  customer_account_id: string;
  event_type: string;
  actor_auth_user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbCustomerAccountBillingProfile = {
  customer_account_id: string;
  billing_email: string;
  stripe_customer_id: string | null;
  stripe_default_payment_method_id: string | null;
  currency: string;
  country_code: string | null;
  payment_method_status: BillingPaymentMethodStatus;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountSubscription = {
  id: string;
  customer_account_id: string;
  billing_plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: BillingSubscriptionStatus;
  is_current: boolean;
  started_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  cancel_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  grace_until: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountInvoice = {
  id: string;
  customer_account_id: string;
  customer_account_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  invoice_number: string | null;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  collection_status: BillingCollectionStatus;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  refunded_amount: number;
  due_at: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountBillingEvent = {
  id: string;
  customer_account_id: string;
  customer_account_subscription_id: string | null;
  customer_account_invoice_id: string | null;
  event_source: BillingEventSource;
  event_type: BillingEventType;
  stripe_event_id: string | null;
  actor_auth_user_id: string | null;
  summary: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbCustomerAccountEntitlement = {
  customer_account_id: string;
  billing_plan_id: string;
  customer_account_subscription_id: string | null;
  max_projects: number;
  max_active_campaigns: number;
  max_live_quests: number;
  max_live_raids: number;
  max_providers: number;
  included_billable_seats: number;
  current_projects: number;
  current_active_campaigns: number;
  current_live_quests: number;
  current_live_raids: number;
  current_providers: number;
  current_billable_seats: number;
  warning_threshold_info: number;
  warning_threshold_upgrade: number;
  block_threshold: number;
  self_serve_allowed: boolean;
  enterprise_managed: boolean;
  grace_until: string | null;
  last_computed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountBusinessNote = {
  id: string;
  customer_account_id: string;
  author_auth_user_id: string | null;
  owner_auth_user_id: string | null;
  note_type: string;
  status: string;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type DbCustomerAccountActivation = {
  customer_account_id: string;
  activation_stage: ActivationStage;
  workspace_health_state: WorkspaceHealthState;
  success_health_state: SuccessHealthState;
  completed_milestones: string[] | Record<string, any> | null;
  blockers: string[] | Record<string, any> | null;
  next_best_action_key: string | null;
  next_best_action_label: string | null;
  next_best_action_route: string | null;
  first_project_id: string | null;
  first_live_campaign_id: string | null;
  first_provider_connected_at: string | null;
  first_campaign_live_at: string | null;
  last_member_activity_at: string | null;
  last_activation_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountSuccessNote = {
  id: string;
  customer_account_id: string;
  project_id: string | null;
  author_auth_user_id: string | null;
  owner_auth_user_id: string | null;
  note_type: SuccessNoteType;
  status: SuccessNoteStatus;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type DbCustomerAccountSuccessTask = {
  id: string;
  customer_account_id: string;
  project_id: string | null;
  owner_auth_user_id: string | null;
  task_type: SuccessTaskType;
  status: SuccessTaskStatus;
  due_state: SuccessTaskDueState;
  title: string;
  summary: string;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountSuccessSignal = {
  id: string;
  customer_account_id: string;
  project_id: string | null;
  dedupe_key: string;
  signal_type: SuccessSignalType;
  signal_tone: SuccessSignalTone;
  status: SuccessSignalStatus;
  summary: string;
  signal_payload: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type DbMemberActivationState = {
  id: string;
  auth_user_id: string;
  primary_project_id: string | null;
  activation_lane: ActivationLane;
  member_health_state: MemberHealthState;
  completed_milestones: string[] | Record<string, any> | null;
  blockers: string[] | Record<string, any> | null;
  next_best_action_key: string | null;
  next_best_action_label: string | null;
  next_best_action_route: string | null;
  linked_provider_count: number;
  wallet_verified: boolean;
  joined_project_count: number;
  completed_quest_count: number;
  claimed_reward_count: number;
  streak_days: number;
  last_activity_at: string | null;
  last_nudge_at: string | null;
  last_reactivation_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbMemberReactivationEvent = {
  id: string;
  auth_user_id: string;
  primary_project_id: string | null;
  event_type: MemberReactivationEventType;
  reason_key: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbActivationNudge = {
  id: string;
  dedupe_key: string;
  target_type: ActivationNudgeTargetType;
  customer_account_id: string | null;
  project_id: string | null;
  auth_user_id: string | null;
  channel: ActivationNudgeChannel;
  reason_key: string;
  status: ActivationNudgeStatus;
  title: string;
  body: string;
  route: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type DbGrowthAnalyticsEvent = {
  id: string;
  event_type: GrowthAnalyticsEventType;
  event_source: GrowthEventSource;
  occurred_at: string;
  auth_user_id: string | null;
  customer_account_id: string | null;
  project_id: string | null;
  campaign_id: string | null;
  session_id: string | null;
  anonymous_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_path: string | null;
  first_touch_source: string | null;
  first_touch_medium: string | null;
  first_touch_campaign: string | null;
  first_touch_term: string | null;
  first_touch_content: string | null;
  first_touch_referrer: string | null;
  first_touch_landing_path: string | null;
  first_touch_captured_at: string | null;
  latest_touch_source: string | null;
  latest_touch_medium: string | null;
  latest_touch_campaign: string | null;
  latest_touch_term: string | null;
  latest_touch_content: string | null;
  latest_touch_referrer: string | null;
  latest_touch_landing_path: string | null;
  latest_touch_captured_at: string | null;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbGrowthFunnelSnapshot = {
  id: string;
  snapshot_date: string;
  funnel_stage: GrowthFunnelStage;
  metric_value: number;
  conversion_rate: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountGrowthSnapshot = {
  id: string;
  customer_account_id: string;
  snapshot_date: string;
  billing_plan_id: string | null;
  billing_status: string;
  activation_stage: string;
  workspace_health_state: string;
  success_health_state: string;
  project_count: number;
  active_campaign_count: number;
  provider_count: number;
  billable_seat_count: number;
  current_mrr: number;
  is_paid_account: boolean;
  is_retained_30d: boolean;
  is_expansion_ready: boolean;
  is_churn_risk: boolean;
  first_touch_source: string | null;
  latest_touch_source: string | null;
  conversion_touch_source: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbProjectGrowthSnapshot = {
  id: string;
  project_id: string;
  customer_account_id: string | null;
  snapshot_date: string;
  project_status: string;
  campaign_count: number;
  active_campaign_count: number;
  live_quest_count: number;
  live_raid_count: number;
  visible_reward_count: number;
  provider_count: number;
  team_member_count: number;
  member_count: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbRetentionCohortSnapshot = {
  id: string;
  snapshot_date: string;
  cohort_type: "signup" | "paid";
  cohort_key: string;
  cohort_start: string;
  period_day: number;
  account_count: number;
  retained_count: number;
  retained_rate: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbBenchmarkCohortSnapshot = {
  id: string;
  snapshot_date: string;
  cohort_key: string;
  benchmark_key: string;
  minimum_cohort_size: number;
  cohort_size: number;
  lower_bound: number | null;
  median_value: number | null;
  upper_bound: number | null;
  top_band_threshold: number | null;
  unit: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbSupportTicket = {
  id: string;
  ticket_ref: string;
  auth_user_id: string | null;
  customer_account_id: string | null;
  project_id: string | null;
  linked_incident_id: string | null;
  source_origin: "web_public" | "web_authenticated" | "portal_internal" | "system";
  ticket_type: SupportTicketType;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  waiting_state: SupportTicketWaitingState;
  escalation_state: SupportTicketEscalationState;
  subject: string;
  message: string;
  requester_name: string;
  requester_email: string;
  assigned_admin_auth_user_id: string | null;
  latest_customer_update_at: string | null;
  latest_internal_update_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbSupportTicketEvent = {
  id: string;
  support_ticket_id: string;
  event_type: SupportTicketEventType;
  visibility_scope: SupportEventVisibilityScope;
  actor_auth_user_id: string | null;
  title: string | null;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbSupportTicketHandoff = {
  id: string;
  support_ticket_id: string;
  customer_account_id: string | null;
  target_project_id: string | null;
  handoff_type: SupportHandoffType;
  status: SupportHandoffStatus;
  target_record_id: string | null;
  target_route: string | null;
  summary: string;
  owner_auth_user_id: string | null;
  created_by_auth_user_id: string | null;
  accepted_at: string | null;
  resolved_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbServiceIncident = {
  id: string;
  incident_ref: string;
  title: string;
  component_key: string;
  severity: ServiceIncidentSeverity;
  impact_scope: ServiceIncidentImpactScope;
  state: ServiceIncidentState;
  public_summary: string;
  internal_summary: string;
  public_visible: boolean;
  declared_by_auth_user_id: string | null;
  owner_auth_user_id: string | null;
  opened_at: string;
  resolved_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbServiceIncidentUpdate = {
  id: string;
  service_incident_id: string;
  update_type: ServiceIncidentUpdateType;
  visibility_scope: ServiceIncidentVisibilityScope;
  incident_state: ServiceIncidentState | null;
  component_status: ServiceStatusLevel | null;
  title: string | null;
  message: string;
  actor_auth_user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type DbServiceStatusSnapshot = {
  id: string;
  component_key: string;
  component_label: string;
  status: ServiceStatusLevel;
  summary: string;
  public_message: string;
  service_incident_id: string | null;
  snapshot_source: ServiceStatusSnapshotSource;
  is_public: boolean;
  created_by_auth_user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

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
  customer_account_id?: string | null;

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
  customer_account_id?: string | null;
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

export type DbOnchainCase = {
  id: string;
  project_id: string;
  auth_user_id: string | null;
  wallet_address: string | null;
  asset_id: string | null;
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

export type DbOnchainCaseEvent = {
  id: string;
  onchain_case_id: string;
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

export type DbProjectOnchainPermission = {
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

export type DbPlatformMetricSnapshot = {
  id: string;
  metric_key: string;
  metric_section: string;
  metric_scope: string;
  snapshot_date: string;
  window_start: string | null;
  window_end: string | null;
  metric_value: number;
  previous_value: number | null;
  unit: string;
  health_state: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbProjectMetricSnapshot = {
  id: string;
  project_id: string;
  metric_key: string;
  metric_section: string;
  metric_scope: string;
  snapshot_date: string;
  window_start: string | null;
  window_end: string | null;
  metric_value: number;
  previous_value: number | null;
  unit: string;
  health_state: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbSupportEscalation = {
  id: string;
  project_id: string | null;
  source_surface: string;
  source_type: string;
  source_id: string;
  dedupe_key: string;
  title: string;
  summary: string | null;
  severity: string;
  status: string;
  waiting_on: string;
  owner_auth_user_id: string | null;
  opened_by_auth_user_id: string | null;
  resolved_by_auth_user_id: string | null;
  next_action_summary: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any> | null;
  opened_at: string;
  resolved_at: string | null;
  dismissed_at: string | null;
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

export type DbCustomerAccountSecurityPolicy = {
  customer_account_id: string;
  policy_status: SecurityPolicyStatus;
  sso_required: boolean;
  two_factor_required_for_admins: boolean;
  allowed_auth_methods: SecurityAuthMethod[];
  session_review_required: boolean;
  high_risk_reauth_required: boolean;
  security_contact_email: string;
  notes: string;
  reviewed_by_auth_user_id: string | null;
  last_reviewed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountSecurityEvent = {
  id: string;
  customer_account_id: string;
  event_type: string;
  actor_auth_user_id: string | null;
  summary: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbUserSecurityPosture = {
  auth_user_id: string;
  primary_customer_account_id: string | null;
  two_factor_enabled: boolean;
  verified_factor_count: number;
  current_aal: AuthenticatorAssuranceLevel;
  current_auth_method: SecurityAuthMethod | "unknown";
  sso_managed: boolean;
  recovery_review_state: SecurityRecoveryReviewState;
  risk_posture: SecurityRiskPosture;
  enforcement_state: SecurityEnforcementState;
  last_password_recovery_at: string | null;
  last_reauthentication_at: string | null;
  last_security_review_at: string | null;
  last_seen_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbAuthSession = {
  id: string;
  session_id: string;
  auth_user_id: string;
  customer_account_id: string | null;
  email: string | null;
  current_aal: AuthenticatorAssuranceLevel;
  primary_auth_method: SecurityAuthMethod | "unknown";
  amr_methods: string[];
  user_agent: string | null;
  ip_summary: string | null;
  location_summary: string | null;
  status: SecuritySessionStatus;
  risk_label: SecuritySessionRiskLabel;
  last_seen_at: string;
  revoked_at: string | null;
  revoked_by_auth_user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbAuthSessionEvent = {
  id: string;
  auth_session_id: string;
  event_type: string;
  actor_auth_user_id: string | null;
  summary: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbDataAccessRequest = {
  id: string;
  customer_account_id: string | null;
  auth_user_id: string | null;
  request_type: DataAccessRequestType;
  status: DataAccessRequestStatus;
  verification_state: DataAccessRequestVerificationState;
  requester_email: string;
  summary: string;
  review_notes: string;
  reviewed_by_auth_user_id: string | null;
  approved_by_auth_user_id: string | null;
  completed_by_auth_user_id: string | null;
  requested_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbDataAccessRequestEvent = {
  id: string;
  data_access_request_id: string;
  event_type: string;
  actor_auth_user_id: string | null;
  summary: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbComplianceControl = {
  id: string;
  control_key: string;
  title: string;
  summary: string;
  control_area: ComplianceControlArea;
  control_state: ComplianceControlState;
  review_state: ComplianceReviewState;
  owner_label: string;
  cadence: ComplianceCadence;
  evidence_summary: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbComplianceEvidenceItem = {
  id: string;
  compliance_control_id: string;
  evidence_type: ComplianceEvidenceType;
  title: string;
  summary: string;
  evidence_url: string | null;
  created_by_auth_user_id: string | null;
  verified_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbSecurityIncident = {
  id: string;
  incident_ref: string;
  customer_account_id: string | null;
  title: string;
  severity: SecurityIncidentSeverity;
  state: SecurityIncidentState;
  scope_summary: string;
  public_summary: string;
  internal_summary: string;
  owner_auth_user_id: string | null;
  declared_by_auth_user_id: string | null;
  opened_at: string;
  resolved_at: string | null;
  postmortem_due_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbSecurityIncidentEvent = {
  id: string;
  security_incident_id: string;
  event_type: string;
  visibility_scope: SecurityIncidentEventVisibilityScope;
  actor_auth_user_id: string | null;
  title: string | null;
  message: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbCustomerAccountSsoConnection = {
  id: string;
  customer_account_id: string;
  provider_label: string;
  provider_type: "saml";
  supabase_provider_id: string | null;
  status: SsoConnectionStatus;
  configured_by_auth_user_id: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  last_tested_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCustomerAccountSsoDomain = {
  id: string;
  customer_account_id: string;
  customer_account_sso_connection_id: string;
  domain: string;
  is_primary: boolean;
  verification_status: SsoDomainVerificationStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbSubprocessor = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  data_scope: string[];
  region_scope: string[];
  website_url: string;
  status: SubprocessorStatus;
  sort_order: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbReleaseRun = {
  id: string;
  release_ref: string;
  title: string;
  summary: string;
  target_environment: ReleaseTargetEnvironment;
  state: ReleaseRunState;
  decision: ReleaseDecision;
  decision_notes: string;
  blocker_summary: string;
  rollback_notes: string;
  owner_auth_user_id: string | null;
  approved_at: string | null;
  deploying_at: string | null;
  verified_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCommercialLead = {
  id: string;
  lead_state: CommercialLeadState;
  source: CommercialLeadSource;
  contact_name: string;
  contact_email: string;
  company_name: string;
  company_domain: string | null;
  owner_auth_user_id: string | null;
  linked_customer_account_id: string | null;
  qualification_summary: string;
  intent_summary: string;
  last_signal_at: string | null;
  last_contact_at: string | null;
  converted_at: string | null;
  lost_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbCommercialLeadEvent = {
  id: string;
  commercial_lead_id: string;
  event_type: CommercialLeadEventType;
  actor_auth_user_id: string | null;
  summary: string;
  event_payload: Record<string, any> | null;
  created_at: string;
};

export type DbCommercialLeadNote = {
  id: string;
  commercial_lead_id: string;
  author_auth_user_id: string | null;
  owner_auth_user_id: string | null;
  note_type: CommercialLeadNoteType;
  status: CommercialLeadNoteStatus;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type DbCommercialFollowUpTask = {
  id: string;
  commercial_lead_id: string;
  owner_auth_user_id: string | null;
  task_type: CommercialFollowUpTaskType;
  status: CommercialFollowUpTaskStatus;
  due_state: CommercialFollowUpTaskDueState;
  title: string;
  summary: string;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbDemoRequest = {
  id: string;
  commercial_lead_id: string | null;
  requester_name: string;
  requester_email: string;
  company_name: string;
  company_domain: string | null;
  team_size: string;
  use_case: string;
  urgency: string;
  request_source: string;
  status: CommercialRequestStatus;
  source_path: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbEnterpriseIntakeRequest = {
  id: string;
  commercial_lead_id: string | null;
  requester_name: string;
  requester_email: string;
  company_name: string;
  company_domain: string | null;
  team_size: string;
  use_case: string;
  requirement_summary: string;
  security_requirements: string;
  billing_requirements: string;
  onboarding_requirements: string;
  urgency: string;
  request_source: string;
  status: CommercialRequestStatus;
  source_path: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbReleaseRunService = {
  id: string;
  release_run_id: string;
  service_key: ReleaseServiceKey;
  inclusion_status: ReleaseServiceInclusionStatus;
  gate_mode: ReleaseGateMode;
  deploy_status: ReleaseServiceDeployStatus;
  version_label: string | null;
  notes: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbReleaseRunCheck = {
  id: string;
  release_run_id: string;
  service_key: ReleaseServiceKey | null;
  check_block: ReleaseCheckBlock;
  check_key: string;
  label: string;
  result: ReleaseCheckResult;
  severity: ReleaseBlockerSeverity;
  is_blocking: boolean;
  summary: string;
  next_action: string;
  verified_by_auth_user_id: string | null;
  verified_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbReleaseRunSmokeResult = {
  id: string;
  release_run_id: string;
  service_key: ReleaseServiceKey | null;
  smoke_category: ReleaseSmokeCategory;
  scenario_key: string;
  scenario_label: string;
  result: ReleaseCheckResult;
  notes: string;
  verified_by_auth_user_id: string | null;
  verified_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbEnvironmentAudit = {
  id: string;
  release_run_id: string;
  service_key: ReleaseServiceKey;
  target_environment: ReleaseTargetEnvironment;
  status: EnvironmentAuditStatus;
  summary: string;
  required_keys: string[];
  missing_keys: string[];
  mismatch_notes: string[];
  verified_by_auth_user_id: string | null;
  verified_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DbMigrationReleaseLink = {
  id: string;
  release_run_id: string;
  migration_filename: string;
  review_state: MigrationReviewState;
  run_state: MigrationRunState;
  mitigation_notes: string;
  reviewed_by_auth_user_id: string | null;
  reviewed_at: string | null;
  executed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};
