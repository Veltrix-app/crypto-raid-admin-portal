"use client";

import Image from "next/image";

const CONTRIBUTION_TIER_BADGES = {
  explorer: {
    label: "Explorer",
    src: "/brand/progress-badges/explorer-badge.webp",
    tone: "border-cyan-300/18 bg-cyan-300/[0.07] text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.08)]",
  },
  contender: {
    label: "Contender",
    src: "/brand/progress-badges/contender-badge.webp",
    tone: "border-violet-300/18 bg-violet-300/[0.07] text-violet-100 shadow-[0_0_18px_rgba(196,181,253,0.08)]",
  },
  champion: {
    label: "Champion",
    src: "/brand/progress-badges/champion-badge.webp",
    tone: "border-amber-300/18 bg-amber-300/[0.08] text-amber-100 shadow-[0_0_18px_rgba(252,211,77,0.08)]",
  },
  legend: {
    label: "Legend",
    src: "/brand/progress-badges/legend-badge.webp",
    tone: "border-fuchsia-300/18 bg-fuchsia-300/[0.075] text-fuchsia-100 shadow-[0_0_22px_rgba(217,70,239,0.1)]",
  },
} as const;

export type ContributionTierName = keyof typeof CONTRIBUTION_TIER_BADGES;

const sizeStyles = {
  sm: {
    root: "gap-1.5 px-2 py-1",
    image: "h-5 w-5",
    text: "text-[8px] tracking-[0.13em]",
    sizes: "20px",
  },
  md: {
    root: "gap-2 px-2.5 py-1.5",
    image: "h-7 w-7",
    text: "text-[9px] tracking-[0.15em]",
    sizes: "28px",
  },
  lg: {
    root: "gap-2.5 px-3 py-2",
    image: "h-10 w-10",
    text: "text-[10px] tracking-[0.17em]",
    sizes: "40px",
  },
} as const;

export function normalizeContributionTier(tier?: string | null): ContributionTierName | null {
  const normalized = (tier ?? "").trim().toLowerCase();

  if (Object.prototype.hasOwnProperty.call(CONTRIBUTION_TIER_BADGES, normalized)) {
    return normalized as ContributionTierName;
  }

  return null;
}

export function formatContributionTier(tier?: string | null) {
  const normalized = normalizeContributionTier(tier);
  return normalized ? CONTRIBUTION_TIER_BADGES[normalized].label : "Not started";
}

export function ContributionTierBadge({
  tier,
  size = "md",
  className = "",
}: {
  tier?: string | null;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const normalized = normalizeContributionTier(tier);
  const styles = sizeStyles[size];

  if (!normalized) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-white/[0.04] bg-white/[0.018] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-sub ${className}`}
      >
        Not started
      </span>
    );
  }

  const badge = CONTRIBUTION_TIER_BADGES[normalized];

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border font-bold uppercase ${badge.tone} ${styles.root} ${className}`}
    >
      <span className={`relative shrink-0 ${styles.image}`}>
        <Image
          src={badge.src}
          alt=""
          fill
          sizes={styles.sizes}
          className="object-contain brightness-110 saturate-125 drop-shadow-[0_0_9px_rgba(255,255,255,0.13)]"
        />
      </span>
      <span className={`truncate ${styles.text}`}>{badge.label}</span>
    </span>
  );
}
