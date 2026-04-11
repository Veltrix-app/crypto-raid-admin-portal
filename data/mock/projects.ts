import { AdminProject } from "@/types/entities/project";

export const mockProjects: AdminProject[] = [
  {
    id: "p1",
    name: "Pepe Raiders",
    slug: "pepe-raiders",

    chain: "Base",
    category: "Meme",

    status: "active",
    onboardingStatus: "approved",

    description:
      "Meme-first community focused on raids, viral pushes and fast social growth.",
    longDescription: "",

    members: 18244,
    campaigns: 3,

    logo: "🚀",
    bannerUrl: "",

    website: "https://peperaiders.xyz",
    xUrl: "",
    telegramUrl: "",
    discordUrl: "",

    contactEmail: "team@peperaiders.xyz",

    isFeatured: true,
    isPublic: true,
  },
  {
    id: "p2",
    name: "Nova DeFi",
    slug: "nova-defi",

    chain: "Solana",
    category: "DeFi",

    status: "active",
    onboardingStatus: "approved",

    description:
      "DeFi-native campaign system for launch growth and community activation.",
    longDescription: "",

    members: 9340,
    campaigns: 2,

    logo: "💠",
    bannerUrl: "",

    website: "https://novadefi.xyz",
    xUrl: "",
    telegramUrl: "",
    discordUrl: "",

    contactEmail: "growth@novadefi.xyz",

    isFeatured: false,
    isPublic: true,
  },
  {
    id: "p3",
    name: "ChainGuild",
    slug: "chainguild",

    chain: "Ethereum",
    category: "Gaming",

    status: "draft",
    onboardingStatus: "pending",

    description:
      "Gaming and NFT growth guild with quest-heavy community campaigns.",
    longDescription: "",

    members: 27111,
    campaigns: 5,

    logo: "⚔️",
    bannerUrl: "",

    website: "https://chainguild.xyz",
    xUrl: "",
    telegramUrl: "",
    discordUrl: "",

    contactEmail: "ops@chainguild.xyz",

    isFeatured: false,
    isPublic: true,
  },
];