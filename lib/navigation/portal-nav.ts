import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  Home,
  Settings,
  Shield,
  WalletCards,
  Workflow,
} from "lucide-react";

export type GlobalNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
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
};

export type SettingsTab = {
  slug: "" | "profile" | "team" | "billing";
  label: string;
  description: string;
};

export const GLOBAL_NAV_ITEMS: readonly GlobalNavItem[] = [
  {
    href: "/overview",
    label: "Overview",
    description: "Cross-project launch posture, live health and the next operator priorities.",
    icon: Home,
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Project workspaces, onboarding, launch setup and day-to-day ownership.",
    icon: FolderKanban,
  },
  {
    href: "/moderation",
    label: "Moderation",
    description: "Trust review, suspicious patterns and contributor case handling.",
    icon: ClipboardCheck,
  },
  {
    href: "/claims",
    label: "Claims",
    description: "Payout queue, blocked claims, incidents and resolution history.",
    icon: WalletCards,
  },
  {
    href: "/onchain",
    label: "On-chain",
    description: "On-chain cases, ingest failures, enrichment issues and safe recovery workflows.",
    icon: Workflow,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Outcomes, activation trends, reliability pressure and performance signals.",
    icon: BarChart3,
  },
  {
    href: "/submissions",
    label: "Submissions",
    description: "Quest proof review, manual submissions and verification backlog.",
    icon: Shield,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Workspace identity, team access, billing and platform controls.",
    icon: Settings,
  },
] as const;

export const PROJECT_WORKSPACE_TABS: readonly ProjectWorkspaceTab[] = [
  {
    slug: "",
    label: "Overview",
    description: "Project health, launch posture and fast entry into the main operating workflows.",
  },
  {
    slug: "launch",
    label: "Launch",
    description: "Project onboarding, readiness, next actions and launch posture.",
  },
  {
    slug: "campaigns",
    label: "Campaigns",
    description: "Campaign systems, quest and raid handoffs, and project activation context.",
  },
  {
    slug: "community",
    label: "Community",
    description: "Community OS, commands, captains, playbooks and outcomes.",
  },
  {
    slug: "rewards",
    label: "Rewards",
    description: "Reward catalog, distributions, stock posture and claim pressure.",
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Payout health, blocked claims, incidents and resolution workflows.",
  },
  {
    slug: "onchain",
    label: "On-chain",
    description: "Assets, wallets, case history and project-safe on-chain operations.",
  },
  {
    slug: "trust",
    label: "Trust",
    description: "Project trust posture, watch states, permissions and review actions.",
  },
  {
    slug: "settings",
    label: "Settings",
    description: "Project configuration, integrations and brand controls.",
  },
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

export function isLegacySecondaryRoute(pathname: string) {
  return LEGACY_SECONDARY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function getSettingsHref(slug: SettingsTab["slug"]) {
  if (!slug) {
    return "/settings";
  }

  return `/settings/${slug}`;
}
