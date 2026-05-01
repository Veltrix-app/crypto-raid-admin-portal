import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import {
  buildCommunityEntityUrl,
  buildProjectAppUrl,
  getDefaultCommunityArtwork,
  loadProjectCommunityState,
  sendProjectCommunityMessage,
  updateCommunityMetadata,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

type MissionPostMode = "digest" | "campaign" | "quest" | "reward";

function buildMissionDigestBody(state: Awaited<ReturnType<typeof loadProjectCommunityState>>) {
  const campaignLine = state.campaigns.length
    ? `Campaigns: ${state.campaigns.slice(0, 2).map((item) => item.title).join(" | ")}`
    : "Campaigns: none live right now";
  const questLine = state.quests.length
    ? `Quests: ${state.quests.slice(0, 3).map((item) => item.title).join(" | ")}`
    : "Quests: none live right now";
  const rewardLine = state.rewards.length
    ? `Rewards: ${state.rewards.slice(0, 2).map((item) => item.title).join(" | ")}`
    : "Rewards: no live drops yet";

  return [
    "Today's mission rail is live inside Veltrix.",
    campaignLine,
    questLine,
    rewardLine,
  ].join("\n");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | { mode?: MissionPostMode; contentId?: string; providers?: Array<"discord" | "telegram"> }
      | null;
    const access = await assertProjectCommunityAccess(projectId ?? "");

    const mode = body?.mode ?? "digest";
    const contentId = typeof body?.contentId === "string" ? body.contentId.trim() : "";
    const providers = Array.isArray(body?.providers) ? body.providers : undefined;
    const state = await loadProjectCommunityState(access.projectId);

    if (mode === "digest") {
      const response = await sendProjectCommunityMessage({
        projectId: access.projectId,
        providers,
        title: `${state.project.name} mission board`,
        body: buildMissionDigestBody(state),
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

      await updateCommunityMetadata({
        projectId: access.projectId,
        metadataPatch: {
          lastMissionDigestAt: new Date().toISOString(),
          lastAutomationRunAt: new Date().toISOString(),
        },
      });
      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "community_bot_settings",
        sourceId: projectId,
        action: "community_mission_digest_posted",
        summary: `Posted a mission digest for ${state.project.name}.`,
        metadata: {
          deliveries: response.deliveries.length,
          providers,
        },
      });

      return NextResponse.json({
        ...response,
        mode,
      });
    }

    if (!contentId) {
      return NextResponse.json(
        { ok: false, error: "Missing mission content id." },
        { status: 400 }
      );
    }

    if (mode === "campaign") {
      const campaign = state.campaigns.find((item) => item.id === contentId);
      if (!campaign) {
        return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
      }

      const response = await sendProjectCommunityMessage({
        projectId: access.projectId,
        providers,
        title: campaign.title,
        body: campaign.short_description || "A live campaign just opened in Veltrix.",
        eyebrow: "CAMPAIGN LIVE",
        projectName: state.project.name,
        campaignTitle: campaign.title,
        imageUrl:
          campaign.banner_url ||
          campaign.thumbnail_url ||
          state.project.banner_url ||
          state.project.logo ||
          getDefaultCommunityArtwork("campaign"),
        fallbackImageUrl: getDefaultCommunityArtwork("campaign"),
        accentColor: state.project.brand_accent,
        meta: [
          { label: "Track", value: state.project.name },
          { label: "XP Pool", value: `+${campaign.xp_budget ?? 0} XP` },
          { label: "State", value: campaign.status === "active" ? "Campaign live" : campaign.status },
        ],
        url: buildCommunityEntityUrl("campaigns", campaign.id),
        buttonLabel: "Open campaign",
      });

      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "campaigns",
        sourceId: campaign.id,
        action: "community_campaign_posted",
        summary: `Posted campaign ${campaign.title} into the project community rail.`,
        metadata: {
          deliveries: response.deliveries.length,
          providers,
        },
      });

      return NextResponse.json({ ...response, mode });
    }

    if (mode === "quest") {
      const quest = state.quests.find((item) => item.id === contentId);
      if (!quest) {
        return NextResponse.json({ ok: false, error: "Quest not found." }, { status: 404 });
      }

      const response = await sendProjectCommunityMessage({
        projectId: access.projectId,
        providers,
        title: quest.title,
        body: quest.short_description || "A mission is now live in Veltrix.",
        eyebrow: "MISSION LIVE",
        projectName: state.project.name,
        imageUrl: state.project.banner_url || state.project.logo || getDefaultCommunityArtwork("quest"),
        fallbackImageUrl: getDefaultCommunityArtwork("quest"),
        accentColor: state.project.brand_accent,
        meta: [
          { label: "Project", value: state.project.name },
          { label: "XP", value: `+${quest.xp ?? 0} XP` },
        ],
        url: buildCommunityEntityUrl("quests", quest.id),
        buttonLabel: "Open mission",
      });

      await writeProjectCommunityAuditLog({
        projectId: access.projectId,
        sourceTable: "quests",
        sourceId: quest.id,
        action: "community_mission_posted",
        summary: `Posted mission ${quest.title} into the project community rail.`,
        metadata: {
          deliveries: response.deliveries.length,
          providers,
        },
      });

      return NextResponse.json({ ...response, mode });
    }

    const reward = state.rewards.find((item) => item.id === contentId);
    if (!reward) {
      return NextResponse.json({ ok: false, error: "Reward not found." }, { status: 404 });
    }

    const response = await sendProjectCommunityMessage({
      projectId: access.projectId,
      providers,
      title: reward.title,
      body: reward.description || "A new reward is live in Veltrix.",
      eyebrow: "REWARD DROP",
      projectName: state.project.name,
      imageUrl: reward.image_url || state.project.banner_url || state.project.logo || undefined,
      fallbackImageUrl: getDefaultCommunityArtwork("quest"),
      accentColor: state.project.brand_accent,
      meta: [
        { label: "Project", value: state.project.name },
        { label: "Cost", value: `${reward.cost ?? 0} XP` },
        { label: "Rarity", value: reward.rarity || "Standard" },
      ],
      url: buildCommunityEntityUrl("rewards", reward.id),
      buttonLabel: "Open reward",
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "rewards",
      sourceId: reward.id,
      action: "community_reward_posted",
      summary: `Posted reward ${reward.title} into the project community rail.`,
      metadata: {
        deliveries: response.deliveries.length,
        providers,
      },
    });

    return NextResponse.json({ ...response, mode });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Mission community post failed.");
  }
}
