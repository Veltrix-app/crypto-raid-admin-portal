export type LootboxSponsoredPackagePersistenceInput = {
  totalPackages: number;
  readyToPitch: number;
  setupQueue: number;
  blocked: number;
  apiState?: "planned" | "live";
};

export type LootboxSponsoredPackagePersistenceTable = {
  name: "lootbox_sponsor_packages" | "lootbox_sponsor_package_notes";
  purpose: string;
  primaryFields: string[];
};

export type LootboxSponsoredPackagePersistenceGate = {
  label: string;
  detail: string;
  state: "planned" | "live";
};

export const lootboxSponsorPackageTiers = ["starter", "standard", "premium"] as const;

export const lootboxSponsorPackageStatuses = [
  "draft",
  "ready_to_pitch",
  "pitched",
  "negotiating",
  "won",
  "lost",
  "blocked",
  "archived",
] as const;

export const lootboxSponsorPackageNoteTypes = [
  "operator_note",
  "sponsor_follow_up",
  "status_change",
  "decision",
] as const;

export type LootboxSponsorPackageTier = (typeof lootboxSponsorPackageTiers)[number];
export type LootboxSponsorPackageStatus = (typeof lootboxSponsorPackageStatuses)[number];
export type LootboxSponsorPackageNoteType = (typeof lootboxSponsorPackageNoteTypes)[number];

type JsonObject = Record<string, unknown>;
type ParseResult<T> = { ok: true; payload: T } | { ok: false; error: string };

export type LootboxSponsorPackageCreatePayload = {
  projectId: string;
  campaignId: string;
  packageTier: LootboxSponsorPackageTier;
  status: LootboxSponsorPackageStatus;
  sponsorName: string | null;
  sponsorContact: string | null;
  sponsorBudget: number;
  currency: string;
  ownerAuthUserId: string | null;
  followUpAt: string | null;
  packageSnapshot: JsonObject;
  metadata: JsonObject;
};

export type LootboxSponsorPackagePatchPayload = {
  status?: LootboxSponsorPackageStatus;
  sponsorName?: string | null;
  sponsorContact?: string | null;
  sponsorBudget?: number;
  currency?: string;
  ownerAuthUserId?: string | null;
  followUpAt?: string | null;
  packageSnapshot?: JsonObject;
  metadata?: JsonObject;
};

export type LootboxSponsorPackageNotePayload = {
  noteType: LootboxSponsorPackageNoteType;
  note: string;
  followUpAt: string | null;
  metadata: JsonObject;
};

const persistenceTables: LootboxSponsoredPackagePersistenceTable[] = [
  {
    name: "lootbox_sponsor_packages",
    purpose: "Stores package status, owner, sponsor budget, follow-up date and the package snapshot.",
    primaryFields: ["project_id", "campaign_id", "status", "owner_auth_user_id", "follow_up_at"],
  },
  {
    name: "lootbox_sponsor_package_notes",
    purpose: "Stores operator notes, sponsor follow-ups, status changes and decision notes.",
    primaryFields: ["sponsor_package_id", "note_type", "note", "follow_up_at"],
  },
];

export function buildLootboxSponsoredPackagePersistenceReadiness(
  input: LootboxSponsoredPackagePersistenceInput
) {
  const liveWrites = input.apiState === "live";
  const gateState = liveWrites ? ("live" as const) : ("planned" as const);

  return {
    summary: {
      totalPackages: input.totalPackages,
      readyToPitch: input.readyToPitch,
      needsOperatorSetup: input.setupQueue + input.blocked,
      requiredTables: persistenceTables.length,
      liveWrites,
    },
    tables: persistenceTables,
    fields: {
      status: [...lootboxSponsorPackageStatuses],
      noteTypes: [...lootboxSponsorPackageNoteTypes],
      owner: ["owner_auth_user_id", "created_by_auth_user_id"],
      followUp: ["follow_up_at", "last_contacted_at"],
    },
    writeGates: [
      {
        label: "Create package",
        detail: liveWrites
          ? "Live API persists one sponsor package snapshot after operator review."
          : "Planned API will persist one sponsor package snapshot after the Phase 2E-L SQL is live.",
        state: gateState,
      },
      {
        label: "Update owner/status",
        detail: liveWrites
          ? "Live API changes owner, status and follow-up dates with audit context."
          : "Planned API will change owner, status and follow-up dates with audit context.",
        state: gateState,
      },
      {
        label: "Add note",
        detail: liveWrites
          ? "Live API appends operator notes and sponsor follow-ups to the note table."
          : "Planned API will append operator notes and sponsor follow-ups to the note table.",
        state: gateState,
      },
    ] satisfies LootboxSponsoredPackagePersistenceGate[],
    guardrails: [
      "No reward inventory, lootbox open or payout table is changed by this foundation.",
      liveWrites
        ? "Portal writes are limited to sponsor package status, owner, notes and follow-up."
        : "Portal writes stay disabled until the Phase 2E-L SQL has been run successfully.",
      "Persistence starts with sponsor package status, owner, notes and follow-up only.",
    ],
    nextStep: liveWrites
      ? "Use the sponsor package APIs from the operator action desk, then wire the UI controls in the next phase."
      : "Run the Phase 2E-L SQL, then enable the sponsor package persistence APIs in the next phase.",
  };
}

export function parseLootboxSponsorPackageCreateBody(
  body: Record<string, unknown> | null
): ParseResult<LootboxSponsorPackageCreatePayload> {
  const projectId = parseRequiredUuid(body?.projectId, "Project id");
  if (!projectId.ok) {
    return projectId;
  }

  const campaignId = parseRequiredUuid(body?.campaignId, "Campaign id");
  if (!campaignId.ok) {
    return campaignId;
  }

  if (!isLootboxSponsorPackageTier(body?.packageTier)) {
    return { ok: false, error: "Unsupported sponsor package tier." };
  }

  const status = parseStatus(body?.status, "draft");
  if (!status.ok) {
    return status;
  }

  const sponsorBudget = parseSponsorBudget(body?.sponsorBudget);
  if (!sponsorBudget.ok) {
    return sponsorBudget;
  }

  const currency = parseCurrency(body?.currency);
  if (!currency.ok) {
    return currency;
  }

  const ownerAuthUserId = parseOptionalUuid(body?.ownerAuthUserId, "Owner auth user id");
  if (!ownerAuthUserId.ok) {
    return ownerAuthUserId;
  }

  const followUpAt = parseOptionalIsoDate(body?.followUpAt, "Follow-up date");
  if (!followUpAt.ok) {
    return followUpAt;
  }

  const packageSnapshot = parseOptionalObject(body?.packageSnapshot, "Package snapshot");
  if (!packageSnapshot.ok) {
    return packageSnapshot;
  }

  const metadata = parseOptionalObject(body?.metadata, "Metadata");
  if (!metadata.ok) {
    return metadata;
  }

  return {
    ok: true,
    payload: {
      projectId: projectId.value,
      campaignId: campaignId.value,
      packageTier: body.packageTier,
      status: status.value,
      sponsorName: parseOptionalText(body.sponsorName, 160),
      sponsorContact: parseOptionalText(body.sponsorContact, 220),
      sponsorBudget: sponsorBudget.value,
      currency: currency.value,
      ownerAuthUserId: ownerAuthUserId.value,
      followUpAt: followUpAt.value,
      packageSnapshot: packageSnapshot.value,
      metadata: metadata.value,
    },
  };
}

export function parseLootboxSponsorPackagePatchBody(
  body: Record<string, unknown> | null
): ParseResult<LootboxSponsorPackagePatchPayload> {
  const payload: LootboxSponsorPackagePatchPayload = {};

  if (hasOwn(body, "status")) {
    const status = parseStatus(body?.status);
    if (!status.ok) {
      return status;
    }
    payload.status = status.value;
  }

  if (hasOwn(body, "sponsorName")) {
    payload.sponsorName = parseOptionalText(body?.sponsorName, 160);
  }

  if (hasOwn(body, "sponsorContact")) {
    payload.sponsorContact = parseOptionalText(body?.sponsorContact, 220);
  }

  if (hasOwn(body, "sponsorBudget")) {
    const sponsorBudget = parseSponsorBudget(body?.sponsorBudget);
    if (!sponsorBudget.ok) {
      return sponsorBudget;
    }
    payload.sponsorBudget = sponsorBudget.value;
  }

  if (hasOwn(body, "currency")) {
    const currency = parseCurrency(body?.currency);
    if (!currency.ok) {
      return currency;
    }
    payload.currency = currency.value;
  }

  if (hasOwn(body, "ownerAuthUserId")) {
    const ownerAuthUserId = parseOptionalUuid(body?.ownerAuthUserId, "Owner auth user id");
    if (!ownerAuthUserId.ok) {
      return ownerAuthUserId;
    }
    payload.ownerAuthUserId = ownerAuthUserId.value;
  }

  if (hasOwn(body, "followUpAt")) {
    const followUpAt = parseOptionalIsoDate(body?.followUpAt, "Follow-up date");
    if (!followUpAt.ok) {
      return followUpAt;
    }
    payload.followUpAt = followUpAt.value;
  }

  if (hasOwn(body, "packageSnapshot")) {
    const packageSnapshot = parseOptionalObject(body?.packageSnapshot, "Package snapshot");
    if (!packageSnapshot.ok) {
      return packageSnapshot;
    }
    payload.packageSnapshot = packageSnapshot.value;
  }

  if (hasOwn(body, "metadata")) {
    const metadata = parseOptionalObject(body?.metadata, "Metadata");
    if (!metadata.ok) {
      return metadata;
    }
    payload.metadata = metadata.value;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "At least one sponsor package field is required." };
  }

  return { ok: true, payload };
}

export function parseLootboxSponsorPackageNoteBody(
  body: Record<string, unknown> | null
): ParseResult<LootboxSponsorPackageNotePayload> {
  const noteType = body?.noteType ?? "operator_note";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!isLootboxSponsorPackageNoteType(noteType)) {
    return { ok: false, error: "Unsupported sponsor package note type." };
  }

  if (!note) {
    return { ok: false, error: "Note is required." };
  }

  if (note.length > 2000) {
    return { ok: false, error: "Note must be 2000 characters or less." };
  }

  const followUpAt = parseOptionalIsoDate(body?.followUpAt, "Follow-up date");
  if (!followUpAt.ok) {
    return followUpAt;
  }

  const metadata = parseOptionalObject(body?.metadata, "Metadata");
  if (!metadata.ok) {
    return metadata;
  }

  return {
    ok: true,
    payload: {
      noteType,
      note,
      followUpAt: followUpAt.value,
      metadata: metadata.value,
    },
  };
}

export function buildLootboxSponsorPackageInsertRow(params: {
  payload: LootboxSponsorPackageCreatePayload;
  createdByAuthUserId: string;
  now?: string;
}) {
  const now = params.now ?? new Date().toISOString();

  return {
    project_id: params.payload.projectId,
    campaign_id: params.payload.campaignId,
    package_tier: params.payload.packageTier,
    status: params.payload.status,
    sponsor_name: params.payload.sponsorName,
    sponsor_contact: params.payload.sponsorContact,
    sponsor_budget: params.payload.sponsorBudget,
    currency: params.payload.currency,
    owner_auth_user_id: params.payload.ownerAuthUserId,
    follow_up_at: params.payload.followUpAt,
    package_snapshot: params.payload.packageSnapshot,
    metadata: params.payload.metadata,
    created_by_auth_user_id: params.createdByAuthUserId,
    last_contacted_at: null,
    created_at: now,
    updated_at: now,
  };
}

export function buildLootboxSponsorPackagePatchRow(
  payload: LootboxSponsorPackagePatchPayload,
  now = new Date().toISOString()
) {
  return {
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.sponsorName !== undefined ? { sponsor_name: payload.sponsorName } : {}),
    ...(payload.sponsorContact !== undefined ? { sponsor_contact: payload.sponsorContact } : {}),
    ...(payload.sponsorBudget !== undefined ? { sponsor_budget: payload.sponsorBudget } : {}),
    ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
    ...(payload.ownerAuthUserId !== undefined
      ? { owner_auth_user_id: payload.ownerAuthUserId }
      : {}),
    ...(payload.followUpAt !== undefined ? { follow_up_at: payload.followUpAt } : {}),
    ...(payload.packageSnapshot !== undefined
      ? { package_snapshot: payload.packageSnapshot }
      : {}),
    ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
    updated_at: now,
  };
}

export function buildLootboxSponsorPackageNoteInsertRow(params: {
  sponsorPackageId: string;
  adminAuthUserId: string;
  payload: LootboxSponsorPackageNotePayload;
  now?: string;
}) {
  return {
    sponsor_package_id: params.sponsorPackageId,
    note_type: params.payload.noteType,
    note: params.payload.note,
    metadata: params.payload.metadata,
    follow_up_at: params.payload.followUpAt,
    created_by_auth_user_id: params.adminAuthUserId,
    created_at: params.now ?? new Date().toISOString(),
  };
}

export function buildLootboxSponsorPackageAuditPayload(params: {
  adminAuthUserId: string;
  projectId: string | null;
  sponsorPackageId: string;
  action: string;
  summary: string;
  metadata: JsonObject;
}) {
  return {
    auth_user_id: params.adminAuthUserId,
    project_id: params.projectId,
    source_table: "lootbox_sponsor_packages",
    source_id: params.sponsorPackageId,
    action: params.action,
    summary: params.summary,
    metadata: params.metadata,
  };
}

export function isLootboxSponsorPackageStatus(
  value: unknown
): value is LootboxSponsorPackageStatus {
  return (
    typeof value === "string" &&
    lootboxSponsorPackageStatuses.some((status) => status === value)
  );
}

export function isMissingLootboxSponsorPackageSchema(
  error: { message?: string } | null | undefined
) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("lootbox_sponsor_packages") ||
    message.includes("lootbox_sponsor_package_notes") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}

function isLootboxSponsorPackageTier(value: unknown): value is LootboxSponsorPackageTier {
  return (
    typeof value === "string" &&
    lootboxSponsorPackageTiers.some((tier) => tier === value)
  );
}

function isLootboxSponsorPackageNoteType(value: unknown): value is LootboxSponsorPackageNoteType {
  return (
    typeof value === "string" &&
    lootboxSponsorPackageNoteTypes.some((type) => type === value)
  );
}

function parseStatus(
  value: unknown,
  fallback?: LootboxSponsorPackageStatus
): { ok: true; value: LootboxSponsorPackageStatus } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    if (fallback) {
      return { ok: true, value: fallback };
    }

    return { ok: false, error: "Unsupported sponsor package status." };
  }

  if (!isLootboxSponsorPackageStatus(value)) {
    return { ok: false, error: "Unsupported sponsor package status." };
  }

  return { ok: true, value };
}

function parseRequiredUuid(
  value: unknown,
  label: string
): { ok: true; value: string } | { ok: false; error: string } {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return { ok: false, error: `${label} is required.` };
  }

  if (!isUuid(normalized)) {
    return { ok: false, error: `${label} must be a valid UUID.` };
  }

  return { ok: true, value: normalized };
}

function parseOptionalUuid(
  value: unknown,
  label: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }

  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return { ok: true, value: null };
  }

  if (!isUuid(normalized)) {
    return { ok: false, error: `${label} must be a valid UUID.` };
  }

  return { ok: true, value: normalized };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parseSponsorBudget(
  value: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: 0 };
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { ok: false, error: "Sponsor budget must be zero or higher." };
  }

  return { ok: true, value: numericValue };
}

function parseCurrency(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  const currency = typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "USD";

  if (currency.length > 12) {
    return { ok: false, error: "Currency must be 12 characters or less." };
  }

  return { ok: true, value: currency };
}

function parseOptionalIsoDate(
  value: unknown,
  label: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `${label} must be a valid ISO date.` };
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return { ok: false, error: `${label} must be a valid ISO date.` };
  }

  return { ok: true, value: new Date(timestamp).toISOString() };
}

function parseOptionalObject(
  value: unknown,
  label: string
): { ok: true; value: JsonObject } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: {} };
  }

  if (!isJsonObject(value)) {
    return { ok: false, error: `${label} must be an object.` };
  }

  return { ok: true, value };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalText(value: unknown, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maxLength) : null;
}

function hasOwn(body: Record<string, unknown> | null, key: string) {
  return Boolean(body && Object.prototype.hasOwnProperty.call(body, key));
}
