import { NextResponse } from "next/server";
import {
  assertProjectTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { loadProjectTrustCockpit } from "@/lib/trust/project-trust-cockpit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectTrustAccess(id);
    const cockpit = await loadProjectTrustCockpit(access);

    return NextResponse.json(
      {
        ok: true,
        cockpit,
        access: {
          isSuperAdmin: access.isSuperAdmin,
          membershipRole: access.membershipRole,
          visibilityPermissions: access.visibilityPermissions,
          actionPermissions: access.actionPermissions,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load project trust cockpit.");
  }
}
