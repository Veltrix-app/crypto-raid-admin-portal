import test from "node:test";
import assert from "node:assert/strict";

import { buildAdminProjectShowcase } from "./project-showcase";
import type { AdminProject } from "@/types/entities/project";

const baseProject: AdminProject = {
  id: "project-1",
  name: "VYNTRO Labs",
  slug: "vyntro-labs",
  chain: "Base",
  category: "Growth",
  status: "active",
  onboardingStatus: "approved",
  description: "Launch OS for community growth.",
  longDescription: "",
  members: 12500,
  campaigns: 0,
  logo: "https://cdn.example.com/logo.png",
  bannerUrl: "",
  website: "https://vyntro.example",
  xUrl: "https://x.com/vyntro",
  telegramUrl: "",
  discordUrl: "",
  docsUrl: "",
  waitlistUrl: "",
  launchPostUrl: "",
  tokenContractAddress: "",
  nftContractAddress: "",
  primaryWallet: "",
  brandAccent: "",
  brandMood: "",
  contactEmail: "team@vyntro.example",
  isFeatured: true,
  isPublic: true,
};

test("admin showcase exposes inline controls for premium public fields", () => {
  const showcase = buildAdminProjectShowcase({
    project: baseProject,
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
  });

  assert.deepEqual(
    showcase.controls.map((control) => control.key),
    [
      "longDescription",
      "bannerUrl",
      "website",
      "docsUrl",
      "tokenContractAddress",
      "primaryWallet",
    ]
  );
  assert.equal(showcase.controls.find((control) => control.key === "tokenContractAddress")?.status, "missing");
  assert.equal(showcase.controls.find((control) => control.key === "primaryWallet")?.group, "market");
  assert.equal(showcase.controls.find((control) => control.key === "longDescription")?.control, "textarea");
});

test("admin showcase controls report ready values without masking the source field", () => {
  const showcase = buildAdminProjectShowcase({
    project: {
      ...baseProject,
      longDescription: "A richer project narrative.",
      bannerUrl: "https://cdn.example.com/banner.png",
      docsUrl: "https://docs.example.com",
      tokenContractAddress: "0x1111111111111111111111111111111111111111",
      primaryWallet: "0x2222222222222222222222222222222222222222",
    },
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
  });

  const tokenControl = showcase.controls.find((control) => control.key === "tokenContractAddress");

  assert.equal(showcase.score > 65, true);
  assert.equal(tokenControl?.status, "live");
  assert.equal(tokenControl?.value, "0x1111111111111111111111111111111111111111");
  assert.match(tokenControl?.helper ?? "", /swap registry/i);
});

test("admin showcase summarizes the project token registry asset", () => {
  const showcase = buildAdminProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: "0x1111111111111111111111111111111111111111",
    },
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
    assets: [
      {
        id: "asset-1",
        chain: "base",
        contract_address: "0x1111111111111111111111111111111111111111",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: {
          swapEnabled: true,
          priceSource: "dexscreener",
        },
      },
    ],
  });

  assert.equal(showcase.registry.status, "live");
  assert.equal(showcase.registry.tokenSymbol, "VYN");
  assert.equal(showcase.registry.swapEnabled, true);
  assert.equal(showcase.registry.priceSource, "dexscreener");
  assert.match(showcase.registry.nextAction, /registered/i);
});

test("admin showcase builds an AI contract scan from registry and wallet signals", () => {
  const showcase = buildAdminProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: "0x1111111111111111111111111111111111111111",
      primaryWallet: "0x2222222222222222222222222222222222222222",
    },
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
    assets: [
      {
        id: "asset-1",
        chain: "base",
        contract_address: "0x1111111111111111111111111111111111111111",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: {
          swapEnabled: true,
          showcaseSwapEnabled: true,
          priceSource: "dexscreener",
        },
      },
    ],
  });

  assert.equal(showcase.scan.status, "live");
  assert.equal(showcase.scan.riskLevel, "low");
  assert.ok(showcase.scan.score >= 80);
  assert.equal(showcase.modules.find((module) => module.key === "scan")?.status, "live");
  assert.ok(showcase.scan.findings.some((finding) => finding.label === "Swap registry"));
});

test("admin showcase enriches scan from contract metadata and exposes premium modules", () => {
  const showcase = buildAdminProjectShowcase({
    project: {
      ...baseProject,
      tokenContractAddress: "0x1111111111111111111111111111111111111111",
      primaryWallet: "0x2222222222222222222222222222222222222222",
    },
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
    assets: [
      {
        id: "asset-1",
        chain: "base",
        contract_address: "0x1111111111111111111111111111111111111111",
        asset_type: "token",
        symbol: "VYN",
        decimals: 18,
        is_active: true,
        metadata: {
          swapEnabled: true,
          showcaseSwapEnabled: true,
          priceSource: "dexscreener",
          contractScan: {
            sourceVerified: true,
            abiAvailable: true,
            auditUrl: "https://audit.example.com/vyn",
            proxyDetected: false,
            ownerRenounced: true,
          },
        },
      },
    ],
  });

  assert.equal(showcase.scan.enrichment.sourceVerified, true);
  assert.equal(showcase.scan.enrichment.auditUrl, "https://audit.example.com/vyn");
  assert.ok(showcase.scan.findings.some((finding) => finding.label === "Verified source"));
  assert.deepEqual(
    showcase.premiumModules.map((module) => module.key),
    ["market-intelligence", "contract-intelligence", "activation-engine", "reward-assurance"]
  );
});

test("admin showcase scan calls out missing contract source", () => {
  const showcase = buildAdminProjectShowcase({
    project: baseProject,
    campaigns: [],
    quests: [],
    raids: [],
    rewards: [],
  });

  assert.equal(showcase.scan.status, "missing");
  assert.equal(showcase.scan.riskLevel, "unknown");
  assert.match(showcase.scan.nextAction, /token or NFT contract/i);
});
