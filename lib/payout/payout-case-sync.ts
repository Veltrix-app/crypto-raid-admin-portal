import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildPayoutCaseDedupeKey,
  resolvePayoutCaseRecordByDedupeKey,
  upsertPayoutCaseRecord,
} from "./payout-case-records";

type RewardClaimRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  reward_id: string | null;
  auth_user_id: string | null;
  username: string | null;
  reward_title: string | null;
  project_name: string | null;
  campaign_title: string | null;
  claim_method: string | null;
  status: string | null;
  fulfillment_notes: string | null;
  delivery_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

type RewardRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  title: string;
  cost: number | null;
  stock: number | null;
  unlimited_stock: boolean | null;
  claimable: boolean | null;
  visible: boolean | null;
  status: string | null;
};

type AuditRow = {
  id: string;
  project_id: string | null;
  source_id: string;
  action: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildClaimCaseSummary(params: {
  claim: RewardClaimRow;
  reward: RewardRow | undefined;
  caseType: "claim_review" | "manual_payout_review" | "delivery_failure";
}) {
  const rewardTitle = params.claim.reward_title ?? params.reward?.title ?? "Reward";
  const campaignTitle = params.claim.campaign_title ?? "campaign";

  if (params.caseType === "delivery_failure") {
    return `${rewardTitle} for ${campaignTitle} was rejected and needs payout follow-through.`;
  }

  if (params.caseType === "manual_payout_review") {
    return `${rewardTitle} is waiting on manual payout review for ${campaignTitle}.`;
  }

  return `${rewardTitle} is waiting on claim review for ${campaignTitle}.`;
}

async function syncClaimCases(projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let claimQuery = supabase
    .from("reward_claims")
    .select(
      "id, project_id, campaign_id, reward_id, auth_user_id, username, reward_title, project_name, campaign_title, claim_method, status, fulfillment_notes, delivery_payload, created_at, updated_at"
    )
    .in("status", ["pending", "rejected"]);
  let rewardQuery = supabase
    .from("rewards")
    .select("id, project_id, campaign_id, title, cost, stock, unlimited_stock, claimable, visible, status");
  let existingCaseQuery = supabase
    .from("payout_cases")
    .select("project_id, dedupe_key")
    .eq("source_type", "reward_claim");

  if (projectId) {
    claimQuery = claimQuery.eq("project_id", projectId);
    rewardQuery = rewardQuery.eq("project_id", projectId);
    existingCaseQuery = existingCaseQuery.eq("project_id", projectId);
  }

  const [
    { data: claimRows, error: claimError },
    { data: rewardRows, error: rewardError },
    { data: existingCaseRows, error: existingCaseError },
  ] = await Promise.all([claimQuery, rewardQuery, existingCaseQuery]);

  if (claimError) throw new Error(claimError.message || "Failed to load reward claims for payout sync.");
  if (rewardError) throw new Error(rewardError.message || "Failed to load rewards for payout sync.");
  if (existingCaseError) {
    throw new Error(existingCaseError.message || "Failed to load existing payout cases.");
  }

  const rewardById = new Map(
    ((rewardRows ?? []) as RewardRow[]).map((row) => [row.id, row])
  );
  const activeClaimKeys = new Map<string, string>();

  for (const claim of (claimRows ?? []) as RewardClaimRow[]) {
    if (!claim.project_id) {
      continue;
    }

    const reward = claim.reward_id ? rewardById.get(claim.reward_id) : undefined;
    const deliveryPayload = asObject(claim.delivery_payload);
    const distributionRewardAmount = asNumber(deliveryPayload.rewardAmount, Number.NaN);
    const rewardCost = reward?.cost ?? (Number.isFinite(distributionRewardAmount) ? distributionRewardAmount : 0);
    const isHighValue = rewardCost >= 500;
    const claimMethod = claim.claim_method ?? "manual_fulfillment";
    const caseType =
      claim.status === "rejected"
        ? "delivery_failure"
        : claimMethod === "manual_fulfillment" || isHighValue
          ? "manual_payout_review"
          : "claim_review";
    const dedupeKey =
      claim.status === "rejected"
        ? buildPayoutCaseDedupeKey(["claim", claim.id, "delivery_failure"])
        : buildPayoutCaseDedupeKey(["claim", claim.id, "review"]);

    activeClaimKeys.set(dedupeKey, claim.project_id);

    await upsertPayoutCaseRecord({
      projectId: claim.project_id,
      campaignId: claim.campaign_id,
      rewardId: claim.reward_id,
      claimId: claim.id,
      authUserId: claim.auth_user_id,
      walletAddress:
        typeof deliveryPayload.walletAddress === "string" ? deliveryPayload.walletAddress : null,
      caseType,
      severity:
        claim.status === "rejected" ? "high" : isHighValue ? "high" : claimMethod === "manual_fulfillment" ? "medium" : "low",
      status: claim.status === "rejected" ? "blocked" : "open",
      sourceType: "reward_claim",
      sourceId: claim.id,
      dedupeKey,
      summary: buildClaimCaseSummary({ claim, reward, caseType }),
      evidenceSummary:
        claim.status === "rejected"
          ? claim.fulfillment_notes || "Claim was rejected and still needs a clear payout resolution."
          : claim.fulfillment_notes || `Claim is still ${claim.status ?? "pending"} via ${claimMethod.replace(/_/g, " ")}.`,
      rawPayload: {
        claim,
        reward,
        deliveryPayload,
      },
      metadata: {
        rewardTitle: claim.reward_title ?? reward?.title ?? "Reward",
        campaignTitle: claim.campaign_title ?? null,
        projectName: claim.project_name ?? null,
        claimMethod,
        rewardCost,
      },
    });
  }

  for (const existingCase of (existingCaseRows ?? []) as Array<{ project_id: string; dedupe_key: string }>) {
    if (activeClaimKeys.has(existingCase.dedupe_key)) {
      continue;
    }

    await resolvePayoutCaseRecordByDedupeKey({
      projectId: existingCase.project_id,
      dedupeKey: existingCase.dedupe_key,
      summary: "Underlying claim no longer requires an open payout case.",
      notes: "Claim moved out of the pending or rejected states.",
    });
  }
}

async function syncInventoryCases(projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let rewardQuery = supabase
    .from("rewards")
    .select("id, project_id, campaign_id, title, cost, stock, unlimited_stock, claimable, visible, status");
  let existingCaseQuery = supabase
    .from("payout_cases")
    .select("project_id, dedupe_key")
    .eq("source_type", "reward_inventory");

  if (projectId) {
    rewardQuery = rewardQuery.eq("project_id", projectId);
    existingCaseQuery = existingCaseQuery.eq("project_id", projectId);
  }

  const [{ data: rewardRows, error: rewardError }, { data: existingCaseRows, error: caseError }] =
    await Promise.all([rewardQuery, existingCaseQuery]);

  if (rewardError) throw new Error(rewardError.message || "Failed to load rewards for payout inventory sync.");
  if (caseError) throw new Error(caseError.message || "Failed to load inventory payout cases.");

  const activeInventoryKeys = new Map<string, string>();

  for (const reward of (rewardRows ?? []) as RewardRow[]) {
    if (!reward.project_id) {
      continue;
    }

    const isTrackable =
      reward.unlimited_stock !== true &&
      reward.claimable !== false &&
      reward.visible !== false &&
      reward.status === "active";
    const stock = reward.stock ?? 0;
    if (!isTrackable || stock > 3) {
      continue;
    }

    const dedupeKey = buildPayoutCaseDedupeKey(["reward", reward.id, "inventory"]);
    activeInventoryKeys.set(dedupeKey, reward.project_id);

    await upsertPayoutCaseRecord({
      projectId: reward.project_id,
      campaignId: reward.campaign_id,
      rewardId: reward.id,
      caseType: "reward_inventory_risk",
      severity: stock <= 0 ? "high" : stock === 1 ? "high" : "medium",
      status: stock <= 0 ? "blocked" : "open",
      sourceType: "reward_inventory",
      sourceId: reward.id,
      dedupeKey,
      summary:
        stock <= 0
          ? `${reward.title} is out of stock and may block claims.`
          : `${reward.title} is running low on stock and needs payout attention.`,
      evidenceSummary: `Current stock is ${stock}. Unlimited stock is disabled for this reward.`,
      rawPayload: {
        reward,
      },
      metadata: {
        rewardTitle: reward.title,
        stock,
        unlimitedStock: reward.unlimited_stock ?? false,
      },
    });
  }

  for (const existingCase of (existingCaseRows ?? []) as Array<{ project_id: string; dedupe_key: string }>) {
    if (activeInventoryKeys.has(existingCase.dedupe_key)) {
      continue;
    }

    await resolvePayoutCaseRecordByDedupeKey({
      projectId: existingCase.project_id,
      dedupeKey: existingCase.dedupe_key,
      summary: "Reward inventory pressure has cleared.",
      notes: "Stock moved above the low-inventory threshold or the reward is no longer claim-active.",
    });
  }
}

async function syncFinalizationCases(projectId?: string) {
  const supabase = getServiceSupabaseClient();
  let auditQuery = supabase
    .from("admin_audit_logs")
    .select("id, project_id, source_id, action, summary, metadata, created_at")
    .in("action", ["reward_finalization_failed", "reward_finalization_completed"])
    .eq("source_table", "reward_distributions")
    .order("created_at", { ascending: false })
    .limit(200);
  let existingCaseQuery = supabase
    .from("payout_cases")
    .select("project_id, dedupe_key")
    .eq("source_type", "campaign_finalization");

  if (projectId) {
    auditQuery = auditQuery.eq("project_id", projectId);
    existingCaseQuery = existingCaseQuery.eq("project_id", projectId);
  }

  const [{ data: auditRows, error: auditError }, { data: existingCaseRows, error: caseError }] =
    await Promise.all([auditQuery, existingCaseQuery]);

  if (auditError) {
    throw new Error(auditError.message || "Failed to load reward finalization logs for payout sync.");
  }
  if (caseError) {
    throw new Error(caseError.message || "Failed to load existing finalization payout cases.");
  }

  const latestByCampaign = new Map<string, AuditRow>();
  for (const row of (auditRows ?? []) as AuditRow[]) {
    if (!row.project_id || latestByCampaign.has(row.source_id)) {
      continue;
    }
    latestByCampaign.set(row.source_id, row);
  }

  const activeFinalizationKeys = new Map<string, string>();

  for (const row of latestByCampaign.values()) {
    const dedupeKey = buildPayoutCaseDedupeKey(["campaign", row.source_id, "finalization_failure"]);
    if (row.action === "reward_finalization_failed") {
      activeFinalizationKeys.set(dedupeKey, row.project_id as string);
      await upsertPayoutCaseRecord({
        projectId: row.project_id as string,
        campaignId: row.source_id,
        caseType: "campaign_finalization_failure",
        severity: "high",
        status: "blocked",
        sourceType: "campaign_finalization",
        sourceId: row.source_id,
        dedupeKey,
        summary: row.summary,
        evidenceSummary: "The latest campaign reward distribution run failed and still needs an operator retry.",
        rawPayload: {
          auditLogId: row.id,
          metadata: row.metadata ?? {},
        },
        metadata: {
          latestAuditAction: row.action,
        },
      });
    } else {
      await resolvePayoutCaseRecordByDedupeKey({
        projectId: row.project_id as string,
        dedupeKey,
        summary: "Campaign reward finalization recovered.",
        notes: "The latest campaign finalization audit log completed successfully.",
      });
    }
  }

  for (const existingCase of (existingCaseRows ?? []) as Array<{ project_id: string; dedupe_key: string }>) {
    if (activeFinalizationKeys.has(existingCase.dedupe_key)) {
      continue;
    }
  }
}

export async function syncPayoutCaseSources(projectId?: string) {
  await syncClaimCases(projectId);
  await syncInventoryCases(projectId);
  await syncFinalizationCases(projectId);
}
