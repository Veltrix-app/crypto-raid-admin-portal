import { NextResponse } from "next/server";
import {
  assertProjectTrustAccess,
  createTrustAccessErrorResponse,
  hasTrustVisibilityPermission,
} from "@/lib/trust/project-trust-auth";
import { listProjectTrustCases } from "@/lib/trust/project-trust-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectTrustAccess(id);
    if (!hasTrustVisibilityPermission(access, "trust_case_list")) {
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

    const cases = await listProjectTrustCases(access);
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
    return createTrustAccessErrorResponse(error, "Failed to load project trust cases.");
  }
}
