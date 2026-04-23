import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import {
  assertWorkspaceInviteAccess,
  expireStaleWorkspaceInvites,
  listWorkspaceMembersAndInvites,
} from "@/lib/accounts/account-invites";
import { isBillableAccountRole } from "@/lib/billing/billing-entitlements";
import { isBillingLimitError } from "@/lib/billing/entitlement-blocks";
import { requireAccountGrowthCapacity } from "@/lib/billing/entitlement-guard";
import type { AdminCustomerAccountRole, AdminCustomerAccountOnboardingStep } from "@/types/entities/account";

const VALID_ROLES: AdminCustomerAccountRole[] = ["owner", "admin", "member", "viewer"];
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function appendCompletedStep(
  current: AdminCustomerAccountOnboardingStep[] | null | undefined,
  nextStep: AdminCustomerAccountOnboardingStep
) {
  const existing = Array.isArray(current) ? current.filter(Boolean) : [];
  return existing.includes(nextStep) ? existing : [...existing, nextStep];
}

function createInviteErrorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function createInviteBillingErrorResponse(error: unknown, fallbackMessage: string) {
  if (isBillingLimitError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        block: error.block,
      },
      { status: 409 }
    );
  }

  return createInviteErrorResponse(
    error instanceof Error ? error.message : fallbackMessage,
    400
  );
}

async function resolveAuthenticatedPortalUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Invalid portal session.");
  }

  return user;
}

async function syncInviteOnboarding(params: {
  accountId: string;
  actorAuthUserId: string;
  email: string;
  role: AdminCustomerAccountRole;
  mode: "created" | "resent";
}) {
  const serviceSupabase = getAccountsServiceClient();
  const onboardingResponse = await serviceSupabase
    .from("customer_account_onboarding")
    .select("status, current_step, completed_steps, first_invite_sent_at")
    .eq("customer_account_id", params.accountId)
    .maybeSingle();

  if (onboardingResponse.error) {
    throw new Error(
      onboardingResponse.error.message || "Failed to read onboarding before invite update."
    );
  }

  const nextCompletedSteps = appendCompletedStep(
    onboardingResponse.data?.completed_steps as AdminCustomerAccountOnboardingStep[] | null | undefined,
    "invite_team"
  );
  const nextCurrentStep =
    onboardingResponse.data?.current_step === "create_project"
      ? "invite_team"
      : onboardingResponse.data?.current_step === "completed"
      ? "completed"
      : "open_launch_workspace";

  const onboardingWrite = onboardingResponse.data
    ? serviceSupabase
        .from("customer_account_onboarding")
        .update({
          completed_steps: nextCompletedSteps,
          current_step: nextCurrentStep,
          first_invite_sent_at:
            onboardingResponse.data.first_invite_sent_at ?? new Date().toISOString(),
        })
        .eq("customer_account_id", params.accountId)
    : serviceSupabase.from("customer_account_onboarding").insert({
        customer_account_id: params.accountId,
        status: "in_progress",
        current_step: nextCurrentStep,
        completed_steps: nextCompletedSteps,
        first_invite_sent_at: new Date().toISOString(),
      });

  const [onboardingResult, eventResult] = await Promise.all([
    onboardingWrite,
    serviceSupabase.from("customer_account_events").insert({
      customer_account_id: params.accountId,
      event_type: "invite_sent",
      actor_auth_user_id: params.actorAuthUserId,
      metadata: {
        email: params.email,
        role: params.role,
        mode: params.mode,
      },
    }),
  ]);

  if (onboardingResult.error) {
    throw new Error(onboardingResult.error.message || "Failed to update onboarding after invite.");
  }

  if (eventResult.error) {
    throw new Error(eventResult.error.message || "Failed to write invite event.");
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await context.params;

  try {
    const user = await resolveAuthenticatedPortalUser();
    await assertWorkspaceInviteAccess({
      accountId,
      authUserId: user.id,
    });

    const state = await listWorkspaceMembersAndInvites(accountId);
    return NextResponse.json({
      ok: true,
      account: state.account,
      members: state.members,
      invites: state.invites,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace team.";
    const status =
      message === "Invalid portal session."
        ? 401
        : message === "Workspace membership not found." ||
          message === "Only active owners or admins can manage invites."
        ? 403
        : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await context.params;
  const serviceSupabase = getAccountsServiceClient();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role =
    typeof body?.role === "string" && VALID_ROLES.includes(body.role as AdminCustomerAccountRole)
      ? (body.role as AdminCustomerAccountRole)
      : "member";

  if (!email) {
    return NextResponse.json({ ok: false, error: "Invite email is required." }, { status: 400 });
  }

  try {
    const user = await resolveAuthenticatedPortalUser();
    await assertWorkspaceInviteAccess({
      accountId,
      authUserId: user.id,
    });
    await expireStaleWorkspaceInvites(accountId);

    const existingInvite = await serviceSupabase
      .from("customer_account_invites")
      .select("id, email, role, status, expires_at, created_at")
      .eq("customer_account_id", accountId)
      .ilike("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite.error) {
      throw new Error(existingInvite.error.message || "Failed to inspect existing invites.");
    }

    if (existingInvite.data) {
      const state = await listWorkspaceMembersAndInvites(accountId);
      return NextResponse.json({
        ok: true,
        created: false,
        invite: existingInvite.data,
        account: state.account,
        members: state.members,
        invites: state.invites,
      });
    }

    if (isBillableAccountRole(role)) {
      const pendingInviteCountResponse = await serviceSupabase
        .from("customer_account_invites")
        .select("id", { count: "exact", head: true })
        .eq("customer_account_id", accountId)
        .eq("status", "pending")
        .in("role", ["owner", "admin", "member"]);

      if (pendingInviteCountResponse.error) {
        throw new Error(
          pendingInviteCountResponse.error.message || "Failed to inspect current invite pressure."
        );
      }

      try {
        await requireAccountGrowthCapacity({
          accountId,
          usageKey: "seats",
          growthAction: "invite_billable_seat",
          increment: (pendingInviteCountResponse.count ?? 0) + 1,
          returnTo: "/account/team",
        });
      } catch (error) {
        return createInviteBillingErrorResponse(error, "Seat capacity check failed.");
      }
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
    const inviteToken = crypto.randomUUID();

    const inviteInsert = await serviceSupabase.from("customer_account_invites").insert({
      customer_account_id: accountId,
      email,
      role,
      status: "pending",
      invite_token: inviteToken,
      invited_by_auth_user_id: user.id,
      expires_at: expiresAt,
      metadata: {
        source: "workspace_team_page",
      },
    });

    if (inviteInsert.error) {
      if (inviteInsert.error.message?.toLowerCase().includes("billing limit reached")) {
        try {
          await requireAccountGrowthCapacity({
            accountId,
            usageKey: "seats",
            growthAction: "invite_billable_seat",
            increment: 1,
            returnTo: "/account/team",
          });
        } catch (error) {
          return createInviteBillingErrorResponse(error, "Seat capacity check failed.");
        }
      }

      throw new Error(inviteInsert.error.message || "Failed to create invite.");
    }

    await syncInviteOnboarding({
      accountId,
      actorAuthUserId: user.id,
      email,
      role,
      mode: "created",
    });

    const state = await listWorkspaceMembersAndInvites(accountId);
    return NextResponse.json({
      ok: true,
      created: true,
      account: state.account,
      members: state.members,
      invites: state.invites,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invite.";
    const status =
      message === "Invalid portal session."
        ? 401
        : message === "Workspace membership not found." ||
          message === "Only active owners or admins can manage invites."
        ? 403
        : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await context.params;
  const serviceSupabase = getAccountsServiceClient();
  const body = await request.json().catch(() => null);
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId.trim() : "";
  const action = body?.action === "resend" || body?.action === "revoke" ? body.action : null;

  if (!inviteId || !action) {
    return NextResponse.json(
      { ok: false, error: "Invite action and invite id are required." },
      { status: 400 }
    );
  }

  try {
    const user = await resolveAuthenticatedPortalUser();
    await assertWorkspaceInviteAccess({
      accountId,
      authUserId: user.id,
    });

    const inviteResponse = await serviceSupabase
      .from("customer_account_invites")
      .select("id, email, role, status, expires_at")
      .eq("customer_account_id", accountId)
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteResponse.error || !inviteResponse.data) {
      throw new Error(inviteResponse.error?.message || "Invite not found.");
    }

    const invite = inviteResponse.data;
    const now = new Date().toISOString();

    if (action === "revoke") {
      if (invite.status === "accepted") {
        throw new Error("Accepted invites cannot be revoked from this surface.");
      }

      if (invite.status !== "revoked") {
        const revokeResult = await serviceSupabase
          .from("customer_account_invites")
          .update({
            status: "revoked",
            revoked_at: now,
            updated_at: now,
          })
          .eq("id", invite.id);

        if (revokeResult.error) {
          throw new Error(revokeResult.error.message || "Failed to revoke invite.");
        }
      }
    }

    if (action === "resend") {
      if (invite.status === "accepted") {
        throw new Error("Accepted invites do not need to be resent.");
      }

      const resendResult = await serviceSupabase
        .from("customer_account_invites")
        .update({
          status: "pending",
          invite_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
          revoked_at: null,
          accepted_at: null,
          accepted_by_auth_user_id: null,
          updated_at: now,
          metadata: {
            resendSource: "workspace_team_page",
            resentAt: now,
          },
        })
        .eq("id", invite.id);

      if (resendResult.error) {
        throw new Error(resendResult.error.message || "Failed to resend invite.");
      }

      await syncInviteOnboarding({
        accountId,
        actorAuthUserId: user.id,
        email: invite.email,
        role: invite.role,
        mode: "resent",
      });
    }

    const state = await listWorkspaceMembersAndInvites(accountId);
    return NextResponse.json({
      ok: true,
      changed: true,
      action,
      account: state.account,
      members: state.members,
      invites: state.invites,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update invite.";
    const status =
      message === "Invalid portal session."
        ? 401
        : message === "Workspace membership not found." ||
          message === "Only active owners or admins can manage invites." ||
          message === "Accepted invites cannot be revoked from this surface." ||
          message === "Accepted invites do not need to be resent."
        ? 403
        : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
