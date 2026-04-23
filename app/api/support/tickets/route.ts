import { NextRequest, NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import { loadSupportTickets } from "@/lib/support/support-queue";

export async function GET(request: NextRequest) {
  try {
    await assertInternalSupportAccess();
    const searchParams = request.nextUrl.searchParams;
    const tickets = await loadSupportTickets({
      ticketType: (searchParams.get("ticketType")?.trim() as any) || "",
      priority: (searchParams.get("priority")?.trim() as any) || "",
      status: (searchParams.get("status")?.trim() as any) || "",
      waitingState: (searchParams.get("waitingState")?.trim() as any) || "",
      linkedAccountId: searchParams.get("linkedAccountId")?.trim() || "",
      linkedProjectId: searchParams.get("linkedProjectId")?.trim() || "",
      search: searchParams.get("search")?.trim() || "",
      includeClosed: searchParams.get("includeClosed") === "true",
    });

    return NextResponse.json(
      {
        ok: true,
        tickets,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load support tickets.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}
