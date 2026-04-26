import type { AdminSubmission } from "@/types/entities/submission";

export type QuestSubmissionDecisionStatus = Extract<
  AdminSubmission["status"],
  "approved" | "rejected"
>;

const defaultWebAppUrl = "https://veltrix-web.vercel.app";

export function normalizeQuestSubmissionDecisionStatus(
  value: unknown
): QuestSubmissionDecisionStatus | null {
  return value === "approved" || value === "rejected" ? value : null;
}

export function getQuestSubmissionDecisionWebAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_WEBAPP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    defaultWebAppUrl
  ).replace(/\/+$/, "");
}

export function buildQuestSubmissionDecisionProxyUrl(input: {
  baseUrl: string;
  submissionId: string;
}) {
  const baseUrl = input.baseUrl.replace(/\/+$/, "");
  return `${baseUrl}/api/quests/submissions/${encodeURIComponent(input.submissionId)}/decision`;
}

export function buildReviewedSubmissionPatch(input: {
  status: QuestSubmissionDecisionStatus;
  reviewNotes: string;
  reviewerAuthUserId: string | null;
  timestamp: string;
  existingReviewNotes?: string;
  existingReviewerAuthUserId?: string;
}) {
  return {
    status: input.status,
    reviewNotes: input.reviewNotes || input.existingReviewNotes || "",
    reviewedByAuthUserId:
      input.reviewerAuthUserId || input.existingReviewerAuthUserId || "",
    reviewedAt: input.timestamp,
    updatedAt: input.timestamp,
  };
}
