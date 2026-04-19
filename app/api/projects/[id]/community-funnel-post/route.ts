import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import {
  buildProjectAppUrl,
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
      | { funnel?: "newcomer" | "reactivation"; providers?: CommunityProvider[] }
      | null;

    const access = await assertProjectCommunityAccess(projectId ?? "");
    const funnel = body?.funnel === "reactivation" ? "reactivation" : "newcomer";
    const providers = sanitizeProviders(body?.providers);

    const [state, growth] = await Promise.all([
      loadProjectCommunityState(access.projectId),
      loadProjectCommunityGrowth(access.projectId),
    ]);

    const cohort =
      funnel === "reactivation" ? growth.cohorts.reactivation : growth.cohorts.newcomers;
    const meta = [
      { label: "Project", value: state.project.name },
      {
        label: funnel === "reactivation" ? "Reactivation pool" : "Starter pool",
        value: String(cohort.length),
      },
      {
        label: "Command ready",
        value: String(growth.cohorts.summary.commandReady),
      },
      {
        label: "Wallet ready",
        value: String(growth.analytics.activationReadyCount),
      },
    ];

    const featuredCampaign = state.campaigns[0];
    const result = await sendProjectCommunityMessage({
      projectId: access.projectId,
      providers,
      eyebrow: funnel === "reactivation" ? "COMEBACK WAVE" : "STARTER LANE",
      title:
        funnel === "reactivation"
          ? `${state.project.name} comeback lane is live`
          : `${state.project.name} starter lane is live`,
      body:
        funnel === "reactivation"
          ? `We've got ${cohort.length} contributors ready for a comeback push. Re-open the rail, stack a quest or raid, and bring the pressure back online.`
          : `Fresh contributors now have a clean path into ${state.project.name}. Link up, clear the first mission lane, and step into the live community rail.`,
      campaignTitle: featuredCampaign?.title ?? null,
      imageUrl: featuredCampaign?.banner_url ?? state.project.banner_url ?? null,
      fallbackImageUrl: getDefaultCommunityArtwork("campaign"),
      accentColor: state.project.brand_accent ?? null,
      meta,
      url: buildProjectAppUrl({ id: state.project.id, slug: state.project.slug }),
      buttonLabel: funnel === "reactivation" ? "Rejoin the rail" : "Open starter lane",
      projectName: state.project.name,
    });

    const integrationId = await updateCommunityMetadata({
      projectId: access.projectId,
      metadataPatch:
        funnel === "reactivation"
          ? { lastReactivationPushAt: new Date().toISOString() }
          : { lastNewcomerPushAt: new Date().toISOString() },
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_bot_settings",
      sourceId: integrationId ?? state.project.id,
      action:
        funnel === "reactivation"
          ? "community_reactivation_funnel_posted"
          : "community_newcomer_funnel_posted",
      summary:
        funnel === "reactivation"
          ? `Reactivation funnel sent to ${result.deliveries.length} community rail${result.deliveries.length === 1 ? "" : "s"}.`
          : `Newcomer funnel sent to ${result.deliveries.length} community rail${result.deliveries.length === 1 ? "" : "s"}.`,
      metadata: {
        providers,
        deliveries: result.deliveries.length,
        skipped: result.skipped.length,
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
        error: error instanceof Error ? error.message : "Failed to send funnel post.",
      },
      { status: 500 }
    );
  }
}
