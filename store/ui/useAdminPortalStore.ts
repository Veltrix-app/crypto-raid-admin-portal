"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";
import { AdminRaid } from "@/types/entities/raid";
import { AdminQuest } from "@/types/entities/quest";
import { AdminReward } from "@/types/entities/reward";
import { AdminSubmission } from "@/types/entities/submission";
import { AdminTeamMember } from "@/types/entities/team-member";
import { AdminBillingPlan } from "@/types/entities/billing-plan";
import {
  DbBillingPlan,
  DbCampaign,
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

  projects: AdminProject[];
  campaigns: AdminCampaign[];
  raids: AdminRaid[];
  quests: AdminQuest[];
  rewards: AdminReward[];
  submissions: AdminSubmission[];
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

  inviteTeamMember: (input: Omit<AdminTeamMember, "id">) => Promise<void>;
};

function mapProject(row: DbProject): AdminProject {
  return {
    id: row.id,
    name: row.name,
    chain: row.chain,
    status: row.status as AdminProject["status"],
    members: row.members,
    campaigns: row.campaigns,
    logo: row.logo,
    website: row.website,
    contactEmail: row.contact_email,
    description: row.description,
    onboardingStatus: row.onboarding_status as AdminProject["onboardingStatus"],
  };
}

function mapCampaign(row: DbCampaign): AdminCampaign {
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    status: row.status as AdminCampaign["status"],
    participants: row.participants,
    completionRate: row.completion_rate,
    xpBudget: row.xp_budget,
  };
}

function mapRaid(row: DbRaid): AdminRaid {
  return {
    id: row.id,
    title: row.title,
    campaignId: row.campaign_id,
    status: row.status as AdminRaid["status"],
    participants: row.participants,
    rewardXp: row.reward_xp,
  };
}

function mapQuest(row: DbQuest): AdminQuest {
  return {
    id: row.id,
    title: row.title,
    campaignId: row.campaign_id,
    type: row.type as AdminQuest["type"],
    status: row.status as AdminQuest["status"],
    xp: row.xp,
  };
}

function mapReward(row: DbReward): AdminReward {
  return {
    id: row.id,
    title: row.title,
    type: row.type as AdminReward["type"],
    rarity: row.rarity as AdminReward["rarity"],
    cost: row.cost,
    stock: row.stock,
  };
}
function mapSubmission(row: DbSubmission): AdminSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    questId: row.quest_id,
    questTitle: row.quest_title,
    campaignId: row.campaign_id,
    campaignTitle: row.campaign_title,
    proof: row.proof,
    submittedAt: row.submitted_at,
    status: row.status as AdminSubmission["status"],
  };
}

function mapTeamMember(row: DbTeamMember): AdminTeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AdminTeamMember["role"],
    status: row.status as AdminTeamMember["status"],
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

  projects: [],
  campaigns: [],
  raids: [],
  quests: [],
  rewards: [],
  submissions: [],
  teamMembers: [],
  billingPlans: [],

  loadAll: async () => {
    const supabase = createClient();
    set({ loading: true });

    const [
      projectsRes,
      campaignsRes,
      raidsRes,
      questsRes,
      rewardsRes,
      submissionsRes,
      teamRes,
      billingRes,
    ] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("raids").select("*").order("created_at", { ascending: false }),
      supabase.from("quests").select("*").order("created_at", { ascending: false }),
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("team_members").select("*").order("created_at", { ascending: false }),
      supabase.from("billing_plans").select("*"),
    ]);

    set({
      hydrated: true,
      loading: false,
      projects: (projectsRes.data ?? []).map(mapProject),
      campaigns: (campaignsRes.data ?? []).map(mapCampaign),
      raids: (raidsRes.data ?? []).map(mapRaid),
      quests: (questsRes.data ?? []).map(mapQuest),
      rewards: (rewardsRes.data ?? []).map(mapReward),
      submissions: (submissionsRes.data ?? []).map(mapSubmission),
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
        chain: input.chain,
        status: input.status,
        members: input.members,
        campaigns: input.campaigns,
        logo: input.logo,
        website: input.website,
        contact_email: input.contactEmail,
        description: input.description,
        onboarding_status: input.onboardingStatus,
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
        chain: input.chain,
        status: input.status,
        members: input.members,
        campaigns: input.campaigns,
        logo: input.logo,
        website: input.website,
        contact_email: input.contactEmail,
        description: input.description,
        onboarding_status: input.onboardingStatus,
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
        title: input.title,
        project_id: input.projectId,
        status: input.status,
        participants: input.participants,
        completion_rate: input.completionRate,
        xp_budget: input.xpBudget,
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
        title: input.title,
        project_id: input.projectId,
        status: input.status,
        participants: input.participants,
        completion_rate: input.completionRate,
        xp_budget: input.xpBudget,
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

    const { data, error } = await supabase
      .from("raids")
      .insert({
        title: input.title,
        campaign_id: input.campaignId,
        status: input.status,
        participants: input.participants,
        reward_xp: input.rewardXp,
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

    const { data, error } = await supabase
      .from("raids")
      .update({
        title: input.title,
        campaign_id: input.campaignId,
        status: input.status,
        participants: input.participants,
        reward_xp: input.rewardXp,
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
const { data, error } = await supabase
      .from("quests")
      .insert({
        title: input.title,
        campaign_id: input.campaignId,
        type: input.type,
        status: input.status,
        xp: input.xp,
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

    const { data, error } = await supabase
      .from("quests")
      .update({
        title: input.title,
        campaign_id: input.campaignId,
        type: input.type,
        status: input.status,
        xp: input.xp,
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

    const { data, error } = await supabase
      .from("rewards")
      .insert({
        title: input.title,
        type: input.type,
        rarity: input.rarity,
        cost: input.cost,
        stock: input.stock,
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

    const { data, error } = await supabase
      .from("rewards")
      .update({
        title: input.title,
        type: input.type,
        rarity: input.rarity,
        cost: input.cost,
        stock: input.stock,
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
      .from("submissions")
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
      .from("submissions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      submissions: state.submissions.map((item) =>
        item.id === id ? { ...item, status: "rejected" } : item
      ),
    }));
  },

  inviteTeamMember: async (input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        name: input.name,
        email: input.email,
        role: input.role,
        status: input.status,
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