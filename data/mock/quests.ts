import { AdminQuest } from "@/types/entities/quest";

export const mockQuests: AdminQuest[] = [
  {
    id: "q1",

    projectId: "p1",
    campaignId: "c1",

    title: "Follow X account",
    description: "Follow the official X account to stay updated.",
    shortDescription: "",

    type: "social",
    questType: "social_follow",
    platform: "x",

    xp: 30,
    actionLabel: "Open X",
    actionUrl: "",

    proofRequired: false,
    proofType: "none",

    autoApprove: true,
    verificationType: "api_check",
    verificationConfig: "",

    isRepeatable: false,
    cooldownSeconds: undefined,
    maxCompletionsPerUser: 1,
    sortOrder: 0,

    startsAt: "",
    endsAt: "",

    status: "active",
  },
  {
    id: "q2",

    projectId: "p1",
    campaignId: "c1",

    title: "Upload meme proof",
    description: "Create a meme, post it, and upload proof.",
    shortDescription: "",

    type: "proof",
    questType: "manual_proof",
    platform: "custom",

    xp: 60,
    actionLabel: "Upload Proof",
    actionUrl: "",

    proofRequired: true,
    proofType: "image",

    autoApprove: false,
    verificationType: "manual_review",
    verificationConfig: "",

    isRepeatable: false,
    cooldownSeconds: undefined,
    maxCompletionsPerUser: 1,
    sortOrder: 1,

    startsAt: "",
    endsAt: "",

    status: "active",
  },
  {
    id: "q3",

    projectId: "p2",
    campaignId: "c2",

    title: "Connect wallet",
    description: "Connect your wallet for reward eligibility.",
    shortDescription: "",

    type: "on-chain",
    questType: "wallet_connect",
    platform: "wallet",

    xp: 40,
    actionLabel: "Connect Wallet",
    actionUrl: "",

    proofRequired: false,
    proofType: "none",

    autoApprove: true,
    verificationType: "onchain_check",
    verificationConfig: "",

    isRepeatable: false,
    cooldownSeconds: undefined,
    maxCompletionsPerUser: 1,
    sortOrder: 0,

    startsAt: "",
    endsAt: "",

    status: "draft",
  },
];