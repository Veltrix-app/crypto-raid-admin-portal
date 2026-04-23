"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";
import { AdminRaid } from "@/types/entities/raid";
import { AdminQuest } from "@/types/entities/quest";
import { AdminReward } from "@/types/entities/reward";
import { AdminSubmission } from "@/types/entities/submission";
import { AdminTeamMember } from "@/types/entities/team-member";
import { AdminBillingPlan } from "@/types/entities/billing-plan";
import { AdminClaim } from "@/types/entities/claim";
import { AdminOnboardingRequest } from "@/types/entities/onboarding-request";
import { AdminProjectBuilderTemplate } from "@/types/entities/project-builder-template";
import { AdminProjectCampaignTemplate } from "@/types/entities/project-campaign-template";
import { AdminReviewFlag } from "@/types/entities/review-flag";
import { AdminUser } from "@/types/entities/user";
import { AdminAuditLog } from "@/types/entities/audit-log";
import { resolveQuestIntegration } from "@/lib/quest-integration";
import {
  type ProjectContentAction,
  type ProjectContentType,
} from "@/lib/projects/content-actions";
import { readBillingAwareJsonResponse } from "@/lib/billing/entitlement-blocks";
import {
  DbAuditLog,
  DbBillingPlan,
  DbCampaign,
  DbClaim,
  DbOnboardingRequest,
  DbProjectBuilderTemplate,
  DbProjectCampaignTemplate,
  DbProject,
  DbQuest,
  DbRaid,
  DbReward,
  DbReviewFlag,
  DbSubmission,
  DbTeamMember,
  DbUserGlobalReputation,
  DbUserProfile,
  DbUserProjectReputation,
} from "@/types/database";

type AdminPortalState = {
  hydrated: boolean;
  loading: boolean;
  scopedProjectId: string | null;

  projects: AdminProject[];
  campaigns: AdminCampaign[];
  raids: AdminRaid[];
  quests: AdminQuest[];
  rewards: AdminReward[];
  submissions: AdminSubmission[];
  claims: AdminClaim[];
  users: AdminUser[];
  reviewFlags: AdminReviewFlag[];
  onboardingRequests: AdminOnboardingRequest[];
  teamMembers: AdminTeamMember[];
  billingPlans: AdminBillingPlan[];
  projectBuilderTemplates: AdminProjectBuilderTemplate[];
  projectCampaignTemplates: AdminProjectCampaignTemplate[];

  loadAll: () => Promise<void>;

  createProject: (input: Omit<AdminProject, "id">) => Promise<string>;
  updateProject: (id: string, input: Omit<AdminProject, "id">) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => AdminProject | undefined;

  createCampaign: (input: Omit<AdminCampaign, "id">) => Promise<string>;
  updateCampaign: (id: string, input: Omit<AdminCampaign, "id">) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaignById: (id: string) => AdminCampaign | undefined;

  createRaid: (input: Omit<AdminRaid, "id">) => Promise<string>;
  updateRaid: (id: string, input: Omit<AdminRaid, "id">) => Promise<void>;
  deleteRaid: (id: string) => Promise<void>;
  getRaidById: (id: string) => AdminRaid | undefined;

  createQuest: (input: Omit<AdminQuest, "id">) => Promise<string>;
  updateQuest: (id: string, input: Omit<AdminQuest, "id">) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  getQuestById: (id: string) => AdminQuest | undefined;

  createReward: (input: Omit<AdminReward, "id">) => Promise<string>;
  updateReward: (id: string, input: Omit<AdminReward, "id">) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  getRewardById: (id: string) => AdminReward | undefined;
  runProjectContentAction: (input: {
    projectId: string;
    objectType: ProjectContentType;
    objectId: string;
    action: ProjectContentAction;
  }) => Promise<{
    objectType: ProjectContentType;
    action: ProjectContentAction;
    sourceId: string;
    targetId: string;
  }>;

  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string) => Promise<void>;
  reviewSubmission: (
    id: string,
    status: AdminSubmission["status"],
    reviewNotes?: string
  ) => Promise<void>;

  updateClaimStatus: (
    id: string,
    status: AdminClaim["status"]
  ) => Promise<void>;
  reviewClaim: (
    id: string,
    status: AdminClaim["status"],
    reviewNotes?: string
  ) => Promise<void>;
  updateReviewFlagStatus: (
    id: string,
    status: AdminReviewFlag["status"]
  ) => Promise<void>;
  applyTrustAction: (input: {
    authUserId: string;
    action: "watch_wallet" | "clear_watch" | "flag_user" | "restore_user";
    projectId?: string;
    reviewFlagId?: string;
    reason?: string;
  }) => Promise<void>;
  getClaimById: (id: string) => AdminClaim | undefined;
  fetchAuditTrail: (sourceTable: string, sourceId: string) => Promise<AdminAuditLog[]>;

  createOnboardingRequest: (
    input: Omit<AdminOnboardingRequest, "id" | "requestedByAuthUserId" | "status" | "reviewNotes" | "reviewedByAuthUserId" | "reviewedAt" | "approvedProjectId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  approveOnboardingRequest: (id: string) => Promise<string>;
  rejectOnboardingRequest: (id: string, notes?: string) => Promise<void>;

  inviteTeamMember: (input: Omit<AdminTeamMember, "id">) => Promise<void>;
  updateTeamMember: (
    id: string,
    input: Pick<AdminTeamMember, "role" | "status">
  ) => Promise<void>;
  createProjectCampaignTemplate: (
    input: Omit<AdminProjectCampaignTemplate, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  deleteProjectCampaignTemplate: (id: string) => Promise<void>;
};

type DbUserProfileLite = {
  auth_user_id: string | null;
  username: string;
  avatar_url?: string;
};

type ProjectContentActionResponse = {
  ok: true;
  objectType: ProjectContentType;
  action: ProjectContentAction;
  sourceId: string;
  targetId: string;
  record: DbCampaign | DbQuest | DbRaid | DbReward;
};

async function dispatchCommunityPush(contentType: "campaign" | "quest" | "raid" | "reward", contentId: string) {
  try {
    const response = await fetch("/api/community-push/dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType,
        contentId,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || "Failed to dispatch community push.");
    }
  } catch (error) {
    console.error("[community-push] dispatch failed", {
      contentType,
      contentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function isCampaignDispatchEligible(campaign: Pick<AdminCampaign, "status" | "visibility">) {
  return campaign.status === "active" && campaign.visibility === "public";
}

function isQuestDispatchEligible(quest: Pick<AdminQuest, "status">) {
  return quest.status === "active";
}

function isRaidDispatchEligible(raid: Pick<AdminRaid, "status">) {
  return raid.status === "active";
}

function isRewardDispatchEligible(reward: Pick<AdminReward, "status" | "visible">) {
  return reward.status === "active" && reward.visible;
}

function mapProject(row: DbProject): AdminProject {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? "",

    chain: row.chain,
    category: row.category ?? "",

    status: row.status as AdminProject["status"],
    onboardingStatus: row.onboarding_status as AdminProject["onboardingStatus"],

    description: row.description,
    longDescription: row.long_description ?? "",

    members: row.members,
    campaigns: row.campaigns,

    logo: row.logo,
    bannerUrl: row.banner_url ?? "",

    website: row.website ?? "",
    xUrl: row.x_url ?? "",
    telegramUrl: row.telegram_url ?? "",
    discordUrl: row.discord_url ?? "",
    docsUrl: row.docs_url ?? "",
    waitlistUrl: row.waitlist_url ?? "",
    launchPostUrl: row.launch_post_url ?? "",
    tokenContractAddress: row.token_contract_address ?? "",
    nftContractAddress: row.nft_contract_address ?? "",
    primaryWallet: row.primary_wallet ?? "",
    brandAccent: row.brand_accent ?? "",
    brandMood: row.brand_mood ?? "",

    contactEmail: row.contact_email ?? "",

    isFeatured: row.is_featured ?? false,
    isPublic: row.is_public ?? true,
  };
}

function mapCampaign(row: DbCampaign): AdminCampaign {
  return {
    id: row.id,
    projectId: row.project_id,

    title: row.title,
    slug: row.slug ?? "",

    shortDescription: row.short_description ?? "",
    longDescription: row.long_description ?? "",

    bannerUrl: row.banner_url ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",

    campaignType: row.campaign_type as AdminCampaign["campaignType"],
    campaignMode: (row.campaign_mode as AdminCampaign["campaignMode"]) ?? "offchain",
    rewardType: (row.reward_type as AdminCampaign["rewardType"]) ?? "campaign_pool",
    rewardPoolAmount: row.reward_pool_amount ?? 0,
    minXpRequired: row.min_xp_required ?? 0,
    activityThreshold: row.activity_threshold ?? 0,
    lockDays: row.lock_days ?? 0,

    xpBudget: row.xp_budget,
    participants: row.participants,
    completionRate: row.completion_rate,

    visibility: row.visibility as AdminCampaign["visibility"],
    featured: row.featured ?? false,

    startsAt: row.starts_at ?? "",
    endsAt: row.ends_at ?? "",

    status: row.status as AdminCampaign["status"],
  };
}

function mapRaid(row: DbRaid): AdminRaid {
  return {
    id: row.id,

    projectId: row.project_id ?? "",
    campaignId: row.campaign_id,

    title: row.title,
    shortDescription: row.short_description ?? "",
    community: row.community ?? "",
    target: row.target ?? "",

    banner: row.banner ?? "",

    rewardXp: row.reward_xp ?? 0,
    participants: row.participants,
    progress: row.progress ?? 0,
    timer: row.timer ?? "",

    platform: (row.platform ?? "x") as AdminRaid["platform"],

    targetUrl: row.target_url ?? "",
    targetPostId: row.target_post_id ?? "",
    targetAccountHandle: row.target_account_handle ?? "",

    verificationType: (row.verification_type ??
      "manual_confirm") as AdminRaid["verificationType"],

    verificationConfig: row.verification_config
      ? JSON.stringify(row.verification_config, null, 2)
      : "",

    instructions: row.instructions ?? [],

    startsAt: row.starts_at ?? "",
    endsAt: row.ends_at ?? "",

    status: row.status as AdminRaid["status"],
  };
}

function mapQuest(row: DbQuest): AdminQuest {
  const resolvedIntegration = resolveQuestIntegration({
    quest_type: row.quest_type,
    verification_type: row.verification_type,
    verification_provider: row.verification_provider ?? null,
    completion_mode: row.completion_mode ?? null,
    verification_config: row.verification_config,
  });

  return {
    id: row.id,

    projectId: row.project_id ?? "",
    campaignId: row.campaign_id,

    title: row.title,
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",

    type: row.type ?? "Task",
    questType: (row.quest_type ?? "custom") as AdminQuest["questType"],
    platform: (row.platform ?? "custom") as AdminQuest["platform"],

    xp: row.xp,
    actionLabel: row.action_label ?? "Open Task",
    actionUrl: row.action_url ?? "",

    proofRequired: row.proof_required ?? false,
    proofType: (row.proof_type ?? "none") as AdminQuest["proofType"],

    autoApprove: row.auto_approve ?? false,
    verificationType: (row.verification_type ??
      "manual_review") as AdminQuest["verificationType"],
    verificationProvider: (resolvedIntegration.verificationProvider ??
      "custom") as AdminQuest["verificationProvider"],
    completionMode: resolvedIntegration.completionMode as AdminQuest["completionMode"],

    verificationConfig: row.verification_config
      ? JSON.stringify(row.verification_config, null, 2)
      : "",

    isRepeatable: row.is_repeatable ?? false,
    cooldownSeconds: row.cooldown_seconds ?? undefined,
    maxCompletionsPerUser: row.max_completions_per_user ?? undefined,
    sortOrder: row.sort_order ?? 0,

    startsAt: row.starts_at ?? "",
    endsAt: row.ends_at ?? "",

    status: row.status as AdminQuest["status"],
  };
}

function mapReward(row: DbReward): AdminReward {
  return {
    id: row.id,

    projectId: row.project_id ?? "",
    campaignId: row.campaign_id ?? "",

    title: row.title,
    description: row.description ?? "",

    type: row.type ?? "Reward",
    rewardType: (row.reward_type ?? "custom") as AdminReward["rewardType"],

    rarity: row.rarity as AdminReward["rarity"],

    cost: row.cost,
    claimable: row.claimable ?? false,
    visible: row.visible ?? true,

    icon: row.icon ?? "",
    imageUrl: row.image_url ?? "",

    stock: row.stock ?? undefined,
    unlimitedStock: row.unlimited_stock ?? true,

    claimMethod: (row.claim_method ??
      "manual_fulfillment") as AdminReward["claimMethod"],

    deliveryConfig: row.delivery_config
      ? JSON.stringify(row.delivery_config, null, 2)
      : "",

    status: (row.status ?? "draft") as AdminReward["status"],
  };
}

function mapSubmission(params: {
  row: DbSubmission;
  questsById: Map<string, DbQuest>;
  campaignsById: Map<string, DbCampaign>;
  usernamesByAuthUserId: Map<string, string>;
}): AdminSubmission {
  const { row, questsById, campaignsById, usernamesByAuthUserId } = params;
  const quest = questsById.get(row.quest_id);
  const campaign = quest ? campaignsById.get(quest.campaign_id) : undefined;

  return {
    id: row.id,
    userId: row.auth_user_id ?? "",
    username:
      usernamesByAuthUserId.get(row.auth_user_id) ?? "Unknown User",
    questId: row.quest_id,
    questTitle: quest?.title ?? "Unknown Quest",
    campaignId: quest?.campaign_id ?? "",
    campaignTitle: campaign?.title ?? "Unknown Campaign",
    proof: row.proof_text,
    submittedAt: row.created_at,
    status: row.status,
    reviewNotes: row.review_notes ?? "",
    reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? "",
    reviewedAt: row.reviewed_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function mapClaim(params: {
  row: DbClaim;
  rewardsById: Map<string, DbReward>;
  campaignsById: Map<string, DbCampaign>;
  projectsById: Map<string, DbProject>;
  usernamesByAuthUserId: Map<string, string>;
}): AdminClaim {
  const { row, rewardsById, campaignsById, projectsById, usernamesByAuthUserId } = params;
  const reward = row.reward_id ? rewardsById.get(row.reward_id) : undefined;
  const deliveryPayload =
    row.delivery_payload && typeof row.delivery_payload === "object"
      ? (row.delivery_payload as Record<string, any>)
      : null;
  const campaignId = row.campaign_id ?? reward?.campaign_id ?? "";
  const projectId =
    row.project_id ?? reward?.project_id ?? (campaignId ? campaignsById.get(campaignId)?.project_id ?? "" : "");
  const campaign = campaignId ? campaignsById.get(campaignId) : undefined;
  const project = projectId ? projectsById.get(projectId) : undefined;
  const distributionRewardAmount = Number(deliveryPayload?.rewardAmount ?? Number.NaN);
  const distributionRewardAsset =
    typeof deliveryPayload?.rewardAsset === "string" && deliveryPayload.rewardAsset.trim()
      ? deliveryPayload.rewardAsset
      : undefined;

  return {
    id: row.id,

      authUserId: row.auth_user_id ?? "",
      username:
        row.username ??
        (row.auth_user_id ? usernamesByAuthUserId.get(row.auth_user_id) : undefined) ??
        "Unknown User",

      rewardId: row.reward_id ?? "",
      rewardTitle:
        row.reward_title ??
        reward?.title ??
        (distributionRewardAsset ? `${campaign?.title ?? "Campaign"} payout` : "Unknown Reward"),
      rewardType: row.reward_id
        ? reward?.reward_type ?? reward?.type ?? undefined
        : distributionRewardAsset,
      rewardCost: row.reward_id
        ? reward?.cost ?? undefined
        : Number.isFinite(distributionRewardAmount)
          ? distributionRewardAmount
          : undefined,

      projectId: projectId || "",
      projectName: row.project_name ?? project?.name ?? "",

      campaignId: campaignId || "",
      campaignTitle: row.campaign_title ?? campaign?.title ?? "",

      claimMethod: row.claim_method ?? "manual_fulfillment",
      status: (row.status ?? "pending") as AdminClaim["status"],
      fulfillmentNotes: row.fulfillment_notes ?? "",
      deliveryPayload: deliveryPayload
        ? JSON.stringify(deliveryPayload, null, 2)
        : "",
      reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? "",
      reviewedAt: row.reviewed_at ?? "",
      updatedAt: row.updated_at ?? "",

      createdAt: row.created_at,
    };
}

function mapTeamMember(row: DbTeamMember): AdminTeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AdminTeamMember["role"],
    status: row.status as AdminTeamMember["status"],
    projectId: row.project_id ?? undefined,
    authUserId: row.auth_user_id ?? undefined,
    joinedAt: row.joined_at ?? undefined,
  };
}

function mapReviewFlag(params: {
  row: DbReviewFlag;
  usernamesByAuthUserId: Map<string, string>;
}): AdminReviewFlag {
  const { row, usernamesByAuthUserId } = params;

  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    projectId: row.project_id ?? undefined,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    flagType: row.flag_type,
    severity: (row.severity ?? "medium") as AdminReviewFlag["severity"],
    status: (row.status ?? "open") as AdminReviewFlag["status"],
    reason: row.reason ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    username: row.auth_user_id ? usernamesByAuthUserId.get(row.auth_user_id) ?? "Unknown User" : undefined,
    metadata: row.metadata ? JSON.stringify(row.metadata, null, 2) : "",
  };
}

function mapAuditLog(row: DbAuditLog): AdminAuditLog {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    projectId: row.project_id ?? undefined,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    action: row.action,
    summary: row.summary,
    metadata: row.metadata ? JSON.stringify(row.metadata, null, 2) : "",
    createdAt: row.created_at,
  };
}

async function writeAuditLog(input: {
  sourceTable: string;
  sourceId: string;
  projectId?: string;
  action: string;
  summary: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createClient();
  const authUserId = useAdminAuthStore.getState().authUserId;
  const { error } = await supabase.from("admin_audit_logs").insert({
    auth_user_id: authUserId,
    project_id: input.projectId ?? null,
    source_table: input.sourceTable,
    source_id: input.sourceId,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Audit log write skipped:", error.message);
  }
}

function mapBillingPlan(row: DbBillingPlan): AdminBillingPlan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: row.price_monthly,
    projectsLimit: row.projects_limit,
    campaignsLimit: row.campaigns_limit,
    questsLimit: row.quests_limit,
    raidsLimit: row.raids_limit,
    providersLimit: row.providers_limit,
    includedBillableSeats: row.included_billable_seats,
    sortOrder: row.sort_order,
    trialDays: row.trial_days,
    currency: row.currency,
    billingInterval: row.billing_interval,
    isPublic: row.is_public,
    isSelfServe: row.is_self_serve,
    isCheckoutEnabled: row.is_checkout_enabled,
    isFreeTier: row.is_free_tier,
    isEnterprise: row.is_enterprise,
    featureFlags: row.feature_flags,
    entitlementMetadata: row.entitlement_metadata,
    stripeProductId: row.stripe_product_id ?? undefined,
    stripeMonthlyPriceId: row.stripe_monthly_price_id ?? undefined,
    features: row.features,
    current: row.current,
  };
}

function mapProjectCampaignTemplate(
  row: DbProjectCampaignTemplate
): AdminProjectCampaignTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description ?? "",
    baseTemplateId: row.base_template_id as AdminProjectCampaignTemplate["baseTemplateId"],
    configuration: row.configuration
      ? JSON.stringify(row.configuration, null, 2)
      : "{}",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectBuilderTemplate(
  row: DbProjectBuilderTemplate
): AdminProjectBuilderTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    templateKind: row.template_kind as AdminProjectBuilderTemplate["templateKind"],
    name: row.name,
    description: row.description ?? "",
    baseTemplateId: row.base_template_id ?? undefined,
    legacyCampaignTemplateId: row.legacy_campaign_template_id ?? undefined,
    configuration: row.configuration
      ? JSON.stringify(row.configuration, null, 2)
      : "{}",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectBuilderTemplateToCampaignTemplate(
  template: AdminProjectBuilderTemplate
): AdminProjectCampaignTemplate | null {
  if (template.templateKind !== "campaign" || !template.baseTemplateId) {
    return null;
  }

  return {
    id: template.legacyCampaignTemplateId ?? template.id,
    projectId: template.projectId,
    name: template.name,
    description: template.description ?? "",
    baseTemplateId: template.baseTemplateId as AdminProjectCampaignTemplate["baseTemplateId"],
    configuration: template.configuration,
    legacyCampaignTemplateId: template.legacyCampaignTemplateId,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function projectCampaignTemplateToBuilderTemplate(
  template: AdminProjectCampaignTemplate
): AdminProjectBuilderTemplate {
  return {
    id: template.id,
    projectId: template.projectId,
    templateKind: "campaign",
    name: template.name,
    description: template.description ?? "",
    baseTemplateId: template.baseTemplateId,
    configuration: template.configuration,
    legacyCampaignTemplateId: template.legacyCampaignTemplateId ?? template.id,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function mapOnboardingRequest(row: DbOnboardingRequest): AdminOnboardingRequest {
  return {
    id: row.id,
    requestedByAuthUserId: row.requested_by_auth_user_id ?? "",
    projectName: row.project_name,
    chain: row.chain,
    category: row.category ?? "",
    website: row.website ?? "",
    contactEmail: row.contact_email ?? "",
    shortDescription: row.short_description ?? "",
    longDescription: row.long_description ?? "",
    logo: row.logo ?? "🚀",
    bannerUrl: row.banner_url ?? "",
    xUrl: row.x_url ?? "",
    telegramUrl: row.telegram_url ?? "",
    discordUrl: row.discord_url ?? "",
    requestedPlanId: row.requested_plan_id ?? "",
    status: (row.status ?? "submitted") as AdminOnboardingRequest["status"],
    reviewNotes: row.review_notes ?? "",
    reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? "",
    reviewedAt: row.reviewed_at ?? "",
    approvedProjectId: row.approved_project_id ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAdminUser(params: {
  profile: DbUserProfile;
  globalReputation?: DbUserGlobalReputation;
  projectReputation?: DbUserProjectReputation;
}): AdminUser {
  const { profile, globalReputation, projectReputation } = params;
  const sybilScore = globalReputation?.sybil_score ?? 0;
  const statusSource = globalReputation?.status ?? profile.status ?? "active";
  const status: AdminUser["status"] =
    statusSource === "flagged" || sybilScore >= 70 ? "flagged" : "active";

  return {
    id: profile.id,
    authUserId: profile.auth_user_id ?? undefined,
    username: profile.username,
    xp: projectReputation?.xp ?? globalReputation?.total_xp ?? profile.xp ?? 0,
    level: projectReputation?.level ?? globalReputation?.level ?? profile.level ?? 1,
    streak: projectReputation?.streak ?? globalReputation?.streak ?? profile.streak ?? 0,
    trustScore: projectReputation?.trust_score ?? globalReputation?.trust_score ?? 50,
    sybilScore,
    contributionTier:
      projectReputation?.contribution_tier ??
      globalReputation?.contribution_tier ??
      "explorer",
    reputationRank: globalReputation?.reputation_rank ?? 0,
    questsCompleted:
      projectReputation?.quests_completed ?? globalReputation?.quests_completed ?? 0,
    raidsCompleted:
      projectReputation?.raids_completed ?? globalReputation?.raids_completed ?? 0,
    rewardsClaimed:
      projectReputation?.rewards_claimed ?? globalReputation?.rewards_claimed ?? 0,
    title: profile.title ?? "Raider",
    avatarUrl: profile.avatar_url ?? "",
    status,
  };
}

export const useAdminPortalStore = create<AdminPortalState>((set, get) => ({
  hydrated: false,
  loading: false,
  scopedProjectId: null,

  projects: [],
  campaigns: [],
  raids: [],
  quests: [],
  rewards: [],
  submissions: [],
  claims: [],
  users: [],
  reviewFlags: [],
  onboardingRequests: [],
  teamMembers: [],
  billingPlans: [],
  projectBuilderTemplates: [],
  projectCampaignTemplates: [],

  loadAll: async () => {
    const supabase = createClient();
    set({ loading: true });
    const { activeProjectId, role } = useAdminAuthStore.getState();
    const isSuperAdmin = role === "super_admin";

    const projectsQuery = supabase.from("projects").select("*").order("created_at", { ascending: false });
    const campaignsQuery = supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    const raidsQuery = supabase.from("raids").select("*").order("created_at", { ascending: false });
    const questsQuery = supabase.from("quests").select("*").order("created_at", { ascending: false });
    const rewardsQuery = supabase.from("rewards").select("*").order("created_at", { ascending: false });
    const teamQuery = supabase.from("team_members").select("*").order("created_at", { ascending: false });

    const scopedProjectsQuery =
      !isSuperAdmin && activeProjectId ? projectsQuery.eq("id", activeProjectId) : projectsQuery;
    const scopedCampaignsQuery =
      !isSuperAdmin && activeProjectId ? campaignsQuery.eq("project_id", activeProjectId) : campaignsQuery;
    const scopedRaidsQuery =
      !isSuperAdmin && activeProjectId ? raidsQuery.eq("project_id", activeProjectId) : raidsQuery;
    const scopedQuestsQuery =
      !isSuperAdmin && activeProjectId ? questsQuery.eq("project_id", activeProjectId) : questsQuery;
    const scopedRewardsQuery =
      !isSuperAdmin && activeProjectId ? rewardsQuery.eq("project_id", activeProjectId) : rewardsQuery;
    const scopedTeamQuery =
      !isSuperAdmin && activeProjectId ? teamQuery.eq("project_id", activeProjectId) : teamQuery;
    const scopedReviewFlagsQuery =
      !isSuperAdmin && activeProjectId
        ? supabase
            .from("review_flags")
            .select("*")
            .eq("project_id", activeProjectId)
            .order("created_at", { ascending: false })
        : supabase.from("review_flags").select("*").order("created_at", { ascending: false });
    const scopedProjectTemplatesQuery =
      !isSuperAdmin && activeProjectId
        ? supabase
            .from("project_campaign_templates")
            .select("*")
            .eq("project_id", activeProjectId)
            .order("created_at", { ascending: false })
        : supabase
            .from("project_campaign_templates")
            .select("*")
            .order("created_at", { ascending: false });
    const scopedProjectBuilderTemplatesQuery =
      !isSuperAdmin && activeProjectId
        ? supabase
            .from("project_builder_templates")
            .select("*")
            .eq("project_id", activeProjectId)
            .order("created_at", { ascending: false })
        : supabase
            .from("project_builder_templates")
            .select("*")
            .order("created_at", { ascending: false });
    const scopedProjectReputationQuery =
      activeProjectId
        ? supabase
            .from("user_project_reputation")
            .select("*")
            .eq("project_id", activeProjectId)
        : Promise.resolve({ data: [], error: null } as any);

    const [
      projectsRes,
      campaignsRes,
      raidsRes,
      questsRes,
      rewardsRes,
      submissionsRes,
      profilesRes,
      claimsRes,
      onboardingRequestsRes,
      teamRes,
      billingRes,
      globalReputationRes,
      projectReputationRes,
      reviewFlagsRes,
      projectBuilderTemplatesRes,
      projectTemplatesRes,
    ] = await Promise.all([
      scopedProjectsQuery,
      scopedCampaignsQuery,
      scopedRaidsQuery,
      scopedQuestsQuery,
      scopedRewardsQuery,
      supabase.from("quest_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_profiles").select("*"),
      supabase.from("reward_claims").select("*").order("created_at", { ascending: false }),
      supabase.from("project_onboarding_requests").select("*").order("created_at", { ascending: false }),
      scopedTeamQuery,
      supabase.from("billing_plans").select("*"),
      supabase.from("user_global_reputation").select("*"),
      scopedProjectReputationQuery,
      scopedReviewFlagsQuery,
      scopedProjectBuilderTemplatesQuery,
      scopedProjectTemplatesQuery,
    ]);

    const campaignRows = (campaignsRes.data ?? []) as DbCampaign[];
    const questRows = (questsRes.data ?? []) as DbQuest[];
    const profileRows = (profilesRes.data ?? []) as DbUserProfile[];
    const globalReputationRows = globalReputationRes.error
      ? []
      : ((globalReputationRes.data ?? []) as DbUserGlobalReputation[]);
    const projectReputationRows = projectReputationRes?.error
      ? []
      : ((projectReputationRes?.data ?? []) as DbUserProjectReputation[]);

    const questsById = new Map(questRows.map((row) => [row.id, row]));
    const campaignsById = new Map(campaignRows.map((row) => [row.id, row]));
    const rewardsById = new Map(
      ((rewardsRes.data ?? []) as DbReward[]).map((row) => [row.id, row])
    );
    const projectsById = new Map(
      ((projectsRes.data ?? []) as DbProject[]).map((row) => [row.id, row])
    );
    const usernamesByAuthUserId = new Map<string, string>(
      profileRows
        .filter((row): row is DbUserProfile & { auth_user_id: string } => !!row.auth_user_id)
        .map((row) => [row.auth_user_id, row.username])
    );
    const globalReputationByAuthUserId = new Map(
      globalReputationRows.map((row) => [row.auth_user_id, row])
    );
    const projectReputationByAuthUserId = new Map(
      projectReputationRows.map((row) => [row.auth_user_id, row])
    );
    const legacyCampaignTemplates = projectTemplatesRes.error
      ? []
      : ((projectTemplatesRes.data ?? []) as DbProjectCampaignTemplate[]).map(
          mapProjectCampaignTemplate
        );
    const builderTemplates = projectBuilderTemplatesRes.error
      ? []
      : ((projectBuilderTemplatesRes.data ?? []) as DbProjectBuilderTemplate[]).map(
          mapProjectBuilderTemplate
        );
    const bridgedLegacyBuilderTemplates = legacyCampaignTemplates
      .filter(
        (template) =>
          !builderTemplates.some(
            (builder) =>
              builder.id === template.id ||
              builder.legacyCampaignTemplateId === template.id
          )
      )
      .map(projectCampaignTemplateToBuilderTemplate);
    const allBuilderTemplates = [...builderTemplates, ...bridgedLegacyBuilderTemplates];
    const builderCampaignTemplates = allBuilderTemplates
      .map(projectBuilderTemplateToCampaignTemplate)
      .filter((template): template is AdminProjectCampaignTemplate => Boolean(template));

    const questIds = new Set(questRows.map((row) => row.id));
    const filteredSubmissionRows = ((submissionsRes.data ?? []) as DbSubmission[]).filter(
      (row) => isSuperAdmin || questIds.has(row.quest_id)
    );

    set({
      hydrated: true,
      loading: false,
      scopedProjectId: activeProjectId,
      projects: (projectsRes.data ?? []).map(mapProject),
      campaigns: campaignRows.map(mapCampaign),
      raids: (raidsRes.data ?? []).map(mapRaid),
      quests: questRows.map(mapQuest),
      rewards: (rewardsRes.data ?? []).map(mapReward),
      submissions: filteredSubmissionRows.map((row) =>
        mapSubmission({
          row,
          questsById,
          campaignsById,
          usernamesByAuthUserId,
        })
      ),
      claims: ((claimsRes.data ?? []) as DbClaim[]).map((row) =>
        mapClaim({
          row,
          rewardsById,
          campaignsById,
          projectsById,
          usernamesByAuthUserId,
        })
      ),
      users: profileRows
        .filter((row): row is DbUserProfile & { auth_user_id: string } => !!row.auth_user_id)
        .map((profile) =>
          mapAdminUser({
            profile,
            globalReputation: globalReputationByAuthUserId.get(profile.auth_user_id),
            projectReputation: projectReputationByAuthUserId.get(profile.auth_user_id),
          })
        )
        .sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
          return a.username.localeCompare(b.username);
        }),
      reviewFlags: ((reviewFlagsRes.data ?? []) as DbReviewFlag[]).map((row) =>
        mapReviewFlag({
          row,
          usernamesByAuthUserId,
        })
      ),
      onboardingRequests: ((onboardingRequestsRes.data ?? []) as DbOnboardingRequest[]).map(
        mapOnboardingRequest
      ),
      teamMembers: (teamRes.data ?? []).map(mapTeamMember),
      billingPlans: (billingRes.data ?? []).map(mapBillingPlan),
      projectBuilderTemplates: allBuilderTemplates,
      projectCampaignTemplates:
        builderCampaignTemplates.length > 0 ? builderCampaignTemplates : legacyCampaignTemplates,
    });
  },

  createProject: async (input) => {
    const supabase = createClient();
    const payload = {
      name: input.name,
      slug: input.slug,

      chain: input.chain,
      category: input.category,

      status: input.status,
      onboarding_status: input.onboardingStatus,

      description: input.description,
      long_description: input.longDescription,

      members: input.members,
      campaigns: input.campaigns,

      logo: input.logo,
      banner_url: input.bannerUrl,

      website: input.website,
      x_url: input.xUrl,
      telegram_url: input.telegramUrl,
      discord_url: input.discordUrl,
      docs_url: input.docsUrl,
      waitlist_url: input.waitlistUrl,
      launch_post_url: input.launchPostUrl,
      token_contract_address: input.tokenContractAddress,
      nft_contract_address: input.nftContractAddress,
      primary_wallet: input.primaryWallet,
      brand_accent: input.brandAccent,
      brand_mood: input.brandMood,

      contact_email: input.contactEmail,

      is_featured: input.isFeatured,
      is_public: input.isPublic,
    };

    let { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("column")) {
      const {
        docs_url: _docsUrl,
        waitlist_url: _waitlistUrl,
        launch_post_url: _launchPostUrl,
        token_contract_address: _tokenContractAddress,
        nft_contract_address: _nftContractAddress,
        primary_wallet: _primaryWallet,
        brand_accent: _brandAccent,
        brand_mood: _brandMood,
        ...fallbackPayload
      } = payload;

      const fallback = await supabase
        .from("projects")
        .insert(fallbackPayload)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const mapped = mapProject(data as DbProject);
    set((state) => ({ projects: [mapped, ...state.projects] }));
    return mapped.id;
  },

  updateProject: async (id, input) => {
    const supabase = createClient();
    const payload = {
      name: input.name,
      slug: input.slug,

      chain: input.chain,
      category: input.category,

      status: input.status,
      onboarding_status: input.onboardingStatus,

      description: input.description,
      long_description: input.longDescription,

      members: input.members,
      campaigns: input.campaigns,

      logo: input.logo,
      banner_url: input.bannerUrl,

      website: input.website,
      x_url: input.xUrl,
      telegram_url: input.telegramUrl,
      discord_url: input.discordUrl,
      docs_url: input.docsUrl,
      waitlist_url: input.waitlistUrl,
      launch_post_url: input.launchPostUrl,
      token_contract_address: input.tokenContractAddress,
      nft_contract_address: input.nftContractAddress,
      primary_wallet: input.primaryWallet,
      brand_accent: input.brandAccent,
      brand_mood: input.brandMood,

      contact_email: input.contactEmail,

      is_featured: input.isFeatured,
      is_public: input.isPublic,
    };

    let { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("column")) {
      const {
        docs_url: _docsUrl,
        waitlist_url: _waitlistUrl,
        launch_post_url: _launchPostUrl,
        token_contract_address: _tokenContractAddress,
        nft_contract_address: _nftContractAddress,
        primary_wallet: _primaryWallet,
        brand_accent: _brandAccent,
        brand_mood: _brandMood,
        ...fallbackPayload
      } = payload;

      const fallback = await supabase
        .from("projects")
        .update(fallbackPayload)
        .eq("id", id)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const mapped = mapProject(data as DbProject);
    set((state) => ({
      projects: state.projects.map((item) => (item.id === id ? mapped : item)),
    }));
  },

  deleteProject: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;

    set((state) => ({
      projects: state.projects.filter((item) => item.id !== id),
      campaigns: state.campaigns.filter((item) => item.projectId !== id),
    }));
  },

  getProjectById: (id) => get().projects.find((item) => item.id === id),

  createCampaign: async (input) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        project_id: input.projectId,

        title: input.title,
        slug: input.slug,

        short_description: input.shortDescription,
        long_description: input.longDescription,

        banner_url: input.bannerUrl,
        thumbnail_url: input.thumbnailUrl,

        campaign_type: input.campaignType,
        campaign_mode: input.campaignMode ?? "offchain",
        reward_type: input.rewardType ?? "campaign_pool",
        reward_pool_amount: input.rewardPoolAmount ?? 0,
        min_xp_required: input.minXpRequired ?? 0,
        activity_threshold: input.activityThreshold ?? 0,
        lock_days: input.lockDays ?? 0,

        xp_budget: input.xpBudget,
        participants: input.participants,
        completion_rate: input.completionRate,

        visibility: input.visibility,
        featured: input.featured,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapCampaign(data as DbCampaign);
    set((state) => ({ campaigns: [mapped, ...state.campaigns] }));
    if (isCampaignDispatchEligible(mapped)) {
      await dispatchCommunityPush("campaign", mapped.id);
    }
    return mapped.id;
  },

  updateCampaign: async (id, input) => {
    const supabase = createClient();
    const previous = get().campaigns.find((item) => item.id === id);

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        project_id: input.projectId,

        title: input.title,
        slug: input.slug,

        short_description: input.shortDescription,
        long_description: input.longDescription,

        banner_url: input.bannerUrl,
        thumbnail_url: input.thumbnailUrl,

        campaign_type: input.campaignType,
        campaign_mode: input.campaignMode ?? "offchain",
        reward_type: input.rewardType ?? "campaign_pool",
        reward_pool_amount: input.rewardPoolAmount ?? 0,
        min_xp_required: input.minXpRequired ?? 0,
        activity_threshold: input.activityThreshold ?? 0,
        lock_days: input.lockDays ?? 0,

        xp_budget: input.xpBudget,
        participants: input.participants,
        completion_rate: input.completionRate,

        visibility: input.visibility,
        featured: input.featured,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const mapped = mapCampaign(data as DbCampaign);
    set((state) => ({
      campaigns: state.campaigns.map((item) => (item.id === id ? mapped : item)),
    }));
    if (isCampaignDispatchEligible(mapped) && !isCampaignDispatchEligible(previous ?? { status: "draft", visibility: "private" })) {
      await dispatchCommunityPush("campaign", mapped.id);
    }
  },

  deleteCampaign: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;

    set((state) => ({
      campaigns: state.campaigns.filter((item) => item.id !== id),
      raids: state.raids.filter((item) => item.campaignId !== id),
      quests: state.quests.filter((item) => item.campaignId !== id),
      submissions: state.submissions.filter((item) => item.campaignId !== id),
    }));
  },

  getCampaignById: (id) => get().campaigns.find((item) => item.id === id),

  createRaid: async (input) => {
    const supabase = createClient();

    let parsedVerificationConfig: Record<string, any> = {};
    if (input.verificationConfig?.trim()) {
      try {
        parsedVerificationConfig = JSON.parse(input.verificationConfig);
      } catch {
        throw new Error("Verification config must be valid JSON.");
      }
    }

    const { data, error } = await supabase
      .from("raids")
      .insert({
        project_id: input.projectId,
        campaign_id: input.campaignId,

        title: input.title,
        short_description: input.shortDescription,
        community: input.community,
        target: input.target,

        banner: input.banner,

        reward_xp: input.rewardXp,
        participants: input.participants,
        progress: input.progress,
        timer: input.timer,

        platform: input.platform,

        target_url: input.targetUrl,
        target_post_id: input.targetPostId,
        target_account_handle: input.targetAccountHandle,

        verification_type: input.verificationType,
        verification_config: parsedVerificationConfig,

        instructions: input.instructions,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapRaid(data as DbRaid);
    set((state) => ({ raids: [mapped, ...state.raids] }));
    if (isRaidDispatchEligible(mapped)) {
      await dispatchCommunityPush("raid", mapped.id);
    }
    return mapped.id;
  },

  updateRaid: async (id, input) => {
    const supabase = createClient();
    const previous = get().raids.find((item) => item.id === id);

    let parsedVerificationConfig: Record<string, any> = {};
    if (input.verificationConfig?.trim()) {
      try {
        parsedVerificationConfig = JSON.parse(input.verificationConfig);
      } catch {
        throw new Error("Verification config must be valid JSON.");
      }
    }

    const { data, error } = await supabase
      .from("raids")
      .update({
        project_id: input.projectId,
        campaign_id: input.campaignId,

        title: input.title,
        short_description: input.shortDescription,
        community: input.community,
        target: input.target,

        banner: input.banner,

        reward_xp: input.rewardXp,
        participants: input.participants,
        progress: input.progress,
        timer: input.timer,

        platform: input.platform,

        target_url: input.targetUrl,
        target_post_id: input.targetPostId,
        target_account_handle: input.targetAccountHandle,

        verification_type: input.verificationType,
        verification_config: parsedVerificationConfig,

        instructions: input.instructions,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const mapped = mapRaid(data as DbRaid);
    set((state) => ({
      raids: state.raids.map((item) => (item.id === id ? mapped : item)),
    }));
    if (isRaidDispatchEligible(mapped) && !isRaidDispatchEligible(previous ?? { status: "draft" })) {
      await dispatchCommunityPush("raid", mapped.id);
    }
  },

  deleteRaid: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("raids").delete().eq("id", id);
    if (error) throw error;

    set((state) => ({
      raids: state.raids.filter((item) => item.id !== id),
    }));
  },

  getRaidById: (id) => get().raids.find((item) => item.id === id),

  createQuest: async (input) => {
    const supabase = createClient();

    let parsedVerificationConfig: Record<string, any> = {};
    if (input.verificationConfig?.trim()) {
      try {
        parsedVerificationConfig = JSON.parse(input.verificationConfig);
      } catch {
        throw new Error("Verification config must be valid JSON.");
      }
    }

    const resolvedIntegration = resolveQuestIntegration({
      quest_type: input.questType,
      verification_type: input.verificationType,
      verification_provider: input.verificationProvider ?? null,
      completion_mode: input.completionMode ?? null,
      verification_config: parsedVerificationConfig,
    });

    const payload = {
      project_id: input.projectId,
      campaign_id: input.campaignId,

      title: input.title,
      description: input.description,
      short_description: input.shortDescription,

      type: input.type,
      quest_type: input.questType,
      platform: input.platform,

      xp: input.xp,
      action_label: input.actionLabel,
      action_url: input.actionUrl,

      proof_required: input.proofRequired,
      proof_type: input.proofType,

      auto_approve: input.autoApprove,
      verification_type: input.verificationType,
      verification_provider: resolvedIntegration.verificationProvider ?? "custom",
      completion_mode: resolvedIntegration.completionMode,
      verification_config: parsedVerificationConfig,

      is_repeatable: input.isRepeatable,
      cooldown_seconds: input.cooldownSeconds ?? null,
      max_completions_per_user: input.maxCompletionsPerUser ?? null,
      sort_order: input.sortOrder,

      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,

      status: input.status,
    };

    let { data, error } = await supabase
      .from("quests")
      .insert(payload)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("description")) {
      const { description: _description, ...fallbackPayload } = payload;
      const fallback = await supabase
        .from("quests")
        .insert({
          ...fallbackPayload,
          short_description: input.shortDescription || input.description,
        } as any)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const mapped = mapQuest(data as DbQuest);
    set((state) => ({ quests: [mapped, ...state.quests] }));
    if (isQuestDispatchEligible(mapped)) {
      await dispatchCommunityPush("quest", mapped.id);
    }
    return mapped.id;
  },

  updateQuest: async (id, input) => {
    const supabase = createClient();
    const previous = get().quests.find((item) => item.id === id);

    let parsedVerificationConfig: Record<string, any> = {};
    if (input.verificationConfig?.trim()) {
      try {
        parsedVerificationConfig = JSON.parse(input.verificationConfig);
      } catch {
        throw new Error("Verification config must be valid JSON.");
      }
    }

    const resolvedIntegration = resolveQuestIntegration({
      quest_type: input.questType,
      verification_type: input.verificationType,
      verification_provider: input.verificationProvider ?? null,
      completion_mode: input.completionMode ?? null,
      verification_config: parsedVerificationConfig,
    });

    const payload = {
      project_id: input.projectId,
      campaign_id: input.campaignId,

      title: input.title,
      description: input.description,
      short_description: input.shortDescription,

      type: input.type,
      quest_type: input.questType,
      platform: input.platform,

      xp: input.xp,
      action_label: input.actionLabel,
      action_url: input.actionUrl,

      proof_required: input.proofRequired,
      proof_type: input.proofType,

      auto_approve: input.autoApprove,
      verification_type: input.verificationType,
      verification_provider: resolvedIntegration.verificationProvider ?? "custom",
      completion_mode: resolvedIntegration.completionMode,
      verification_config: parsedVerificationConfig,

      is_repeatable: input.isRepeatable,
      cooldown_seconds: input.cooldownSeconds ?? null,
      max_completions_per_user: input.maxCompletionsPerUser ?? null,
      sort_order: input.sortOrder,

      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,

      status: input.status,
    };

    let { data, error } = await supabase
      .from("quests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("description")) {
      const { description: _description, ...fallbackPayload } = payload;
      const fallback = await supabase
        .from("quests")
        .update({
          ...fallbackPayload,
          short_description: input.shortDescription || input.description,
        } as any)
        .eq("id", id)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const mapped = mapQuest(data as DbQuest);
    set((state) => ({
      quests: state.quests.map((item) => (item.id === id ? mapped : item)),
    }));
    if (isQuestDispatchEligible(mapped) && !isQuestDispatchEligible(previous ?? { status: "draft" })) {
      await dispatchCommunityPush("quest", mapped.id);
    }
  },

  deleteQuest: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("quests").delete().eq("id", id);
    if (error) throw error;

    set((state) => ({
      quests: state.quests.filter((item) => item.id !== id),
      submissions: state.submissions.filter((item) => item.questId !== id),
    }));
  },

  getQuestById: (id) => get().quests.find((item) => item.id === id),

  createReward: async (input) => {
    const supabase = createClient();

    let parsedDeliveryConfig: Record<string, any> = {};
    if (input.deliveryConfig?.trim()) {
      try {
        parsedDeliveryConfig = JSON.parse(input.deliveryConfig);
      } catch {
        throw new Error("Delivery config must be valid JSON.");
      }
    }

    const { data, error } = await supabase
      .from("rewards")
      .insert({
        project_id: input.projectId,
        campaign_id: input.campaignId || null,

        title: input.title,
        description: input.description,

        type: input.type,
        reward_type: input.rewardType,

        rarity: input.rarity,
        cost: input.cost,

        claimable: input.claimable,
        visible: input.visible,

        icon: input.icon,
        image_url: input.imageUrl,

        stock: input.unlimitedStock ? null : input.stock ?? null,
        unlimited_stock: input.unlimitedStock,

        claim_method: input.claimMethod,
        delivery_config: parsedDeliveryConfig,

        status: input.status,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapReward(data as DbReward);
    set((state) => ({ rewards: [mapped, ...state.rewards] }));
    if (isRewardDispatchEligible(mapped)) {
      await dispatchCommunityPush("reward", mapped.id);
    }
    return mapped.id;
  },

  updateReward: async (id, input) => {
    const supabase = createClient();
    const previous = get().rewards.find((item) => item.id === id);

    let parsedDeliveryConfig: Record<string, any> = {};
    if (input.deliveryConfig?.trim()) {
      try {
        parsedDeliveryConfig = JSON.parse(input.deliveryConfig);
      } catch {
        throw new Error("Delivery config must be valid JSON.");
      }
    }

    const { data, error } = await supabase
      .from("rewards")
      .update({
        project_id: input.projectId,
        campaign_id: input.campaignId || null,

        title: input.title,
        description: input.description,

        type: input.type,
        reward_type: input.rewardType,

        rarity: input.rarity,
        cost: input.cost,

        claimable: input.claimable,
        visible: input.visible,

        icon: input.icon,
        image_url: input.imageUrl,

        stock: input.unlimitedStock ? null : input.stock ?? null,
        unlimited_stock: input.unlimitedStock,

        claim_method: input.claimMethod,
        delivery_config: parsedDeliveryConfig,

        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const mapped = mapReward(data as DbReward);
    set((state) => ({
      rewards: state.rewards.map((item) => (item.id === id ? mapped : item)),
    }));
    if (
      isRewardDispatchEligible(mapped) &&
      !isRewardDispatchEligible(previous ?? { status: "draft", visible: false })
    ) {
      await dispatchCommunityPush("reward", mapped.id);
    }
  },

  deleteReward: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("rewards").delete().eq("id", id);
    if (error) throw error;

    set((state) => ({
      rewards: state.rewards.filter((item) => item.id !== id),
    }));
  },

  getRewardById: (id) => get().rewards.find((item) => item.id === id),

  runProjectContentAction: async (input) => {
    const previousCampaign =
      input.objectType === "campaign"
        ? get().campaigns.find((item) => item.id === input.objectId)
        : undefined;
    const previousQuest =
      input.objectType === "quest"
        ? get().quests.find((item) => item.id === input.objectId)
        : undefined;
    const previousRaid =
      input.objectType === "raid"
        ? get().raids.find((item) => item.id === input.objectId)
        : undefined;
    const previousReward =
      input.objectType === "reward"
        ? get().rewards.find((item) => item.id === input.objectId)
        : undefined;

    const response = await fetch(`/api/projects/${input.projectId}/content-actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        objectType: input.objectType,
        objectId: input.objectId,
        action: input.action,
      }),
    });

    const payload = await readBillingAwareJsonResponse<ProjectContentActionResponse>(
      response,
      "Failed to run project content action."
    );

    if (payload.objectType === "campaign") {
      const mapped = mapCampaign(payload.record as DbCampaign);
      set((state) => ({
        campaigns:
          payload.action === "duplicate"
            ? [mapped, ...state.campaigns]
            : state.campaigns.map((item) =>
                item.id === payload.sourceId ? mapped : item
              ),
      }));

      if (
        payload.action !== "duplicate" &&
        isCampaignDispatchEligible(mapped) &&
        !isCampaignDispatchEligible(
          previousCampaign ?? { status: "draft", visibility: "private" }
        )
      ) {
        await dispatchCommunityPush("campaign", mapped.id);
      }
    }

    if (payload.objectType === "quest") {
      const mapped = mapQuest(payload.record as DbQuest);
      set((state) => ({
        quests:
          payload.action === "duplicate"
            ? [mapped, ...state.quests]
            : state.quests.map((item) =>
                item.id === payload.sourceId ? mapped : item
              ),
      }));

      if (
        payload.action !== "duplicate" &&
        isQuestDispatchEligible(mapped) &&
        !isQuestDispatchEligible(previousQuest ?? { status: "draft" })
      ) {
        await dispatchCommunityPush("quest", mapped.id);
      }
    }

    if (payload.objectType === "raid") {
      const mapped = mapRaid(payload.record as DbRaid);
      set((state) => ({
        raids:
          payload.action === "duplicate"
            ? [mapped, ...state.raids]
            : state.raids.map((item) =>
                item.id === payload.sourceId ? mapped : item
              ),
      }));

      if (
        payload.action !== "duplicate" &&
        isRaidDispatchEligible(mapped) &&
        !isRaidDispatchEligible(previousRaid ?? { status: "draft" })
      ) {
        await dispatchCommunityPush("raid", mapped.id);
      }
    }

    if (payload.objectType === "reward") {
      const mapped = mapReward(payload.record as DbReward);
      set((state) => ({
        rewards:
          payload.action === "duplicate"
            ? [mapped, ...state.rewards]
            : state.rewards.map((item) =>
                item.id === payload.sourceId ? mapped : item
              ),
      }));

      if (
        payload.action !== "duplicate" &&
        isRewardDispatchEligible(mapped) &&
        !isRewardDispatchEligible(
          previousReward ?? { status: "draft", visible: false }
        )
      ) {
        await dispatchCommunityPush("reward", mapped.id);
      }
    }

    return {
      objectType: payload.objectType,
      action: payload.action,
      sourceId: payload.sourceId,
      targetId: payload.targetId,
    };
  },

  reviewSubmission: async (id, status, reviewNotes = "") => {
    const supabase = createClient();
    const authUserId = useAdminAuthStore.getState().authUserId;
    const timestamp = new Date().toISOString();
    const submission = get().submissions.find((item) => item.id === id);

    const fullUpdate = {
      status,
      review_notes: reviewNotes,
      reviewed_by_auth_user_id: authUserId,
      reviewed_at: timestamp,
      updated_at: timestamp,
    };

    let { error } = await supabase
      .from("quest_submissions")
      .update(fullUpdate)
      .eq("id", id);

    if (error) {
      const fallback = await supabase
        .from("quest_submissions")
        .update({ status })
        .eq("id", id);
      error = fallback.error;
    }

    if (error) throw error;

    set((state) => ({
      submissions: state.submissions.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              reviewNotes: reviewNotes || item.reviewNotes,
              reviewedByAuthUserId: authUserId ?? item.reviewedByAuthUserId,
              reviewedAt: timestamp,
              updatedAt: timestamp,
            }
          : item
      ),
    }));

    if (submission) {
      await writeAuditLog({
        sourceTable: "quest_submissions",
        sourceId: id,
        projectId: get().quests.find((quest) => quest.id === submission.questId)?.projectId,
        action: `submission_${status}`,
        summary: `${status === "approved" ? "Approved" : "Rejected"} submission for ${submission.questTitle}.`,
        metadata: {
          submissionId: id,
          questId: submission.questId,
          campaignId: submission.campaignId,
          reviewNotes,
        },
      });
    }
  },

  approveSubmission: async (id) => {
    await get().reviewSubmission(id, "approved");
  },

  rejectSubmission: async (id) => {
    await get().reviewSubmission(id, "rejected");
  },

    reviewClaim: async (id, status, reviewNotes = "") => {
      const supabase = createClient();
      const authUserId = useAdminAuthStore.getState().authUserId;
      const timestamp = new Date().toISOString();
      const claim = get().claims.find((item) => item.id === id);
      let distributionId: string | null = null;

      if (claim?.deliveryPayload) {
        try {
          const payload = JSON.parse(claim.deliveryPayload) as Record<string, unknown>;
          if (typeof payload.distributionId === "string" && payload.distributionId.trim()) {
            distributionId = payload.distributionId;
          }
        } catch (error) {
          console.warn("distribution delivery payload parse skipped", error);
        }
      }

      const fullUpdate = {
        status,
      fulfillment_notes: reviewNotes,
      reviewed_by_auth_user_id: authUserId,
      reviewed_at: timestamp,
      updated_at: timestamp,
    };

    let { error } = await supabase
      .from("reward_claims")
      .update(fullUpdate)
      .eq("id", id);

    if (error) {
      const fallback = await supabase
        .from("reward_claims")
        .update({ status })
        .eq("id", id);
      error = fallback.error;
    }

      if (error) throw error;

      if (claim?.claimMethod === "campaign_distribution" && distributionId) {
        const distributionStatus =
          status === "processing"
            ? "processing"
            : status === "fulfilled"
              ? "paid"
              : status === "rejected"
                ? "rejected"
                : "queued";

        const { error: distributionError } = await supabase
          .from("reward_distributions")
          .update({
            status: distributionStatus,
            updated_at: timestamp,
          })
          .eq("id", distributionId);

        if (distributionError) throw distributionError;
      }

      set((state) => ({
        claims: state.claims.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              fulfillmentNotes: reviewNotes || item.fulfillmentNotes,
              reviewedByAuthUserId: authUserId ?? item.reviewedByAuthUserId,
              reviewedAt: timestamp,
              updatedAt: timestamp,
            }
          : item
      ),
    }));

    if (claim) {
      await writeAuditLog({
        sourceTable: "reward_claims",
        sourceId: id,
        projectId: claim.projectId,
        action: `claim_${status}`,
        summary: `${status === "fulfilled" ? "Fulfilled" : status === "processing" ? "Moved" : "Rejected"} claim for ${claim.rewardTitle}.`,
        metadata: {
            claimId: id,
            rewardId: claim.rewardId,
            campaignId: claim.campaignId,
            distributionId,
            authUserId,
            reviewNotes,
          },
      });
    }
  },

  updateClaimStatus: async (id, status) => {
    await get().reviewClaim(id, status);
  },

  updateReviewFlagStatus: async (id, status) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("review_flags")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      reviewFlags: state.reviewFlags.map((item) =>
        item.id === id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      ),
    }));
  },

  applyTrustAction: async ({ authUserId, action, projectId, reviewFlagId, reason }) => {
    const supabase = createClient();
    const timestamp = new Date().toISOString();
    const isWatchAction = action === "watch_wallet" || action === "flag_user";
    const nextRiskLabel = isWatchAction ? "watch" : "unknown";
    const nextUserStatus =
      action === "flag_user" ? "flagged" : action === "restore_user" ? "active" : null;

    const { data: walletLinks, error: walletLinksError } = await supabase
      .from("wallet_links")
      .select("id, metadata")
      .eq("auth_user_id", authUserId);

    if (walletLinksError) throw walletLinksError;

    for (const link of walletLinks ?? []) {
      const metadata =
        link.metadata && typeof link.metadata === "object" ? link.metadata : {};
      const { error: walletUpdateError } = await supabase
        .from("wallet_links")
        .update({
          risk_label: nextRiskLabel,
          metadata: {
            ...metadata,
            lastTrustAction: action,
            lastTrustActionAt: timestamp,
            lastTrustActionReason: reason ?? "",
          },
          updated_at: timestamp,
        })
        .eq("id", link.id);

      if (walletUpdateError) throw walletUpdateError;
    }

    if (nextUserStatus) {
      const { error: globalReputationError } = await supabase
        .from("user_global_reputation")
        .update({
          status: nextUserStatus,
          updated_at: timestamp,
        })
        .eq("auth_user_id", authUserId);

      if (globalReputationError) throw globalReputationError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          status: nextUserStatus,
        })
        .eq("auth_user_id", authUserId);

      if (profileError) throw profileError;
    }

    if (reviewFlagId) {
      const { error: reviewFlagError } = await supabase
        .from("review_flags")
        .update({
          status: "resolved",
          updated_at: timestamp,
          metadata: {
            appliedTrustAction: action,
            appliedTrustActionAt: timestamp,
            appliedTrustActionReason: reason ?? "",
          },
        })
        .eq("id", reviewFlagId);

      if (reviewFlagError) throw reviewFlagError;
    }

    await writeAuditLog({
      sourceTable: "wallet_links",
      sourceId: authUserId,
      projectId,
      action: `trust_action_${action}`,
      summary: `Applied ${action.replace(/_/g, " ")} to contributor trust posture.`,
      metadata: {
        authUserId,
        action,
        reviewFlagId: reviewFlagId ?? null,
        walletRiskLabel: nextRiskLabel,
        userStatus: nextUserStatus,
        reason: reason ?? "",
      },
    });

    set((state) => ({
      users: state.users.map((user) =>
        user.authUserId === authUserId && nextUserStatus
          ? { ...user, status: nextUserStatus as AdminUser["status"] }
          : user
      ),
      reviewFlags: reviewFlagId
        ? state.reviewFlags.map((flag) =>
            flag.id === reviewFlagId
              ? {
                  ...flag,
                  status: "resolved",
                  updatedAt: timestamp,
                  metadata: JSON.stringify(
                    {
                      appliedTrustAction: action,
                      appliedTrustActionAt: timestamp,
                      appliedTrustActionReason: reason ?? "",
                    },
                    null,
                    2
                  ),
                }
              : flag
          )
        : state.reviewFlags,
    }));
  },

  getClaimById: (id) => get().claims.find((item) => item.id === id),

  fetchAuditTrail: async (sourceTable, sourceId) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("source_table", sourceTable)
      .eq("source_id", sourceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Audit trail fetch skipped:", error.message);
      return [];
    }

    return ((data ?? []) as DbAuditLog[]).map(mapAuditLog);
  },

  createOnboardingRequest: async (input) => {
    const supabase = createClient();
    const authUserId = useAdminAuthStore.getState().authUserId;

    const { data, error } = await supabase
      .from("project_onboarding_requests")
      .insert({
        requested_by_auth_user_id: authUserId,
        project_name: input.projectName,
        chain: input.chain,
        category: input.category,
        website: input.website,
        contact_email: input.contactEmail,
        short_description: input.shortDescription,
        long_description: input.longDescription,
        logo: input.logo,
        banner_url: input.bannerUrl,
        x_url: input.xUrl,
        telegram_url: input.telegramUrl,
        discord_url: input.discordUrl,
        requested_plan_id: input.requestedPlanId || null,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapOnboardingRequest(data as DbOnboardingRequest);
    set((state) => ({
      onboardingRequests: [mapped, ...state.onboardingRequests],
    }));
    return mapped.id;
  },

  approveOnboardingRequest: async (id) => {
    const supabase = createClient();
    const authStore = useAdminAuthStore.getState();
    const authUserId = authStore.authUserId;
    const request = get().onboardingRequests.find((item) => item.id === id);
    if (!request) throw new Error("Onboarding request not found.");

    const { data: requesterProfile } = request.requestedByAuthUserId
      ? await supabase
          .from("user_profiles")
          .select("auth_user_id, username, avatar_url")
          .eq("auth_user_id", request.requestedByAuthUserId)
          .maybeSingle()
      : { data: null };

    const normalizedSlug = request.projectName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const ownerWasAttached = !!request.requestedByAuthUserId;
    const timestamp = new Date().toISOString();

    const { data: createdProject, error: createError } = await supabase
      .from("projects")
      .insert({
        name: request.projectName,
        slug: normalizedSlug,
        chain: request.chain,
        category: request.category,
        status: "draft",
        onboarding_status: "approved",
        description: request.shortDescription,
        long_description: request.longDescription,
        members: ownerWasAttached ? 1 : 0,
        campaigns: 0,
        logo: request.logo,
        banner_url: request.bannerUrl,
        website: request.website,
        x_url: request.xUrl,
        telegram_url: request.telegramUrl,
        discord_url: request.discordUrl,
        contact_email: request.contactEmail,
        is_featured: false,
        is_public: true,
        owner_user_id: request.requestedByAuthUserId || null,
      })
      .select()
      .single();

    if (createError) throw createError;

    if (request.requestedByAuthUserId) {
      const { error: teamInsertError } = await supabase.from("team_members").insert({
        name: requesterProfile?.username || request.projectName,
        email: request.contactEmail,
        role: "owner",
        status: "active",
        project_id: createdProject.id,
        auth_user_id: request.requestedByAuthUserId,
        joined_at: timestamp,
      });

      if (teamInsertError) throw teamInsertError;
    }

    const { error: updateError } = await supabase
      .from("project_onboarding_requests")
      .update({
        status: "approved",
        approved_project_id: createdProject.id,
        reviewed_by_auth_user_id: authUserId,
        reviewed_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    if (ownerWasAttached) {
      await authStore.refreshMemberships();
      if (authStore.authUserId === request.requestedByAuthUserId) {
        useAdminAuthStore.setState({ activeProjectId: createdProject.id });
      }
    }

    set((state) => ({
      projects: [mapProject(createdProject as DbProject), ...state.projects],
      teamMembers: ownerWasAttached
        ? [
            {
              id: `pending-${createdProject.id}`,
              name: requesterProfile?.username || request.projectName,
              email: request.contactEmail,
              role: "owner",
              status: "active",
              projectId: createdProject.id,
              authUserId: request.requestedByAuthUserId,
              joinedAt: timestamp,
            },
            ...state.teamMembers.filter(
              (item) =>
                !(
                  item.projectId === createdProject.id &&
                  item.authUserId === request.requestedByAuthUserId
                )
            ),
          ]
        : state.teamMembers,
      onboardingRequests: state.onboardingRequests.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "approved",
              approvedProjectId: createdProject.id,
              reviewedByAuthUserId: authUserId ?? "",
              reviewedAt: timestamp,
              updatedAt: timestamp,
            }
          : item
      ),
    }));

    return createdProject.id;
  },

  rejectOnboardingRequest: async (id, notes = "") => {
    const supabase = createClient();
    const authUserId = useAdminAuthStore.getState().authUserId;

    const { error } = await supabase
      .from("project_onboarding_requests")
      .update({
        status: "rejected",
        review_notes: notes,
        reviewed_by_auth_user_id: authUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      onboardingRequests: state.onboardingRequests.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "rejected",
              reviewNotes: notes,
              reviewedByAuthUserId: authUserId ?? "",
              reviewedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item
      ),
    }));
  },

  inviteTeamMember: async (input) => {
    const supabase = createClient();
    const activeProjectId = useAdminAuthStore.getState().activeProjectId;
    if (!activeProjectId) {
      throw new Error("No active project selected.");
    }

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        name: input.name,
        email: input.email,
        role: input.role,
        status: input.status,
        project_id: activeProjectId,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapTeamMember(data as DbTeamMember);
    set((state) => ({
      teamMembers: [mapped, ...state.teamMembers],
    }));
  },

  updateTeamMember: async (id, input) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("team_members")
      .update({
        role: input.role,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const mapped = mapTeamMember(data as DbTeamMember);
    set((state) => ({
      teamMembers: state.teamMembers.map((member) =>
        member.id === id ? mapped : member
      ),
    }));
  },

  createProjectCampaignTemplate: async (input) => {
    const supabase = createClient();
    const parsedConfiguration = input.configuration?.trim()
      ? JSON.parse(input.configuration)
      : {};

    const { data, error } = await supabase
      .from("project_campaign_templates")
      .insert({
        project_id: input.projectId,
        name: input.name,
        description: input.description || null,
        base_template_id: input.baseTemplateId,
        configuration: parsedConfiguration,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapProjectCampaignTemplate(data as DbProjectCampaignTemplate);
    let mappedBuilderTemplate = projectCampaignTemplateToBuilderTemplate(mapped);

    const builderInsert = await supabase
      .from("project_builder_templates")
      .upsert(
        {
          project_id: input.projectId,
          template_kind: "campaign",
          name: input.name,
          description: input.description || null,
          base_template_id: input.baseTemplateId,
          legacy_campaign_template_id: mapped.id,
          configuration: parsedConfiguration,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "legacy_campaign_template_id" }
      )
      .select()
      .single();

    if (!builderInsert.error && builderInsert.data) {
      mappedBuilderTemplate = mapProjectBuilderTemplate(
        builderInsert.data as DbProjectBuilderTemplate
      );
    } else if (builderInsert.error) {
      console.warn(
        "Project builder template sync skipped:",
        builderInsert.error.message
      );
    }

    set((state) => ({
      projectBuilderTemplates: [
        mappedBuilderTemplate,
        ...state.projectBuilderTemplates.filter(
          (template) =>
            template.id !== mappedBuilderTemplate.id &&
            template.legacyCampaignTemplateId !== mapped.id
        ),
      ],
      projectCampaignTemplates: [
        mapped,
        ...state.projectCampaignTemplates.filter((template) => template.id !== mapped.id),
      ],
    }));
    return mapped.id;
  },

  deleteProjectCampaignTemplate: async (id) => {
    const supabase = createClient();
    const builderDelete = await supabase
      .from("project_builder_templates")
      .delete()
      .or(`id.eq.${id},legacy_campaign_template_id.eq.${id}`);

    if (builderDelete.error) {
      console.warn("Project builder template delete skipped:", builderDelete.error.message);
    }

    const { error } = await supabase
      .from("project_campaign_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      projectBuilderTemplates: state.projectBuilderTemplates.filter(
        (template) =>
          template.id !== id && template.legacyCampaignTemplateId !== id
      ),
      projectCampaignTemplates: state.projectCampaignTemplates.filter(
        (template) => template.id !== id
      ),
    }));
  },
}));
