export const METRIC_SECTIONS = [
  "activation",
  "readiness",
  "community",
  "rewards",
  "trust",
  "onchain",
  "automation",
  "operations",
] as const;

export const METRIC_UNITS = ["count", "percent", "score"] as const;
export const METRIC_SCOPES = ["platform", "project"] as const;
export const METRIC_HEALTH_STATES = ["healthy", "watch", "warning", "critical"] as const;

export const PLATFORM_METRIC_KEYS = [
  "active_projects",
  "launch_ready_projects",
  "member_activation_rate",
  "linked_readiness_rate",
  "campaign_completion_rate",
  "reward_claim_conversion_rate",
  "open_trust_case_count",
  "open_payout_case_count",
  "open_onchain_case_count",
  "automation_health_score",
  "provider_failure_count",
  "queue_backlog_count",
  "support_escalation_count",
] as const;

export const PROJECT_METRIC_KEYS = [
  "project_activation_rate",
  "project_launch_readiness_score",
  "project_linked_readiness_rate",
  "community_participation_rate",
  "project_reward_claim_conversion_rate",
  "project_open_trust_case_count",
  "project_open_payout_case_count",
  "project_open_onchain_case_count",
  "project_automation_health_score",
  "project_provider_failure_count",
  "project_queue_backlog_count",
  "project_support_escalation_count",
] as const;

export type MetricSection = (typeof METRIC_SECTIONS)[number];
export type MetricUnit = (typeof METRIC_UNITS)[number];
export type MetricScope = (typeof METRIC_SCOPES)[number];
export type MetricHealthState = (typeof METRIC_HEALTH_STATES)[number];
export type PlatformMetricKey = (typeof PLATFORM_METRIC_KEYS)[number];
export type ProjectMetricKey = (typeof PROJECT_METRIC_KEYS)[number];
export type MetricKey = PlatformMetricKey | ProjectMetricKey;

export type MetricDefinition = {
  key: MetricKey;
  scope: MetricScope;
  label: string;
  description: string;
  section: MetricSection;
  unit: MetricUnit;
  preferredDirection: "higher_is_better" | "lower_is_better";
  thresholds?: {
    watch?: number;
    warning?: number;
    critical?: number;
  };
};

export const METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  {
    key: "active_projects",
    scope: "platform",
    label: "Active projects",
    description: "Projects currently in motion across the platform.",
    section: "activation",
    unit: "count",
    preferredDirection: "higher_is_better",
  },
  {
    key: "launch_ready_projects",
    scope: "platform",
    label: "Launch-ready projects",
    description: "Projects currently meeting launch posture requirements.",
    section: "readiness",
    unit: "count",
    preferredDirection: "higher_is_better",
  },
  {
    key: "member_activation_rate",
    scope: "platform",
    label: "Member activation rate",
    description: "Share of members moving into active contribution.",
    section: "activation",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 60, warning: 45, critical: 30 },
  },
  {
    key: "linked_readiness_rate",
    scope: "platform",
    label: "Linked readiness rate",
    description: "Share of users with the expected linked account posture.",
    section: "readiness",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 75, warning: 60, critical: 45 },
  },
  {
    key: "campaign_completion_rate",
    scope: "platform",
    label: "Campaign completion rate",
    description: "Average completion rate across active campaigns.",
    section: "community",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 55, warning: 40, critical: 25 },
  },
  {
    key: "reward_claim_conversion_rate",
    scope: "platform",
    label: "Reward claim conversion",
    description: "Share of visible reward opportunities that convert into claims.",
    section: "rewards",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 40, warning: 25, critical: 10 },
  },
  {
    key: "open_trust_case_count",
    scope: "platform",
    label: "Open trust cases",
    description: "Unresolved trust or fraud cases across the platform.",
    section: "trust",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 15, warning: 30, critical: 50 },
  },
  {
    key: "open_payout_case_count",
    scope: "platform",
    label: "Open payout cases",
    description: "Unresolved payout, claim, or delivery safety cases.",
    section: "rewards",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 10, warning: 20, critical: 35 },
  },
  {
    key: "open_onchain_case_count",
    scope: "platform",
    label: "Open on-chain cases",
    description: "Unresolved ingestion, enrichment, or sync issues.",
    section: "onchain",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 10, warning: 20, critical: 35 },
  },
  {
    key: "automation_health_score",
    scope: "platform",
    label: "Automation health",
    description: "Composite score for automations, jobs, and routine ops rails.",
    section: "automation",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  {
    key: "provider_failure_count",
    scope: "platform",
    label: "Provider failures",
    description: "Fresh provider, webhook, and delivery failures requiring attention.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 7, critical: 12 },
  },
  {
    key: "queue_backlog_count",
    scope: "platform",
    label: "Queue backlog",
    description: "Open backlog across claims, moderation, on-chain, and trust queues.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 40, warning: 80, critical: 120 },
  },
  {
    key: "support_escalation_count",
    scope: "platform",
    label: "Support escalations",
    description: "Cross-surface issues currently needing explicit ownership.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  {
    key: "project_activation_rate",
    scope: "project",
    label: "Project activation rate",
    description: "Share of project members reaching active participation.",
    section: "activation",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 60, warning: 45, critical: 30 },
  },
  {
    key: "project_launch_readiness_score",
    scope: "project",
    label: "Launch readiness",
    description: "Composite launch posture score for the active project.",
    section: "readiness",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  {
    key: "project_linked_readiness_rate",
    scope: "project",
    label: "Project linked readiness",
    description: "Share of project members with linked and verified readiness.",
    section: "readiness",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 75, warning: 60, critical: 45 },
  },
  {
    key: "community_participation_rate",
    scope: "project",
    label: "Community participation",
    description: "Contribution and mission participation rate for the project community.",
    section: "community",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 55, warning: 40, critical: 25 },
  },
  {
    key: "project_reward_claim_conversion_rate",
    scope: "project",
    label: "Project reward conversion",
    description: "Share of project reward opportunities converting into claims.",
    section: "rewards",
    unit: "percent",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 40, warning: 25, critical: 10 },
  },
  {
    key: "project_open_trust_case_count",
    scope: "project",
    label: "Project trust cases",
    description: "Unresolved trust and fraud cases for the project.",
    section: "trust",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 5, warning: 10, critical: 18 },
  },
  {
    key: "project_open_payout_case_count",
    scope: "project",
    label: "Project payout cases",
    description: "Unresolved payout and claim safety cases for the project.",
    section: "rewards",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  {
    key: "project_open_onchain_case_count",
    scope: "project",
    label: "Project on-chain cases",
    description: "Unresolved project ingestion, enrichment, and sync issues.",
    section: "onchain",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 3, warning: 6, critical: 10 },
  },
  {
    key: "project_automation_health_score",
    scope: "project",
    label: "Project automation health",
    description: "Composite automation and cadence health for the project.",
    section: "automation",
    unit: "score",
    preferredDirection: "higher_is_better",
    thresholds: { watch: 80, warning: 65, critical: 45 },
  },
  {
    key: "project_provider_failure_count",
    scope: "project",
    label: "Project provider failures",
    description: "Fresh provider or webhook failures touching the project.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 2, warning: 4, critical: 7 },
  },
  {
    key: "project_queue_backlog_count",
    scope: "project",
    label: "Project queue backlog",
    description: "Backlog pressure across moderation, claims, trust, and on-chain for the project.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 12, warning: 25, critical: 40 },
  },
  {
    key: "project_support_escalation_count",
    scope: "project",
    label: "Project escalations",
    description: "Active support escalations tied to the project.",
    section: "operations",
    unit: "count",
    preferredDirection: "lower_is_better",
    thresholds: { watch: 1, warning: 3, critical: 5 },
  },
] as const;

export const METRIC_DEFINITION_BY_KEY = Object.fromEntries(
  METRIC_DEFINITIONS.map((definition) => [definition.key, definition])
) as Record<MetricKey, MetricDefinition>;

export function isMetricKey(value: string): value is MetricKey {
  return value in METRIC_DEFINITION_BY_KEY;
}

export function getMetricDefinition(key: MetricKey) {
  return METRIC_DEFINITION_BY_KEY[key];
}

export function evaluateMetricHealthState(key: MetricKey, value: number): MetricHealthState {
  const definition = getMetricDefinition(key);
  const thresholds = definition.thresholds;

  if (!thresholds) {
    return "healthy";
  }

  const direction = definition.preferredDirection;

  if (direction === "higher_is_better") {
    if (typeof thresholds.critical === "number" && value <= thresholds.critical) return "critical";
    if (typeof thresholds.warning === "number" && value <= thresholds.warning) return "warning";
    if (typeof thresholds.watch === "number" && value <= thresholds.watch) return "watch";
    return "healthy";
  }

  if (typeof thresholds.critical === "number" && value >= thresholds.critical) return "critical";
  if (typeof thresholds.warning === "number" && value >= thresholds.warning) return "warning";
  if (typeof thresholds.watch === "number" && value >= thresholds.watch) return "watch";
  return "healthy";
}
