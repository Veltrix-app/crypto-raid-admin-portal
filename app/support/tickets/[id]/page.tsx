"use client";

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
      >
        <SupportTicketDetail ticketId={params.id} />
      </PortalPageFrame>
    </AdminShell>
  );
}
