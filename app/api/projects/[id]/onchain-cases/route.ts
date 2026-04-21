import { NextResponse } from "next/server";
import {
  assertProjectOnchainAccess,
  createOnchainAccessErrorResponse,
  hasOnchainVisibilityPermission,
} from "@/lib/onchain/project-onchain-auth";
import { listProjectOnchainCases } from "@/lib/onchain/project-onchain-cases";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectOnchainAccess(id);
    if (!hasOnchainVisibilityPermission(access, "case_list")) {
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

    const cases = await listProjectOnchainCases(access);
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
    return createOnchainAccessErrorResponse(error, "Failed to load project on-chain cases.");
  }
}
