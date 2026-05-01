import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import {
  buildCommunityEntityUrl,
  getDefaultCommunityArtwork,
  loadProjectCommunityState,
  sendProjectCommunityMessage,
  updateCommunityMetadata,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

type RaidPostMode = "live" | "reminder" | "result";

function buildRaidBody(mode: RaidPostMode, title: string, description: string | null) {
  if (mode === "reminder") {
    return description?.trim()
      ? `${description}\n\nReminder: this raid is still live and needs fresh pressure.`
      : "This raid is still live and needs another wave right now.";
  }

  if (mode === "result") {
    return description?.trim()
      ? `${description}\n\nResult rail: wrap the pressure, share outcomes and surface the top raiders.`
      : "Raid pressure window is closing. Time to surface outcomes and top contributors.";
  }

  return description?.trim() || "A raid is live and needs community pressure right now.";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | { raidId?: string; mode?: RaidPostMode; providers?: Array<"discord" | "telegram"> }
      | null;
    const access = await assertProjectCommunityAccess(projectId ?? "");

    const raidId = typeof body?.raidId === "string" ? body.raidId.trim() : "";
    const mode = body?.mode ?? "live";
    const providers = Array.isArray(body?.providers) ? body.providers : undefined;

    if (!raidId) {
      return NextResponse.json({ ok: false, error: "Missing raid id." }, { status: 400 });
    }

    const state = await loadProjectCommunityState(access.projectId);
    const raid = state.raids.find((item) => item.id === raidId);

    if (!raid) {
      return NextResponse.json({ ok: false, error: "Raid not found." }, { status: 404 });
    }

    const eyebrow =
      mode === "reminder" ? "RAID REMINDER" : mode === "result" ? "RAID RESULT" : "RAID ALERT";

    const response = await sendProjectCommunityMessage({
      projectId: access.projectId,
      providers,
      title: raid.title,
      body: buildRaidBody(mode, raid.title, raid.short_description),
      eyebrow,
      projectName: state.project.name,
      imageUrl:
        raid.banner || state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("raid"),
      fallbackImageUrl: getDefaultCommunityArtwork("raid"),
      accentColor: state.project.brand_accent,
      meta: [
        { label: "Project", value: state.project.name },
        { label: "Mode", value: mode === "live" ? "Live pressure" : mode === "reminder" ? "Reminder wave" : "Result wrap" },
        { label: "Raid XP", value: `+${raid.reward_xp ?? 0} XP` },
      ],
      url: buildCommunityEntityUrl("raids", raid.id),
      buttonLabel: mode === "result" ? "Open results" : "Open raid",
    });

    await updateCommunityMetadata({
      projectId: access.projectId,
      metadataPatch: {
        lastRaidAlertAt: new Date().toISOString(),
        lastAutomationRunAt: new Date().toISOString(),
      },
    });
    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "raids",
      sourceId: raid.id,
      action:
        mode === "reminder"
          ? "community_raid_reminder_posted"
          : mode === "result"
            ? "community_raid_result_posted"
            : "community_raid_alert_posted",
      summary: `Posted ${mode} rail for ${raid.title}.`,
      metadata: {
        deliveries: response.deliveries.length,
        providers,
      },
    });

    return NextResponse.json({
      ...response,
      mode,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Raid community post failed.");
  }
}
