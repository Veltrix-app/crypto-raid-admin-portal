import { NextRequest, NextResponse } from "next/server";
import {
  buildCommunityEntityUrl,
  buildProjectAppUrl,
  getDefaultCommunityArtwork,
  loadCommunitySettingsRows,
  loadProjectCommunityState,
  sendProjectCommunityMessage,
  updateCommunityMetadata,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

type AutomationMode = "all" | "missions" | "raids";

function readMetadata(input: unknown) {
  const metadata = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    missionDigestEnabled: metadata.missionDigestEnabled === true,
    raidAlertsEnabled: metadata.raidAlertsEnabled === true,
    raidRemindersEnabled: metadata.raidRemindersEnabled === true,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | { mode?: AutomationMode; providers?: Array<"discord" | "telegram"> }
      | null;

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const mode = body?.mode ?? "all";
    const providers = Array.isArray(body?.providers) ? body.providers : undefined;
    const { integrations, settingsByIntegrationId } = await loadCommunitySettingsRows(projectId);
    const primaryIntegration =
      integrations.find((integration) => integration.provider === "discord") ?? integrations[0] ?? null;

    if (!primaryIntegration) {
      return NextResponse.json(
        { ok: false, error: "No project community integrations are configured yet." },
        { status: 400 }
      );
    }

    const metadata = readMetadata(settingsByIntegrationId.get(primaryIntegration.id)?.metadata);
    const state = await loadProjectCommunityState(projectId);
    const results: Array<Record<string, unknown>> = [];
    const metadataPatch: Record<string, unknown> = {
      lastAutomationRunAt: new Date().toISOString(),
    };

    if ((mode === "all" || mode === "missions") && metadata.missionDigestEnabled) {
      const missionBody = [
        "Today's mission rail is live inside Veltrix.",
        state.campaigns.length
          ? `Campaigns: ${state.campaigns.slice(0, 2).map((item) => item.title).join(" | ")}`
          : "Campaigns: none live right now",
        state.quests.length
          ? `Quests: ${state.quests.slice(0, 3).map((item) => item.title).join(" | ")}`
          : "Quests: none live right now",
        state.rewards.length
          ? `Rewards: ${state.rewards.slice(0, 2).map((item) => item.title).join(" | ")}`
          : "Rewards: no live drops yet",
      ].join("\n");

      const missionResult = await sendProjectCommunityMessage({
        projectId,
        providers,
        title: `${state.project.name} mission board`,
        body: missionBody,
        eyebrow: "MISSION DIGEST",
        projectName: state.project.name,
        imageUrl: state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("quest"),
        fallbackImageUrl: getDefaultCommunityArtwork("quest"),
        accentColor: state.project.brand_accent,
        meta: [
          { label: "Campaigns", value: String(state.campaigns.length) },
          { label: "Quests", value: String(state.quests.length) },
          { label: "Rewards", value: String(state.rewards.length) },
        ],
        url: buildProjectAppUrl(state.project),
        buttonLabel: "Open project rail",
      });

      results.push({
        type: "missions",
        ...missionResult,
      });
      metadataPatch.lastMissionDigestAt = new Date().toISOString();
    }

    if ((mode === "all" || mode === "raids") && state.raids.length > 0) {
      const raidMode = metadata.raidAlertsEnabled
        ? "live"
        : metadata.raidRemindersEnabled
          ? "reminder"
          : null;

      if (raidMode) {
        const raid = state.raids[0];
        const raidBody =
          raidMode === "reminder"
            ? `${raid.short_description || "This raid is still live."}\n\nReminder: another wave is due right now.`
            : raid.short_description || "A raid is live and needs community pressure right now.";

        const raidResult = await sendProjectCommunityMessage({
          projectId,
          providers,
          title: raid.title,
          body: raidBody,
          eyebrow: raidMode === "reminder" ? "RAID REMINDER" : "RAID ALERT",
          projectName: state.project.name,
          imageUrl:
            raid.banner ||
            state.project.banner_url ||
            state.project.logo ||
            getDefaultCommunityArtwork("raid"),
          fallbackImageUrl: getDefaultCommunityArtwork("raid"),
          accentColor: state.project.brand_accent,
          meta: [
            { label: "Project", value: state.project.name },
            { label: "Raid XP", value: `+${raid.reward_xp ?? 0} XP` },
            { label: "Mode", value: raidMode === "reminder" ? "Reminder wave" : "Live pressure" },
          ],
          url: buildCommunityEntityUrl("raids", raid.id),
          buttonLabel: "Open raid",
        });

        results.push({
          type: "raids",
          ...raidResult,
        });
        metadataPatch.lastRaidAlertAt = new Date().toISOString();
      }
    }

    await updateCommunityMetadata({
      projectId,
      metadataPatch,
    });
    await writeProjectCommunityAuditLog({
      projectId,
      sourceTable: "community_bot_settings",
      sourceId: primaryIntegration.id,
      action: "community_automation_run",
      summary: `Ran ${mode} automation rail for ${state.project.name}.`,
      metadata: {
        results,
        providers,
      },
    });

    return NextResponse.json({
      ok: true,
      mode,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Community automation run failed.",
      },
      { status: 500 }
    );
  }
}
