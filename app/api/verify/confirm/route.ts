import { NextRequest, NextResponse } from "next/server";
import {
  confirmQuestVerification,
  type IntegrationProvider,
} from "@/lib/verification-completion";

const callbackSecret = process.env.VERIFICATION_CALLBACK_SECRET;

function getCallbackToken(request: NextRequest) {
  return request.headers.get("x-verification-secret")?.trim() || "";
}

function isProvider(value: unknown): value is IntegrationProvider {
  return value === "discord" || value === "telegram" || value === "x";
}

export async function POST(request: NextRequest) {
  if (!callbackSecret) {
    return NextResponse.json(
      { ok: false, error: "Verification callback secret is not configured." },
      { status: 500 }
    );
  }

  const incomingSecret = getCallbackToken(request);
  if (!incomingSecret || incomingSecret !== callbackSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized callback." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const authUserId = typeof body?.authUserId === "string" ? body.authUserId : "";
  const questId = typeof body?.questId === "string" ? body.questId : "";
  const provider = body?.provider;
  const eventType = typeof body?.eventType === "string" ? body.eventType : "";
  const externalRef =
    typeof body?.externalRef === "string" && body.externalRef.trim()
      ? body.externalRef.trim()
      : null;
  const metadata =
    body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  if (!authUserId || !questId || !eventType || !isProvider(provider)) {
    return NextResponse.json(
      { ok: false, error: "Missing authUserId, questId, provider or eventType." },
      { status: 400 }
    );
  }

  try {
    const result = await confirmQuestVerification({
      authUserId,
      questId,
      provider,
      eventType,
      externalRef,
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification confirmation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
