import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type { AdminCustomerAccountRole } from "@/types/entities/account";

export type AccountTeamMembershipSummary = {
  id: string;
  authUserId: string;
  email: string | null;
  label: string;
  role: AdminCustomerAccountRole;
  status: string;
  joinedAt: string | null;
};

export type AccountTeamInviteSummary = {
  id: string;
  email: string;
  role: AdminCustomerAccountRole;
  status: string;
  expiresAt: string;
  createdAt: string | null;
};

function isInviteExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function expireStaleWorkspaceInvites(accountId: string) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("customer_account_invites")
    .update({
      status: "expired",
      updated_at: now,
    })
    .eq("customer_account_id", accountId)
    .eq("status", "pending")
    .lt("expires_at", now);

  if (error) {
    throw new Error(error.message || "Failed to expire stale workspace invites.");
  }
}

export async function assertWorkspaceInviteAccess(params: {
  accountId: string;
  authUserId: string;
}) {
  const supabase = getAccountsServiceClient();
  const membershipResponse = await supabase
    .from("customer_account_memberships")
    .select("id, role, status")
    .eq("customer_account_id", params.accountId)
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (membershipResponse.error || !membershipResponse.data) {
    throw new Error("Workspace membership not found.");
  }

  if (
    !["owner", "admin"].includes(membershipResponse.data.role) ||
    membershipResponse.data.status !== "active"
  ) {
    throw new Error("Only active owners or admins can manage invites.");
  }

  return membershipResponse.data;
}

export async function listWorkspaceMembersAndInvites(accountId: string) {
  const supabase = getAccountsServiceClient();
  await expireStaleWorkspaceInvites(accountId);

  const [accountResponse, membershipsResponse, invitesResponse] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("id, name, contact_email, primary_owner_auth_user_id")
      .eq("id", accountId)
      .maybeSingle(),
    supabase
      .from("customer_account_memberships")
      .select("id, auth_user_id, role, status, joined_at, metadata")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: true }),
    supabase
      .from("customer_account_invites")
      .select("id, email, role, status, expires_at, created_at, accepted_by_auth_user_id")
      .eq("customer_account_id", accountId)
      .order("created_at", { ascending: false }),
  ]);

  if (accountResponse.error || !accountResponse.data) {
    throw new Error(accountResponse.error?.message || "Workspace account not found.");
  }

  if (membershipsResponse.error) {
    throw new Error(membershipsResponse.error.message || "Failed to load workspace members.");
  }

  if (invitesResponse.error) {
    throw new Error(invitesResponse.error.message || "Failed to load workspace invites.");
  }

  const account = accountResponse.data;
  const acceptedInviteEmailByAuthUserId = new Map(
    (invitesResponse.data ?? [])
      .filter((invite) => invite.accepted_by_auth_user_id)
      .map((invite) => [invite.accepted_by_auth_user_id as string, invite.email])
  );

  const members: AccountTeamMembershipSummary[] = (membershipsResponse.data ?? []).map((member) => {
    const metadata =
      member.metadata && typeof member.metadata === "object"
        ? (member.metadata as Record<string, unknown>)
        : {};
    const ownerEmail =
      member.auth_user_id === account.primary_owner_auth_user_id
        ? account.contact_email
        : null;
    const email =
      ownerEmail ??
      acceptedInviteEmailByAuthUserId.get(member.auth_user_id) ??
      (typeof metadata.email === "string" ? metadata.email : null);

    return {
      id: member.id,
      authUserId: member.auth_user_id,
      email,
      label: email ?? `${member.auth_user_id.slice(0, 8)}...`,
      role: member.role,
      status: member.status,
      joinedAt: member.joined_at ?? null,
    };
  });

  const invites: AccountTeamInviteSummary[] = (invitesResponse.data ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status:
      invite.status === "pending" && isInviteExpired(invite.expires_at)
        ? "expired"
        : invite.status,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  }));

  return {
    account,
    members,
    invites,
  };
}
