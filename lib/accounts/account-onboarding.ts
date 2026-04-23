"use client";

import { createClient } from "@/lib/supabase/client";
import { readBillingAwareJsonResponse } from "@/lib/billing/entitlement-blocks";
import type {
  AdminCustomerAccountOnboardingStep,
  AdminCustomerAccountRole,
  AdminCustomerAccountSourceType,
  AdminCustomerAccountStatus,
} from "@/types/entities/account";

export type PortalCustomerAccountSummary = {
  id: string;
  name: string;
  status: AdminCustomerAccountStatus;
  sourceType: AdminCustomerAccountSourceType;
  role: AdminCustomerAccountRole;
  membershipStatus: string;
  isLegacyBackfill: boolean;
  projectCount: number;
  firstProjectId: string | null;
  firstProjectName: string | null;
  onboardingStatus: "in_progress" | "completed" | "skipped";
  currentStep: AdminCustomerAccountOnboardingStep;
  completedSteps: AdminCustomerAccountOnboardingStep[];
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortalCustomerAccountInviteSummary = {
  id: string;
  customerAccountId: string;
  accountName: string;
  email: string;
  role: AdminCustomerAccountRole;
  status: string;
  expiresAt: string;
  createdAt: string | null;
};

export type PortalCustomerAccountOverview = {
  accounts: PortalCustomerAccountSummary[];
  invites: PortalCustomerAccountInviteSummary[];
  activeAccountId: string | null;
  needsWorkspaceBootstrap: boolean;
  suggestedNextStep:
    | "create_workspace"
    | "create_project"
    | "invite_team"
    | "open_launch_workspace"
    | "continue";
};

export type PortalAccountChecklistItem = {
  id:
    | "account_created"
    | "workspace_active"
    | "project_created"
    | "invite_sent"
    | "launch_opened";
  label: string;
  description: string;
  status: "complete" | "active" | "upcoming";
};

export type PortalAccountAccessState = {
  overview: PortalCustomerAccountOverview | null;
  primaryAccount: PortalCustomerAccountSummary | null;
  limitedNav: boolean;
  shouldRedirectToGettingStarted: boolean;
  suggestedRedirectHref: string | null;
  checklist: PortalAccountChecklistItem[];
};

function getSupabaseAccessToken() {
  const supabase = createClient();
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  return readBillingAwareJsonResponse<T>(response, "Workspace account request failed.");
}

export async function fetchPortalAccountOverview() {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch("/api/accounts/current", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    overview: PortalCustomerAccountOverview;
  }>(response);

  return payload.overview;
}

export async function bootstrapPortalAccount(accountName: string) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch("/api/accounts/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ accountName }),
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    overview: PortalCustomerAccountOverview;
  }>(response);

  return payload.overview;
}

export async function acceptPortalAccountInvite(inviteId: string) {
  const response = await fetch("/api/accounts/accept-invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inviteId }),
    cache: "no-store",
  });

  return readJsonResponse<{
    ok: true;
    accountId: string;
    accepted: boolean;
    alreadyAccepted: boolean;
  }>(response);
}

export async function updatePortalWorkspaceInvite(params: {
  accountId: string;
  inviteId: string;
  action: "resend" | "revoke";
}) {
  const response = await fetch(`/api/accounts/${params.accountId}/invites`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inviteId: params.inviteId,
      action: params.action,
    }),
    cache: "no-store",
  });

  return readJsonResponse<{
    ok: true;
    changed: boolean;
    action: "resend" | "revoke";
    members: Array<unknown>;
    invites: Array<unknown>;
  }>(response);
}

export async function createPortalWorkspaceInvite(params: {
  accountId: string;
  email: string;
  role: AdminCustomerAccountRole;
}) {
  const response = await fetch(`/api/accounts/${params.accountId}/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      role: params.role,
    }),
    cache: "no-store",
  });

  return readJsonResponse<{
    ok: true;
    created: boolean;
    members: Array<unknown>;
    invites: Array<unknown>;
  }>(response);
}

export async function bootstrapPortalWorkspaceProject(params: {
  accountId: string;
  name: string;
  chain: string;
  category: string;
  description: string;
}) {
  const response = await fetch(`/api/accounts/${params.accountId}/projects/bootstrap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      chain: params.chain,
      category: params.category,
      description: params.description,
    }),
    cache: "no-store",
  });

  return readJsonResponse<{
    ok: true;
    created: boolean;
    projectId: string;
    projectName: string;
  }>(response);
}

export function derivePortalAccountChecklist(
  account: PortalCustomerAccountSummary | null
): PortalAccountChecklistItem[] {
  const completedSteps = new Set(account?.completedSteps ?? []);
  const hasAccount = Boolean(account);
  const hasActiveWorkspace = Boolean(account && ["trial", "active"].includes(account.status));
  const hasProject = Boolean(account && account.projectCount > 0);
  const inviteSent = completedSteps.has("invite_team") || account?.currentStep === "open_launch_workspace";
  const launchOpened =
    completedSteps.has("open_launch_workspace") || account?.currentStep === "completed";

  return [
    {
      id: "account_created",
      label: "Account created",
      description: "The customer account layer exists and the owner membership is attached.",
      status: hasAccount ? "complete" : "active",
    },
    {
      id: "workspace_active",
      label: "First workspace active",
      description: "The workspace exists in a live posture instead of pending verification only.",
      status: hasActiveWorkspace ? "complete" : hasAccount ? "active" : "upcoming",
    },
    {
      id: "project_created",
      label: "First project created",
      description: "A real project workspace exists so the operator spine can start.",
      status: hasProject ? "complete" : hasActiveWorkspace ? "active" : "upcoming",
    },
    {
      id: "invite_sent",
      label: "First invite sent",
      description: "The owner has invited at least one teammate into the workspace.",
      status: inviteSent ? "complete" : hasProject ? "active" : "upcoming",
    },
    {
      id: "launch_opened",
      label: "Launch workspace opened",
      description: "The first project has been handed off into the launch workspace.",
      status: launchOpened ? "complete" : hasProject ? "active" : "upcoming",
    },
  ];
}

function pathnameMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function derivePortalAccountAccessState(params: {
  pathname: string;
  overview: PortalCustomerAccountOverview | null;
  isSuperAdmin: boolean;
}) {
  if (params.isSuperAdmin) {
    return {
      overview: params.overview,
      primaryAccount: params.overview?.accounts[0] ?? null,
      limitedNav: false,
      shouldRedirectToGettingStarted: false,
      suggestedRedirectHref: null,
      checklist: derivePortalAccountChecklist(params.overview?.accounts[0] ?? null),
    } satisfies PortalAccountAccessState;
  }

  const primaryAccount = params.overview?.accounts[0] ?? null;
  const checklist = derivePortalAccountChecklist(primaryAccount);
  const pathname = params.pathname;
  const onGettingStarted = pathnameMatches(pathname, "/getting-started");
  const onAccountOverview = pathnameMatches(pathname, "/account");
  const onAccountTeam = pathnameMatches(pathname, "/account/team");
  const onProjectCreate = pathnameMatches(pathname, "/projects/new");
  const onLaunchWorkspace = Boolean(
    primaryAccount?.firstProjectId &&
      pathnameMatches(pathname, `/projects/${primaryAccount.firstProjectId}/launch`)
  );

  if (!params.overview || params.overview.needsWorkspaceBootstrap) {
    return {
      overview: params.overview,
      primaryAccount,
      limitedNav: true,
      shouldRedirectToGettingStarted: !onGettingStarted,
      suggestedRedirectHref: "/getting-started",
      checklist,
    } satisfies PortalAccountAccessState;
  }

  if (primaryAccount?.currentStep === "create_project") {
    return {
      overview: params.overview,
      primaryAccount,
      limitedNav: true,
      shouldRedirectToGettingStarted:
        !(
          onGettingStarted ||
          onAccountOverview ||
          onProjectCreate ||
          pathnameMatches(pathname, "/projects")
        ),
      suggestedRedirectHref: onGettingStarted ? "/projects/new" : "/getting-started",
      checklist,
    } satisfies PortalAccountAccessState;
  }

  if (primaryAccount?.currentStep === "invite_team") {
    return {
      overview: params.overview,
      primaryAccount,
      limitedNav: true,
      shouldRedirectToGettingStarted: !(onGettingStarted || onAccountOverview || onAccountTeam),
      suggestedRedirectHref: "/getting-started",
      checklist,
    } satisfies PortalAccountAccessState;
  }

  if (primaryAccount?.currentStep === "open_launch_workspace") {
    return {
      overview: params.overview,
      primaryAccount,
      limitedNav: true,
      shouldRedirectToGettingStarted:
        !(
          onGettingStarted ||
          onAccountOverview ||
          onAccountTeam ||
          onLaunchWorkspace ||
          pathnameMatches(pathname, "/projects")
        ),
      suggestedRedirectHref: onGettingStarted
        ? primaryAccount.firstProjectId
          ? `/projects/${primaryAccount.firstProjectId}/launch`
          : "/projects"
        : "/getting-started",
      checklist,
    } satisfies PortalAccountAccessState;
  }

  return {
    overview: params.overview,
    primaryAccount,
    limitedNav: false,
    shouldRedirectToGettingStarted: false,
    suggestedRedirectHref: null,
    checklist,
  } satisfies PortalAccountAccessState;
}
