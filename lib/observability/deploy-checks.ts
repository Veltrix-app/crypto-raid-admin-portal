import { loadPlatformHealthSummary } from "@/lib/observability/health";

export type DeployCheckState = "healthy" | "warning" | "critical";

export type DeployCheckRecord = {
  key: string;
  label: string;
  state: DeployCheckState;
  summary: string;
  nextAction: string;
};

export type DeployCheckSummary = {
  generatedAt: string;
  overallState: DeployCheckState;
  warningCount: number;
  criticalCount: number;
  checks: DeployCheckRecord[];
};

function hasEnv(name: string) {
  return typeof process.env[name] === "string" && Boolean(process.env[name]?.trim());
}

function withStatePriority(states: DeployCheckState[]): DeployCheckState {
  if (states.includes("critical")) {
    return "critical";
  }
  if (states.includes("warning")) {
    return "warning";
  }
  return "healthy";
}

export async function loadDeployChecks(): Promise<DeployCheckSummary> {
  const healthSummary = await loadPlatformHealthSummary();
  const checks: DeployCheckRecord[] = [
    {
      key: "supabase_public_client",
      label: "Supabase public client",
      state:
        hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
          ? "healthy"
          : "critical",
      summary:
        hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
          ? "Public Supabase URL and anon key are configured for portal and web clients."
          : "The public Supabase client is missing URL or anon credentials.",
      nextAction: "Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel.",
    },
    {
      key: "supabase_service_role",
      label: "Service-role operations",
      state: hasEnv("SUPABASE_SERVICE_ROLE_KEY") ? "healthy" : "critical",
      summary: hasEnv("SUPABASE_SERVICE_ROLE_KEY")
        ? "Service-role access is configured for portal-side case, metric and ops loaders."
        : "The service-role key is missing for operator-only routes.",
      nextAction: "Confirm SUPABASE_SERVICE_ROLE_KEY on the portal deployment target.",
    },
    {
      key: "community_bot_bridge",
      label: "Community bot bridge",
      state:
        hasEnv("COMMUNITY_BOT_URL") && hasEnv("COMMUNITY_BOT_WEBHOOK_SECRET")
          ? "healthy"
          : hasEnv("COMMUNITY_BOT_URL")
            ? "warning"
            : "critical",
      summary:
        hasEnv("COMMUNITY_BOT_URL") && hasEnv("COMMUNITY_BOT_WEBHOOK_SECRET")
          ? "Portal-to-bot push and sync callbacks are configured."
          : hasEnv("COMMUNITY_BOT_URL")
            ? "Bot URL is present, but the webhook secret is missing."
            : "Bot URL and webhook secret are not fully configured for operator actions.",
      nextAction: "Verify COMMUNITY_BOT_URL and COMMUNITY_BOT_WEBHOOK_SECRET on the portal.",
    },
    {
      key: "member_webapp_routes",
      label: "Member-facing deep links",
      state: hasEnv("NEXT_PUBLIC_APP_URL") ? "healthy" : "warning",
      summary: hasEnv("NEXT_PUBLIC_APP_URL")
        ? "Deep links back into the member webapp are configured."
        : "The webapp base URL is missing, so deep-link follow-through is fragile.",
      nextAction: "Set NEXT_PUBLIC_APP_URL so commands and portal CTAs can resolve the webapp cleanly.",
    },
    {
      key: "snapshot_freshness",
      label: "Metric snapshot freshness",
      state: healthSummary.snapshotStale ? "warning" : "healthy",
      summary: healthSummary.snapshotStale
        ? "At least one metric snapshot feed is stale or missing."
        : "Platform and project metric snapshots are fresh enough for trend views.",
      nextAction: "Run the refresh-platform-metric-snapshots job and check snapshot cadence on Render.",
    },
    {
      key: "provider_pressure",
      label: "Provider and escalation pressure",
      state:
        healthSummary.providerFailureCount > 6 || healthSummary.supportEscalationCount > 3
          ? "critical"
          : healthSummary.providerFailureCount > 0 || healthSummary.supportEscalationCount > 0
            ? "warning"
            : "healthy",
      summary:
        healthSummary.providerFailureCount > 0 || healthSummary.supportEscalationCount > 0
          ? `${healthSummary.providerFailureCount} provider failures and ${healthSummary.supportEscalationCount} support escalations are active.`
          : "Provider rails and support escalation posture are currently stable.",
      nextAction: "Use Overview, Claims, Moderation or On-chain to clear active pressure before the next launch window.",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    overallState: withStatePriority(checks.map((check) => check.state)),
    warningCount: checks.filter((check) => check.state === "warning").length,
    criticalCount: checks.filter((check) => check.state === "critical").length,
    checks,
  };
}
