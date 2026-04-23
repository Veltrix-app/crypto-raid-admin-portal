import type { ReleaseServiceKey, ReleaseSmokeCategory } from "@/types/database";

export type ReleaseSmokeScenarioDefinition = {
  smokeCategory: ReleaseSmokeCategory;
  scenarioKey: string;
  scenarioLabel: string;
  serviceKey?: ReleaseServiceKey;
  verificationHint: string;
};

export type ReleaseSmokePackDefinition = {
  smokeCategory: ReleaseSmokeCategory;
  label: string;
  description: string;
  scenarios: ReleaseSmokeScenarioDefinition[];
};

export const RELEASE_SMOKE_PACKS: readonly ReleaseSmokePackDefinition[] = [
  {
    smokeCategory: "auth_and_entry",
    label: "Auth and entry",
    description: "Confirm the core operator and first-entry paths still work after deploy.",
    scenarios: [
      {
        smokeCategory: "auth_and_entry",
        scenarioKey: "portal_login",
        scenarioLabel: "Portal login and first entry still work.",
        serviceKey: "portal",
        verificationHint: "Open /login, authenticate successfully, and verify the first operator landing surface.",
      },
    ],
  },
  {
    smokeCategory: "billing_and_account",
    label: "Billing and account",
    description: "Check that commercial flows and account-level settings remain healthy.",
    scenarios: [
      {
        smokeCategory: "billing_and_account",
        scenarioKey: "billing_workspace",
        scenarioLabel: "Billing workspace and account flow still load correctly.",
        serviceKey: "portal",
        verificationHint: "Open /settings/billing and verify usage, invoices, and upgrade CTAs still render.",
      },
    ],
  },
  {
    smokeCategory: "support_and_status",
    label: "Support and status",
    description: "Keep public support intake and incident communication trustworthy after release.",
    scenarios: [
      {
        smokeCategory: "support_and_status",
        scenarioKey: "support_status",
        scenarioLabel: "Public support and status routes still behave correctly.",
        serviceKey: "webapp",
        verificationHint: "Open /support and /status to confirm intake and status surfaces still load and reflect current posture.",
      },
    ],
  },
  {
    smokeCategory: "security_and_trust",
    label: "Security and trust",
    description: "Confirm trust surfaces, security controls and compliance routes still match the live platform posture.",
    scenarios: [
      {
        smokeCategory: "security_and_trust",
        scenarioKey: "security_trust",
        scenarioLabel: "Security and trust surfaces still reflect the current platform posture.",
        verificationHint: "Check /settings/security, /security, /trust, /privacy and /terms for obvious regressions.",
      },
    ],
  },
  {
    smokeCategory: "success_and_analytics",
    label: "Success and analytics",
    description: "Verify customer-health and outcome surfaces still load on the current data model.",
    scenarios: [
      {
        smokeCategory: "success_and_analytics",
        scenarioKey: "success_analytics",
        scenarioLabel: "Success and analytics views load without regressions.",
        serviceKey: "portal",
        verificationHint: "Open /success and /analytics to confirm dashboards render and queues still resolve.",
      },
    ],
  },
  {
    smokeCategory: "docs_and_public_surfaces",
    label: "Docs and public surfaces",
    description: "Keep public docs and launch-facing reference surfaces coherent with the current release.",
    scenarios: [
      {
        smokeCategory: "docs_and_public_surfaces",
        scenarioKey: "docs_public",
        scenarioLabel: "Docs and public launch surfaces are visible and coherent.",
        serviceKey: "docs",
        verificationHint: "Open the docs home and any touched trust or product docs to verify copy and navigation are live.",
      },
    ],
  },
  {
    smokeCategory: "community_bot_readiness",
    label: "Community bot readiness",
    description: "Confirm bot callbacks and community-side release posture before marking the release healthy.",
    scenarios: [
      {
        smokeCategory: "community_bot_readiness",
        scenarioKey: "bot_readiness",
        scenarioLabel: "Community bot callbacks and readiness posture are confirmed.",
        serviceKey: "community_bot",
        verificationHint: "Verify bot env posture, callback URLs, and the current ready/degraded decision before closing the release.",
      },
    ],
  },
] as const;

export const RELEASE_SMOKE_SCENARIOS = RELEASE_SMOKE_PACKS.flatMap((pack) => pack.scenarios);

export function getSmokePackDefinition(category: ReleaseSmokeCategory) {
  return RELEASE_SMOKE_PACKS.find((entry) => entry.smokeCategory === category) ?? null;
}

