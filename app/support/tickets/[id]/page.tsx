"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";

export default function SupportTicketPage() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Support ticket"
        title="Ticket drilldown"
        description="Keep the full requester context, queue posture and bounded handoff trail visible before the issue moves into a specialist workspace."
        actions={
          <Link
            href="/support"
            className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
          >
            Back to support
          </Link>
        }
      >
        <SupportTicketDetail ticketId={params.id} />
      </PortalPageFrame>
    </AdminShell>
  );
}
