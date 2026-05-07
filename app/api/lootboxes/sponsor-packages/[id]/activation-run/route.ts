import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxSponsorActivationHandoffRead,
  buildLootboxSponsorActivationRunRequest,
  type LootboxSponsorPackageDetailPackageRow,
} from "@/lib/lootboxes/lootbox-sponsored-package-operator";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackageNoteInsertRow,
  isMissingLootboxSponsorPackageSchema,
} from "@/lib/lootboxes/lootbox-sponsored-package-persistence";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SponsorPackageAdminResult =
  | {
      ok: true;
      authUserId: string;
      serviceSupabase: ReturnType<typeof getServiceSupabaseClient>;
    }
  | { ok: false; response: NextResponse };

type CampaignRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  visibility: string;
  reward_pool_amount: number | null;
  participants: number | null;
  completion_rate: number | null;
};

type ProjectRow = {
  id: string;
  name: string;
  slug: string | null;
};

type FeaturedShardPoolRow = {
  id: string;
  campaign_id: string | null;
  status: string | null;
  pool_size: number | null;
  remaining_shards: number | null;
};

async function getSponsorPackageAdmin(): Promise<SponsorPackageAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "You must be signed in." }, { status: 401 }),
    };
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error: adminError } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: adminError.message }, { status: 500 }),
    };
  }

  if (!adminUser || adminUser.status !== "active" || adminUser.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Sponsor package controls are limited to Veltrix super admins." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, authUserId: user.id, serviceSupabase };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing sponsor package id." }, { status: 400 });
    }

    const admin = await getSponsorPackageAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const packageResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .select(
        [
          "id",
          "project_id",
          "campaign_id",
          "package_tier",
          "status",
          "sponsor_name",
          "sponsor_contact",
          "sponsor_budget",
          "currency",
          "owner_auth_user_id",
          "follow_up_at",
          "last_contacted_at",
          "package_snapshot",
          "metadata",
          "created_by_auth_user_id",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .eq("id", id)
      .maybeSingle();

    if (packageResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(packageResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: packageResponse.error.message }, { status });
    }

    if (!packageResponse.data) {
      return NextResponse.json({ ok: false, error: "Sponsor package not found." }, { status: 404 });
    }

    const packageRow = packageResponse.data as unknown as LootboxSponsorPackageDetailPackageRow;
    const campaign = await loadSponsorCampaign(admin.serviceSupabase, packageRow.campaign_id);
    const projectId = packageRow.project_id ?? campaign?.projectId ?? null;
    const project = await loadSponsorProject(admin.serviceSupabase, projectId);
    const shardPools = await loadSponsorShardPools(admin.serviceSupabase, packageRow.campaign_id);

    const handoffRead = buildLootboxSponsorActivationHandoffRead({
      packages: [packageRow],
      campaigns: campaign ? [campaign] : [],
      projects: project ? [project] : [],
      shardPools,
    });
    const handoff = handoffRead.handoffs.find((item) => item.packageId === packageRow.id);

    if (!handoff) {
      return NextResponse.json(
        { ok: false, error: "Sponsor activation handoff could not be built." },
        { status: 409 }
      );
    }

    const runRequest = buildLootboxSponsorActivationRunRequest({ handoff });

    if (!runRequest.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: runRequest.error,
          blockedBy: runRequest.blockedBy,
        },
        { status: 409 }
      );
    }

    const noteResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_package_notes")
      .insert(
        buildLootboxSponsorPackageNoteInsertRow({
          sponsorPackageId: packageRow.id,
          adminAuthUserId: admin.authUserId,
          payload: runRequest.notePayload,
        })
      )
      .select("id, sponsor_package_id, note_type, note, metadata, follow_up_at, created_by_auth_user_id, created_at")
      .single();

    if (noteResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(noteResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: noteResponse.error.message }, { status });
    }

    const auditResult = await admin.serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxSponsorPackageAuditPayload({
          adminAuthUserId: admin.authUserId,
          projectId,
          sponsorPackageId: packageRow.id,
          action: runRequest.audit.action,
          summary: runRequest.audit.summary,
          metadata: {
            ...runRequest.audit.metadata,
            noteId: noteResponse.data.id,
          },
        })
      );

    if (auditResult.error) {
      console.error("Sponsor activation run audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      activationRun: runRequest.activationRun,
      note: noteResponse.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor activation run failed.",
      },
      { status: 500 }
    );
  }
}

async function loadSponsorCampaign(
  serviceSupabase: ReturnType<typeof getServiceSupabaseClient>,
  campaignId: string | null
) {
  if (!campaignId) {
    return null;
  }

  const { data, error } = await serviceSupabase
    .from("campaigns")
    .select("id, project_id, title, status, visibility, reward_pool_amount, participants, completion_rate")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as CampaignRow;
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    visibility: row.visibility,
    rewardPoolAmount: row.reward_pool_amount ?? 0,
    participants: row.participants ?? 0,
    completionRate: row.completion_rate ?? 0,
  };
}

async function loadSponsorProject(
  serviceSupabase: ReturnType<typeof getServiceSupabaseClient>,
  projectId: string | null
) {
  if (!projectId) {
    return null;
  }

  const { data, error } = await serviceSupabase
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as ProjectRow;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? "",
  };
}

async function loadSponsorShardPools(
  serviceSupabase: ReturnType<typeof getServiceSupabaseClient>,
  campaignId: string | null
) {
  if (!campaignId) {
    return [];
  }

  const { data, error } = await serviceSupabase
    .from("featured_shard_pools")
    .select("id, campaign_id, status, pool_size, remaining_shards")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as FeaturedShardPoolRow[]).map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status ?? "draft",
    poolSize: row.pool_size ?? 0,
    remainingShards: row.remaining_shards ?? 0,
  }));
}
