import { NextResponse } from "next/server";
import {
  assertProjectPayoutAccess,
  createPayoutAccessErrorResponse,
  hasPayoutVisibilityPermission,
} from "@/lib/payout/project-payout-auth";
import { listProjectPayoutCases } from "@/lib/payout/project-payout-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectPayoutAccess(id);
    if (!hasPayoutVisibilityPermission(access, "claim_list")) {
      return NextResponse.json({
        ok: true,
        cases: [],
        summaryOnly: true,
        access: {
          isSuperAdmin: access.isSuperAdmin,
          membershipRole: access.membershipRole,
          visibilityPermissions: access.visibilityPermissions,
          actionPermissions: access.actionPermissions,
        },
      });
    }

    const cases = await listProjectPayoutCases(access);
    return NextResponse.json({
      ok: true,
      cases,
      summaryOnly: false,
      access: {
        isSuperAdmin: access.isSuperAdmin,
        membershipRole: access.membershipRole,
        visibilityPermissions: access.visibilityPermissions,
        actionPermissions: access.actionPermissions,
      },
    });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load project payout cases.");
  }
}
