import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { isBillingLimitError } from "@/lib/billing/entitlement-blocks";
import { requireAccountGrowthCapacity } from "@/lib/billing/entitlement-guard";

function slugifyProjectName(name: string, accountId: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `${base || "project"}-${accountId.slice(0, 6)}`;
}

function appendCompletedStep(current: string[] | null | undefined, nextStep: string) {
  const existing = Array.isArray(current) ? current.filter(Boolean) : [];
  return existing.includes(nextStep) ? existing : [...existing, nextStep];
}

function createBootstrapErrorResponse(error: unknown, fallbackMessage: string) {
  if (isBillingLimitError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        block: error.block,
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: 500 }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await context.params;
  const supabase = await createServerClient();
  const serviceSupabase = getAccountsServiceClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Invalid portal session." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectName = typeof body?.name === "string" ? body.name.trim() : "";
  const chain = typeof body?.chain === "string" && body.chain.trim() ? body.chain.trim() : "Base";
  const category =
    typeof body?.category === "string" && body.category.trim() ? body.category.trim() : "community";
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : `${projectName || "This project"} is preparing launch setup in Veltrix.`;

  if (!projectName) {
    return NextResponse.json({ ok: false, error: "Project name is required." }, { status: 400 });
  }

  const [membershipResponse, accountResponse, onboardingResponse, projectsResponse] =
    await Promise.all([
      serviceSupabase
        .from("customer_account_memberships")
        .select("role, status")
        .eq("customer_account_id", accountId)
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      serviceSupabase
        .from("customer_accounts")
        .select("id, name, contact_email")
        .eq("id", accountId)
        .maybeSingle(),
      serviceSupabase
        .from("customer_account_onboarding")
        .select("customer_account_id, current_step, completed_steps, first_project_id")
        .eq("customer_account_id", accountId)
        .maybeSingle(),
      serviceSupabase
        .from("projects")
        .select("id, name, created_at")
        .eq("customer_account_id", accountId)
        .order("created_at", { ascending: true }),
    ]);

  if (membershipResponse.error || !membershipResponse.data) {
    return NextResponse.json(
      { ok: false, error: membershipResponse.error?.message || "Workspace membership not found." },
      { status: 403 }
    );
  }

  if (
    !["owner", "admin"].includes(membershipResponse.data.role) ||
    membershipResponse.data.status !== "active"
  ) {
    return NextResponse.json(
      { ok: false, error: "Only active owners or admins can bootstrap the first project." },
      { status: 403 }
    );
  }

  if (accountResponse.error || !accountResponse.data) {
    return NextResponse.json(
      { ok: false, error: accountResponse.error?.message || "Workspace account not found." },
      { status: 404 }
    );
  }

  const existingProjects = projectsResponse.data ?? [];
  const firstExistingProject =
    existingProjects.find((project) => project.id === onboardingResponse.data?.first_project_id) ??
    existingProjects[0] ??
    null;

  if (firstExistingProject) {
    return NextResponse.json({
      ok: true,
      created: false,
      projectId: firstExistingProject.id,
      projectName: firstExistingProject.name,
    });
  }

  try {
    await requireAccountGrowthCapacity({
      accountId,
      usageKey: "projects",
      growthAction: "create_project",
      returnTo: "/projects",
    });
  } catch (error) {
    return createBootstrapErrorResponse(error, "Project capacity check failed.");
  }

  const slug = slugifyProjectName(projectName, accountId);
  const { data: createdProject, error: projectError } = await serviceSupabase
    .from("projects")
    .insert({
      customer_account_id: accountId,
      owner_user_id: user.id,
      name: projectName,
      slug,
      chain,
      category,
      status: "draft",
      onboarding_status: "draft",
      description,
      long_description: "",
      members: 1,
      campaigns: 0,
      logo: "🚀",
      banner_url: null,
      website: null,
      x_url: null,
      telegram_url: null,
      discord_url: null,
      docs_url: null,
      waitlist_url: null,
      launch_post_url: null,
      token_contract_address: null,
      nft_contract_address: null,
      primary_wallet: null,
      brand_accent: null,
      brand_mood: null,
      contact_email: accountResponse.data.contact_email ?? user.email ?? null,
      is_featured: false,
      is_public: true,
    })
    .select("id, name")
    .single();

  if (
    projectError?.message?.toLowerCase().includes("billing limit reached")
  ) {
    try {
      await requireAccountGrowthCapacity({
        accountId,
        usageKey: "projects",
        growthAction: "create_project",
        returnTo: "/projects",
      });
    } catch (error) {
      return createBootstrapErrorResponse(error, "Project capacity check failed.");
    }
  }

  if (projectError || !createdProject) {
    return NextResponse.json(
      { ok: false, error: projectError?.message || "Failed to create project." },
      { status: 500 }
    );
  }

  const ownerTeamError = await serviceSupabase.from("team_members").insert({
    project_id: createdProject.id,
    auth_user_id: user.id,
    name: accountResponse.data.name,
    email: accountResponse.data.contact_email ?? user.email ?? "",
    role: "owner",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (ownerTeamError.error) {
    return NextResponse.json(
      { ok: false, error: ownerTeamError.error.message || "Failed to create owner team membership." },
      { status: 500 }
    );
  }

  const onboardingPayload = {
    current_step: "open_launch_workspace",
    completed_steps: appendCompletedStep(onboardingResponse.data?.completed_steps, "create_project"),
    first_project_id: createdProject.id,
  };

  const onboardingWrite = onboardingResponse.data
    ? serviceSupabase
        .from("customer_account_onboarding")
        .update(onboardingPayload)
        .eq("customer_account_id", accountId)
    : serviceSupabase.from("customer_account_onboarding").insert({
        customer_account_id: accountId,
        status: "in_progress",
        ...onboardingPayload,
      });

  const [onboardingWriteResult, eventWriteResult] = await Promise.all([
    onboardingWrite,
    serviceSupabase.from("customer_account_events").insert({
      customer_account_id: accountId,
      event_type: "first_project_created",
      actor_auth_user_id: user.id,
      metadata: {
        projectId: createdProject.id,
        projectName: createdProject.name,
      },
    }),
  ]);

  if (onboardingWriteResult.error) {
    return NextResponse.json(
      { ok: false, error: onboardingWriteResult.error.message || "Failed to update onboarding." },
      { status: 500 }
    );
  }

  if (eventWriteResult.error) {
    return NextResponse.json(
      { ok: false, error: eventWriteResult.error.message || "Failed to write account event." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    created: true,
    projectId: createdProject.id,
    projectName: createdProject.name,
  });
}
