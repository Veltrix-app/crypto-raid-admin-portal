import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  Building2,
  ClipboardCheck,
  FlaskConical,
  Fingerprint,
  FolderKanban,
  Gift,
  Home,
  HeartHandshake,
  Landmark,
  LifeBuoy,
  Megaphone,
  Settings,
  Shield,
  Sparkles,
  Rocket,
  TrendingUp,
  UsersRound,
  WalletCards,
  Workflow,
} from "lucide-react";

export type GlobalNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "workspace" | "primary" | "ops";
  requiresWorkspace?: boolean;
  superAdminOnly?: boolean;
};

export type ProjectWorkspaceTab = {
  slug:
    | ""
    | "launch"
    | "campaigns"
    | "community"
    | "rewards"
    | "payouts"
    | "onchain"
    | "trust"
    | "settings";
  label: string;
  description: string;
  group: "Core" | "Safety" | "Control";
};

export type SettingsTab = {
  slug: "" | "profile" | "team" | "billing" | "security";
  label: string;
  description: string;
};

export const GLOBAL_NAV_ITEMS: readonly GlobalNavItem[] = [
  {
    href: "/getting-started",
    label: "Getting Started",
    description: "First-run account setup, project bootstrap and the clean handoff into launch operations.",
    icon: Sparkles,
    group: "workspace",
  },
  {
    href: "/account",
    label: "Account",
    description: "Workspace identity, onboarding posture, team entry and the layer that sits above projects.",
    icon: Building2,
    group: "workspace",
  },
  {
    href: "/overview",
    label: "Overview",
    description: "Cross-project launch posture, live health and the next operator priorities.",
    icon: Home,
    group: "primary",
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Project workspaces, onboarding, launch setup and day-to-day ownership.",
    icon: FolderKanban,
    group: "primary",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    description: "Campaign setup, launch context, quest bundles and activation posture.",
    icon: Megaphone,
    group: "primary",
  },
  {
    href: "/projects/:projectId/community",
    label: "Community",
    description: "Project community commands, automations, captains, raids and growth loops.",
    icon: UsersRound,
    group: "primary",
    requiresWorkspace: true,
  },
  {
    href: "/rewards",
    label: "Rewards",
    description: "Reward catalog, stock pressure, claim surfaces and incentive readiness.",
    icon: Gift,
    group: "primary",
  },
  {
    href: "/moderation",
    label: "Moderation",
    description: "Trust review, suspicious patterns and contributor case handling.",
    icon: ClipboardCheck,
    group: "ops",
  },
  {
    href: "/claims",
    label: "Claims",
    description: "Payout queue, blocked claims, incidents and resolution history.",
    icon: WalletCards,
    group: "primary",
  },
  {
    href: "/onchain",
    label: "On-chain",
    description: "On-chain cases, ingest failures, enrichment issues and safe recovery workflows.",
    icon: Workflow,
    group: "ops",
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Outcomes, activation trends, reliability pressure and performance signals.",
    icon: BarChart3,
    group: "primary",
  },
  {
    href: "/xp",
    label: "XP Review",
    description: "DeFi XP events, suspicious claim pressure, user history and economy guardrails.",
    icon: BadgeCheck,
    group: "ops",
  },
  {
    href: "/growth",
    label: "Growth",
    description: "Internal commercial cockpit for leads, buyer requests, evaluation posture and follow-up.",
    icon: TrendingUp,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/business",
    label: "Business",
    description: "Internal revenue cockpit for plan mix, billing ops, collections and account health.",
    icon: Landmark,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/success",
    label: "Success",
    description: "Internal activation cockpit for workspace health, expansion pressure, member drift and customer follow-up.",
    icon: HeartHandshake,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/security",
    label: "Security",
    description: "Internal trust, compliance, enterprise identity and security lifecycle control.",
    icon: Fingerprint,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/releases",
    label: "Releases",
    description: "Internal release control for scope, migrations, smoke posture, rollback and go or no-go state.",
    icon: Rocket,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/qa",
    label: "QA",
    description: "Internal readiness board for release verification, smoke completion and environment warnings.",
    icon: FlaskConical,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/support",
    label: "Support",
    description: "Internal support queue, incident command, public status posture and bounded handoffs.",
    icon: LifeBuoy,
    group: "ops",
    superAdminOnly: true,
  },
  {
    href: "/submissions",
    label: "Submissions",
    description: "Quest proof review, manual submissions and verification backlog.",
    icon: Shield,
    group: "ops",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Workspace identity, team access, billing and platform controls.",
    icon: Settings,
    group: "primary",
  },
] as const;

export const GLOBAL_NAV_GROUPS: ReadonlyArray<{
  key: GlobalNavItem["group"];
  label: string;
}> = [
  { key: "primary", label: "Main" },
  { key: "workspace", label: "Setup" },
  { key: "ops", label: "Ops" },
] as const;

export const PROJECT_WORKSPACE_TABS: readonly ProjectWorkspaceTab[] = [
  {
    slug: "",
    label: "Overview",
    description: "Project health, launch posture and fast entry into the main operating workflows.",
    group: "Core",
  },
  {
    slug: "launch",
    label: "Launch",
    description: "Project onboarding, readiness, next actions and launch posture.",
    group: "Core",
  },
  {
    slug: "campaigns",
    label: "Campaigns",
    description: "Campaign systems, quest and raid handoffs, and project activation context.",
    group: "Core",
  },
  {
    slug: "community",
    label: "Community",
    description: "Community OS, commands, captains, playbooks and outcomes.",
    group: "Core",
  },
  {
    slug: "rewards",
    label: "Rewards",
    description: "Reward catalog, distributions, stock posture and claim pressure.",
    group: "Core",
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Payout health, blocked claims, incidents and resolution workflows.",
    group: "Safety",
  },
  {
    slug: "onchain",
    label: "On-chain",
    description: "Assets, wallets, case history and project-safe on-chain operations.",
    group: "Safety",
  },
  {
    slug: "trust",
    label: "Trust",
    description: "Project trust posture, watch states, permissions and review actions.",
    group: "Safety",
  },
  {
    slug: "settings",
    label: "Settings",
    description: "Project configuration, integrations and brand controls.",
    group: "Control",
  },
] as const;

export const PROJECT_WORKSPACE_TAB_GROUPS: ReadonlyArray<{
  key: ProjectWorkspaceTab["group"];
  label: string;
}> = [
  { key: "Core", label: "Core" },
  { key: "Safety", label: "Safety" },
  { key: "Control", label: "Control" },
] as const;

export const SETTINGS_TABS: readonly SettingsTab[] = [
  {
    slug: "",
    label: "Overview",
    description: "Workspace settings posture, priorities and entry into the main control modules.",
  },
  {
    slug: "profile",
    label: "Profile",
    description: "Brand, links, public context and launch identity.",
  },
  {
    slug: "team",
    label: "Team",
    description: "Operators, reviewers and workspace access structure.",
  },
  {
    slug: "billing",
    label: "Billing",
    description: "Plan posture, usage, capacity and expansion readiness.",
  },
  {
    slug: "security",
    label: "Security",
    description: "Sessions, 2FA, SSO posture, data requests and enterprise policy controls.",
  },
] as const;

export const LEGACY_SECONDARY_ROUTES = [
  "/campaigns",
  "/quests",
  "/raids",
  "/rewards",
  "/users",
] as const;

export function getProjectWorkspaceHref(projectId: string, slug: ProjectWorkspaceTab["slug"]) {
  if (!slug) {
    return `/projects/${projectId}`;
  }

  return `/projects/${projectId}/${slug}`;
}

export function isLegacySecondaryRoute(pathname: string | null | undefined) {
  const safePathname = pathname ?? "";
  return LEGACY_SECONDARY_ROUTES.some(
    (route) => safePathname === route || safePathname.startsWith(`${route}/`)
  );
}

export function getSettingsHref(slug: SettingsTab["slug"]) {
  if (!slug) {
    return "/settings";
  }

  return `/settings/${slug}`;
}
