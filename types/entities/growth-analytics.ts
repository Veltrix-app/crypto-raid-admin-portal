export type AdminGrowthAnalyticsEventType =
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

export type AdminGrowthEventSource =
  | "webapp"
  | "portal"
  | "billing"
  | "customer"
  | "system"
  | "support"
  | "success";

export type AdminGrowthFunnelStage =
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

export type AdminBenchmarkLabel =
  | "below_peer_range"
  | "within_peer_range"
  | "above_peer_range"
  | "top_cohort";

export type AdminGrowthAttributionTouch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referrer: string | null;
  landingPath: string | null;
  capturedAt: string | null;
};

export type AdminGrowthBenchmarkBand = {
  label: AdminBenchmarkLabel;
  lowerBound: number | null;
  medianValue: number | null;
  upperBound: number | null;
  topBandThreshold: number | null;
  cohortSize: number;
  unit: string;
};

export type AdminGrowthFunnelSnapshot = {
  id: string;
  snapshotDate: string;
  funnelStage: AdminGrowthFunnelStage;
  metricValue: number;
  conversionRate: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCustomerAccountGrowthSnapshot = {
  id: string;
  customerAccountId: string;
  snapshotDate: string;
  billingPlanId: string | null;
  billingStatus: string;
  activationStage: string;
  workspaceHealthState: string;
  successHealthState: string;
  projectCount: number;
  activeCampaignCount: number;
  providerCount: number;
  billableSeatCount: number;
  currentMrr: number;
  isPaidAccount: boolean;
  isRetained30d: boolean;
  isExpansionReady: boolean;
  isChurnRisk: boolean;
  firstTouchSource: string | null;
  latestTouchSource: string | null;
  conversionTouchSource: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProjectGrowthSnapshot = {
  id: string;
  projectId: string;
  customerAccountId: string | null;
  snapshotDate: string;
  projectStatus: string;
  campaignCount: number;
  activeCampaignCount: number;
  liveQuestCount: number;
  liveRaidCount: number;
  visibleRewardCount: number;
  providerCount: number;
  teamMemberCount: number;
  memberCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};
