import { AdminCampaign } from "@/types/entities/campaign";

export const mockCampaigns: AdminCampaign[] = [
  {
    id: "c1",
    projectId: "p1",

    title: "Weekly Meme Push",
    slug: "weekly-meme-push",

    shortDescription: "Boost meme visibility across social channels.",
    longDescription: "",

    bannerUrl: "",
    thumbnailUrl: "",

    campaignType: "social_growth",

    xpBudget: 12000,
    participants: 1421,
    completionRate: 64,

    visibility: "public",
    featured: true,

    startsAt: "",
    endsAt: "",

    status: "active",
  },
  {
    id: "c2",
    projectId: "p2",

    title: "Launch Warmup",
    slug: "launch-warmup",

    shortDescription: "Warm up the community before launch.",
    longDescription: "",

    bannerUrl: "",
    thumbnailUrl: "",

    campaignType: "community_growth",

    xpBudget: 9000,
    participants: 882,
    completionRate: 38,

    visibility: "public",
    featured: false,

    startsAt: "",
    endsAt: "",

    status: "active",
  },
  {
    id: "c3",
    projectId: "p3",

    title: "Ambassador Sprint",
    slug: "ambassador-sprint",

    shortDescription: "Quest-heavy ambassador drive for top contributors.",
    longDescription: "",

    bannerUrl: "",
    thumbnailUrl: "",

    campaignType: "hybrid",

    xpBudget: 18000,
    participants: 0,
    completionRate: 0,

    visibility: "private",
    featured: false,

    startsAt: "",
    endsAt: "",

    status: "draft",
  },
];