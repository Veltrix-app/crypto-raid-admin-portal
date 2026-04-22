import type {
  AdminCustomerAccountOnboardingStatus,
  AdminCustomerAccountOnboardingStep,
  AdminCustomerAccountRole,
  AdminCustomerAccountSourceType,
  AdminCustomerAccountStatus,
} from "@/types/entities/account";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";

type CustomerAccountRow = {
  id: string;
  name: string;
  status: AdminCustomerAccountStatus;
  source_type: AdminCustomerAccountSourceType;
  legacy_project_id: string | null;
  contact_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CustomerAccountMembershipRow = {
  customer_account_id: string;
  role: AdminCustomerAccountRole;
  status: string;
  created_at: string | null;
};

type CustomerAccountOnboardingRow = {
  customer_account_id: string;
  status: AdminCustomerAccountOnboardingStatus;
  current_step: AdminCustomerAccountOnboardingStep;
  completed_steps: AdminCustomerAccountOnboardingStep[] | null;
  first_project_id: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  customer_account_id: string | null;
  created_at: string | null;
};

type CustomerAccountInviteRow = {
  id: string;
  customer_account_id: string;
  email: string;
  role: AdminCustomerAccountRole;
  status: string;
  expires_at: string;
  created_at: string | null;
};

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
  onboardingStatus: AdminCustomerAccountOnboardingStatus;
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

type LoadOverviewParams = {
  authUserId: string;
  normalizedEmail?: string;
};

type BootstrapParams = {
  authUserId: string;
  normalizedEmail?: string;
  displayName: string;
  requestedName?: string | null;
  emailConfirmed: boolean;
};

const roleRank: Record<AdminCustomerAccountRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

function deriveWorkspaceName(params: {
  requestedName?: string | null;
  displayName: string;
  normalizedEmail?: string;
}) {
  const requestedName = params.requestedName?.trim();
  if (requestedName) {
    return requestedName;
  }

  const emailLabel = params.normalizedEmail?.split("@")[0]?.trim();
  if (emailLabel) {
    return `${emailLabel} workspace`;
  }

  return `${params.displayName} workspace`;
}

function sortAccounts(a: PortalCustomerAccountSummary, b: PortalCustomerAccountSummary) {
  if (a.membershipStatus !== b.membershipStatus) {
    return a.membershipStatus === "active" ? -1 : 1;
  }

  if (roleRank[a.role] !== roleRank[b.role]) {
    return roleRank[a.role] - roleRank[b.role];
  }

  return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
}

function resolveSuggestedNextStep(
  accounts: PortalCustomerAccountSummary[]
): PortalCustomerAccountOverview["suggestedNextStep"] {
  const primary = accounts[0];
  if (!primary) {
    return "create_workspace";
  }

  if (primary.currentStep === "create_project") {
    return "create_project";
  }

  if (primary.currentStep === "invite_team") {
    return "invite_team";
  }

  if (
    primary.currentStep === "open_launch_workspace" ||
    (primary.projectCount > 0 && primary.firstProjectId)
  ) {
    return "open_launch_workspace";
  }

  return "continue";
}

export async function loadCustomerAccountOverviewForUser(
  params: LoadOverviewParams
): Promise<PortalCustomerAccountOverview> {
  const supabase = getAccountsServiceClient();

  const membershipResponse = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id, role, status, created_at")
    .eq("auth_user_id", params.authUserId);

  if (membershipResponse.error) {
    throw new Error(
      membershipResponse.error.message || "Failed to load customer account memberships."
    );
  }

  const membershipRows = (membershipResponse.data ?? []) as CustomerAccountMembershipRow[];
  const accountIds = Array.from(
    new Set(membershipRows.map((row) => row.customer_account_id).filter(Boolean))
  );

  const [accountsResponse, onboardingResponse, projectsResponse, invitesResponse] =
    await Promise.all([
      accountIds.length
        ? supabase
            .from("customer_accounts")
            .select(
              "id, name, status, source_type, legacy_project_id, contact_email, created_at, updated_at"
            )
            .in("id", accountIds)
        : Promise.resolve({ data: [], error: null }),
      accountIds.length
        ? supabase
            .from("customer_account_onboarding")
            .select(
              "customer_account_id, status, current_step, completed_steps, first_project_id, completed_at, created_at, updated_at"
            )
            .in("customer_account_id", accountIds)
        : Promise.resolve({ data: [], error: null }),
      accountIds.length
        ? supabase
            .from("projects")
            .select("id, name, customer_account_id, created_at")
            .in("customer_account_id", accountIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      params.normalizedEmail
        ? supabase
            .from("customer_account_invites")
            .select("id, customer_account_id, email, role, status, expires_at, created_at")
            .ilike("email", params.normalizedEmail)
            .in("status", ["pending"])
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (accountsResponse.error) {
    throw new Error(accountsResponse.error.message || "Failed to load customer accounts.");
  }

  if (onboardingResponse.error) {
    throw new Error(
      onboardingResponse.error.message || "Failed to load customer account onboarding."
    );
  }

  if (projectsResponse.error) {
    throw new Error(projectsResponse.error.message || "Failed to load customer account projects.");
  }

  if (invitesResponse.error) {
    throw new Error(invitesResponse.error.message || "Failed to load customer account invites.");
  }

  const accountById = new Map(
    ((accountsResponse.data ?? []) as CustomerAccountRow[]).map((row) => [row.id, row])
  );
  const onboardingByAccountId = new Map(
    ((onboardingResponse.data ?? []) as CustomerAccountOnboardingRow[]).map((row) => [
      row.customer_account_id,
      row,
    ])
  );
  const projectsByAccountId = new Map<string, ProjectRow[]>();

  for (const row of (projectsResponse.data ?? []) as ProjectRow[]) {
    const accountId = row.customer_account_id;
    if (!accountId) {
      continue;
    }

    const current = projectsByAccountId.get(accountId) ?? [];
    current.push(row);
    projectsByAccountId.set(accountId, current);
  }

  const accounts = membershipRows
    .map((membership): PortalCustomerAccountSummary | null => {
      const account = accountById.get(membership.customer_account_id);
      if (!account) {
        return null;
      }

      const onboarding = onboardingByAccountId.get(account.id);
      const projects = projectsByAccountId.get(account.id) ?? [];
      const firstProject =
        projects.find((project) => project.id === onboarding?.first_project_id) ?? projects[0] ?? null;

      const mappedAccount: PortalCustomerAccountSummary = {
        id: account.id,
        name: account.name,
        status: account.status,
        sourceType: account.source_type,
        role: membership.role,
        membershipStatus: membership.status,
        isLegacyBackfill: account.source_type === "legacy_backfill",
        projectCount: projects.length,
        firstProjectId: firstProject?.id ?? onboarding?.first_project_id ?? null,
        firstProjectName: firstProject?.name ?? null,
        onboardingStatus: onboarding?.status ?? "in_progress",
        currentStep:
          onboarding?.current_step ??
          (projects.length > 0 ? "open_launch_workspace" : "create_project"),
        completedSteps:
          onboarding?.completed_steps ??
          (projects.length > 0
            ? ["create_workspace", "create_project"]
            : ["create_workspace"]),
        completedAt: onboarding?.completed_at ?? null,
        createdAt: account.created_at,
        updatedAt: onboarding?.updated_at ?? account.updated_at,
      };

      return mappedAccount;
    })
    .filter((row) => row !== null)
    .sort(sortAccounts);

  const inviteAccountNameById = new Map(accounts.map((account) => [account.id, account.name]));
  for (const account of (accountsResponse.data ?? []) as CustomerAccountRow[]) {
    inviteAccountNameById.set(account.id, account.name);
  }

  const invites = ((invitesResponse.data ?? []) as CustomerAccountInviteRow[]).map((invite) => ({
    id: invite.id,
    customerAccountId: invite.customer_account_id,
    accountName: inviteAccountNameById.get(invite.customer_account_id) ?? "Workspace",
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  }));

  return {
    accounts,
    invites,
    activeAccountId: accounts[0]?.id ?? null,
    needsWorkspaceBootstrap: accounts.length === 0,
    suggestedNextStep: resolveSuggestedNextStep(accounts),
  };
}

export async function bootstrapCustomerAccountForUser(params: BootstrapParams) {
  const existingOverview = await loadCustomerAccountOverviewForUser({
    authUserId: params.authUserId,
    normalizedEmail: params.normalizedEmail,
  });

  if (existingOverview.accounts.length > 0) {
    return {
      created: false,
      account: existingOverview.accounts[0],
      overview: existingOverview,
    };
  }

  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const status: AdminCustomerAccountStatus = params.emailConfirmed
    ? "trial"
    : "pending_verification";
  const accountName = deriveWorkspaceName({
    requestedName: params.requestedName,
    displayName: params.displayName,
    normalizedEmail: params.normalizedEmail,
  });

  const { data: accountRow, error: accountError } = await supabase
    .from("customer_accounts")
    .insert({
      name: accountName,
      status,
      contact_email: params.normalizedEmail || null,
      created_by_auth_user_id: params.authUserId,
      primary_owner_auth_user_id: params.authUserId,
      source_type: "self_serve",
      metadata: {
        bootstrapSource: "webapp_getting_started",
      },
    })
    .select("id, name, status, source_type, legacy_project_id, contact_email, created_at, updated_at")
    .single();

  if (accountError || !accountRow) {
    throw new Error(accountError?.message || "Failed to create customer account.");
  }

  const accountId = (accountRow as CustomerAccountRow).id;

  const membershipError = await supabase.from("customer_account_memberships").insert({
    customer_account_id: accountId,
    auth_user_id: params.authUserId,
    role: "owner",
    status: "active",
    joined_at: now,
    metadata: {
      source: "self_serve",
    },
  });

  if (membershipError.error) {
    throw new Error(membershipError.error.message || "Failed to create account membership.");
  }

  const onboardingError = await supabase.from("customer_account_onboarding").insert({
    customer_account_id: accountId,
    status: "in_progress",
    current_step: "create_project",
    completed_steps: ["create_workspace"],
    metadata: {
      workspaceCreatedFrom: "webapp_getting_started",
    },
  });

  if (onboardingError.error) {
    throw new Error(onboardingError.error.message || "Failed to create onboarding state.");
  }

  const eventsError = await supabase.from("customer_account_events").insert([
    {
      customer_account_id: accountId,
      event_type: "account_created",
      actor_auth_user_id: params.authUserId,
      metadata: {
        source: "self_serve",
      },
    },
    {
      customer_account_id: accountId,
      event_type: "owner_bootstrapped",
      actor_auth_user_id: params.authUserId,
      metadata: {
        source: "self_serve",
      },
    },
  ]);

  if (eventsError.error) {
    throw new Error(eventsError.error.message || "Failed to write account events.");
  }

  const overview = await loadCustomerAccountOverviewForUser({
    authUserId: params.authUserId,
    normalizedEmail: params.normalizedEmail,
  });

  return {
    created: true,
    account: overview.accounts[0] ?? null,
    overview,
  };
}
