import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type {
  AdminBenchmarkLabel,
  AdminCustomerGrowthSummary,
  AdminGrowthBenchmarkSummary,
  AdminGrowthFunnelStage,
  AdminGrowthOverview,
  AdminProjectGrowthSummary,
} from "@/types/entities/growth-analytics";

const ACCOUNT_BENCHMARK_MINIMUM = 5;
const PROJECT_BENCHMARK_MINIMUM = 5;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type FunnelSnapshotRow = {
  snapshot_date: string;
  funnel_stage: AdminGrowthFunnelStage;
  metric_value: number;
  conversion_rate: number | null;
};

type AccountSnapshotRow = {
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
};

type ProjectSnapshotRow = {
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
};

type GrowthEventRow = {
  event_type: string;
  latest_touch_source: string | null;
  utm_source: string | null;
  first_touch_source: string | null;
  customer_account_id: string | null;
  occurred_at: string;
};

type AccountMetaRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type ProjectMetaRow = {
  id: string;
  name: string;
  customer_account_id: string | null;
  status: string;
  members: number;
};

type AccountSubscriptionRow = {
  customer_account_id: string;
  billing_plan_id: string | null;
  status: string;
  current_period_end: string | null;
};

type AccountEntitlementRow = {
  customer_account_id: string;
  current_projects: number;
  current_active_campaigns: number;
  current_providers: number;
  current_billable_seats: number;
};

type ProjectCountRow = {
  id: string;
};

type IntegrationRow = {
  provider: string | null;
};

type EventTouchRow = {
  first_touch_source: string | null;
  latest_touch_source: string | null;
  utm_source: string | null;
  event_type: string;
  occurred_at: string;
};

function sanitizeSourceLabel(value: string | null | undefined) {
  if (!value) {
    return "Direct";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "Direct";
  }

  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function optionalSourceLabel(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return sanitizeSourceLabel(value);
}

function humanizeBenchmarkLabel(label: AdminBenchmarkLabel | null) {
  switch (label) {
    case "below_peer_range":
      return "Below peer range";
    case "within_peer_range":
      return "Within peer range";
    case "above_peer_range":
      return "Above peer range";
    case "top_cohort":
      return "Top cohort";
    default:
      return "Benchmark building";
  }
}

function humanizeFunnelStage(stage: AdminGrowthFunnelStage) {
  switch (stage) {
    case "anonymous_visit":
      return "Visits";
    case "pricing_view":
      return "Pricing views";
    case "signup_started":
      return "Signup starts";
    case "signup_completed":
      return "Signups";
    case "workspace_created":
      return "Workspaces";
    case "first_project_created":
      return "First projects";
    case "first_provider_connected":
      return "Providers connected";
    case "first_campaign_live":
      return "First live campaigns";
    case "checkout_started":
      return "Checkout starts";
    case "paid_converted":
      return "Paid conversions";
    case "retained_30d":
      return "Retained 30d";
    case "expanded":
      return "Expanded";
    case "downgraded":
      return "Downgraded";
    case "churned":
      return "Churned";
    default:
      return String(stage).replaceAll("_", " ");
  }
}

function calculatePercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) {
    return null;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((sortedValues.length - 1) * ratio))
  );
  return sortedValues[index] ?? null;
}

function resolveAccountAgeBand(createdAt: string | null) {
  if (!createdAt) {
    return "unknown";
  }

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const ageDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (ageDays <= 30) {
    return "0_30_days";
  }

  if (ageDays <= 90) {
    return "31_90_days";
  }

  return "91_plus_days";
}

function humanizeAccountAgeBand(ageBand: string) {
  switch (ageBand) {
    case "0_30_days":
      return "first 30 days";
    case "31_90_days":
      return "days 31 to 90";
    case "91_plus_days":
      return "after day 90";
    default:
      return "mixed age";
  }
}

function buildAccountCohortKey(snapshot: AccountSnapshotRow, createdAt: string | null) {
  return `plan:${snapshot.billing_plan_id ?? "free"}|age:${resolveAccountAgeBand(createdAt)}`;
}

function buildAccountCohortLabel(snapshot: AccountSnapshotRow, createdAt: string | null) {
  const planLabel = sanitizeSourceLabel(snapshot.billing_plan_id ?? "free");
  return `${planLabel} workspaces in ${humanizeAccountAgeBand(resolveAccountAgeBand(createdAt))}`;
}

function buildProjectCohortKey(snapshot: ProjectSnapshotRow, accountPlanId: string | null | undefined) {
  return `plan:${accountPlanId ?? "free"}|status:${snapshot.project_status}`;
}

function buildProjectCohortLabel(snapshot: ProjectSnapshotRow, accountPlanId: string | null | undefined) {
  const planLabel = sanitizeSourceLabel(accountPlanId ?? "free");
  return `${planLabel} projects with ${snapshot.project_status.replaceAll("_", " ")} posture`;
}

function calculateWorkspaceGrowthScore(snapshot: {
  project_count: number;
  active_campaign_count: number;
  provider_count: number;
  billable_seat_count: number;
  is_paid_account: boolean;
  is_retained_30d: boolean;
  is_expansion_ready: boolean;
  is_churn_risk: boolean;
}) {
  const baseScore =
    snapshot.project_count * 18 +
    snapshot.active_campaign_count * 26 +
    snapshot.provider_count * 12 +
    snapshot.billable_seat_count * 6 +
    (snapshot.is_paid_account ? 10 : 0) +
    (snapshot.is_retained_30d ? 12 : 0) +
    (snapshot.is_expansion_ready ? 10 : 0) -
    (snapshot.is_churn_risk ? 8 : 0);

  return Math.max(0, Math.round(baseScore));
}

function calculateProjectLaunchScore(snapshot: {
  campaign_count: number;
  active_campaign_count: number;
  live_quest_count: number;
  live_raid_count: number;
  visible_reward_count: number;
  provider_count: number;
  team_member_count: number;
  member_count: number;
}) {
  const baseScore =
    snapshot.campaign_count * 8 +
    snapshot.active_campaign_count * 20 +
    snapshot.live_quest_count * 3 +
    snapshot.live_raid_count * 10 +
    snapshot.visible_reward_count * 2 +
    snapshot.provider_count * 12 +
    snapshot.team_member_count * 4 +
    Math.round(Math.min(snapshot.member_count, 200) / 10);

  return Math.max(0, Math.round(baseScore));
}

function deriveBenchmarkFromValues(params: {
  currentValue: number;
  values: number[];
  cohortKey: string;
  cohortLabel: string;
  benchmarkKey: "workspace_growth_score" | "project_launch_score";
  unit: string;
  minimumCohortSize: number;
}): AdminGrowthBenchmarkSummary {
  const sortedValues = [...params.values].sort((left, right) => left - right);
  const lowerBound = percentile(sortedValues, 0.25);
  const medianValue = percentile(sortedValues, 0.5);
  const upperBound = percentile(sortedValues, 0.75);
  const topBandThreshold = percentile(sortedValues, 0.9);
  const cohortSize = sortedValues.length;

  if (
    cohortSize < params.minimumCohortSize ||
    lowerBound === null ||
    medianValue === null ||
    upperBound === null ||
    topBandThreshold === null
  ) {
    return {
      available: false,
      benchmarkKey: params.benchmarkKey,
      label: null,
      labelText: humanizeBenchmarkLabel(null),
      currentValue: params.currentValue,
      cohortKey: params.cohortKey,
      cohortLabel: params.cohortLabel,
      cohortSize,
      lowerBound,
      medianValue,
      upperBound,
      topBandThreshold,
      unit: params.unit,
    };
  }

  const label: AdminBenchmarkLabel =
    params.currentValue >= topBandThreshold
      ? "top_cohort"
      : params.currentValue > upperBound
        ? "above_peer_range"
        : params.currentValue < lowerBound
          ? "below_peer_range"
          : "within_peer_range";

  return {
    available: true,
    benchmarkKey: params.benchmarkKey,
    label,
    labelText: humanizeBenchmarkLabel(label),
    currentValue: params.currentValue,
    cohortKey: params.cohortKey,
    cohortLabel: params.cohortLabel,
    cohortSize,
    lowerBound,
    medianValue,
    upperBound,
    topBandThreshold,
    unit: params.unit,
  };
}

async function loadLatestSnapshotDate(table: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || `Failed to load latest snapshot date for ${table}.`);
  }

  return typeof data?.snapshot_date === "string" ? data.snapshot_date : null;
}

function buildAttributionSummary(rows: GrowthEventRow[]) {
  const sourceMap = new Map<
    string,
    { source: string; anonymousVisits: number; pricingViews: number; signups: number; checkoutStarts: number; paidConversions: number }
  >();

  for (const row of rows) {
    const source = sanitizeSourceLabel(
      row.latest_touch_source ?? row.utm_source ?? row.first_touch_source ?? "direct"
    );
    const current =
      sourceMap.get(source) ??
      {
        source,
        anonymousVisits: 0,
        pricingViews: 0,
        signups: 0,
        checkoutStarts: 0,
        paidConversions: 0,
      };

    if (row.event_type === "anonymous_visit") {
      current.anonymousVisits += 1;
    }
    if (row.event_type === "pricing_view") {
      current.pricingViews += 1;
    }
    if (row.event_type === "signup_completed") {
      current.signups += 1;
    }
    if (row.event_type === "checkout_started") {
      current.checkoutStarts += 1;
    }
    if (row.event_type === "paid_converted") {
      current.paidConversions += 1;
    }

    sourceMap.set(source, current);
  }

  return Array.from(sourceMap.values())
    .sort((left, right) => {
      const rightScore =
        right.paidConversions * 100 + right.signups * 20 + right.pricingViews * 5 + right.anonymousVisits;
      const leftScore =
        left.paidConversions * 100 + left.signups * 20 + left.pricingViews * 5 + left.anonymousVisits;
      return rightScore - leftScore;
    })
    .slice(0, 6);
}

function buildRecentFunnel(params: {
  funnelRows: FunnelSnapshotRow[];
  recentEvents: GrowthEventRow[];
  accountRows: AccountSnapshotRow[];
}) {
  const eventCounts = new Map<string, number>();
  for (const row of params.recentEvents) {
    eventCounts.set(row.event_type, (eventCounts.get(row.event_type) ?? 0) + 1);
  }

  const snapshotCounts = new Map(
    params.funnelRows.map((row) => [row.funnel_stage, row.metric_value] as const)
  );

  const retainedCount = params.accountRows.filter((row) => row.is_retained_30d).length;

  const stageValues: Array<{
    stage: AdminGrowthFunnelStage;
    value: number;
    dataSource: "events" | "snapshots" | "blended";
  }> = [
    { stage: "anonymous_visit", value: eventCounts.get("anonymous_visit") ?? 0, dataSource: "events" },
    { stage: "pricing_view", value: eventCounts.get("pricing_view") ?? 0, dataSource: "events" },
    { stage: "signup_started", value: eventCounts.get("signup_started") ?? 0, dataSource: "events" },
    { stage: "signup_completed", value: eventCounts.get("signup_completed") ?? 0, dataSource: "events" },
    {
      stage: "workspace_created",
      value: snapshotCounts.get("workspace_created") ?? eventCounts.get("workspace_created") ?? 0,
      dataSource:
        snapshotCounts.has("workspace_created") && eventCounts.has("workspace_created")
          ? "blended"
          : snapshotCounts.has("workspace_created")
            ? "snapshots"
            : "events",
    },
    {
      stage: "first_project_created",
      value:
        snapshotCounts.get("first_project_created") ?? eventCounts.get("first_project_created") ?? 0,
      dataSource:
        snapshotCounts.has("first_project_created") && eventCounts.has("first_project_created")
          ? "blended"
          : snapshotCounts.has("first_project_created")
            ? "snapshots"
            : "events",
    },
    {
      stage: "first_provider_connected",
      value:
        snapshotCounts.get("first_provider_connected") ?? eventCounts.get("provider_connected") ?? 0,
      dataSource:
        snapshotCounts.has("first_provider_connected") && eventCounts.has("provider_connected")
          ? "blended"
          : snapshotCounts.has("first_provider_connected")
            ? "snapshots"
            : "events",
    },
    {
      stage: "first_campaign_live",
      value:
        snapshotCounts.get("first_campaign_live") ?? eventCounts.get("first_campaign_live") ?? 0,
      dataSource:
        snapshotCounts.has("first_campaign_live") && eventCounts.has("first_campaign_live")
          ? "blended"
          : snapshotCounts.has("first_campaign_live")
            ? "snapshots"
            : "events",
    },
    { stage: "checkout_started", value: eventCounts.get("checkout_started") ?? 0, dataSource: "events" },
    {
      stage: "paid_converted",
      value: snapshotCounts.get("paid_converted") ?? eventCounts.get("paid_converted") ?? 0,
      dataSource:
        snapshotCounts.has("paid_converted") && eventCounts.has("paid_converted")
          ? "blended"
          : snapshotCounts.has("paid_converted")
            ? "snapshots"
            : "events",
    },
    {
      stage: "retained_30d",
      value: retainedCount,
      dataSource: "snapshots",
    },
    {
      stage: "expanded",
      value: eventCounts.get("expanded") ?? snapshotCounts.get("expanded") ?? 0,
      dataSource: eventCounts.has("expanded") ? "events" : "snapshots",
    },
    {
      stage: "downgraded",
      value: eventCounts.get("downgraded") ?? snapshotCounts.get("downgraded") ?? 0,
      dataSource: eventCounts.has("downgraded") ? "events" : "snapshots",
    },
    {
      stage: "churned",
      value: eventCounts.get("churned") ?? snapshotCounts.get("churned") ?? 0,
      dataSource: eventCounts.has("churned") ? "events" : "snapshots",
    },
  ];

  return stageValues.map((entry, index) => {
    const previousValue = index > 0 ? stageValues[index - 1]?.value ?? 0 : 0;
    return {
      stage: entry.stage,
      label: humanizeFunnelStage(entry.stage),
      value: entry.value,
      conversionRate: index === 0 ? null : calculatePercent(entry.value, previousValue),
      dataSource: entry.dataSource,
    };
  });
}

function buildRetentionCohorts(accountRows: AccountSnapshotRow[], accountMetaById: Map<string, AccountMetaRow>) {
  const cohortMap = new Map<
    string,
    { cohortLabel: string; accountCount: number; retainedCount: number; retainedRate: number }
  >();

  for (const snapshot of accountRows) {
    const account = accountMetaById.get(snapshot.customer_account_id);
    if (!account?.created_at) {
      continue;
    }

    const createdAt = new Date(account.created_at);
    if (Number.isNaN(createdAt.getTime())) {
      continue;
    }

    const cohortLabel = createdAt.toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    });
    const current =
      cohortMap.get(cohortLabel) ?? {
        cohortLabel,
        accountCount: 0,
        retainedCount: 0,
        retainedRate: 0,
      };

    current.accountCount += 1;
    if (snapshot.is_retained_30d) {
      current.retainedCount += 1;
    }
    current.retainedRate = calculatePercent(current.retainedCount, current.accountCount);
    cohortMap.set(cohortLabel, current);
  }

  return Array.from(cohortMap.values()).slice(-6).reverse();
}

async function loadLatestAccountSnapshots() {
  const supabase = getAccountsServiceClient();
  const latestSnapshotDate = await loadLatestSnapshotDate("customer_account_growth_snapshots");

  if (!latestSnapshotDate) {
    return { latestSnapshotDate: null, rows: [] as AccountSnapshotRow[] };
  }

  const { data, error } = await supabase
    .from("customer_account_growth_snapshots")
    .select(
      "customer_account_id, snapshot_date, billing_plan_id, billing_status, activation_stage, workspace_health_state, success_health_state, project_count, active_campaign_count, provider_count, billable_seat_count, current_mrr, is_paid_account, is_retained_30d, is_expansion_ready, is_churn_risk, first_touch_source, latest_touch_source, conversion_touch_source"
    )
    .eq("snapshot_date", latestSnapshotDate);

  if (error) {
    throw new Error(error.message || "Failed to load latest account growth snapshots.");
  }

  return {
    latestSnapshotDate,
    rows: (data ?? []) as AccountSnapshotRow[],
  };
}

async function loadLatestProjectSnapshots() {
  const supabase = getAccountsServiceClient();
  const latestSnapshotDate = await loadLatestSnapshotDate("project_growth_snapshots");

  if (!latestSnapshotDate) {
    return { latestSnapshotDate: null, rows: [] as ProjectSnapshotRow[] };
  }

  const { data, error } = await supabase
    .from("project_growth_snapshots")
    .select(
      "project_id, customer_account_id, snapshot_date, project_status, campaign_count, active_campaign_count, live_quest_count, live_raid_count, visible_reward_count, provider_count, team_member_count, member_count"
    )
    .eq("snapshot_date", latestSnapshotDate);

  if (error) {
    throw new Error(error.message || "Failed to load latest project growth snapshots.");
  }

  return {
    latestSnapshotDate,
    rows: (data ?? []) as ProjectSnapshotRow[],
  };
}

function buildWorkspaceBenchmark(
  snapshot: AccountSnapshotRow,
  cohortRows: AccountSnapshotRow[],
  accountMetaById: Map<string, AccountMetaRow>
) {
  const accountMeta = accountMetaById.get(snapshot.customer_account_id);
  const cohortKey = buildAccountCohortKey(snapshot, accountMeta?.created_at ?? null);
  const cohortLabel = buildAccountCohortLabel(snapshot, accountMeta?.created_at ?? null);
  const values = cohortRows
    .filter((row) => {
      const rowAccount = accountMetaById.get(row.customer_account_id);
      return buildAccountCohortKey(row, rowAccount?.created_at ?? null) === cohortKey;
    })
    .map((row) => calculateWorkspaceGrowthScore(row));

  return deriveBenchmarkFromValues({
    currentValue: calculateWorkspaceGrowthScore(snapshot),
    values,
    cohortKey,
    cohortLabel,
    benchmarkKey: "workspace_growth_score",
    unit: "score",
    minimumCohortSize: ACCOUNT_BENCHMARK_MINIMUM,
  });
}

function buildProjectBenchmark(
  snapshot: ProjectSnapshotRow,
  cohortRows: ProjectSnapshotRow[],
  accountRowsById: Map<string, AccountSnapshotRow>
) {
  const accountPlanId = snapshot.customer_account_id
    ? accountRowsById.get(snapshot.customer_account_id)?.billing_plan_id ?? "free"
    : "free";
  const cohortKey = buildProjectCohortKey(snapshot, accountPlanId);
  const cohortLabel = buildProjectCohortLabel(snapshot, accountPlanId);
  const values = cohortRows
    .filter((row) => {
      const rowPlanId = row.customer_account_id
        ? accountRowsById.get(row.customer_account_id)?.billing_plan_id ?? "free"
        : "free";
      return buildProjectCohortKey(row, rowPlanId) === cohortKey;
    })
    .map((row) => calculateProjectLaunchScore(row));

  return deriveBenchmarkFromValues({
    currentValue: calculateProjectLaunchScore(snapshot),
    values,
    cohortKey,
    cohortLabel,
    benchmarkKey: "project_launch_score",
    unit: "score",
    minimumCohortSize: PROJECT_BENCHMARK_MINIMUM,
  });
}

async function loadAccountTouches(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("growth_analytics_events")
    .select("first_touch_source, latest_touch_source, utm_source, event_type, occurred_at")
    .eq("customer_account_id", accountId)
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load account attribution touches.");
  }

  const rows = (data ?? []) as EventTouchRow[];
  const firstTouch =
    rows.find((row) => row.first_touch_source || row.latest_touch_source || row.utm_source) ?? null;
  const latestTouch =
    [...rows]
      .reverse()
      .find((row) => row.latest_touch_source || row.utm_source || row.first_touch_source) ?? null;
  const conversionTouch =
    [...rows]
      .reverse()
      .find(
        (row) =>
          row.event_type === "paid_converted" &&
          (row.latest_touch_source || row.utm_source || row.first_touch_source)
      ) ?? null;

  return {
    firstTouchSource: optionalSourceLabel(
      firstTouch?.first_touch_source ?? firstTouch?.latest_touch_source ?? firstTouch?.utm_source ?? null
    ),
    latestTouchSource: optionalSourceLabel(
      latestTouch?.latest_touch_source ?? latestTouch?.utm_source ?? latestTouch?.first_touch_source ?? null
    ),
    conversionTouchSource: conversionTouch
      ? optionalSourceLabel(
          conversionTouch.latest_touch_source ??
            conversionTouch.utm_source ??
            conversionTouch.first_touch_source ??
            null
        )
      : null,
  };
}

function recommendWorkspaceMove(summary: {
  projectCount: number;
  providerCount: number;
  activeCampaignCount: number;
  billableSeatCount: number;
  isExpansionReady: boolean;
}) {
  if (summary.projectCount === 0) {
    return "Create the first project so the workspace can move past setup.";
  }

  if (summary.providerCount === 0) {
    return "Connect the first provider so this workspace can ship real delivery rails.";
  }

  if (summary.activeCampaignCount === 0) {
    return "Publish the first live campaign so the account closes its first launch loop.";
  }

  if (summary.billableSeatCount <= 1) {
    return "Invite another operator so the workspace is not bottlenecked on one person.";
  }

  if (summary.isExpansionReady) {
    return "This workspace is showing expansion posture. Open Success or Business and plan the next tier of activity.";
  }

  return "Keep the workspace moving and use the benchmark band to decide whether this account needs more push or more scale.";
}

function recommendProjectMove(summary: {
  providerCount: number;
  activeCampaignCount: number;
  liveQuestCount: number;
  liveRaidCount: number;
}) {
  if (summary.providerCount === 0) {
    return "Connect the first provider so this project can move beyond draft delivery.";
  }

  if (summary.activeCampaignCount === 0) {
    return "Launch the first active campaign so the project can start collecting live participation.";
  }

  if (summary.liveQuestCount === 0) {
    return "Publish the first live quest so the campaign has a concrete member action path.";
  }

  if (summary.liveRaidCount === 0) {
    return "Add a live raid so the project has a coordinated push motion, not only passive participation.";
  }

  return "This project already has real launch motion. Use the benchmark band to judge whether it needs more scale, more density, or simply more time.";
}

export async function loadGrowthAnalyticsOverview(): Promise<AdminGrowthOverview> {
  const supabase = getAccountsServiceClient();
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const [
    latestFunnelSnapshotDate,
    latestAccounts,
    latestProjects,
    recentEventsResponse,
    accountsMetaResponse,
  ] = await Promise.all([
    loadLatestSnapshotDate("growth_funnel_snapshots"),
    loadLatestAccountSnapshots(),
    loadLatestProjectSnapshots(),
    supabase
      .from("growth_analytics_events")
      .select("event_type, latest_touch_source, utm_source, first_touch_source, customer_account_id, occurred_at")
      .gte("occurred_at", thirtyDaysAgo)
      .order("occurred_at", { ascending: false }),
    supabase.from("customer_accounts").select("id, name, created_at"),
  ]);

  if (recentEventsResponse.error) {
    throw new Error(recentEventsResponse.error.message || "Failed to load recent growth events.");
  }

  if (accountsMetaResponse.error) {
    throw new Error(accountsMetaResponse.error.message || "Failed to load account cohort metadata.");
  }

  const funnelRows = latestFunnelSnapshotDate
    ? await (async () => {
        const { data, error } = await supabase
          .from("growth_funnel_snapshots")
          .select("snapshot_date, funnel_stage, metric_value, conversion_rate")
          .eq("snapshot_date", latestFunnelSnapshotDate);

        if (error) {
          throw new Error(error.message || "Failed to load growth funnel snapshots.");
        }

        return (data ?? []) as FunnelSnapshotRow[];
      })()
    : [];

  const accountRows = latestAccounts.rows;
  const projectRows = latestProjects.rows;
  const accountMetaById = new Map(
    ((accountsMetaResponse.data ?? []) as AccountMetaRow[]).map((row) => [row.id, row])
  );
  const accountRowsById = new Map(accountRows.map((row) => [row.customer_account_id, row]));
  const recentEvents = (recentEventsResponse.data ?? []) as GrowthEventRow[];

  const workspaceBenchmarksReady = accountRows.filter((row) =>
    buildWorkspaceBenchmark(row, accountRows, accountMetaById).available
  ).length;
  const projectBenchmarksReady = projectRows.filter((row) =>
    buildProjectBenchmark(row, projectRows, accountRowsById).available
  ).length;

  return {
    latestSnapshotDate:
      latestAccounts.latestSnapshotDate ??
      latestProjects.latestSnapshotDate ??
      latestFunnelSnapshotDate,
    funnel: buildRecentFunnel({
      funnelRows,
      recentEvents,
      accountRows,
    }),
    revenue: {
      mrr: accountRows.reduce((sum, row) => sum + row.current_mrr, 0),
      activePaidAccounts: accountRows.filter((row) => row.is_paid_account).length,
      freeAccounts: accountRows.filter((row) => !row.is_paid_account).length,
      trialingAccounts: accountRows.filter((row) => row.billing_status === "trialing").length,
      expansionReadyAccounts: accountRows.filter((row) => row.is_expansion_ready).length,
      churnRiskAccounts: accountRows.filter((row) => row.is_churn_risk).length,
    },
    retention: {
      overallRetained30dRate: calculatePercent(
        accountRows.filter((row) => row.is_retained_30d).length,
        accountRows.length
      ),
      paidRetained30dRate: calculatePercent(
        accountRows.filter((row) => row.is_paid_account && row.is_retained_30d).length,
        accountRows.filter((row) => row.is_paid_account).length
      ),
      expansionReadyRate: calculatePercent(
        accountRows.filter((row) => row.is_expansion_ready).length,
        accountRows.length
      ),
      churnRiskRate: calculatePercent(
        accountRows.filter((row) => row.is_churn_risk).length,
        accountRows.length
      ),
      cohorts: buildRetentionCohorts(accountRows, accountMetaById),
    },
    attribution: {
      sources: buildAttributionSummary(recentEvents),
    },
    benchmarkCoverage: {
      workspaceBenchmarksReady,
      workspaceAccountsMeasured: accountRows.length,
      projectBenchmarksReady,
      projectsMeasured: projectRows.length,
    },
  };
}

export async function loadCurrentCustomerGrowthSummary(
  customerAccountId: string
): Promise<AdminCustomerGrowthSummary | null> {
  const supabase = getAccountsServiceClient();
  const [
    latestAccounts,
    accountResponse,
    subscriptionResponse,
    entitlementResponse,
  ] = await Promise.all([
    loadLatestAccountSnapshots(),
    supabase
      .from("customer_accounts")
      .select("id, name, created_at")
      .eq("id", customerAccountId)
      .maybeSingle(),
    supabase
      .from("customer_account_subscriptions")
      .select("customer_account_id, billing_plan_id, status, current_period_end")
      .eq("customer_account_id", customerAccountId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("customer_account_entitlements")
      .select("customer_account_id, current_projects, current_active_campaigns, current_providers, current_billable_seats")
      .eq("customer_account_id", customerAccountId)
      .maybeSingle(),
  ]);

  if (accountResponse.error) {
    throw new Error(accountResponse.error.message || "Failed to load customer account growth summary.");
  }
  if (subscriptionResponse.error) {
    throw new Error(subscriptionResponse.error.message || "Failed to load billing subscription summary.");
  }
  if (entitlementResponse.error) {
    throw new Error(entitlementResponse.error.message || "Failed to load entitlement summary.");
  }

  const account = accountResponse.data as AccountMetaRow | null;
  if (!account) {
    return null;
  }

  const snapshot =
    latestAccounts.rows.find((row) => row.customer_account_id === customerAccountId) ?? null;
  const entitlements = entitlementResponse.data as AccountEntitlementRow | null;
  const subscription = subscriptionResponse.data as AccountSubscriptionRow | null;
  const accountMetaById = new Map([[account.id, account]]);

  const projectCount = entitlements?.current_projects ?? snapshot?.project_count ?? 0;
  const activeCampaignCount =
    entitlements?.current_active_campaigns ?? snapshot?.active_campaign_count ?? 0;
  const providerCount = entitlements?.current_providers ?? snapshot?.provider_count ?? 0;
  const billableSeatCount =
    entitlements?.current_billable_seats ?? snapshot?.billable_seat_count ?? 0;
  const isPaidAccount = Boolean((subscription?.billing_plan_id ?? snapshot?.billing_plan_id) && (subscription?.billing_plan_id ?? snapshot?.billing_plan_id) !== "free");
  const activationStage =
    activeCampaignCount > 0
      ? "campaign_live"
      : providerCount > 0
        ? "provider_connected"
        : projectCount > 0
          ? "first_project_created"
          : "workspace_created";
  const workspaceHealthState =
    activeCampaignCount > 0 ? "live" : projectCount > 0 || providerCount > 0 ? "activating" : "not_started";
  const isRetained30d =
    snapshot?.is_retained_30d ??
    Boolean(account.created_at && Date.now() - new Date(account.created_at).getTime() >= THIRTY_DAYS_MS);
  const isExpansionReady =
    snapshot?.is_expansion_ready ??
    (projectCount >= 2 || activeCampaignCount >= 2 || billableSeatCount >= 4);
  const isChurnRisk =
    snapshot?.is_churn_risk ?? ["past_due", "grace"].includes(subscription?.status ?? "");
  const successHealthState =
    isChurnRisk
      ? "churn_risk"
      : isExpansionReady
        ? "expansion_ready"
        : activeCampaignCount > 0 || providerCount > 0
          ? "healthy"
          : "watching";

  const touches = await loadAccountTouches(customerAccountId);
  const benchmarkSnapshot: AccountSnapshotRow = {
    customer_account_id: customerAccountId,
    snapshot_date: snapshot?.snapshot_date ?? latestAccounts.latestSnapshotDate ?? new Date().toISOString().slice(0, 10),
    billing_plan_id: subscription?.billing_plan_id ?? snapshot?.billing_plan_id ?? "free",
    billing_status: subscription?.status ?? snapshot?.billing_status ?? "free",
    activation_stage: snapshot?.activation_stage ?? activationStage,
    workspace_health_state: snapshot?.workspace_health_state ?? workspaceHealthState,
    success_health_state: snapshot?.success_health_state ?? successHealthState,
    project_count: projectCount,
    active_campaign_count: activeCampaignCount,
    provider_count: providerCount,
    billable_seat_count: billableSeatCount,
    current_mrr: snapshot?.current_mrr ?? 0,
    is_paid_account: isPaidAccount,
    is_retained_30d: isRetained30d,
    is_expansion_ready: isExpansionReady,
    is_churn_risk: isChurnRisk,
    first_touch_source: snapshot?.first_touch_source ?? null,
    latest_touch_source: snapshot?.latest_touch_source ?? null,
    conversion_touch_source: snapshot?.conversion_touch_source ?? null,
  };

  return {
    customerAccountId: account.id,
    accountName: account.name,
    snapshotDate: snapshot?.snapshot_date ?? latestAccounts.latestSnapshotDate,
    billingPlanId: subscription?.billing_plan_id ?? snapshot?.billing_plan_id ?? "free",
    billingStatus: subscription?.status ?? snapshot?.billing_status ?? "free",
    activationStage,
    workspaceHealthState,
    successHealthState,
    projectCount,
    activeCampaignCount,
    providerCount,
    billableSeatCount,
    currentMrr: snapshot?.current_mrr ?? 0,
    isPaidAccount,
    isRetained30d,
    isExpansionReady,
    isChurnRisk,
    firstTouchSource: touches.firstTouchSource,
    latestTouchSource: touches.latestTouchSource,
    conversionTouchSource:
      touches.conversionTouchSource ??
      optionalSourceLabel(snapshot?.conversion_touch_source ?? null),
    benchmark: buildWorkspaceBenchmark(
      benchmarkSnapshot,
      latestAccounts.rows.length > 0 ? latestAccounts.rows : [benchmarkSnapshot],
      accountMetaById
    ),
    recommendedMove: recommendWorkspaceMove({
      projectCount,
      providerCount,
      activeCampaignCount,
      billableSeatCount,
      isExpansionReady,
    }),
  };
}

export async function loadCurrentCustomerGrowthSummaryForUser(authUserId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to resolve the current customer account.");
  }

  if (!data?.customer_account_id) {
    return null;
  }

  return loadCurrentCustomerGrowthSummary(data.customer_account_id);
}

export async function loadProjectGrowthSummary(
  projectId: string
): Promise<AdminProjectGrowthSummary | null> {
  const supabase = getAccountsServiceClient();
  const [latestAccounts, latestProjects, projectResponse] = await Promise.all([
    loadLatestAccountSnapshots(),
    loadLatestProjectSnapshots(),
    supabase
      .from("projects")
      .select("id, name, customer_account_id, status, members")
      .eq("id", projectId)
      .maybeSingle(),
  ]);

  if (projectResponse.error) {
    throw new Error(projectResponse.error.message || "Failed to load project analytics summary.");
  }

  const project = projectResponse.data as ProjectMetaRow | null;
  if (!project) {
    return null;
  }

  const snapshot = latestProjects.rows.find((row) => row.project_id === projectId) ?? null;

  const [
    campaignsResponse,
    activeCampaignsResponse,
    questsResponse,
    raidsResponse,
    rewardsResponse,
    integrationsResponse,
    teamResponse,
  ] = await Promise.all([
    supabase.from("campaigns").select("id").eq("project_id", projectId),
    supabase.from("campaigns").select("id").eq("project_id", projectId).eq("status", "active"),
    supabase.from("quests").select("id").eq("project_id", projectId).eq("status", "active"),
    supabase.from("raids").select("id").eq("project_id", projectId).eq("status", "active"),
    supabase.from("rewards").select("id").eq("project_id", projectId).eq("visible", true),
    supabase
      .from("project_integrations")
      .select("provider")
      .eq("project_id", projectId)
      .in("status", ["connected", "needs_attention"]),
    supabase
      .from("team_members")
      .select("id")
      .eq("project_id", projectId)
      .in("status", ["active", "invited"]),
  ]);

  const responses = [
    campaignsResponse,
    activeCampaignsResponse,
    questsResponse,
    raidsResponse,
    rewardsResponse,
    integrationsResponse,
    teamResponse,
  ];
  const firstError = responses.find((response) => response.error);
  if (firstError?.error) {
    throw new Error(firstError.error.message || "Failed to load project performance counts.");
  }

  const campaignCount = ((campaignsResponse.data ?? []) as ProjectCountRow[]).length;
  const activeCampaignCount = ((activeCampaignsResponse.data ?? []) as ProjectCountRow[]).length;
  const liveQuestCount = ((questsResponse.data ?? []) as ProjectCountRow[]).length;
  const liveRaidCount = ((raidsResponse.data ?? []) as ProjectCountRow[]).length;
  const visibleRewardCount = ((rewardsResponse.data ?? []) as ProjectCountRow[]).length;
  const providerCount = new Set(
    ((integrationsResponse.data ?? []) as IntegrationRow[])
      .map((row) => row.provider)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  ).size;
  const teamMemberCount = ((teamResponse.data ?? []) as ProjectCountRow[]).length;

  const accountRowsById = new Map(
    latestAccounts.rows.map((row) => [row.customer_account_id, row] as const)
  );
  const benchmarkSnapshot: ProjectSnapshotRow = {
    project_id: project.id,
    customer_account_id: project.customer_account_id,
    snapshot_date:
      snapshot?.snapshot_date ?? latestProjects.latestSnapshotDate ?? new Date().toISOString().slice(0, 10),
    project_status: project.status ?? snapshot?.project_status ?? "draft",
    campaign_count: campaignCount,
    active_campaign_count: activeCampaignCount,
    live_quest_count: liveQuestCount,
    live_raid_count: liveRaidCount,
    visible_reward_count: visibleRewardCount,
    provider_count: providerCount,
    team_member_count: teamMemberCount,
    member_count: project.members ?? snapshot?.member_count ?? 0,
  };

  return {
    projectId: project.id,
    projectName: project.name,
    snapshotDate: snapshot?.snapshot_date ?? latestProjects.latestSnapshotDate,
    projectStatus: project.status ?? snapshot?.project_status ?? "draft",
    campaignCount,
    activeCampaignCount,
    liveQuestCount,
    liveRaidCount,
    visibleRewardCount,
    providerCount,
    teamMemberCount,
    memberCount: project.members ?? snapshot?.member_count ?? 0,
    benchmark: buildProjectBenchmark(
      benchmarkSnapshot,
      latestProjects.rows.length > 0 ? latestProjects.rows : [benchmarkSnapshot],
      accountRowsById
    ),
    recommendedMove: recommendProjectMove({
      providerCount,
      activeCampaignCount,
      liveQuestCount,
      liveRaidCount,
    }),
  };
}
