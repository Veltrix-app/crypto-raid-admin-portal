import { NextRequest, NextResponse } from "next/server";
import {
  getAccountsServiceClient,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { loadPortalCustomerBillingWorkspace } from "@/lib/billing/account-billing";

async function assertPortalAccountAccess(params: {
  authUserId: string;
  customerAccountId: string;
}) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_memberships")
    .select("customer_account_id")
    .eq("customer_account_id", params.customerAccountId)
    .eq("auth_user_id", params.authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to verify portal account access.");
  }

  if (!data?.customer_account_id) {
    throw new Error("Account access denied.");
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing customer account id." }, { status: 400 });
    }

    await assertPortalAccountAccess({
      authUserId: authenticatedUser.user.id,
      customerAccountId: id,
    });

    const workspace = await loadPortalCustomerBillingWorkspace(id);

    return NextResponse.json(
      {
        ok: true,
        workspace,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load portal billing workspace.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Account access denied."
          ? 403
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
