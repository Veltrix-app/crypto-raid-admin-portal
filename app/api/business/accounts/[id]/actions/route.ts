import { NextRequest, NextResponse } from "next/server";
import {
  assertAuthenticatedPortalSuperAdmin,
  resolveAuthenticatedPortalAccountUser,
} from "@/lib/accounts/account-auth";
import { extendBusinessGraceWindow } from "@/lib/billing/business-actions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    await assertAuthenticatedPortalSuperAdmin(authenticatedUser.user.id);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          action?: "extend_grace";
          days?: number;
        }
      | null;

    if (body?.action !== "extend_grace") {
      return NextResponse.json({ ok: false, error: "Unknown business action." }, { status: 400 });
    }

    const result = await extendBusinessGraceWindow({
      customerAccountId: id,
      actorAuthUserId: authenticatedUser.user.id,
      days: body?.days ?? 3,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run the business action.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : message === "Grace can only be extended on paid workspace accounts."
            ? 400
            : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
