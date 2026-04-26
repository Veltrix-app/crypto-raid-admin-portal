import test from "node:test";
import assert from "node:assert/strict";
import {
  buildQuestSubmissionDecisionProxyUrl,
  buildReviewedSubmissionPatch,
  normalizeQuestSubmissionDecisionStatus,
} from "./submission-decisions";

test("quest submission decision status only allows approved or rejected", () => {
  assert.equal(normalizeQuestSubmissionDecisionStatus("approved"), "approved");
  assert.equal(normalizeQuestSubmissionDecisionStatus("rejected"), "rejected");
  assert.equal(normalizeQuestSubmissionDecisionStatus("pending"), null);
  assert.equal(normalizeQuestSubmissionDecisionStatus(""), null);
});

test("quest submission decision proxy URL targets the central webapp route safely", () => {
  assert.equal(
    buildQuestSubmissionDecisionProxyUrl({
      baseUrl: "https://veltrix-web.vercel.app/",
      submissionId: "submission/id with space",
    }),
    "https://veltrix-web.vercel.app/api/quests/submissions/submission%2Fid%20with%20space/decision"
  );
});

test("reviewed submission patch keeps portal state synced after central XP routing", () => {
  assert.deepEqual(
    buildReviewedSubmissionPatch({
      status: "approved",
      reviewNotes: "Proof checks out",
      reviewerAuthUserId: "reviewer-1",
      timestamp: "2026-04-26T10:00:00.000Z",
      existingReviewNotes: "Previous note",
      existingReviewerAuthUserId: "reviewer-old",
    }),
    {
      status: "approved",
      reviewNotes: "Proof checks out",
      reviewedByAuthUserId: "reviewer-1",
      reviewedAt: "2026-04-26T10:00:00.000Z",
      updatedAt: "2026-04-26T10:00:00.000Z",
    }
  );

  assert.equal(
    buildReviewedSubmissionPatch({
      status: "rejected",
      reviewNotes: "",
      reviewerAuthUserId: null,
      timestamp: "2026-04-26T10:00:00.000Z",
      existingReviewNotes: "Keep this",
      existingReviewerAuthUserId: "reviewer-old",
    }).reviewNotes,
    "Keep this"
  );
});
