import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import {
  buildCommunityEntityUrl,
  getDefaultCommunityArtwork,
  loadProjectCommunityState,
  sendProjectCommunityMessage,
  updateCommunityMetadata,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";
import { loadProjectCommunityGrowth } from "@/lib/community/project-community-insights";

type CommunityProvider = "discord" | "telegram";

function sanitizeProviders(input: unknown) {
  if (!Array.isArray(input)) return undefined;
  const providers = input.filter(
    (value): value is CommunityProvider => value === "discord" || value === "telegram"
  );
  return providers.length > 0 ? providers : undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | { campaignId?: string; providers?: CommunityProvider[] }
      | null;

    const access = await assertProjectCommunityAccess(projectId ?? "");
    const campaignId =
      typeof body?.campaignId === "string" ? body.campaignId.trim() : "";

    if (!campaignId) {
      return NextResponse.json({ ok: false, error: "Missing campaign id." }, { status: 400 });
    }

    const providers = sanitizeProviders(body?.providers);
    const [state, growth] = await Promise.all([
      loadProjectCommunityState(access.projectId),
      loadProjectCommunityGrowth(access.projectId),
    ]);

    const board = growth.activationBoards.find((item) => item.campaignId === campaignId);
    const campaign = state.campaigns.find((item) => item.id === campaignId);

    if (!board || !campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign activation board not available for this project." },
        { status: 404 }
      );
    }

    const laneLabel =
      board.recommendedLane === "reactivation"
        ? "Reactivation"
        : board.recommendedLane === "core"
          ? "Core pressure"
          : "Newcomer";

    const result = await sendProjectCommunityMessage({
      projectId: access.projectId,
      providers,
      eyebrow: "ACTIVATION BOARD",
      title: `${campaign.title} activation board is live`,
      body: board.recommendedCopy,
      campaignTitle: campaign.title,
      imageUrl: campaign.banner_url ?? campaign.thumbnail_url ?? null,
      fallbackImageUrl: getDefaultCommunityArtwork("campaign"),
      accentColor: state.project.brand_accent ?? null,
      meta: [
        { label: "Activation score", value: `${board.activationScore}` },
        { label: "Ready contributors", value: `${board.readyContributors}` },
        { label: "Recommended lane", value: laneLabel },
        { label: "Quests • raids • rewards", value: `${board.questCount} • ${board.raidCount} • ${board.rewardCount}` },
      ],
      url: buildCommunityEntityUrl("campaigns", campaignId),
      buttonLabel: "Open campaign board",
      projectName: state.project.name,
    });

    const integrationId = await updateCommunityMetadata({
      projectId: access.projectId,
      metadataPatch: {
        lastActivationBoardAt: new Date().toISOString(),
      },
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "campaigns",
      sourceId: campaignId,
      action: "community_activation_board_posted",
      summary: `Activation board posted for ${campaign.title} to ${result.deliveries.length} community rail${result.deliveries.length === 1 ? "" : "s"}.`,
      metadata: {
        integrationId,
        providers,
        deliveries: result.deliveries.length,
        skipped: result.skipped.length,
        activationScore: board.activationScore,
        updatedBy: access.authUserId,
      },
    });

    return NextResponse.json({
      ok: true,
      deliveries: result.deliveries,
      skipped: result.skipped,
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to send activation board.",
      },
      { status: 500 }
    );
  }
}
