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
import {
  DbBillingPlan,
  DbCampaign,
  DbClaim,
  DbProject,
  DbQuest,
  DbRaid,
  DbReward,
  DbSubmission,
  DbTeamMember,
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
  teamMembers: AdminTeamMember[];
  billingPlans: AdminBillingPlan[];

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

  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string) => Promise<void>;

  updateClaimStatus: (
    id: string,
    status: AdminClaim["status"]
  ) => Promise<void>;
  getClaimById: (id: string) => AdminClaim | undefined;

  inviteTeamMember: (input: Omit<AdminTeamMember, "id">) => Promise<void>;
};

type DbUserProfileLite = {
  auth_user_id: string | null;
  username: string;
};

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
  };
}

function mapClaim(row: DbClaim): AdminClaim {
  return {
    id: row.id,

    authUserId: row.auth_user_id ?? "",
    username: row.username ?? "Unknown User",

    rewardId: row.reward_id ?? "",
    rewardTitle: row.reward_title ?? "Unknown Reward",

    projectId: row.project_id ?? "",
    projectName: row.project_name ?? "",

    campaignId: row.campaign_id ?? "",
    campaignTitle: row.campaign_title ?? "",

    claimMethod: row.claim_method ?? "manual_fulfillment",
    status: (row.status ?? "pending") as AdminClaim["status"],

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

function mapBillingPlan(row: DbBillingPlan): AdminBillingPlan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: row.price_monthly,
    projectsLimit: row.projects_limit,
    campaignsLimit: row.campaigns_limit,
    features: row.features,
    current: row.current,
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
  teamMembers: [],
  billingPlans: [],

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

    const [
      projectsRes,
      campaignsRes,
      raidsRes,
      questsRes,
      rewardsRes,
      submissionsRes,
      profilesRes,
      claimsRes,
      teamRes,
      billingRes,
    ] = await Promise.all([
      scopedProjectsQuery,
      scopedCampaignsQuery,
      scopedRaidsQuery,
      scopedQuestsQuery,
      scopedRewardsQuery,
      supabase.from("quest_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_profiles").select("auth_user_id, username"),
      supabase.from("reward_claims").select("*").order("created_at", { ascending: false }),
      scopedTeamQuery,
      supabase.from("billing_plans").select("*"),
    ]);

    const campaignRows = (campaignsRes.data ?? []) as DbCampaign[];
    const questRows = (questsRes.data ?? []) as DbQuest[];
    const profileRows = (profilesRes.data ?? []) as DbUserProfileLite[];

    const questsById = new Map(questRows.map((row) => [row.id, row]));
    const campaignsById = new Map(campaignRows.map((row) => [row.id, row]));
    const usernamesByAuthUserId = new Map(
      profileRows
        .filter((row): row is DbUserProfileLite & { auth_user_id: string } => !!row.auth_user_id)
        .map((row) => [row.auth_user_id, row.username])
    );

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
      claims: (claimsRes.data ?? []).map(mapClaim),
      teamMembers: (teamRes.data ?? []).map(mapTeamMember),
      billingPlans: (billingRes.data ?? []).map(mapBillingPlan),
    });
  },

  createProject: async (input) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("projects")
      .insert({
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

        contact_email: input.contactEmail,

        is_featured: input.isFeatured,
        is_public: input.isPublic,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapProject(data as DbProject);
    set((state) => ({ projects: [mapped, ...state.projects] }));
    return mapped.id;
  },

  updateProject: async (id, input) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("projects")
      .update({
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

        contact_email: input.contactEmail,

        is_featured: input.isFeatured,
        is_public: input.isPublic,
      })
      .eq("id", id)
      .select()
      .single();

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
    return mapped.id;
  },

  updateCampaign: async (id, input) => {
    const supabase = createClient();

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
    return mapped.id;
  },

  updateRaid: async (id, input) => {
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

    const { data, error } = await supabase
      .from("quests")
      .insert({
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
        verification_config: parsedVerificationConfig,

        is_repeatable: input.isRepeatable,
        cooldown_seconds: input.cooldownSeconds ?? null,
        max_completions_per_user: input.maxCompletionsPerUser ?? null,
        sort_order: input.sortOrder,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = mapQuest(data as DbQuest);
    set((state) => ({ quests: [mapped, ...state.quests] }));
    return mapped.id;
  },

  updateQuest: async (id, input) => {
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
      .from("quests")
      .update({
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
        verification_config: parsedVerificationConfig,

        is_repeatable: input.isRepeatable,
        cooldown_seconds: input.cooldownSeconds ?? null,
        max_completions_per_user: input.maxCompletionsPerUser ?? null,
        sort_order: input.sortOrder,

        starts_at: input.startsAt || null,
        ends_at: input.endsAt || null,

        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const mapped = mapQuest(data as DbQuest);
    set((state) => ({
      quests: state.quests.map((item) => (item.id === id ? mapped : item)),
    }));
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
    return mapped.id;
  },

  updateReward: async (id, input) => {
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

  approveSubmission: async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("quest_submissions")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      submissions: state.submissions.map((item) =>
        item.id === id ? { ...item, status: "approved" } : item
      ),
    }));
  },

  rejectSubmission: async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("quest_submissions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      submissions: state.submissions.map((item) =>
        item.id === id ? { ...item, status: "rejected" } : item
      ),
    }));
  },

  updateClaimStatus: async (id, status) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("reward_claims")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      claims: state.claims.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },

  getClaimById: (id) => get().claims.find((item) => item.id === id),

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
}));
