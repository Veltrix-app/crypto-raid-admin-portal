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
    description: "Cross-project launch health, queue pressure and executive signal.",
    icon: Home,
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Project workspaces, onboarding flow and workspace entry.",
    icon: FolderKanban,
  },
  {
    href: "/moderation",
    label: "Moderation",
    description: "Trust review, suspicious patterns and contributor actions.",
    icon: ClipboardCheck,
  },
  {
    href: "/claims",
    label: "Claims",
    description: "Reward fulfillment queue, incidents and payout operations.",
    icon: WalletCards,
  },
  {
    href: "/onchain",
    label: "On-chain",
    description: "Ingest failures, enrichment cases and project-safe recovery rails.",
    icon: Workflow,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Cross-project growth, activation and performance insights.",
    icon: BarChart3,
  },
  {
    href: "/submissions",
    label: "Submissions",
    description: "Review queue for quest proof and manual submission flows.",
    icon: Shield,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Operator, team and platform-level control surfaces.",
    icon: Settings,
  },
] as const;

export const PROJECT_WORKSPACE_TABS: readonly ProjectWorkspaceTab[] = [
  {
    slug: "",
    label: "Overview",
    description: "Project health, posture and fast entry into dedicated rails.",
  },
  {
    slug: "launch",
    label: "Launch",
    description: "Project onboarding, readiness, next actions and launch posture.",
  },
  {
    slug: "campaigns",
    label: "Campaigns",
    description: "Project-scoped campaigns and activation context.",
  },
  {
    slug: "community",
    label: "Community",
    description: "Community OS, commands, captains, playbooks and outcomes.",
  },
  {
    slug: "rewards",
    label: "Rewards",
    description: "Reward catalog, distributions and claim pressure.",
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Payout health, blocked claims, incidents and resolution rails.",
  },
  {
    slug: "onchain",
    label: "On-chain",
    description: "Assets, wallets, pipeline health and ingestion operations.",
  },
  {
    slug: "trust",
    label: "Trust",
    description: "Project-specific trust posture, watch states and review actions.",
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
    description: "Workspace-level settings posture, priorities and module entry.",
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
