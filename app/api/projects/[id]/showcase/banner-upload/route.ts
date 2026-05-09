import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = "project-showcase-assets";
const maxBannerSize = 6 * 1024 * 1024;

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for project showcase uploads.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isPngFile(file: File) {
  return file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
}

async function ensureBucketExists(supabase: ReturnType<typeof getServiceSupabaseClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket: { name: string }) => bucket.name === bucketName);

  if (exists) {
    await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit: maxBannerSize,
    });
    return;
  }

  await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: maxBannerSize,
  });
}

async function canManageProject(params: {
  supabase: ReturnType<typeof getServiceSupabaseClient>;
  authUserId: string;
  projectId: string;
}) {
  const [{ data: adminUser }, { data: ownedProject }, { data: teamMember }] = await Promise.all([
    params.supabase
      .from("admin_users")
      .select("role, status")
      .eq("auth_user_id", params.authUserId)
      .maybeSingle(),
    params.supabase
      .from("projects")
      .select("id")
      .eq("id", params.projectId)
      .eq("owner_user_id", params.authUserId)
      .maybeSingle(),
    params.supabase
      .from("team_members")
      .select("id")
      .eq("project_id", params.projectId)
      .eq("auth_user_id", params.authUserId)
      .maybeSingle(),
  ]);

  return Boolean(
    (adminUser?.status === "active" && adminUser?.role === "super_admin") ||
      ownedProject ||
      teamMember
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Missing access token." }, { status: 401 });
    }

    const supabase = getServiceSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session for showcase upload." }, { status: 401 });
    }

    const allowed = await canManageProject({
      supabase,
      authUserId: user.id,
      projectId,
    });

    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Project upload access denied." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing banner PNG." }, { status: 400 });
    }

    if (!isPngFile(file)) {
      return NextResponse.json({ ok: false, error: "Showcase banners must be PNG files." }, { status: 400 });
    }

    if (file.size > maxBannerSize) {
      return NextResponse.json({ ok: false, error: "Banner PNG must be 6MB or smaller." }, { status: 400 });
    }

    await ensureBucketExists(supabase);

    const objectPath = `${projectId}/showcase-banner-${Date.now()}.png`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(objectPath, arrayBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      recommended: {
        size: "2400x1080",
        minimum: "1600x720",
        format: "PNG",
        maxFileSize: "6MB",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Project showcase banner upload failed.",
      },
      { status: 500 }
    );
  }
}
