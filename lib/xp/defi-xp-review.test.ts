import test from "node:test";
import assert from "node:assert/strict";

import { buildDefiXpReviewRead } from "./defi-xp-review";

const events = [
  {
    id: "evt-1",
    authUserId: "user-1",
    sourceType: "defi_mission",
    sourceRef: "defi:first-vault-position",
    effectiveXp: 300,
    metadata: { trackingReady: true, walletAddress: "0x123" },
    createdAt: "2026-04-26T10:00:00.000Z",
  },
  {
    id: "evt-2",
    authUserId: "user-2",
    sourceType: "defi_mission",
    sourceRef: "defi:borrow-open",
    effectiveXp: 750,
    metadata: { trackingReady: true, walletAddress: "0x456" },
    createdAt: "2026-04-26T11:00:00.000Z",
  },
  {
    id: "evt-3",
    authUserId: "user-1",
    sourceType: "defi_mission",
    sourceRef: "defi:first-market-supply",
    effectiveXp: 400,
    metadata: { trackingReady: false },
    createdAt: "2026-04-26T12:00:00.000Z",
  },
];

test("defi xp review summarizes totals suspicious claims and user history", () => {
  const read = buildDefiXpReviewRead({
    events,
    profiles: [
      { authUserId: "user-1", username: "jordim", wallet: "0x123" },
      { authUserId: "user-2", username: "runner", wallet: "0x456" },
    ],
    reputations: [
      { authUserId: "user-1", totalXp: 1800, level: 3, trustScore: 70, sybilScore: 14 },
      { authUserId: "user-2", totalXp: 900, level: 2, trustScore: 42, sybilScore: 91 },
    ],
  });

  assert.equal(read.summary.totalEvents, 3);
  assert.equal(read.summary.totalXp, 1450);
  assert.equal(read.summary.suspiciousClaims, 2);
  assert.equal(read.summary.uniqueUsers, 2);
  assert.equal(read.rows[0].sourceLabel, "First market supply");
  assert.equal(read.rows[0].decision, "review");
  assert.match(read.rows[0].reason, /tracking/i);
  assert.equal(read.rows.find((row) => row.sourceRef === "defi:borrow-open")?.decision, "blocked");
  assert.match(read.rows.find((row) => row.sourceRef === "defi:borrow-open")?.reason ?? "", /borrow volume/i);
  assert.deepEqual(
    read.userHistories.find((history) => history.authUserId === "user-1")?.events.map((event) => event.id),
    ["evt-3", "evt-1"]
  );
});
