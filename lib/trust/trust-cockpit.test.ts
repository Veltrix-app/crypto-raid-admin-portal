import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProjectTrustCockpit,
  type TrustCockpitAccess,
  type TrustCockpitInput,
} from "./trust-cockpit";

const fullAccess: TrustCockpitAccess = {
  projectId: "project-a",
  canSeeMemberDetail: true,
  canSeeWalletDetail: true,
  canSeeRawSignalDetail: true,
  canSeeResolutionHistory: true,
};

const input: TrustCockpitInput = {
  projectId: "project-a",
  generatedAt: "2026-05-01T10:00:00.000Z",
  rollups: [
    {
      projectId: "project-a",
      authUserId: "user-critical",
      riskLevel: "critical",
      openEventCount: 4,
      highEventCount: 1,
      criticalEventCount: 1,
      latestRecommendedAction: "xp_suspended",
      metadata: { reasonCodes: ["shared_funder", "velocity_spike"] },
      updatedAt: "2026-05-01T09:00:00.000Z",
    },
    {
      projectId: "project-b",
      authUserId: "user-other-project",
      riskLevel: "critical",
      openEventCount: 9,
      highEventCount: 3,
      criticalEventCount: 1,
      latestRecommendedAction: "ban",
      metadata: { reasonCodes: ["external"] },
      updatedAt: "2026-05-01T09:30:00.000Z",
    },
    {
      projectId: "project-a",
      authUserId: "user-watch",
      riskLevel: "medium",
      openEventCount: 2,
      highEventCount: 0,
      criticalEventCount: 0,
      latestRecommendedAction: "watch",
      metadata: {},
      updatedAt: "2026-05-01T08:00:00.000Z",
    },
  ],
  events: [
    {
      id: "event-1",
      projectId: "project-a",
      authUserId: "user-critical",
      walletAddress: "0xabc123",
      eventType: "wallet_cluster",
      riskCategory: "wallet_graph",
      severity: "critical",
      sourceType: "onchain_signal",
      sourceId: "signal-1",
      reason: "Shared funding source across multiple high-velocity accounts.",
      evidence: { clusterSize: 12, sessionHash: "hidden-even-for-projects" },
      scoreDelta: 28,
      recommendedAction: "xp_suspended",
      status: "open",
      createdAt: "2026-05-01T09:15:00.000Z",
      updatedAt: "2026-05-01T09:15:00.000Z",
    },
    {
      id: "event-2",
      projectId: "project-b",
      authUserId: "user-other-project",
      walletAddress: "0xdef456",
      eventType: "other_project",
      riskCategory: "raid_abuse",
      severity: "critical",
      sourceType: "manual",
      sourceId: "signal-2",
      reason: "Should never leak into project-a.",
      evidence: {},
      scoreDelta: 99,
      recommendedAction: "ban",
      status: "open",
      createdAt: "2026-05-01T09:20:00.000Z",
      updatedAt: "2026-05-01T09:20:00.000Z",
    },
  ],
  heldRewards: [
    {
      id: "dist-1",
      projectId: "project-a",
      campaignId: "campaign-a",
      campaignTitle: "Genesis",
      authUserId: "user-critical",
      rewardAsset: "USDC",
      rewardAmount: 100,
      status: "held_for_review",
      calculationSnapshot: { trustGate: { reason: "critical risk" } },
      updatedAt: "2026-05-01T09:40:00.000Z",
    },
    {
      id: "dist-2",
      projectId: "project-b",
      campaignId: "campaign-b",
      campaignTitle: "Other",
      authUserId: "user-other-project",
      rewardAsset: "USDC",
      rewardAmount: 900,
      status: "held_for_review",
      calculationSnapshot: {},
      updatedAt: "2026-05-01T09:50:00.000Z",
    },
  ],
  decisions: [
    {
      id: "decision-1",
      projectId: "project-a",
      authUserId: "user-critical",
      action: "xp_suspended",
      previousStatus: "review_required",
      newStatus: "xp_suspended",
      reason: "Critical wallet graph evidence.",
      actorRole: "super_admin",
      createdAt: "2026-05-01T09:45:00.000Z",
    },
  ],
  profiles: [
    {
      authUserId: "user-critical",
      username: "risk.runner",
      avatarUrl: "https://example.com/avatar.png",
    },
    {
      authUserId: "user-watch",
      username: "new.member",
      avatarUrl: null,
    },
  ],
  reputations: [
    {
      authUserId: "user-critical",
      status: "xp_suspended",
      trustScore: 12,
      sybilScore: 94,
      totalXp: 2400,
      level: 4,
    },
    {
      authUserId: "user-watch",
      status: "watch",
      trustScore: 48,
      sybilScore: 55,
      totalXp: 900,
      level: 2,
    },
  ],
};

test("project trust cockpit keeps every row scoped to the active project", () => {
  const cockpit = buildProjectTrustCockpit(input, fullAccess);

  assert.equal(cockpit.scope.projectId, "project-a");
  assert.equal(cockpit.summary.flaggedMembers, 2);
  assert.equal(cockpit.summary.heldRewards, 1);
  assert.equal(cockpit.summary.criticalEvents, 1);
  assert.deepEqual(
    cockpit.reviewQueue.map((row) => row.authUserId),
    ["user-critical", "user-watch"]
  );
  assert.equal(
    cockpit.reviewQueue.some((row) => row.authUserId === "user-other-project"),
    false
  );
  assert.equal(cockpit.heldRewards[0].campaignTitle, "Genesis");
});

test("project trust cockpit hides member wallet and raw evidence in summary-only mode", () => {
  const cockpit = buildProjectTrustCockpit(input, {
    ...fullAccess,
    canSeeMemberDetail: false,
    canSeeWalletDetail: false,
    canSeeRawSignalDetail: false,
    canSeeResolutionHistory: false,
  });

  assert.equal(cockpit.reviewQueue[0].displayName, "Restricted member");
  assert.equal(cockpit.reviewQueue[0].walletAddress, null);
  assert.equal(cockpit.events[0].evidence, null);
  assert.equal(cockpit.decisions.length, 0);
  assert.equal(cockpit.scope.visibilityLabel, "Summary-only project view");
});

test("project trust cockpit prioritizes critical risk before medium watch rows", () => {
  const cockpit = buildProjectTrustCockpit(input, fullAccess);

  assert.equal(cockpit.reviewQueue[0].riskLevel, "critical");
  assert.equal(cockpit.reviewQueue[0].recommendedActionLabel, "Suspend XP");
  assert.match(cockpit.commandRead.now, /1 critical/);
  assert.match(cockpit.commandRead.next, /1 held reward/);
  assert.match(cockpit.commandRead.watch, /2 contributors/);
});
