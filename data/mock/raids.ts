import { AdminRaid } from "@/types/entities/raid";

export const mockRaids: AdminRaid[] = [
  {
    id: "r1",

    projectId: "p1",
    campaignId: "c1",

    title: "Push teaser thread",
    shortDescription: "Boost the teaser thread with community engagement.",
    community: "Pepe Raiders",
    target: "Like, repost and drop a funny comment.",

    banner: "",

    rewardXp: 40,
    participants: 382,
    progress: 78,
    timer: "18m left",

    platform: "x",

    targetUrl: "",
    targetPostId: "",
    targetAccountHandle: "",

    verificationType: "manual_confirm",
    verificationConfig: "",

    instructions: [
      "Open the target post",
      "Like and repost it",
      "Leave a short comment",
      "Return to the app and confirm completion",
    ],

    startsAt: "",
    endsAt: "",

    status: "active",
  },
  {
    id: "r2",

    projectId: "p2",
    campaignId: "c2",

    title: "Quote rumor thread",
    shortDescription: "Quote the rumor thread and mention your squad.",
    community: "Nova DeFi",
    target: "Quote the post and mention your squad.",

    banner: "",

    rewardXp: 60,
    participants: 0,
    progress: 0,
    timer: "42m left",

    platform: "x",

    targetUrl: "",
    targetPostId: "",
    targetAccountHandle: "",

    verificationType: "manual_confirm",
    verificationConfig: "",

    instructions: [
      "Open the rumor thread",
      "Quote the post",
      "Mention your squad or community name",
      "Return and confirm your action",
    ],

    startsAt: "",
    endsAt: "",

    status: "scheduled",
  },
];