"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { IncidentCommandPanel } from "@/components/support/IncidentCommandPanel";

export default function SupportIncidentPage() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Incident command"
        title="Incident detail"
        description="Manage the internal and public timeline from one command surface so service incidents stay explainable while tickets are still landing."
      >
        <IncidentCommandPanel incidentId={params.id} />
      </PortalPageFrame>
    </AdminShell>
  );
}
