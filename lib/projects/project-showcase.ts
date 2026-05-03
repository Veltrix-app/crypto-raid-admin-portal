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

export type AdminShowcaseControlKey =
  | "longDescription"
  | "bannerUrl"
  | "website"
  | "docsUrl"
  | "tokenContractAddress"
  | "primaryWallet";

export type AdminShowcaseControlGroup = "profile" | "market";

export type AdminShowcaseControl = {
  key: AdminShowcaseControlKey;
  label: string;
  value: string;
  status: AdminShowcaseStatus;
  control: "input" | "textarea";
  group: AdminShowcaseControlGroup;
  placeholder: string;
  helper: string;
};

export type AdminShowcaseProjectAsset = {
  id?: string;
  chain: string;
  contract_address: string;
  asset_type: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

export type AdminShowcaseRegistry = {
  status: AdminShowcaseStatus;
  tokenSymbol: string;
  tokenContractAddress: string;
  decimalsLabel: string;
  swapEnabled: boolean;
  priceSource: string;
  scanEnrichment: AdminShowcaseScanEnrichment;
  nextAction: string;
};

export type AdminShowcaseScanSeverity = "positive" | "info" | "warning" | "danger";

export type AdminShowcaseScanEnrichment = {
  sourceVerified: boolean | null;
  abiAvailable: boolean | null;
  proxyDetected: boolean | null;
  ownerRenounced: boolean | null;
  auditUrl: string | null;
  explorerSourceUrl: string | null;
  updatedAt: string | null;
};

export type AdminShowcaseScanFinding = {
  label: string;
  detail: string;
  evidence: string;
  severity: AdminShowcaseScanSeverity;
};

export type AdminShowcaseScan = {
  status: AdminShowcaseStatus;
  riskLevel: "low" | "medium" | "high" | "unknown";
  score: number;
  summary: string;
  enrichment: AdminShowcaseScanEnrichment;
  findings: AdminShowcaseScanFinding[];
  nextAction: string;
};

export type AdminShowcasePremiumModule = {
  key: "market-intelligence" | "contract-intelligence" | "activation-engine" | "reward-assurance";
  eyebrow: string;
  title: string;
  description: string;
  status: AdminShowcaseStatus;
  primaryMetric: string;
  secondaryMetric: string;
  highlights: string[];
  source: string;
  nextAction: string;
};

export type AdminProjectShowcaseModel = {
  publicUrl: string;
  score: number;
  nextAction: string;
  modules: AdminShowcaseModule[];
  readiness: AdminShowcaseReadinessItem[];
  autoFilledFields: AdminShowcaseReadinessItem[];
  controls: AdminShowcaseControl[];
  registry: AdminShowcaseRegistry;
  scan: AdminShowcaseScan;
  premiumModules: AdminShowcasePremiumModule[];
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

function buildControl(input: {
  key: AdminShowcaseControlKey;
  label: string;
  value: string | null | undefined;
  control?: AdminShowcaseControl["control"];
  group: AdminShowcaseControlGroup;
  placeholder: string;
  helper: string;
}): AdminShowcaseControl {
  return {
    key: input.key,
    label: input.label,
    value: input.value ?? "",
    status: statusFor(hasValue(input.value)),
    control: input.control ?? "input",
    group: input.group,
    placeholder: input.placeholder,
    helper: input.helper,
  };
}

function normalizeAddress(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isLikelyEvmAddress(value: string | null | undefined) {
  return /^0x[a-fA-F0-9]{40}$/.test((value ?? "").trim());
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getScanRiskLevel(score: number, hasCriticalFinding: boolean) {
  if (hasCriticalFinding) return "high";
  if (score >= 80) return "low";
  if (score >= 55) return "medium";
  return "high";
}

const EMPTY_SCAN_ENRICHMENT: AdminShowcaseScanEnrichment = {
  sourceVerified: null,
  abiAvailable: null,
  proxyDetected: null,
  ownerRenounced: null,
  auditUrl: null,
  explorerSourceUrl: null,
  updatedAt: null,
};

function readMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function readMetadataFlag(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "boolean" ? value : null;
}

function readMetadataObject(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeScanEnrichment(
  metadata: Record<string, unknown> | null | undefined
): AdminShowcaseScanEnrichment {
  const scan = readMetadataObject(metadata, "contractScan");
  const readFlag = (key: string) => {
    const value = scan[key];
    return typeof value === "boolean" ? value : null;
  };
  const readString = (key: string) => {
    const value = scan[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  };

  return {
    ...EMPTY_SCAN_ENRICHMENT,
    sourceVerified: readFlag("sourceVerified"),
    abiAvailable: readFlag("abiAvailable"),
    proxyDetected: readFlag("proxyDetected"),
    ownerRenounced: readFlag("ownerRenounced"),
    auditUrl: readString("auditUrl"),
    explorerSourceUrl: readString("explorerSourceUrl"),
    updatedAt: readString("updatedAt"),
  };
}

function isTokenAsset(asset: AdminShowcaseProjectAsset) {
  const type = asset.asset_type.trim().toLowerCase();
  return (
    type === "token" ||
    type === "erc20" ||
    type === "project_token" ||
    type === "utility_token" ||
    type === "governance_token"
  );
}

function buildRegistrySummary(input: {
  project: AdminProject;
  assets: AdminShowcaseProjectAsset[];
}): AdminShowcaseRegistry {
  const tokenAddress = normalizeAddress(input.project.tokenContractAddress);
  const matchingAsset =
    input.assets.find(
      (asset) =>
        asset.is_active &&
        isTokenAsset(asset) &&
        normalizeAddress(asset.contract_address) === tokenAddress
    ) ??
    input.assets.find((asset) => asset.is_active && isTokenAsset(asset)) ??
    null;
  const metadata = matchingAsset?.metadata ?? {};
  const swapEnabled =
    Boolean(matchingAsset) &&
    readMetadataFlag(metadata, "swapEnabled") !== false &&
    readMetadataFlag(metadata, "showcaseSwapEnabled") !== false;
  const priceSource = readMetadataString(metadata, "priceSource") || "dexscreener";
  const scanEnrichment = normalizeScanEnrichment(metadata);

  if (!matchingAsset) {
    return {
      status: "missing",
      tokenSymbol: "Missing",
      tokenContractAddress: input.project.tokenContractAddress || "Missing",
      decimalsLabel: "Missing",
      swapEnabled: false,
      priceSource,
      scanEnrichment,
      nextAction: "Register the project token as an active tracked asset.",
    };
  }

  return {
    status: swapEnabled ? "live" : "ready",
    tokenSymbol: matchingAsset.symbol || "TOKEN",
    tokenContractAddress: matchingAsset.contract_address,
    decimalsLabel: `${matchingAsset.decimals} decimals`,
    swapEnabled,
    priceSource,
    scanEnrichment,
    nextAction: swapEnabled
      ? `${matchingAsset.symbol} is registered for swap and live price reads.`
      : "Enable swap metadata before public one-click routes go live.",
  };
}

function buildScanSummary(input: {
  project: AdminProject;
  registry: AdminShowcaseRegistry;
}): AdminShowcaseScan {
  const tokenContractAddress = input.project.tokenContractAddress?.trim() || "";
  const nftContractAddress = input.project.nftContractAddress?.trim() || "";
  const primaryWallet = input.project.primaryWallet?.trim() || "";
  const hasContractSource = hasValue(tokenContractAddress) || hasValue(nftContractAddress);
  const enrichment = input.registry.scanEnrichment;

  if (!hasContractSource) {
    return {
      status: "missing",
      riskLevel: "unknown",
      score: 0,
      summary: "No contract source is connected for the public AI scan yet.",
      enrichment,
      findings: [
        {
          label: "Contract source",
          detail: "Add a token or NFT contract before publishing the scan module.",
          evidence: "Project Settings",
          severity: "warning",
        },
      ],
      nextAction: "Add a token or NFT contract to start the AI contract scan.",
    };
  }

  const findings: AdminShowcaseScanFinding[] = [];
  let score = 34;
  let hasCriticalFinding = false;

  if (tokenContractAddress) {
    if (isLikelyEvmAddress(tokenContractAddress)) {
      score += 16;
      findings.push({
        label: "Token contract",
        detail: "Token contract is a valid EVM address for explorer and scan routing.",
        evidence: tokenContractAddress,
        severity: "positive",
      });
    } else {
      score -= 28;
      hasCriticalFinding = true;
      findings.push({
        label: "Token contract",
        detail: "Token contract does not look like a valid EVM address.",
        evidence: tokenContractAddress,
        severity: "danger",
      });
    }
  }

  if (nftContractAddress) {
    if (isLikelyEvmAddress(nftContractAddress)) {
      score += 8;
      findings.push({
        label: "NFT contract",
        detail: "NFT contract is available as a secondary public identity signal.",
        evidence: nftContractAddress,
        severity: "info",
      });
    } else {
      score -= 18;
      hasCriticalFinding = true;
      findings.push({
        label: "NFT contract",
        detail: "NFT contract does not look like a valid EVM address.",
        evidence: nftContractAddress,
        severity: "danger",
      });
    }
  }

  if (input.registry.status === "live") {
    score += 22;
    findings.push({
      label: "Swap registry",
      detail: "Project token is registered as an active public swap and price asset.",
      evidence: input.registry.tokenSymbol,
      severity: "positive",
    });
  } else if (input.registry.status === "ready") {
    score += 10;
    findings.push({
      label: "Swap registry",
      detail: "Project token asset exists, but public swap metadata still needs enabling.",
      evidence: input.registry.tokenSymbol,
      severity: "warning",
    });
  } else {
    score -= 10;
    findings.push({
      label: "Swap registry",
      detail: "Register the token asset before the scan can confirm public swap routing.",
      evidence: "Project Assets",
      severity: "warning",
    });
  }

  if (input.registry.priceSource && input.registry.priceSource !== "Missing") {
    score += 8;
    findings.push({
      label: "Price source",
      detail: "Market lookup source is configured for live token context.",
      evidence: input.registry.priceSource,
      severity: "positive",
    });
  }

  if (primaryWallet) {
    if (isLikelyEvmAddress(primaryWallet)) {
      score += 12;
      findings.push({
        label: "Treasury context",
        detail: "Primary wallet is available for ownership or operations context.",
        evidence: primaryWallet,
        severity: "positive",
      });
    } else {
      score -= 8;
      findings.push({
        label: "Treasury context",
        detail: "Primary wallet is present but does not look like a valid EVM address.",
        evidence: primaryWallet,
        severity: "warning",
      });
    }
  } else {
    score -= 4;
    findings.push({
      label: "Treasury context",
      detail: "No primary wallet is present for ownership or treasury context.",
      evidence: "Project Settings",
      severity: "warning",
    });
  }

  if (enrichment.sourceVerified === true) {
    score += 12;
    findings.push({
      label: "Verified source",
      detail: "Explorer source verification is marked as complete for this contract.",
      evidence: enrichment.explorerSourceUrl ?? "Explorer",
      severity: "positive",
    });
  } else if (enrichment.sourceVerified === false) {
    score -= 12;
    findings.push({
      label: "Verified source",
      detail: "Explorer source verification is marked as missing.",
      evidence: enrichment.explorerSourceUrl ?? "Explorer",
      severity: "warning",
    });
  }

  if (enrichment.abiAvailable === true) {
    score += 8;
    findings.push({
      label: "ABI read",
      detail: "ABI availability is confirmed for deeper function-level scans.",
      evidence: enrichment.explorerSourceUrl ?? "Explorer ABI",
      severity: "positive",
    });
  } else if (enrichment.abiAvailable === false) {
    score -= 6;
    findings.push({
      label: "ABI read",
      detail: "ABI availability is not confirmed yet.",
      evidence: "Explorer ABI",
      severity: "warning",
    });
  }

  if (enrichment.auditUrl) {
    score += 10;
    findings.push({
      label: "External audit",
      detail: "Audit evidence is attached for public review.",
      evidence: enrichment.auditUrl,
      severity: "positive",
    });
  }

  if (enrichment.proxyDetected === true) {
    score -= 10;
    findings.push({
      label: "Proxy posture",
      detail: "Proxy contract signal is enabled; upgradeability context should remain visible.",
      evidence: "Project Assets metadata",
      severity: "warning",
    });
  } else if (enrichment.proxyDetected === false) {
    score += 5;
    findings.push({
      label: "Proxy posture",
      detail: "No proxy contract signal is marked for this asset.",
      evidence: "Project Assets metadata",
      severity: "info",
    });
  }

  if (enrichment.ownerRenounced === true) {
    score += 8;
    findings.push({
      label: "Ownership posture",
      detail: "Ownership is marked as renounced or materially constrained.",
      evidence: "Project Assets metadata",
      severity: "positive",
    });
  } else if (enrichment.ownerRenounced === false) {
    score -= 6;
    findings.push({
      label: "Ownership posture",
      detail: "Ownership is not marked as renounced, so admin-key context should remain visible.",
      evidence: "Project Assets metadata",
      severity: "warning",
    });
  }

  const normalizedScore = clampScore(score);
  const riskLevel = getScanRiskLevel(normalizedScore, hasCriticalFinding);
  const status: AdminShowcaseStatus =
    normalizedScore >= 80 && riskLevel === "low" ? "live" : normalizedScore >= 45 ? "ready" : "missing";
  const nextFinding =
    findings.find((finding) => finding.severity === "danger") ??
    findings.find((finding) => finding.severity === "warning") ??
    null;

  return {
    status,
    riskLevel,
    score: normalizedScore,
    summary:
      status === "live"
        ? "AI scan has contract, registry, price source, explorer and wallet context ready."
        : "AI scan preview is available, but operators should complete the missing contract signals first.",
    enrichment,
    findings,
    nextAction: nextFinding
      ? `${nextFinding.label}: ${nextFinding.detail}`
      : "Scan can graduate into ABI and source-code analysis.",
  };
}

function buildPremiumModules(input: {
  project: AdminProject;
  campaigns: AdminCampaign[];
  quests: AdminQuest[];
  raids: AdminRaid[];
  rewards: AdminReward[];
  registry: AdminShowcaseRegistry;
  scan: AdminShowcaseScan;
}): AdminShowcasePremiumModule[] {
  const activeActions = input.quests.length + input.raids.length;
  const claimableRewards = input.rewards.filter((reward) => reward.claimable).length;

  return [
    {
      key: "market-intelligence",
      eyebrow: "Market",
      title: `${input.registry.tokenSymbol} market read`,
      description: "Token, swap, price source and explorer readiness for the public market module.",
      status: input.registry.status,
      primaryMetric: input.registry.tokenSymbol,
      secondaryMetric: input.registry.swapEnabled ? "Swap enabled" : "Swap pending",
      highlights: [
        input.registry.tokenContractAddress,
        input.registry.decimalsLabel,
        input.registry.priceSource,
      ],
      source: "Project Assets",
      nextAction: input.registry.nextAction,
    },
    {
      key: "contract-intelligence",
      eyebrow: "Security",
      title: "AI contract intelligence",
      description: "Contract, source, ABI, audit and wallet signals prepared for public diligence.",
      status: input.scan.status,
      primaryMetric: `${input.scan.score}%`,
      secondaryMetric:
        input.scan.riskLevel === "unknown" ? "Risk unknown" : `${input.scan.riskLevel} risk`,
      highlights: input.scan.findings.slice(0, 3).map((finding) => finding.label),
      source: "AI Contract Scan",
      nextAction: input.scan.nextAction,
    },
    {
      key: "activation-engine",
      eyebrow: "Activation",
      title: "Community action engine",
      description: "Campaigns, quests and raids that can make the showcase immediately actionable.",
      status: statusFor(activeActions > 0),
      primaryMetric: String(activeActions),
      secondaryMetric: `${input.campaigns.length} campaigns`,
      highlights: [
        `${input.quests.length} quests`,
        `${input.raids.length} raids`,
        input.campaigns[0]?.title ?? "Campaign pending",
      ],
      source: "Campaigns + Quests + Raids",
      nextAction: activeActions > 0 ? "Keep mission lanes fresh." : "Create one live quest or raid.",
    },
    {
      key: "reward-assurance",
      eyebrow: "Rewards",
      title: "Reward assurance layer",
      description: "Visible reward supply and claim posture for premium project trust.",
      status: statusFor(input.rewards.length > 0),
      primaryMetric: String(input.rewards.length),
      secondaryMetric: `${claimableRewards} claimable`,
      highlights: [
        `${claimableRewards} claimable`,
        input.rewards[0]?.rarity ? `${input.rewards[0].rarity} lead reward` : "Reward pending",
        input.rewards[0]?.rewardType ?? "Funding posture pending",
      ],
      source: "Reward Studio",
      nextAction: input.rewards.length > 0 ? "Keep reward funding visible." : "Create and fund a visible reward.",
    },
  ];
}

export function buildAdminProjectShowcase(input: {
  project: AdminProject;
  campaigns: AdminCampaign[];
  quests: AdminQuest[];
  raids: AdminRaid[];
  rewards: AdminReward[];
  assets?: AdminShowcaseProjectAsset[];
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
  const registry = buildRegistrySummary({
    project,
    assets: input.assets ?? [],
  });
  const scan = buildScanSummary({
    project,
    registry,
  });
  const premiumModules = buildPremiumModules({
    project,
    campaigns,
    quests,
    raids,
    rewards,
    registry,
    scan,
  });
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
    controls: [
      buildControl({
        key: "longDescription",
        label: "Project story",
        value: project.longDescription,
        control: "textarea",
        group: "profile",
        placeholder: "Write the long-form public project narrative...",
        helper: "Feeds the premium hero story and project context modules.",
      }),
      buildControl({
        key: "bannerUrl",
        label: "Wide banner URL",
        value: project.bannerUrl,
        group: "profile",
        placeholder: "https://cdn.example.com/banner.png",
        helper: "Powers the first visual read on the public project page.",
      }),
      buildControl({
        key: "website",
        label: "Website",
        value: project.website,
        group: "profile",
        placeholder: "https://project.example",
        helper: "Primary public route for users who want to leave VYNTRO.",
      }),
      buildControl({
        key: "docsUrl",
        label: "Docs URL",
        value: project.docsUrl,
        group: "profile",
        placeholder: "https://docs.project.example",
        helper: "Adds deeper diligence context to the public showcase.",
      }),
      buildControl({
        key: "tokenContractAddress",
        label: "Token contract",
        value: project.tokenContractAddress,
        group: "market",
        placeholder: "0x...",
        helper: "Feeds market, scan and swap registry readiness for this project token.",
      }),
      buildControl({
        key: "primaryWallet",
        label: "Primary wallet",
        value: project.primaryWallet,
        group: "market",
        placeholder: "0x...",
        helper: "Adds treasury or operations context for safety modules.",
      }),
    ],
    registry,
    scan,
    premiumModules,
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
        status: registry.status,
        source: "DeFi Swap + Project Assets",
        nextAction: registry.nextAction,
      },
      {
        key: "scan",
        label: "Security",
        title: "AI contract scan preview",
        description: "Contract, registry, price source and wallet signals prepared for public safety reads.",
        status: scan.status,
        source: "AI Contract Scan",
        nextAction: scan.nextAction,
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
