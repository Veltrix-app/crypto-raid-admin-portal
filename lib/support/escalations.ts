import { createClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbSupportEscalation } from "@/types/database";

export const SUPPORT_ESCALATION_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export const SUPPORT_ESCALATION_STATUSES = [
  "open",
  "triaging",
  "waiting_internal",
  "waiting_project",
  "waiting_provider",
  "blocked",
  "resolved",
  "dismissed",
] as const;
export const SUPPORT_ESCALATION_WAITING_ON = [
  "internal",
  "project",
  "provider",
  "deploy",
  "none",
] as const;

export type SupportEscalationSeverity = (typeof SUPPORT_ESCALATION_SEVERITIES)[number];
export type SupportEscalationStatus = (typeof SUPPORT_ESCALATION_STATUSES)[number];
export type SupportEscalationWaitingOn = (typeof SUPPORT_ESCALATION_WAITING_ON)[number];

export type SupportEscalationRecord = DbSupportEscalation & {
  projectName: string | null;
  ownerIsViewer: boolean;
};

export type SupportEscalationSummary = {
  total: number;
  unresolved: number;
  critical: number;
  waitingProject: number;
  waitingProvider: number;
  waitingDeploy: number;
};

export class SupportEscalationAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function asEscalationStatus(value: string | null | undefined): SupportEscalationStatus {
  if (SUPPORT_ESCALATION_STATUSES.includes(value as SupportEscalationStatus)) {
    return value as SupportEscalationStatus;
  }
  return "open";
}

function asWaitingOn(value: string | null | undefined): SupportEscalationWaitingOn {
  if (SUPPORT_ESCALATION_WAITING_ON.includes(value as SupportEscalationWaitingOn)) {
    return value as SupportEscalationWaitingOn;
  }
  return "internal";
}

function asSeverity(value: string | null | undefined): SupportEscalationSeverity {
  if (SUPPORT_ESCALATION_SEVERITIES.includes(value as SupportEscalationSeverity)) {
    return value as SupportEscalationSeverity;
  }
  return "medium";
}

function severityRank(severity: SupportEscalationSeverity) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function isResolvedStatus(status: SupportEscalationStatus) {
  return status === "resolved" || status === "dismissed";
}

function shapeSupportEscalation(
  escalation: DbSupportEscalation,
  projectName: string | null,
  viewerAuthUserId?: string | null
): SupportEscalationRecord {
  return {
    ...escalation,
    severity: asSeverity(escalation.severity),
    status: asEscalationStatus(escalation.status),
    waiting_on: asWaitingOn(escalation.waiting_on),
    projectName,
    ownerIsViewer: Boolean(viewerAuthUserId && escalation.owner_auth_user_id === viewerAuthUserId),
  };
}

export async function assertInternalSupportAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new SupportEscalationAccessError(401, "You must be signed in to access support escalations.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new SupportEscalationAccessError(500, error.message);
  }

  if (!adminUser || adminUser.status !== "active") {
    throw new SupportEscalationAccessError(
      403,
      "Support escalations are limited to Veltrix operators."
    );
  }

  return {
    authUserId: user.id,
    adminRole: adminUser.role ?? "operator",
    isSuperAdmin: adminUser.role === "super_admin",
  };
}

export async function listSupportEscalations(options?: {
  projectId?: string | null;
  sourceSurface?: string | null;
  includeResolved?: boolean;
  limit?: number;
  viewerAuthUserId?: string | null;
}) {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from("support_escalations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(options?.limit ?? 30);

  if (options?.projectId) {
    query = query.eq("project_id", options.projectId);
  }

  if (options?.sourceSurface) {
    query = query.eq("source_surface", options.sourceSurface);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rawRows = ((data ?? []) as DbSupportEscalation[]).filter((row) =>
    options?.includeResolved ? true : !isResolvedStatus(asEscalationStatus(row.status))
  );

  const projectIds = Array.from(
    new Set(rawRows.map((row) => row.project_id).filter((value): value is string => Boolean(value)))
  );
  const projectNameMap = new Map<string, string>();

  if (projectIds.length > 0) {
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    if (projectError) {
      throw new Error(projectError.message);
    }

    for (const project of (projects ?? []) as Array<{ id: string; name: string }>) {
      projectNameMap.set(project.id, project.name);
    }
  }

  return rawRows
    .map((row) =>
      shapeSupportEscalation(
        row,
        row.project_id ? projectNameMap.get(row.project_id) ?? null : null,
        options?.viewerAuthUserId
      )
    )
    .sort((a, b) => {
      const severityDelta = severityRank(asSeverity(b.severity)) - severityRank(asSeverity(a.severity));
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}

export async function getSupportEscalationById(
  escalationId: string,
  viewerAuthUserId?: string | null
) {
  const rows = await listSupportEscalations({
    includeResolved: true,
    limit: 100,
    viewerAuthUserId,
  });
  return rows.find((row) => row.id === escalationId) ?? null;
}

export function summarizeSupportEscalations(escalations: SupportEscalationRecord[]): SupportEscalationSummary {
  return {
    total: escalations.length,
    unresolved: escalations.filter((row) => !isResolvedStatus(asEscalationStatus(row.status))).length,
    critical: escalations.filter((row) => asSeverity(row.severity) === "critical").length,
    waitingProject: escalations.filter((row) => asWaitingOn(row.waiting_on) === "project").length,
    waitingProvider: escalations.filter((row) => asWaitingOn(row.waiting_on) === "provider").length,
    waitingDeploy: escalations.filter((row) => asWaitingOn(row.waiting_on) === "deploy").length,
  };
}

export async function updateSupportEscalation(
  escalationId: string,
  actorAuthUserId: string,
  input: {
    status?: SupportEscalationStatus;
    waitingOn?: SupportEscalationWaitingOn;
    nextActionSummary?: string | null;
    resolutionNotes?: string | null;
  }
) {
  const supabase = getServiceSupabaseClient();
  const { data: escalation, error } = await supabase
    .from("support_escalations")
    .select("*")
    .eq("id", escalationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const existing = escalation as DbSupportEscalation;
  const nextStatus = input.status ? asEscalationStatus(input.status) : asEscalationStatus(existing.status);
  const now = new Date().toISOString();

  const resolvedAt =
    nextStatus === "resolved" ? now : nextStatus === "dismissed" ? null : null;
  const dismissedAt = nextStatus === "dismissed" ? now : null;

  const { error: updateError } = await supabase
    .from("support_escalations")
    .update({
      status: nextStatus,
      waiting_on: isResolvedStatus(nextStatus)
        ? "none"
        : input.waitingOn
          ? asWaitingOn(input.waitingOn)
          : asWaitingOn(existing.waiting_on),
      next_action_summary:
        typeof input.nextActionSummary === "string"
          ? input.nextActionSummary.trim() || null
          : existing.next_action_summary,
      resolution_notes:
        typeof input.resolutionNotes === "string"
          ? input.resolutionNotes.trim() || null
          : existing.resolution_notes,
      owner_auth_user_id: actorAuthUserId,
      resolved_by_auth_user_id: nextStatus === "resolved" ? actorAuthUserId : null,
      resolved_at: resolvedAt,
      dismissed_at: dismissedAt,
      updated_at: now,
    })
    .eq("id", escalationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return getSupportEscalationById(escalationId, actorAuthUserId);
}
