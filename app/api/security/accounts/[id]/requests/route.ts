import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedPortalAccountUser } from "@/lib/accounts/account-auth";
import {
  createDataAccessRequest,
  updateDataAccessRequest,
} from "@/lib/security/data-requests";
import {
  resolveSecurityAccountAccessByAuthUserId,
} from "@/lib/security/security-policies";
import type { DataAccessRequestType } from "@/types/database";

type RequestAction = "review" | "request_verification" | "approve" | "reject" | "complete";

const CREATE_TYPES: DataAccessRequestType[] = ["export", "delete"];
const REQUEST_ACTIONS: RequestAction[] = [
  "review",
  "request_verification",
  "approve",
  "reject",
  "complete",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseCreateBody(body: unknown) {
  if (typeof body !== "object" || body == null || Array.isArray(body)) {
    throw new Error("Invalid request payload.");
  }

  const raw = body as Record<string, unknown>;
  const requestType = asTrimmedString(raw.requestType) as DataAccessRequestType;
  const summary = asTrimmedString(raw.summary);

  if (!CREATE_TYPES.includes(requestType)) {
    throw new Error("Data request type must be export or delete.");
  }

  if (summary.length < 8 || summary.length > 500) {
    throw new Error("Data request summary must be between 8 and 500 characters.");
  }

  return {
    requestType,
    summary,
  };
}

function parseUpdateBody(body: unknown) {
  if (typeof body !== "object" || body == null || Array.isArray(body)) {
    throw new Error("Invalid request payload.");
  }

  const raw = body as Record<string, unknown>;
  const requestId = asTrimmedString(raw.requestId);
  const action = asTrimmedString(raw.action) as RequestAction;
  const reviewNotes = raw.reviewNotes == null ? undefined : asTrimmedString(raw.reviewNotes);

  if (!isUuid(requestId)) {
    throw new Error("Request id must be a valid UUID.");
  }

  if (!REQUEST_ACTIONS.includes(action)) {
    throw new Error("Unsupported data request action.");
  }

  if (reviewNotes && reviewNotes.length > 1000) {
    throw new Error("Review notes are too long.");
  }

  return {
    requestId,
    action,
    reviewNotes,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const { id } = await context.params;
    await resolveSecurityAccountAccessByAuthUserId({
      accountId: id,
      authUserId: authenticatedUser.user.id,
    });
    const body = parseCreateBody(await request.json());
    const createdRequest = await createDataAccessRequest({
      accountId: id,
      authUserId: authenticatedUser.user.id,
      requesterEmail: authenticatedUser.email ?? "",
      requestType: body.requestType,
      summary: body.summary,
    });

    return NextResponse.json({
      ok: true,
      request: createdRequest,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create data access request.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Security access denied."
          ? 403
          : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await resolveAuthenticatedPortalAccountUser(request);
    const { id } = await context.params;
    const access = await resolveSecurityAccountAccessByAuthUserId({
      accountId: id,
      authUserId: authenticatedUser.user.id,
    });

    if (!access.isInternalAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error: "Security access denied.",
        },
        { status: 403 }
      );
    }

    const body = parseUpdateBody(await request.json());
    const updatedRequest = await updateDataAccessRequest({
      requestId: body.requestId,
      actorAuthUserId: authenticatedUser.user.id,
      action: body.action,
      reviewNotes: body.reviewNotes,
    });

    return NextResponse.json({
      ok: true,
      request: updatedRequest,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update data access request.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Security access denied."
          ? 403
          : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
