import { NextRequest, NextResponse } from "next/server";
import {
  applyProjectOnchainCaseAction,
  type OnchainCaseAction,
} from "@/lib/onchain/onchain-actions";
import {
  assertProjectOnchainAccess,
  createOnchainAccessErrorResponse,
} from "@/lib/onchain/project-onchain-auth";
import { loadProjectOnchainCaseDetail } from "@/lib/onchain/project-onchain-cases";

const PROJECT_ONCHAIN_ACTIONS = [
  "annotate",
  "escalate",
  "retry",
  "rerun_enrichment",
  "rescan_assets",
  "resolve",
] as const satisfies readonly OnchainCaseAction[];

function isProjectOnchainAction(value: string): value is (typeof PROJECT_ONCHAIN_ACTIONS)[number] {
  return PROJECT_ONCHAIN_ACTIONS.includes(value as (typeof PROJECT_ONCHAIN_ACTIONS)[number]);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params;
    const access = await assertProjectOnchainAccess(id);
    const body = (await request.json().catch(() => null)) as
      | {
          action?: string;
          notes?: string | null;
        }
      | null;

    if (!body?.action || !isProjectOnchainAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid project on-chain action." }, { status: 400 });
    }

    await applyProjectOnchainCaseAction({
      access,
      caseId,
      action: body.action,
      notes: body.notes ?? null,
    });

    const onchainCase = await loadProjectOnchainCaseDetail(caseId, access);

    return NextResponse.json({
      ok: true,
      onchainCase,
      message: "Project on-chain action applied.",
    });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to apply project on-chain action.");
  }
}
