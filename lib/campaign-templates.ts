import { AdminCampaign } from "@/types/entities/campaign";
import { AdminProject } from "@/types/entities/project";
import { AdminQuest } from "@/types/entities/quest";
import { AdminReward } from "@/types/entities/reward";

export type CampaignTemplateId =
  | "blank_campaign_canvas"
  | "community_growth_starter"
  | "launch_hype_sprint"
  | "content_creator_flywheel"
  | "ecosystem_onboarding_loop"
  | "referral_growth_loop"
  | "social_raid_push"
  | "holder_activation_path";

type CampaignTemplateDefinition = {
  id: CampaignTemplateId;
  label: string;
  summary: string;
  goal: string;
  requiredProjectFields: Array<keyof AdminProject>;
  campaign: {
    campaignType: AdminCampaign["campaignType"];
    visibility: AdminCampaign["visibility"];
    featured: boolean;
    xpBudget: number;
    title: string;
    shortDescription: string;
    longDescription: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
  };
  quests: Array<
    Omit<AdminQuest, "id" | "projectId" | "campaignId"> & {
      requiredProjectFields?: Array<keyof AdminProject>;
    }
  >;
  rewards: Array<Omit<AdminReward, "id" | "projectId" | "campaignId">>;
};

type BuildTemplateResult = {
  campaignDraft: Omit<AdminCampaign, "id">;
  questDrafts: ResolvedQuestDraft[];
  rewardDrafts: ResolvedRewardDraft[];
  missingProjectFields: Array<keyof AdminProject>;
};

export type ResolvedQuestDraft = {
  key: string;
  draft: Omit<AdminQuest, "id">;
  missingProjectFields: Array<keyof AdminProject>;
  autofilledFields: string[];
};

export type ResolvedRewardDraft = {
  key: string;
  draft: Omit<AdminReward, "id">;
  missingProjectFields: Array<keyof AdminProject>;
  autofilledFields: string[];
};

export type CampaignTemplateOption = CampaignTemplateDefinition & {
  fitScore: number;
  fitLabel: "Best fit" | "Strong fit" | "Good fit" | "Needs setup";
  fitReasons: string[];
};

const TEMPLATE_DEFINITIONS: Record<CampaignTemplateId, CampaignTemplateDefinition> = {
  blank_campaign_canvas: {
    id: "blank_campaign_canvas",
    label: "Blank Campaign Canvas",
    summary:
      "Start from a clean campaign shell when you want full control and do not want generated quests or rewards yet.",
    goal: "Give project teams a flexible custom starting point instead of forcing a predefined playbook.",
    requiredProjectFields: [],
    campaign: {
      campaignType: "hybrid",
      visibility: "public",
      featured: false,
      xpBudget: 0,
      title: "{{project.name}} Campaign",
      shortDescription:
        "Start from a blank campaign and shape the flow exactly how your project needs it.",
      longDescription:
        "Use this blank campaign canvas when you want the wizard structure without generated quest and reward scaffolding.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [],
    rewards: [],
  },
  community_growth_starter: {
    id: "community_growth_starter",
    label: "Community Growth Starter",
    summary:
      "Spin up a complete onboarding funnel that turns new visitors into joined community members with a first reward path.",
    goal: "Grow owned community channels quickly with minimal setup friction.",
    requiredProjectFields: ["telegramUrl", "discordUrl", "xUrl", "website"],
    campaign: {
      campaignType: "community_growth",
      visibility: "public",
      featured: true,
      xpBudget: 2200,
      title: "{{project.name}} Community Starter",
      shortDescription:
        "Guide new contributors from discovery into your core community channels and first actions.",
      longDescription:
        "{{project.name}} uses this campaign as the first owned-community funnel. Contributors join the key channels, complete simple starter actions and begin building trust inside the ecosystem.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Join {{project.name}} on Telegram",
        description:
          "Join the Telegram hub to stay close to launches, drops and coordination moments.",
        shortDescription: "Join the Telegram hub",
        type: "Community",
        questType: "telegram_join",
        platform: "telegram",
        xp: 150,
        actionLabel: "Join Telegram",
        actionUrl: "{{project.telegramUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationConfig: '{\n  "groupUrl": "{{project.telegramUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["telegramUrl"],
      },
      {
        title: "Join {{project.name}} on Discord",
        description:
          "Enter the Discord and unlock the place where deeper participation happens.",
        shortDescription: "Join the Discord",
        type: "Community",
        questType: "discord_join",
        platform: "discord",
        xp: 150,
        actionLabel: "Join Discord",
        actionUrl: "{{project.discordUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationProvider: "discord",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "inviteUrl": "{{project.discordUrl}}",\n  "integrationProvider": "discord",\n  "eventType": "discord_membership_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["discordUrl"],
      },
      {
        title: "Follow {{project.name}} on X",
        description:
          "Follow the project account so you do not miss campaign pushes and announcements.",
        shortDescription: "Follow the X account",
        type: "Social",
        questType: "social_follow",
        platform: "x",
        xp: 120,
        actionLabel: "Follow on X",
        actionUrl: "{{project.xUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "api_check",
        verificationConfig: '{\n  "profileUrl": "{{project.xUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
      {
        title: "Visit the {{project.name}} website",
        description:
          "Open the official site to understand the product, positioning and next conversion steps.",
        shortDescription: "Visit the official website",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 90,
        actionLabel: "Open Website",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.website}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 4,
        status: "active",
        requiredProjectFields: ["website"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Starter Access",
        description:
          "A starter reward for contributors who finish the first community loop.",
        type: "Access",
        rewardType: "access",
        rarity: "common",
        cost: 300,
        claimable: true,
        visible: true,
        icon: "🚀",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig: '{\n  "notes": "Grant starter access or whitelist the user."\n}',
        status: "active",
      },
    ],
  },
  launch_hype_sprint: {
    id: "launch_hype_sprint",
    label: "Launch Hype Sprint",
    summary:
      "Create a fast-moving social launch campaign with attention, amplification and a simple reward loop.",
    goal: "Stack launch awareness across X, website traffic and visible social proof.",
    requiredProjectFields: ["xUrl", "website", "launchPostUrl"],
    campaign: {
      campaignType: "social_growth",
      visibility: "public",
      featured: true,
      xpBudget: 2800,
      title: "{{project.name}} Launch Sprint",
      shortDescription:
        "A focused campaign for pushing launch attention into follows, visits and high-visibility engagement.",
      longDescription:
        "This launch sprint gives {{project.name}} a clean social amplification loop. Contributors move through follows, traffic and proof-based engagement while earning a simple launch reward.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Follow {{project.name}} on X",
        description: "Follow the launch account and lock into the main comms stream.",
        shortDescription: "Follow the launch account",
        type: "Social",
        questType: "social_follow",
        platform: "x",
        xp: 100,
        actionLabel: "Follow on X",
        actionUrl: "{{project.xUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "api_check",
        verificationConfig: '{\n  "profileUrl": "{{project.xUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
      {
        title: "Visit the launch page",
        description: "Open the official website and absorb the full launch narrative.",
        shortDescription: "Visit the launch page",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 80,
        actionLabel: "Open Launch Site",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.website}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["website"],
      },
      {
        title: "Amplify the launch post",
        description:
          "Open the canonical launch post, react to it and submit your own public response as proof.",
        shortDescription: "Amplify the launch post",
        type: "Social",
        questType: "manual_proof",
        platform: "x",
        xp: 220,
        actionLabel: "Submit Post Proof",
        actionUrl: "{{project.launchPostUrl}}",
        proofRequired: true,
        proofType: "url",
        autoApprove: false,
        verificationType: "manual_review",
        verificationConfig:
          '{\n  "targetPostUrl": "{{project.launchPostUrl}}",\n  "instructions": "Quote, comment on or react to the official launch post and paste your public proof URL here."\n}',
        isRepeatable: false,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["launchPostUrl"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Launch Badge",
        description: "A commemorative reward for users who supported the launch push.",
        type: "Badge",
        rewardType: "badge",
        rarity: "rare",
        cost: 350,
        claimable: true,
        visible: true,
        icon: "🔥",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig: '{\n  "notes": "Issue the launch supporter badge manually."\n}',
        status: "active",
      },
    ],
  },
  content_creator_flywheel: {
    id: "content_creator_flywheel",
    label: "Content Creator Flywheel",
    summary:
      "Set up a creator-focused campaign with proof-based content submission and a themed creator reward.",
    goal: "Collect quality creator content without asking projects to build the loop from scratch.",
    requiredProjectFields: ["website", "xUrl", "docsUrl"],
    campaign: {
      campaignType: "content",
      visibility: "public",
      featured: false,
      xpBudget: 2400,
      title: "{{project.name}} Creator Campaign",
      shortDescription:
        "Invite creators to explore the project, produce content and get rewarded for proof-backed submissions.",
      longDescription:
        "This campaign gives {{project.name}} a creator acquisition lane. Users explore the project, publish content and submit proof for review, creating a reusable content flywheel.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Read the {{project.name}} docs",
        description: "Open the docs and understand the product deeply before creating content around it.",
        shortDescription: "Read the docs",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 80,
        actionLabel: "Open Docs",
        actionUrl: "{{project.docsUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.docsUrl}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["docsUrl"],
      },
      {
        title: "Follow the project on X",
        description: "Follow the project account to stay aligned with the messaging.",
        shortDescription: "Follow the project account",
        type: "Social",
        questType: "social_follow",
        platform: "x",
        xp: 100,
        actionLabel: "Follow on X",
        actionUrl: "{{project.xUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "api_check",
        verificationConfig: '{\n  "profileUrl": "{{project.xUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
      {
        title: "Submit original content about {{project.name}}",
        description:
          "Create an original thread, post or visual and submit the public proof for review.",
        shortDescription: "Submit creator proof",
        type: "Proof",
        questType: "manual_proof",
        platform: "custom",
        xp: 300,
        actionLabel: "Submit Content Proof",
        actionUrl: "{{project.website}}",
        proofRequired: true,
        proofType: "url",
        autoApprove: false,
        verificationType: "manual_review",
        verificationConfig:
          '{\n  "instructions": "Paste the public URL to your original post or asset."\n}',
        isRepeatable: false,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["website"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Creator Spotlight",
        description: "A creator-facing reward for users whose proof passes review.",
        type: "Access",
        rewardType: "access",
        rarity: "epic",
        cost: 450,
        claimable: true,
        visible: true,
        icon: "🎨",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig:
          '{\n  "notes": "Feature approved creators or grant them a creator role."\n}',
        status: "active",
      },
    ],
  },
  ecosystem_onboarding_loop: {
    id: "ecosystem_onboarding_loop",
    label: "Ecosystem Onboarding Loop",
    summary:
      "A broader starter template that introduces the project, channels and first contributor proof in one clean flow.",
    goal: "Reduce setup time for new projects that want a complete starter path.",
    requiredProjectFields: ["website", "telegramUrl", "discordUrl"],
    campaign: {
      campaignType: "hybrid",
      visibility: "public",
      featured: false,
      xpBudget: 2600,
      title: "{{project.name}} Ecosystem Onboarding",
      shortDescription:
        "Bring contributors through the core ecosystem surfaces and validate their first meaningful action.",
      longDescription:
        "{{project.name}} can use this onboarding loop to guide contributors through the key surfaces of the project, from web context to channels and a first proof-backed contribution.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Visit the {{project.name}} hub",
        description: "Open the official site and understand the ecosystem before going deeper.",
        shortDescription: "Visit the project hub",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 70,
        actionLabel: "Open Website",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.website}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["website"],
      },
      {
        title: "Join the Telegram",
        description: "Get into the fast-moving communication lane.",
        shortDescription: "Join Telegram",
        type: "Community",
        questType: "telegram_join",
        platform: "telegram",
        xp: 130,
        actionLabel: "Join Telegram",
        actionUrl: "{{project.telegramUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationConfig: '{\n  "groupUrl": "{{project.telegramUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["telegramUrl"],
      },
      {
        title: "Join the Discord",
        description: "Enter the main contributor workspace.",
        shortDescription: "Join Discord",
        type: "Community",
        questType: "discord_join",
        platform: "discord",
        xp: 130,
        actionLabel: "Join Discord",
        actionUrl: "{{project.discordUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationProvider: "discord",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "inviteUrl": "{{project.discordUrl}}",\n  "integrationProvider": "discord",\n  "eventType": "discord_membership_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["discordUrl"],
      },
      {
        title: "Submit your first contributor proof",
        description:
          "Complete a small custom action and prove it to signal real intent.",
        shortDescription: "Submit first proof",
        type: "Proof",
        questType: "manual_proof",
        platform: "custom",
        xp: 220,
        actionLabel: "Submit Proof",
        actionUrl: "{{project.website}}",
        proofRequired: true,
        proofType: "text",
        autoApprove: false,
        verificationType: "manual_review",
        verificationConfig:
          '{\n  "instructions": "Ask contributors for a short text proof of their first meaningful action."\n}',
        isRepeatable: false,
        sortOrder: 4,
        status: "active",
        requiredProjectFields: ["website"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Onboarded Contributor",
        description: "Starter reward for contributors who finish the ecosystem onboarding path.",
        type: "Badge",
        rewardType: "badge",
        rarity: "common",
        cost: 320,
        claimable: true,
        visible: true,
        icon: "🌱",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig:
          '{\n  "notes": "Issue the onboarding contributor badge or starter perk."\n}',
        status: "active",
      },
    ],
  },
  referral_growth_loop: {
    id: "referral_growth_loop",
    label: "Referral Growth Loop",
    summary:
      "Turn contributors into acquisition channels with a fast referral ladder and a milestone reward.",
    goal: "Drive new user acquisition without forcing the project to design the whole loop manually.",
    requiredProjectFields: ["website", "xUrl", "waitlistUrl"],
    campaign: {
      campaignType: "referral",
      visibility: "public",
      featured: true,
      xpBudget: 3200,
      title: "{{project.name}} Referral Sprint",
      shortDescription:
        "Give contributors a simple path to bring new users into {{project.name}} and get rewarded for it.",
      longDescription:
        "{{project.name}} can use this referral loop to turn attention into direct acquisition. Contributors learn the project, follow the public account and then move into referral-driven growth.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Explore {{project.name}}",
        description: "Visit the official website and understand what you are inviting people into.",
        shortDescription: "Visit the project website",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 80,
        actionLabel: "Open Website",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.website}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["website"],
      },
      {
        title: "Follow {{project.name}} on X",
        description: "Stay aligned with the main account before starting the referral push.",
        shortDescription: "Follow the project account",
        type: "Social",
        questType: "social_follow",
        platform: "x",
        xp: 120,
        actionLabel: "Follow on X",
        actionUrl: "{{project.xUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "api_check",
        verificationConfig: '{\n  "profileUrl": "{{project.xUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
      {
        title: "Share your referral link for {{project.name}}",
        description: "Publish or share your referral path and submit proof so the project can track your growth contribution.",
        shortDescription: "Submit referral proof",
        type: "Referral",
        questType: "referral",
        platform: "custom",
        xp: 260,
        actionLabel: "Submit Referral Proof",
        actionUrl: "{{project.waitlistUrl}}",
        proofRequired: true,
        proofType: "url",
        autoApprove: false,
        verificationType: "hybrid",
        verificationConfig:
          '{\n  "landingUrl": "{{project.waitlistUrl}}",\n  "instructions": "Paste the referral post, link or landing page you used to drive signups."\n}',
        isRepeatable: true,
        cooldownSeconds: 86400,
        maxCompletionsPerUser: 3,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["waitlistUrl"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Growth Operator",
        description: "Recognition reward for contributors who complete the referral sprint.",
        type: "Access",
        rewardType: "access",
        rarity: "rare",
        cost: 500,
        claimable: true,
        visible: true,
        icon: "📈",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig:
          '{\n  "notes": "Grant referral contributors a growth role, perk or early access reward."\n}',
        status: "active",
      },
    ],
  },
  social_raid_push: {
    id: "social_raid_push",
    label: "Social Raid Push",
    summary:
      "A fast raid-oriented template for projects that want social amplification and coordinated participation.",
    goal: "Launch a tight social push that turns followers into visible engagement quickly.",
    requiredProjectFields: ["xUrl", "telegramUrl"],
    campaign: {
      campaignType: "social_growth",
      visibility: "public",
      featured: true,
      xpBudget: 2300,
      title: "{{project.name}} Social Raid",
      shortDescription:
        "Mobilize your community into a coordinated social push across X and your fastest-moving comms lane.",
      longDescription:
        "{{project.name}} can use this raid-oriented template to combine Telegram coordination with public social action, helping the community move together during launches and high-attention moments.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Join the raid channel",
        description: "Get into the Telegram lane where the project coordinates the live push.",
        shortDescription: "Join Telegram",
        type: "Community",
        questType: "telegram_join",
        platform: "telegram",
        xp: 120,
        actionLabel: "Join Telegram",
        actionUrl: "{{project.telegramUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationConfig: '{\n  "groupUrl": "{{project.telegramUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["telegramUrl"],
      },
      {
        title: "Follow {{project.name}} on X",
        description: "Lock into the account the raid will amplify.",
        shortDescription: "Follow the project account",
        type: "Social",
        questType: "social_follow",
        platform: "x",
        xp: 100,
        actionLabel: "Follow on X",
        actionUrl: "{{project.xUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "api_check",
        verificationConfig: '{\n  "profileUrl": "{{project.xUrl}}"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
      {
        title: "Submit your raid action proof",
        description: "Complete the social action and paste the public link as proof.",
        shortDescription: "Submit raid proof",
        type: "Social",
        questType: "manual_proof",
        platform: "x",
        xp: 220,
        actionLabel: "Submit Proof",
        actionUrl: "{{project.xUrl}}",
        proofRequired: true,
        proofType: "url",
        autoApprove: false,
        verificationType: "manual_review",
        verificationConfig:
          '{\n  "instructions": "Paste the public URL of your like, repost, comment or quote-post action."\n}',
        isRepeatable: true,
        cooldownSeconds: 43200,
        maxCompletionsPerUser: 2,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["xUrl"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Raid Supporter",
        description: "Reward for contributors who show up in coordinated social pushes.",
        type: "Badge",
        rewardType: "badge",
        rarity: "rare",
        cost: 380,
        claimable: true,
        visible: true,
        icon: "⚡",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig:
          '{\n  "notes": "Issue a raid supporter badge or a supporter-only perk after review."\n}',
        status: "active",
      },
    ],
  },
  holder_activation_path: {
    id: "holder_activation_path",
    label: "Holder Activation Path",
    summary:
      "A starter template for wallet-first ecosystems that want to convert holders into active community members.",
    goal: "Bridge wallet connection, community joining and a first holder-facing reward.",
    requiredProjectFields: ["website", "discordUrl", "chain", "tokenContractAddress"],
    campaign: {
      campaignType: "onchain",
      visibility: "gated",
      featured: false,
      xpBudget: 3600,
      title: "{{project.name}} Holder Activation",
      shortDescription:
        "Move holders from passive awareness into connected, verified and community-active participation.",
      longDescription:
        "{{project.name}} can use this wallet-first flow to bring holders into a connected journey: learn the project, connect a wallet, join the community and unlock a first gated reward path.",
      bannerUrl: "{{project.bannerUrl}}",
    },
    quests: [
      {
        title: "Study the {{project.name}} ecosystem",
        description: "Visit the main website and understand what the holder path unlocks.",
        shortDescription: "Visit the website",
        type: "Traffic",
        questType: "url_visit",
        platform: "website",
        xp: 70,
        actionLabel: "Open Website",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "event_check",
        verificationProvider: "website",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "targetUrl": "{{project.website}}",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 1,
        status: "active",
        requiredProjectFields: ["website"],
      },
      {
        title: "Connect your {{project.chain}} wallet",
        description: "Connect the wallet you use inside the ecosystem so holder-based experiences can unlock.",
        shortDescription: "Connect wallet",
        type: "Wallet",
        questType: "wallet_connect",
        platform: "wallet",
        xp: 180,
        actionLabel: "Connect Wallet",
        actionUrl: "{{project.website}}",
        proofRequired: false,
        proofType: "wallet",
        autoApprove: true,
        verificationType: "onchain_check",
        verificationConfig:
          '{\n  "chain": "{{project.chain}}",\n  "tokenContract": "{{project.tokenContractAddress}}"\n}',
        isRepeatable: false,
        sortOrder: 2,
        status: "active",
        requiredProjectFields: ["website", "chain", "tokenContractAddress"],
      },
      {
        title: "Join the holder Discord lane",
        description: "Enter the Discord so verified holders can participate in the private community flow.",
        shortDescription: "Join Discord",
        type: "Community",
        questType: "discord_join",
        platform: "discord",
        xp: 130,
        actionLabel: "Join Discord",
        actionUrl: "{{project.discordUrl}}",
        proofRequired: false,
        proofType: "none",
        autoApprove: true,
        verificationType: "bot_check",
        verificationProvider: "discord",
        completionMode: "integration_auto",
        verificationConfig:
          '{\n  "inviteUrl": "{{project.discordUrl}}",\n  "integrationProvider": "discord",\n  "eventType": "discord_membership_confirmed"\n}',
        isRepeatable: false,
        sortOrder: 3,
        status: "active",
        requiredProjectFields: ["discordUrl"],
      },
    ],
    rewards: [
      {
        title: "{{project.name}} Holder Access",
        description: "Starter holder reward for connected users who complete the activation path.",
        type: "Access",
        rewardType: "allowlist",
        rarity: "epic",
        cost: 420,
        claimable: true,
        visible: true,
        icon: "🔐",
        imageUrl: "",
        stock: undefined,
        unlimitedStock: true,
        claimMethod: "manual_fulfillment",
        deliveryConfig:
          '{\n  "notes": "Grant holder access, role or gated perk after validating the completion path."\n}',
        status: "active",
      },
    ],
  },
};

function getProjectFieldValue(project: AdminProject, field: keyof AdminProject) {
  const value = project[field];
  return typeof value === "string" ? value : "";
}

function deriveProjectContext(project: AdminProject) {
  const xHandle = project.xUrl
    ? project.xUrl
        .replace(/^https?:\/\/(www\.)?x\.com\//, "")
        .replace(/^https?:\/\/(www\.)?twitter\.com\//, "")
        .replace(/\/.*$/, "")
    : "";

  return {
    project: {
      ...project,
      xHandle,
    },
  };
}

function resolveTemplateText(template: string | undefined, project: AdminProject) {
  if (!template) return "";
  const context = deriveProjectContext(project);

  return template.replace(/\{\{(project|derived)\.([a-zA-Z0-9_]+)\}\}/g, (_, source, key) => {
    if (source === "project") {
      const normalizedKey = key as keyof AdminProject;
      return getProjectFieldValue(context.project, normalizedKey) || "";
    }

    if (source === "derived" && key === "xHandle") {
      return context.project.xHandle || "";
    }

    return "";
  });
}

function resolveQuestDraft(
  quest: CampaignTemplateDefinition["quests"][number],
  project: AdminProject,
  campaignDraft: Omit<AdminCampaign, "id">
): ResolvedQuestDraft {
  const missingProjectFields = (quest.requiredProjectFields ?? []).filter(
    (field) => !getProjectFieldValue(project, field)
  );
  const draft = {
    projectId: project.id,
    campaignId: "",
    title: resolveTemplateText(quest.title, project),
    description: resolveTemplateText(quest.description, project),
    shortDescription: resolveTemplateText(quest.shortDescription, project),
    type: quest.type,
    questType: quest.questType,
    platform: quest.platform,
    xp: quest.xp,
    actionLabel: resolveTemplateText(quest.actionLabel, project),
    actionUrl: resolveTemplateText(quest.actionUrl, project),
    proofRequired: quest.proofRequired,
    proofType: quest.proofType,
    autoApprove: quest.autoApprove,
    verificationType: quest.verificationType,
    verificationProvider: quest.verificationProvider,
    completionMode: quest.completionMode,
    verificationConfig: resolveTemplateText(quest.verificationConfig, project),
    isRepeatable: quest.isRepeatable,
    cooldownSeconds: quest.cooldownSeconds,
    maxCompletionsPerUser: quest.maxCompletionsPerUser,
    sortOrder: quest.sortOrder,
    startsAt: campaignDraft.startsAt,
    endsAt: campaignDraft.endsAt,
    status: quest.status,
  };

  return {
    key: `${quest.questType}-${quest.sortOrder}-${draft.title}`,
    draft,
    missingProjectFields,
    autofilledFields: ["title", "description", "actionUrl", "verificationConfig"].filter(
      (field) => {
        if (field === "actionUrl") return !!draft.actionUrl;
        if (field === "verificationConfig") return !!draft.verificationConfig;
        if (field === "title") return quest.title.includes("{{");
        if (field === "description") return quest.description.includes("{{");
        return false;
      }
    ),
  };
}

function resolveRewardDraft(
  reward: CampaignTemplateDefinition["rewards"][number],
  project: AdminProject
): ResolvedRewardDraft {
  const draft = {
    projectId: project.id,
    campaignId: "",
    title: resolveTemplateText(reward.title, project),
    description: resolveTemplateText(reward.description, project),
    type: reward.type,
    rewardType: reward.rewardType,
    rarity: reward.rarity,
    cost: reward.cost,
    claimable: reward.claimable,
    visible: reward.visible,
    icon: reward.icon,
    imageUrl: resolveTemplateText(reward.imageUrl, project),
    stock: reward.stock,
    unlimitedStock: reward.unlimitedStock,
    claimMethod: reward.claimMethod,
    deliveryConfig: resolveTemplateText(reward.deliveryConfig, project),
    status: reward.status,
  };

  return {
    key: `${reward.rewardType}-${reward.title}`,
    draft,
    missingProjectFields: [],
    autofilledFields: ["title", "description", "deliveryConfig"].filter((field) => {
      if (field === "deliveryConfig") return !!draft.deliveryConfig;
      if (field === "title") return reward.title.includes("{{");
      if (field === "description") return reward.description.includes("{{");
      return false;
    }),
  };
}

export function getCampaignTemplateOptions() {
  return Object.values(TEMPLATE_DEFINITIONS).map((template) => ({
    ...template,
    fitScore: 0,
    fitLabel: "Good fit" as const,
    fitReasons: [],
  }));
}

export function getRecommendedCampaignTemplateOptions(project?: AdminProject | null) {
  return Object.values(TEMPLATE_DEFINITIONS)
    .map((template) => assessTemplateFit(template, project))
    .sort((a, b) => b.fitScore - a.fitScore || a.label.localeCompare(b.label));
}

export function buildCampaignTemplate(
  project: AdminProject,
  templateId: CampaignTemplateId
): BuildTemplateResult {
  const template = TEMPLATE_DEFINITIONS[templateId];
  const missingProjectFields = Array.from(
    new Set(
      [
        ...template.requiredProjectFields,
        ...template.quests.flatMap((quest) => quest.requiredProjectFields ?? []),
      ].filter((field) => !getProjectFieldValue(project, field))
    )
  );

  const title = resolveTemplateText(template.campaign.title, project);
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const campaignDraft: Omit<AdminCampaign, "id"> = {
    projectId: project.id,
    title,
    slug,
    shortDescription: resolveTemplateText(template.campaign.shortDescription, project),
    longDescription: resolveTemplateText(template.campaign.longDescription, project),
    bannerUrl: resolveTemplateText(template.campaign.bannerUrl, project),
    thumbnailUrl: resolveTemplateText(template.campaign.thumbnailUrl, project),
    campaignType: template.campaign.campaignType,
    xpBudget: template.campaign.xpBudget,
    participants: 0,
    completionRate: 0,
    visibility: template.campaign.visibility,
    featured: template.campaign.featured,
    startsAt: "",
    endsAt: "",
    status: "draft",
  };

  return {
    campaignDraft,
    questDrafts: template.quests.map((quest) =>
      resolveQuestDraft(quest, project, campaignDraft)
    ),
    rewardDrafts: template.rewards.map((reward) => resolveRewardDraft(reward, project)),
    missingProjectFields,
  };
}

export function formatProjectFieldLabel(field: keyof AdminProject) {
  switch (field) {
    case "xUrl":
      return "X URL";
    case "telegramUrl":
      return "Telegram URL";
    case "discordUrl":
      return "Discord URL";
    case "bannerUrl":
      return "Banner URL";
    case "contactEmail":
      return "Contact email";
    default:
      return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  }
}

function assessTemplateFit(
  template: CampaignTemplateDefinition,
  project?: AdminProject | null
): CampaignTemplateOption {
  if (!project) {
    return {
      ...template,
      fitScore: 40,
      fitLabel: "Good fit",
      fitReasons: ["Choose a project workspace to get a personalized recommendation."],
    };
  }

  const reasons: string[] = [];
  let score = 45;

  const presentRequiredFields = template.requiredProjectFields.filter((field) =>
    Boolean(getProjectFieldValue(project, field))
  );
  const missingRequiredFields = template.requiredProjectFields.filter(
    (field) => !getProjectFieldValue(project, field)
  );

  score += presentRequiredFields.length * 10;
  score -= missingRequiredFields.length * 8;

  if (presentRequiredFields.length > 0) {
    reasons.push(
      `Ready project context: ${presentRequiredFields
        .map((field) => formatProjectFieldLabel(field))
        .join(", ")}.`
    );
  }

  if (missingRequiredFields.length > 0) {
    reasons.push(
      `Needs setup for ${missingRequiredFields
        .map((field) => formatProjectFieldLabel(field))
        .join(", ")}.`
    );
  }

  if (template.id === "holder_activation_path" && project.chain.trim()) {
    score += 18;
    reasons.push(`Chain is already set to ${project.chain}, which helps wallet-first onboarding.`);
  }

  if (template.id === "holder_activation_path" && project.tokenContractAddress) {
    score += 14;
    reasons.push("Token contract is already set, so holder verification can auto-configure cleanly.");
  }

  if (
    (template.id === "community_growth_starter" ||
      template.id === "ecosystem_onboarding_loop" ||
      template.id === "social_raid_push") &&
    (project.telegramUrl || project.discordUrl)
  ) {
    score += 10;
    reasons.push("Community channels are already connected, so social/community quests can auto-wire fast.");
  }

  if (
    (template.id === "launch_hype_sprint" ||
      template.id === "content_creator_flywheel" ||
      template.id === "referral_growth_loop") &&
    project.xUrl
  ) {
    score += 10;
    reasons.push("The X profile is connected, which strengthens social, creator and launch templates.");
  }

  if ((template.id === "referral_growth_loop" || template.id === "launch_hype_sprint") && project.website) {
    score += 8;
    reasons.push("Website traffic is ready to route into launch or referral conversion.");
  }

  if (template.id === "launch_hype_sprint" && project.launchPostUrl) {
    score += 12;
    reasons.push("Launch post URL is set, so the hype sprint can point users at the exact social moment.");
  }

  if (template.id === "referral_growth_loop" && project.waitlistUrl) {
    score += 12;
    reasons.push("Waitlist URL is present, which makes the referral path much cleaner to convert.");
  }

  if (template.id === "content_creator_flywheel" && project.docsUrl) {
    score += 10;
    reasons.push("Docs are linked, which gives creator contributors better research context upfront.");
  }

  const fitLabel =
    score >= 88
      ? "Best fit"
      : score >= 72
      ? "Strong fit"
      : score >= 55
      ? "Good fit"
      : "Needs setup";

  return {
    ...template,
    fitScore: Math.max(0, Math.min(100, score)),
    fitLabel,
    fitReasons: reasons.slice(0, 3),
  };
}
