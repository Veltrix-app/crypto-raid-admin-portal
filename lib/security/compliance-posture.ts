import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type {
  DbComplianceControl,
  DbComplianceEvidenceItem,
  DbSubprocessor,
} from "@/types/database";
import type {
  AdminComplianceControl,
  AdminComplianceEvidenceItem,
  AdminSubprocessor,
} from "@/types/entities/security";

function shapeControl(row: DbComplianceControl): AdminComplianceControl {
  return {
    id: row.id,
    controlKey: row.control_key,
    title: row.title,
    summary: row.summary,
    controlArea: row.control_area,
    controlState: row.control_state,
    reviewState: row.review_state,
    ownerLabel: row.owner_label,
    cadence: row.cadence,
    evidenceSummary: row.evidence_summary,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    nextReviewAt: row.next_review_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeEvidence(row: DbComplianceEvidenceItem): AdminComplianceEvidenceItem {
  return {
    id: row.id,
    complianceControlId: row.compliance_control_id,
    evidenceType: row.evidence_type,
    title: row.title,
    summary: row.summary,
    evidenceUrl: row.evidence_url ?? undefined,
    createdByAuthUserId: row.created_by_auth_user_id ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeSubprocessor(row: DbSubprocessor): AdminSubprocessor {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    purpose: row.purpose,
    dataScope: row.data_scope ?? [],
    regionScope: row.region_scope ?? [],
    websiteUrl: row.website_url,
    status: row.status,
    sortOrder: row.sort_order,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadComplianceControls() {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("compliance_controls")
    .select("*")
    .order("next_review_at", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbComplianceControl[]).map(shapeControl);
}

export async function loadComplianceEvidenceItems(controlIds?: string[]) {
  const supabase = getAccountsServiceClient();
  let query = supabase
    .from("compliance_evidence_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (controlIds?.length) {
    query = query.in("compliance_control_id", controlIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbComplianceEvidenceItem[]).map(shapeEvidence);
}

export async function loadSubprocessors() {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("subprocessors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbSubprocessor[]).map(shapeSubprocessor);
}
