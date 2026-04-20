import type { ProjectOperationAuditAction } from "@/lib/platform/core-ops";

export type ProjectContentType = "campaign" | "quest" | "raid" | "reward";
export type ProjectContentAction =
  | "duplicate"
  | "archive"
  | "publish"
  | "pause"
  | "resume";

export function resolveProjectContentStatus(
  contentType: ProjectContentType,
  action: Exclude<ProjectContentAction, "duplicate">
) {
  if (action === "pause") {
    return "paused";
  }

  if (action === "publish" || action === "resume") {
    return "active";
  }

  if (contentType === "raid") {
    return "ended";
  }

  return "archived";
}

export function getProjectContentActionAuditType(
  action: ProjectContentAction
): ProjectOperationAuditAction {
  if (action === "publish") return "published";
  if (action === "pause") return "paused";
  if (action === "resume") return "resumed";
  if (action === "archive") return "archived";
  return "created";
}

export function buildDuplicateContentTitle(title: string) {
  const normalized = title.trim();
  if (!normalized) {
    return "Untitled Copy";
  }

  const numberedCopyMatch = normalized.match(/^(.*)\sCopy\s(\d+)$/i);
  if (numberedCopyMatch) {
    const baseTitle = numberedCopyMatch[1]?.trim() || normalized;
    const currentCopyNumber = Number.parseInt(numberedCopyMatch[2] || "1", 10);
    return `${baseTitle} Copy ${Number.isFinite(currentCopyNumber) ? currentCopyNumber + 1 : 2}`;
  }

  if (/\sCopy$/i.test(normalized)) {
    return `${normalized} 2`;
  }

  return `${normalized} Copy`;
}

export function getPrimaryProjectContentAction(
  contentType: ProjectContentType,
  status: string | null | undefined
): { action: Extract<ProjectContentAction, "publish" | "pause" | "resume">; label: string } | null {
  const normalized = status?.trim().toLowerCase() ?? "draft";

  if (normalized === "active") {
    return { action: "pause", label: "Pause" };
  }

  if (normalized === "paused") {
    return { action: "resume", label: "Resume" };
  }

  if (normalized === "archived") {
    return null;
  }

  if (contentType === "raid" && normalized === "ended") {
    return null;
  }

  return { action: "publish", label: "Publish" };
}

export function canArchiveProjectContent(
  contentType: ProjectContentType,
  status: string | null | undefined
) {
  const normalized = status?.trim().toLowerCase() ?? "draft";
  if (normalized === "archived") {
    return false;
  }

  if (contentType === "raid" && normalized === "ended") {
    return false;
  }

  return true;
}
