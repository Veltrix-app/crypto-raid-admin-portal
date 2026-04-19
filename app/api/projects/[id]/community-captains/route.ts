import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import {
  updateCommunityMetadata,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

type CaptainInput = {
  authUserId?: string;
  role?: string;
  label?: string;
};

function sanitizeCaptains(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as Array<{
      authUserId: string;
      role: "community_captain" | "raid_lead" | "growth_lead";
      label: string;
    }>;
  }

  return input
    .map((candidate) => {
      const row =
        candidate && typeof candidate === "object" ? (candidate as CaptainInput) : {};
      const authUserId =
        typeof row.authUserId === "string" ? row.authUserId.trim() : "";
      const role =
        row.role === "raid_lead" || row.role === "growth_lead"
          ? row.role
          : "community_captain";
      const label = typeof row.label === "string" ? row.label.trim() : "";

      return {
        authUserId,
        role,
        label,
      };
    })
    .filter((row) => row.authUserId.length > 0)
    .slice(0, 6);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | { assignments?: CaptainInput[] }
      | null;

    const access = await assertProjectCommunityAccess(projectId ?? "");
    const assignments = sanitizeCaptains(body?.assignments);
    const integrationId = await updateCommunityMetadata({
      projectId: access.projectId,
      metadataPatch: {
        captainAssignments: assignments,
      },
    });

    if (!integrationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Connect Discord or Telegram before saving captains.",
        },
        { status: 400 }
      );
    }

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_bot_settings",
      sourceId: integrationId,
      action: "community_captains_updated",
      summary: `Community captains updated for this project (${assignments.length} assignment${assignments.length === 1 ? "" : "s"}).`,
      metadata: {
        assignments,
        updatedBy: access.authUserId,
      },
    });

    return NextResponse.json({
      ok: true,
      assignments,
      message: "Community captains saved.",
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save community captains.",
      },
      { status: 500 }
    );
  }
}
