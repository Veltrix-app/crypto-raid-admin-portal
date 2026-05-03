import { NextRequest, NextResponse } from "next/server";
import {
  buildDuplicateContentTitle,
  getProjectContentActionAuditType,
  resolveProjectContentStatus,
  type ProjectContentAction,
  type ProjectContentType,
} from "@/lib/projects/content-actions";
import {
  assertProjectAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import { requireProjectGrowthCapacity } from "@/lib/billing/entitlement-guard";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { createProjectOperationAudit } from "@/lib/platform/core-ops";
import {
  getRewardTreasuryConfig,
  getRewardTreasuryPosture,
} from "@/lib/rewards/reward-treasury";
import type { AdminReward } from "@/types/entities/reward";
import type { DbCampaign, DbQuest, DbRaid, DbReward } from "@/types/database";

type ContentActionBody = {
  objectType?: ProjectContentType;
  objectId?: string;
  action?: ProjectContentAction;
};

type MutableContentAction = Exclude<ProjectContentAction, "duplicate">;
type SupportedRow = DbCampaign | DbQuest | DbRaid | DbReward;

const TABLE_BY_OBJECT_TYPE: Record<ProjectContentType, string> = {
  campaign: "campaigns",
  quest: "quests",
  raid: "raids",
  reward: "rewards",
};

function isMutableAction(action: ProjectContentAction): action is MutableContentAction {
  return action !== "duplicate";
}

function isSupportedContentType(value: string): value is ProjectContentType {
  return value === "campaign" || value === "quest" || value === "raid" || value === "reward";
}

function isSupportedContentAction(value: string): value is ProjectContentAction {
  return (
    value === "duplicate" ||
    value === "archive" ||
    value === "publish" ||
    value === "pause" ||
    value === "resume"
  );
}

function normalizeProjectId(row: SupportedRow) {
  if ("project_id" in row && typeof row.project_id === "string") {
    return row.project_id.trim();
  }

  return "";
}

function buildDuplicateSlug(slug: string | null | undefined) {
  if (!slug?.trim()) {
    return null;
  }

  const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${normalizedSlug}-copy-${Date.now().toString(36).slice(-5)}`;
}

function buildDuplicatedRecord(
  objectType: ProjectContentType,
  row: SupportedRow
): Record<string, unknown> {
  if (objectType === "campaign") {
    const campaign = row as DbCampaign;
    return {
      project_id: campaign.project_id,
      title: buildDuplicateContentTitle(campaign.title),
      slug: buildDuplicateSlug(campaign.slug),
      short_description: campaign.short_description,
      long_description: campaign.long_description,
      banner_url: campaign.banner_url,
      thumbnail_url: campaign.thumbnail_url,
      campaign_type: campaign.campaign_type,
      campaign_mode: campaign.campaign_mode ?? "offchain",
      reward_type: campaign.reward_type ?? "campaign_pool",
      reward_pool_amount: campaign.reward_pool_amount ?? 0,
      min_xp_required: campaign.min_xp_required ?? 0,
      activity_threshold: campaign.activity_threshold ?? 0,
      lock_days: campaign.lock_days ?? 0,
      xp_budget: campaign.xp_budget,
      participants: 0,
      completion_rate: 0,
      visibility: campaign.visibility,
      featured: false,
      starts_at: null,
      ends_at: null,
      status: "draft",
    };
  }

  if (objectType === "quest") {
    const quest = row as DbQuest;
    return {
      project_id: quest.project_id,
      campaign_id: quest.campaign_id,
      title: buildDuplicateContentTitle(quest.title),
      description: quest.description,
      short_description: quest.short_description,
      type: quest.type,
      quest_type: quest.quest_type,
      platform: quest.platform,
      xp: quest.xp,
      action_label: quest.action_label,
      action_url: quest.action_url,
      proof_required: quest.proof_required,
      proof_type: quest.proof_type,
      auto_approve: quest.auto_approve,
      verification_type: quest.verification_type,
      verification_provider: quest.verification_provider ?? "custom",
      completion_mode: quest.completion_mode ?? "manual_review",
      verification_config: quest.verification_config ?? {},
      is_repeatable: quest.is_repeatable,
      cooldown_seconds: quest.cooldown_seconds,
      max_completions_per_user: quest.max_completions_per_user,
      sort_order: quest.sort_order ?? 0,
      starts_at: null,
      ends_at: null,
      status: "draft",
    };
  }

  if (objectType === "raid") {
    const raid = row as DbRaid;
    return {
      project_id: raid.project_id,
      campaign_id: raid.campaign_id,
      title: buildDuplicateContentTitle(raid.title),
      short_description: raid.short_description,
      community: raid.community,
      target: raid.target,
      banner: raid.banner,
      reward_xp: raid.reward_xp,
      participants: 0,
      progress: 0,
      timer: raid.timer,
      platform: raid.platform,
      target_url: raid.target_url,
      target_post_id: raid.target_post_id,
      target_account_handle: raid.target_account_handle,
      verification_type: raid.verification_type,
      verification_config: raid.verification_config ?? {},
      instructions: raid.instructions ?? [],
      starts_at: null,
      ends_at: null,
      status: "draft",
    };
  }

  const reward = row as DbReward;
  return {
    project_id: reward.project_id,
    campaign_id: reward.campaign_id,
    title: buildDuplicateContentTitle(reward.title),
    description: reward.description,
    type: reward.type,
    reward_type: reward.reward_type,
    rarity: reward.rarity,
    cost: reward.cost,
    claimable: reward.claimable,
    visible: reward.visible,
    icon: reward.icon,
    image_url: reward.image_url,
    stock: reward.stock,
    unlimited_stock: reward.unlimited_stock,
    claim_method: reward.claim_method,
    delivery_config: reward.delivery_config ?? {},
    status: "draft",
  };
}

function buildActionSummary(params: {
  objectType: ProjectContentType;
  action: ProjectContentAction;
  title: string;
  nextStatus?: string;
}) {
  const label = params.objectType;
  if (params.action === "duplicate") {
    return `Duplicated ${label} into a new draft copy from ${params.title}.`;
  }

  if (params.action === "archive") {
    return `Archived ${label} ${params.title} into ${params.nextStatus}.`;
  }

  return `${params.action[0].toUpperCase()}${params.action.slice(1)}d ${label} ${params.title} into ${params.nextStatus}.`;
}

async function enforceProjectGrowthAction(params: {
  projectId: string;
  objectId: string;
  objectType: ProjectContentType;
  action: MutableContentAction;
  previousStatus: string | null | undefined;
}) {
  if (
    (params.action !== "publish" && params.action !== "resume") ||
    params.previousStatus === "active"
  ) {
    return;
  }

  if (params.objectType === "campaign") {
    await requireProjectGrowthCapacity({
      projectId: params.projectId,
      usageKey: "campaigns",
      growthAction: "publish_campaign",
      returnTo: `/campaigns/${params.objectId}`,
    });
    return;
  }

  if (params.objectType === "quest") {
    await requireProjectGrowthCapacity({
      projectId: params.projectId,
      usageKey: "quests",
      growthAction: "activate_quest",
      returnTo: `/quests/${params.objectId}`,
    });
    return;
  }

  if (params.objectType === "raid") {
    await requireProjectGrowthCapacity({
      projectId: params.projectId,
      usageKey: "raids",
      growthAction: "activate_raid",
      returnTo: `/raids/${params.objectId}`,
    });
  }
}

function assertRewardCanGoLive(row: DbReward) {
  const treasury = getRewardTreasuryConfig(
    row.delivery_config ? JSON.stringify(row.delivery_config) : "",
    {
      rewardType: row.reward_type as AdminReward["rewardType"],
      claimable: Boolean(row.claimable),
    }
  );
  const posture = getRewardTreasuryPosture(
    treasury,
    row.reward_type as AdminReward["rewardType"],
    Boolean(row.claimable)
  );

  if (!posture.ready) {
    throw new Error(
      `Reward funding is not launch-ready yet: ${posture.label}. ${posture.nextAction}`
    );
  }
}

async function loadSourceRow(
  objectType: ProjectContentType,
  objectId: string
): Promise<SupportedRow | null> {
  const supabase = getServiceSupabaseClient();
  const table = TABLE_BY_OBJECT_TYPE[objectType];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", objectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || `Failed to load ${objectType}.`);
  }

  return (data as SupportedRow | null) ?? null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim() ?? "";
    const access = await assertProjectAccess(projectId);
    const body = (await request.json().catch(() => null)) as ContentActionBody | null;

    if (
      !body ||
      !body.objectType ||
      !body.objectId ||
      !body.action ||
      !isSupportedContentType(body.objectType) ||
      !isSupportedContentAction(body.action)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid content action payload." },
        { status: 400 }
      );
    }

    const objectId = body.objectId.trim();
    if (!objectId) {
      return NextResponse.json(
        { ok: false, error: "Missing object id." },
        { status: 400 }
      );
    }

    const sourceRow = await loadSourceRow(body.objectType, objectId);
    if (!sourceRow || normalizeProjectId(sourceRow) !== access.projectId) {
      return NextResponse.json(
        { ok: false, error: "Content object not found in this project." },
        { status: 404 }
      );
    }

    const supabase = getServiceSupabaseClient();
    const table = TABLE_BY_OBJECT_TYPE[body.objectType];

    if (body.action === "duplicate") {
      const duplicatePayload = buildDuplicatedRecord(body.objectType, sourceRow);
      const { data: duplicatedRow, error: duplicateError } = await supabase
        .from(table)
        .insert({
          ...duplicatePayload,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (duplicateError || !duplicatedRow) {
        throw new Error(duplicateError?.message || `Failed to duplicate ${body.objectType}.`);
      }

      const summary = buildActionSummary({
        objectType: body.objectType,
        action: body.action,
        title: "title" in sourceRow ? String(sourceRow.title) : body.objectType,
      });

      await Promise.all([
        createProjectOperationAudit({
          projectId: access.projectId,
          objectType: body.objectType,
          objectId,
          actionType: "updated",
          actorAuthUserId: access.authUserId,
          actorRole: access.membershipRole,
          metadata: {
            summary,
            action: "duplicate",
            duplicatedIntoId: (duplicatedRow as { id: string }).id,
          },
        }),
        createProjectOperationAudit({
          projectId: access.projectId,
          objectType: body.objectType,
          objectId: (duplicatedRow as { id: string }).id,
          actionType: "created",
          actorAuthUserId: access.authUserId,
          actorRole: access.membershipRole,
          metadata: {
            summary,
            action: "duplicate",
            duplicatedFromId: objectId,
          },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        objectType: body.objectType,
        action: body.action,
        sourceId: objectId,
        targetId: (duplicatedRow as { id: string }).id,
        record: duplicatedRow,
      });
    }

    const nextStatus = resolveProjectContentStatus(body.objectType, body.action);
    if (body.objectType === "reward" && nextStatus === "active") {
      assertRewardCanGoLive(sourceRow as DbReward);
    }

    await enforceProjectGrowthAction({
      projectId: access.projectId,
      objectId,
      objectType: body.objectType,
      action: body.action,
      previousStatus: "status" in sourceRow ? sourceRow.status : null,
    });

    const { data: updatedRow, error: updateError } = await supabase
      .from(table)
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", objectId)
      .select("*")
      .single();

    if (updateError?.message?.toLowerCase().includes("billing limit reached")) {
      await enforceProjectGrowthAction({
        projectId: access.projectId,
        objectId,
        objectType: body.objectType,
        action: body.action,
        previousStatus: "status" in sourceRow ? sourceRow.status : null,
      });
    }

    if (updateError || !updatedRow) {
      throw new Error(updateError?.message || `Failed to ${body.action} ${body.objectType}.`);
    }

    const summary = buildActionSummary({
      objectType: body.objectType,
      action: body.action,
      title: "title" in sourceRow ? String(sourceRow.title) : body.objectType,
      nextStatus,
    });

    await createProjectOperationAudit({
      projectId: access.projectId,
      objectType: body.objectType,
      objectId,
      actionType: getProjectContentActionAuditType(body.action),
      actorAuthUserId: access.authUserId,
      actorRole: access.membershipRole,
      metadata: {
        summary,
        action: body.action,
        previousStatus: "status" in sourceRow ? sourceRow.status : null,
        nextStatus,
      },
    });

    return NextResponse.json({
      ok: true,
      objectType: body.objectType,
      action: body.action,
      sourceId: objectId,
      targetId: objectId,
      record: updatedRow,
    });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Failed to run project content action."
    );
  }
}
