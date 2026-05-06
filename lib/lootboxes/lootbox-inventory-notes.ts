const MAX_NOTE_LENGTH = 700;
const MAX_REFERENCE_LENGTH = 140;

export type LootboxInventoryNoteParseResult =
  | { ok: true; note: string; reference: string | null }
  | { ok: false; error: string };

export type LootboxInventoryNoteInventoryItem = {
  id: string;
  auth_user_id: string;
  label: string;
  status: string | null;
};

export function parseLootboxInventoryNoteBody(
  body: Record<string, unknown> | null
): LootboxInventoryNoteParseResult {
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";

  if (!note) {
    return { ok: false, error: "Note is required." };
  }

  if (note.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `Note must be ${MAX_NOTE_LENGTH} characters or less.` };
  }

  if (reference.length > MAX_REFERENCE_LENGTH) {
    return { ok: false, error: `Reference must be ${MAX_REFERENCE_LENGTH} characters or less.` };
  }

  return {
    ok: true,
    note,
    reference: reference || null,
  };
}

export function buildLootboxInventoryNoteAuditPayload(params: {
  adminAuthUserId: string;
  inventoryItem: LootboxInventoryNoteInventoryItem;
  note: string;
  reference: string | null;
}) {
  return {
    auth_user_id: params.adminAuthUserId,
    project_id: null,
    source_table: "user_inventory",
    source_id: params.inventoryItem.id,
    action: "lootbox_inventory_note_added",
    summary: `Added fulfillment note for ${params.inventoryItem.label}.`,
    metadata: {
      inventoryItemId: params.inventoryItem.id,
      targetAuthUserId: params.inventoryItem.auth_user_id,
      inventoryStatus: params.inventoryItem.status ?? "owned",
      note: params.note,
      reference: params.reference,
    },
  };
}
