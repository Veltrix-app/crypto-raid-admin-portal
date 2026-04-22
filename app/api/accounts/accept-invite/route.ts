import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const serviceSupabase = getAccountsServiceClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json({ ok: false, error: "Invalid portal session." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const inviteToken = typeof body?.inviteToken === "string" ? body.inviteToken.trim() : "";
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId.trim() : "";

  if (!inviteToken && !inviteId) {
    return NextResponse.json(
      { ok: false, error: "Invite id or invite token is required." },
      { status: 400 }
    );
  }

  const inviteQuery = serviceSupabase
    .from("customer_account_invites")
    .select(
      "id, customer_account_id, email, role, status, expires_at, accepted_by_auth_user_id"
    );
  const inviteResponse = inviteToken
    ? await inviteQuery.eq("invite_token", inviteToken).maybeSingle()
    : await inviteQuery.eq("id", inviteId).maybeSingle();

  if (inviteResponse.error || !inviteResponse.data) {
    return NextResponse.json({ ok: false, error: "Invite not found." }, { status: 404 });
  }

  const invite = inviteResponse.data;
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "This invite belongs to a different email address." },
      { status: 403 }
    );
  }

  if (invite.status === "accepted") {
    return NextResponse.json({
      ok: true,
      accountId: invite.customer_account_id,
      accepted: false,
      alreadyAccepted: true,
    });
  }

  if (invite.status === "revoked") {
    return NextResponse.json({ ok: false, error: "Invite has been revoked." }, { status: 400 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await serviceSupabase
      .from("customer_account_invites")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invite.id);

    return NextResponse.json({ ok: false, error: "Invite has expired." }, { status: 400 });
  }

  const membershipResponse = await serviceSupabase
    .from("customer_account_memberships")
    .select("id")
    .eq("customer_account_id", invite.customer_account_id)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (membershipResponse.error) {
    return NextResponse.json(
      { ok: false, error: membershipResponse.error.message || "Failed to inspect membership." },
      { status: 500 }
    );
  }

  if (!membershipResponse.data) {
    const membershipInsert = await serviceSupabase.from("customer_account_memberships").insert({
      customer_account_id: invite.customer_account_id,
      auth_user_id: user.id,
      role: invite.role,
      status: "active",
      joined_at: new Date().toISOString(),
      metadata: {
        email: user.email,
        source: "invite_acceptance",
      },
    });

    if (membershipInsert.error) {
      return NextResponse.json(
        {
          ok: false,
          error: membershipInsert.error.message || "Failed to create workspace membership.",
        },
        { status: 500 }
      );
    }
  }

  const now = new Date().toISOString();
  const [inviteUpdate, eventInsert] = await Promise.all([
    serviceSupabase
      .from("customer_account_invites")
      .update({
        status: "accepted",
        accepted_by_auth_user_id: user.id,
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", invite.id),
    serviceSupabase.from("customer_account_events").insert({
      customer_account_id: invite.customer_account_id,
      event_type: "invite_accepted",
      actor_auth_user_id: user.id,
      metadata: {
        inviteId: invite.id,
        email: user.email,
      },
    }),
  ]);

  if (inviteUpdate.error) {
    return NextResponse.json(
      { ok: false, error: inviteUpdate.error.message || "Failed to accept invite." },
      { status: 500 }
    );
  }

  if (eventInsert.error) {
    return NextResponse.json(
      { ok: false, error: eventInsert.error.message || "Failed to write invite acceptance event." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    accountId: invite.customer_account_id,
    accepted: true,
    alreadyAccepted: false,
  });
}
