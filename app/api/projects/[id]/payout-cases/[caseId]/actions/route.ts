import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectPayoutAccess,
  createPayoutAccessErrorResponse,
} from "@/lib/payout/project-payout-auth";
import { loadProjectPayoutCaseDetail } from "@/lib/payout/project-payout-cases";
import {
  applyProjectPayoutCaseAction,
  type PayoutCaseAction,
} from "@/lib/payout/payout-actions";
import { syncPayoutCaseSources } from "@/lib/payout/payout-case-sync";

const PROJECT_PAYOUT_ACTIONS = [
  "annotate",
  "escalate",
  "retry",
  "resolve",
  "freeze_reward",
  "pause_claim_rail",
  "payout_override",
] as const satisfies readonly PayoutCaseAction[];

function isProjectPayoutAction(value: string): value is (typeof PROJECT_PAYOUT_ACTIONS)[number] {
  return PROJECT_PAYOUT_ACTIONS.includes(value as (typeof PROJECT_PAYOUT_ACTIONS)[number]);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectPayoutAccess(id);
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isProjectPayoutAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid project payout action." }, { status: 400 });
    }

    const result = await applyProjectPayoutCaseAction({
      access,
      caseId,
      action: body.action,
      notes: body.notes ?? null,
    });

    await syncPayoutCaseSources(result.projectId);

    const payoutCase = await loadProjectPayoutCaseDetail(caseId, access);

    return NextResponse.json({
      ok: true,
      payoutCase,
      message: "Project payout action applied.",
    });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to apply project payout action.");
  }
}
