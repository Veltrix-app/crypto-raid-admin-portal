export type DefiXpReviewDecision = "clear" | "review" | "blocked";
export type DefiXpReviewTone = "default" | "success" | "warning" | "danger";

export type DefiXpReviewEventInput = {
  id: string;
  authUserId: string | null;
  sourceType: string | null;
  sourceRef: string | null;
  effectiveXp: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string | null;
};

export type DefiXpReviewProfileInput = {
  authUserId: string | null;
  username?: string | null;
  wallet?: string | null;
};

export type DefiXpReviewReputationInput = {
  authUserId: string | null;
  totalXp?: number | null;
  level?: number | null;
  trustScore?: number | null;
  sybilScore?: number | null;
  status?: string | null;
};

export type DefiXpReviewRow = {
  id: string;
  authUserId: string;
  userLabel: string;
  walletLabel: string;
  sourceRef: string;
  sourceLabel: string;
  xp: number;
  decision: DefiXpReviewDecision;
  tone: DefiXpReviewTone;
  reason: string;
  createdAt: string;
  trustScore: number;
  sybilScore: number;
};

export type DefiXpUserHistory = {
  authUserId: string;
  userLabel: string;
  walletLabel: string;
  totalXp: number;
  level: number;
  trustScore: number;
  sybilScore: number;
  events: DefiXpReviewRow[];
};

export type DefiXpReviewRead = {
  status: "clear" | "watch";
  summary: {
    totalEvents: number;
    totalXp: number;
    suspiciousClaims: number;
    blockedClaims: number;
    uniqueUsers: number;
  };
  rows: DefiXpReviewRow[];
  userHistories: DefiXpUserHistory[];
  guardrails: Array<{
    label: string;
    value: string;
    tone: DefiXpReviewTone;
  }>;
};

const SOURCE_LABELS: Record<string, string> = {
  "defi:first-vault-position": "First vault position",
  "defi:first-market-supply": "First market supply",
  "defi:collateral-enabled": "Collateral enabled",
  "defi:first-repay": "First repay",
};

const BORROW_VOLUME_REFS = new Set(["defi:borrow-open", "defi:borrow-volume"]);

export function buildDefiXpReviewRead(input: {
  events: DefiXpReviewEventInput[];
  profiles?: DefiXpReviewProfileInput[];
  reputations?: DefiXpReviewReputationInput[];
}): DefiXpReviewRead {
  const profilesByUser = new Map(
    (input.profiles ?? [])
      .filter((profile) => Boolean(profile.authUserId))
      .map((profile) => [profile.authUserId as string, profile])
  );
  const reputationsByUser = new Map(
    (input.reputations ?? [])
      .filter((reputation) => Boolean(reputation.authUserId))
      .map((reputation) => [reputation.authUserId as string, reputation])
  );

  const rows = input.events
    .filter((event) => event.sourceType === "defi_mission")
    .map((event) =>
      buildReviewRow({
        event,
        profile: profilesByUser.get(event.authUserId ?? ""),
        reputation: reputationsByUser.get(event.authUserId ?? ""),
      })
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  const uniqueUsers = new Set(rows.map((row) => row.authUserId)).size;
  const suspiciousClaims = rows.filter((row) => row.decision !== "clear").length;
  const blockedClaims = rows.filter((row) => row.decision === "blocked").length;
  const historiesByUser = new Map<string, DefiXpUserHistory>();

  for (const row of rows) {
    const reputation = reputationsByUser.get(row.authUserId);
    const history = historiesByUser.get(row.authUserId) ?? {
      authUserId: row.authUserId,
      userLabel: row.userLabel,
      walletLabel: row.walletLabel,
      totalXp: toSafeNumber(reputation?.totalXp),
      level: Math.max(1, toSafeNumber(reputation?.level, 1)),
      trustScore: row.trustScore,
      sybilScore: row.sybilScore,
      events: [],
    };
    history.events.push(row);
    historiesByUser.set(row.authUserId, history);
  }

  const totalXp = rows.reduce((sum, row) => sum + row.xp, 0);

  return {
    status: suspiciousClaims > 0 ? "watch" : "clear",
    summary: {
      totalEvents: rows.length,
      totalXp,
      suspiciousClaims,
      blockedClaims,
      uniqueUsers,
    },
    rows,
    userHistories: Array.from(historiesByUser.values()).sort(
      (left, right) => right.events.length - left.events.length
    ),
    guardrails: [
      {
        label: "Borrow volume",
        value: "Never rewarded",
        tone: "warning",
      },
      {
        label: "Sybil review",
        value: "90+ blocks XP",
        tone: suspiciousClaims > 0 ? "warning" : "success",
      },
      {
        label: "Tracking proof",
        value: "Required",
        tone: "default",
      },
    ],
  };
}

function buildReviewRow(input: {
  event: DefiXpReviewEventInput;
  profile?: DefiXpReviewProfileInput;
  reputation?: DefiXpReviewReputationInput;
}): DefiXpReviewRow {
  const authUserId = input.event.authUserId || "unknown-user";
  const sourceRef = input.event.sourceRef || "defi:unknown";
  const metadata = input.event.metadata ?? {};
  const trustScore = toSafeNumber(input.reputation?.trustScore, 50);
  const sybilScore = toSafeNumber(input.reputation?.sybilScore);
  const walletLabel =
    normalizeString(input.profile?.wallet) ||
    normalizeString(metadata.walletAddress) ||
    "No wallet";
  const userLabel =
    normalizeString(input.profile?.username) ||
    shortId(authUserId) ||
    "Unknown member";
  const decision = deriveDecision({
    sourceRef,
    trackingReady: metadata.trackingReady,
    sybilScore,
  });

  return {
    id: input.event.id,
    authUserId,
    userLabel,
    walletLabel: shortWallet(walletLabel),
    sourceRef,
    sourceLabel: SOURCE_LABELS[sourceRef] ?? humanizeSourceRef(sourceRef),
    xp: Math.max(0, Math.floor(toSafeNumber(input.event.effectiveXp))),
    decision: decision.decision,
    tone: decision.tone,
    reason: decision.reason,
    createdAt: input.event.createdAt || new Date(0).toISOString(),
    trustScore,
    sybilScore,
  };
}

function deriveDecision(input: {
  sourceRef: string;
  trackingReady: unknown;
  sybilScore: number;
}): { decision: DefiXpReviewDecision; tone: DefiXpReviewTone; reason: string } {
  if (BORROW_VOLUME_REFS.has(input.sourceRef)) {
    return {
      decision: "blocked",
      tone: "danger",
      reason: "Borrow volume cannot be rewarded directly.",
    };
  }

  if (input.sybilScore >= 90) {
    return {
      decision: "blocked",
      tone: "danger",
      reason: "Sybil score is inside review territory.",
    };
  }

  if (input.trackingReady === false) {
    return {
      decision: "review",
      tone: "warning",
      reason: "Tracking proof was not ready when XP was issued.",
    };
  }

  return {
    decision: "clear",
    tone: "success",
    reason: "DeFi XP event matches the current policy.",
  };
}

function humanizeSourceRef(sourceRef: string) {
  return sourceRef
    .replace(/^defi:/, "")
    .split("-")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? capitalize(part) : part))
    .join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shortId(value: string) {
  if (!value || value === "unknown-user") return "";
  return value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function shortWallet(value: string) {
  if (!value || value === "No wallet") return value;
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function toSafeNumber(value: unknown, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}
