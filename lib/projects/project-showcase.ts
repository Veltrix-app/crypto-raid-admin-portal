import type { AdminCampaign } from "@/types/entities/campaign";
import type { AdminProject } from "@/types/entities/project";
import type { AdminQuest } from "@/types/entities/quest";
import type { AdminRaid } from "@/types/entities/raid";
import type { AdminReward } from "@/types/entities/reward";

export type AdminShowcaseStatus = "live" | "ready" | "missing";

export type AdminShowcaseModule = {
  key: string;
  label: string;
  title: string;
  description: string;
  status: AdminShowcaseStatus;
  source: string;
  nextAction: string;
};

export type AdminShowcaseReadinessItem = {
  label: string;
  value: string;
  status: AdminShowcaseStatus;
};

export type AdminProjectShowcaseModel = {
  publicUrl: string;
  score: number;
  nextAction: string;
  modules: AdminShowcaseModule[];
  readiness: AdminShowcaseReadinessItem[];
  autoFilledFields: AdminShowcaseReadinessItem[];
  counts: {
    campaigns: number;
    quests: number;
    raids: number;
    rewards: number;
  };
};

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function statusFor(value: boolean, live = value): AdminShowcaseStatus {
  if (live) return "live";
  if (value) return "ready";
  return "missing";
}

function score(status: AdminShowcaseStatus) {
  if (status === "live") return 1;
  if (status === "ready") return 0.75;
  return 0;
}

export function getPublicProjectShowcaseUrl(project: Pick<AdminProject, "id" | "slug">) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEBAPP_URL ||
    "https://veltrix-web.vercel.app"
  ).replace(/\/$/, "");

  return `${baseUrl}/projects/${encodeURIComponent(project.id)}`;
}

export function buildAdminProjectShowcase(input: {
  project: AdminProject;
  campaigns: AdminCampaign[];
  quests: AdminQuest[];
  raids: AdminRaid[];
  rewards: AdminReward[];
}): AdminProjectShowcaseModel {
  const { project } = input;
  const campaigns = input.campaigns.filter((campaign) => campaign.projectId === project.id);
  const campaignIds = new Set(campaigns.map((campaign) => campaign.id));
  const quests = input.quests.filter((quest) => quest.projectId === project.id);
  const raids = input.raids.filter(
    (raid) => raid.projectId === project.id || campaignIds.has(raid.campaignId)
  );
  const rewards = input.rewards.filter(
    (reward) =>
      reward.projectId === project.id ||
      (reward.campaignId ? campaignIds.has(reward.campaignId) : false)
  );
  const hasSocial = hasValue(project.xUrl) || hasValue(project.telegramUrl) || hasValue(project.discordUrl);
  const readiness: AdminShowcaseReadinessItem[] = [
    {
      label: "Visual identity",
      value: hasValue(project.logo) && hasValue(project.bannerUrl)
        ? "Logo and banner are ready."
        : "Add a logo and a wide banner.",
      status: statusFor(hasValue(project.logo) && hasValue(project.bannerUrl)),
    },
    {
      label: "Narrative",
      value: hasValue(project.longDescription)
        ? "Long-form story can power the showcase."
        : "Add the long-form project story.",
      status: statusFor(hasValue(project.longDescription)),
    },
    {
      label: "Token contract",
      value: hasValue(project.tokenContractAddress)
        ? project.tokenContractAddress!
        : "Add token contract for market, scan and swap modules.",
      status: statusFor(hasValue(project.tokenContractAddress)),
    },
    {
      label: "Primary wallet",
      value: hasValue(project.primaryWallet)
        ? "Treasury or operations wallet is present."
        : "Add a primary wallet for safety context.",
      status: statusFor(hasValue(project.primaryWallet)),
    },
    {
      label: "Social links",
      value: hasSocial ? "At least one social channel is connected." : "Add X, Telegram or Discord.",
      status: statusFor(hasSocial),
    },
    {
      label: "Daily activation",
      value: quests.length > 0 ? `${quests.length} project quests are ready.` : "Create a live quest.",
      status: statusFor(quests.length > 0),
    },
  ];
  const missing = readiness.find((item) => item.status === "missing");

  return {
    publicUrl: getPublicProjectShowcaseUrl(project),
    score: Math.round(
      (readiness.reduce((sum, item) => sum + score(item.status), 0) / readiness.length) * 100
    ),
    nextAction: missing
      ? `${missing.label}: ${missing.value}`
      : "Public showcase is ready for premium traffic.",
    counts: {
      campaigns: campaigns.length,
      quests: quests.length,
      raids: raids.length,
      rewards: rewards.length,
    },
    readiness,
    autoFilledFields: [
      { label: "Name", value: project.name, status: statusFor(hasValue(project.name)) },
      { label: "Slug", value: project.slug || "Missing", status: statusFor(hasValue(project.slug)) },
      { label: "Chain", value: project.chain, status: statusFor(hasValue(project.chain)) },
      { label: "Category", value: project.category || "Missing", status: statusFor(hasValue(project.category)) },
      { label: "Website", value: project.website || "Missing", status: statusFor(hasValue(project.website)) },
      { label: "Docs", value: project.docsUrl || "Missing", status: statusFor(hasValue(project.docsUrl)) },
    ],
    modules: [
      {
        key: "profile",
        label: "Profile",
        title: "CoinMarketCap-style project profile",
        description: "Name, story, visuals, links, chain, category and community presence.",
        status: statusFor(hasValue(project.description) && hasValue(project.website)),
        source: "Project Settings",
        nextAction: "Keep identity fields complete and approved.",
      },
      {
        key: "token",
        label: "Market",
        title: "Token and contract section",
        description: "Explorer link, contract address and token context prepared for live price later.",
        status: statusFor(hasValue(project.tokenContractAddress)),
        source: "Settings + On-chain",
        nextAction: "Add token contract and treasury wallet.",
      },
      {
        key: "swap",
        label: "Swap",
        title: "Preset swap entry",
        description: "Routes users into the VYNTRO swap UI with this project token context.",
        status: statusFor(hasValue(project.tokenContractAddress)),
        source: "DeFi Swap",
        nextAction: "Register the token in the swap route list before enabling one-click swaps.",
      },
      {
        key: "scan",
        label: "Security",
        title: "AI contract scan preview",
        description: "Public safety read that can attach explorer source, ABI and contract findings.",
        status: statusFor(
          hasValue(project.tokenContractAddress) || hasValue(project.nftContractAddress)
        ),
        source: "Security Scan",
        nextAction: "Connect token or NFT contract first.",
      },
      {
        key: "activation",
        label: "Activation",
        title: "Daily quests and raids",
        description: "Always-on tasks, raids and campaigns visible from the project showcase.",
        status: statusFor(quests.length > 0 || raids.length > 0),
        source: "Quests + Raids",
        nextAction: "Create one live quest or raid.",
      },
      {
        key: "rewards",
        label: "Rewards",
        title: "Reward assurance",
        description: "Shows reward stock and funding posture so users trust the campaign outcome.",
        status: statusFor(rewards.length > 0),
        source: "Reward Studio",
        nextAction: "Create and fund at least one visible reward.",
      },
    ],
  };
}
