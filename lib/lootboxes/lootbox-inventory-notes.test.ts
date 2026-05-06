import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLootboxInventoryNoteAuditPayload,
  parseLootboxInventoryNoteBody,
} from "./lootbox-inventory-notes";

test("parseLootboxInventoryNoteBody trims note and reference", () => {
  const parsed = parseLootboxInventoryNoteBody({
    note: "  Delivered Discord role manually.  ",
    reference: "  DISCORD-ROLE-77  ",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.note, "Delivered Discord role manually.");
    assert.equal(parsed.reference, "DISCORD-ROLE-77");
  }
});

test("parseLootboxInventoryNoteBody rejects missing or oversized notes", () => {
  assert.deepEqual(parseLootboxInventoryNoteBody({ note: "   " }), {
    ok: false,
    error: "Note is required.",
  });
  assert.deepEqual(parseLootboxInventoryNoteBody({ note: "x".repeat(701) }), {
    ok: false,
    error: "Note must be 700 characters or less.",
  });
  assert.deepEqual(
    parseLootboxInventoryNoteBody({ note: "Valid note", reference: "x".repeat(141) }),
    {
      ok: false,
      error: "Reference must be 140 characters or less.",
    }
  );
});

test("buildLootboxInventoryNoteAuditPayload creates an audit log note", () => {
  const payload = buildLootboxInventoryNoteAuditPayload({
    adminAuthUserId: "admin-1",
    inventoryItem: {
      id: "inventory-1",
      auth_user_id: "member-1",
      label: "Profile Glow",
      status: "pending_review",
    },
    note: "Fulfilled manually after Discord verification.",
    reference: "DISCORD-ROLE-77",
  });

  assert.equal(payload.auth_user_id, "admin-1");
  assert.equal(payload.source_table, "user_inventory");
  assert.equal(payload.source_id, "inventory-1");
  assert.equal(payload.action, "lootbox_inventory_note_added");
  assert.equal(payload.summary, "Added fulfillment note for Profile Glow.");
  assert.deepEqual(payload.metadata, {
    inventoryItemId: "inventory-1",
    targetAuthUserId: "member-1",
    inventoryStatus: "pending_review",
    note: "Fulfilled manually after Discord verification.",
    reference: "DISCORD-ROLE-77",
  });
});
