import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectTrustAccess,
  createTrustAccessErrorResponse,
} from "@/lib/trust/project-trust-auth";
import { loadProjectTrustCaseDetail } from "@/lib/trust/project-trust-cases";
import {
  applyProjectTrustCaseAction,
  type TrustCaseAction,
} from "@/lib/trust/trust-actions";

const PROJECT_TRUST_ACTIONS = [
  "annotate",
  "escalate",
  "resolve",
  "mute_member",
  "freeze_reward_eligibility",
  "trust_override",
  "reward_override",
 ] as const satisfies readonly TrustCaseAction[];

function isProjectTrustAction(value: string): value is (typeof PROJECT_TRUST_ACTIONS)[number] {
  return PROJECT_TRUST_ACTIONS.includes(value as (typeof PROJECT_TRUST_ACTIONS)[number]);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectTrustAccess(id);
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isProjectTrustAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid project trust action." }, { status: 400 });
    }

    await applyProjectTrustCaseAction({
      access,
      caseId,
      action: body.action,
      notes: body.notes ?? null,
    });

    const trustCase = await loadProjectTrustCaseDetail(caseId, access);

    return NextResponse.json({
      ok: true,
      trustCase,
      message: "Project trust action applied.",
    });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to apply project trust action.");
  }
}
