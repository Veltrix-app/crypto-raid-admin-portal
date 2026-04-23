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

export type AdminGrowthBenchmarkSummary = {
  available: boolean;
  benchmarkKey: "workspace_growth_score" | "project_launch_score";
  label: AdminBenchmarkLabel | null;
  labelText: string;
  currentValue: number;
  cohortKey: string | null;
  cohortLabel: string | null;
  cohortSize: number;
  lowerBound: number | null;
  medianValue: number | null;
  upperBound: number | null;
  topBandThreshold: number | null;
  unit: string;
};

export type AdminGrowthOverview = {
  latestSnapshotDate: string | null;
  funnel: Array<{
    stage: AdminGrowthFunnelStage;
    label: string;
    value: number;
    conversionRate: number | null;
    dataSource: "events" | "snapshots" | "blended";
  }>;
  revenue: {
    mrr: number;
    activePaidAccounts: number;
    freeAccounts: number;
    trialingAccounts: number;
    expansionReadyAccounts: number;
    churnRiskAccounts: number;
  };
  retention: {
    overallRetained30dRate: number;
    paidRetained30dRate: number;
    expansionReadyRate: number;
    churnRiskRate: number;
    cohorts: Array<{
      cohortLabel: string;
      accountCount: number;
      retainedCount: number;
      retainedRate: number;
    }>;
  };
  attribution: {
    sources: Array<{
      source: string;
      anonymousVisits: number;
      pricingViews: number;
      signups: number;
      checkoutStarts: number;
      paidConversions: number;
    }>;
  };
  benchmarkCoverage: {
    workspaceBenchmarksReady: number;
    workspaceAccountsMeasured: number;
    projectBenchmarksReady: number;
    projectsMeasured: number;
  };
};

export type AdminCustomerGrowthSummary = {
  customerAccountId: string;
  accountName: string;
  snapshotDate: string | null;
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
  benchmark: AdminGrowthBenchmarkSummary;
  recommendedMove: string;
};

export type AdminProjectGrowthSummary = {
  projectId: string;
  projectName: string;
  snapshotDate: string | null;
  projectStatus: string;
  campaignCount: number;
  activeCampaignCount: number;
  liveQuestCount: number;
  liveRaidCount: number;
  visibleRewardCount: number;
  providerCount: number;
  teamMemberCount: number;
  memberCount: number;
  benchmark: AdminGrowthBenchmarkSummary;
  recommendedMove: string;
};
