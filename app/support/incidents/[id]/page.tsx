"use client";

import Link from "next/link";
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
        actions={
          <Link
            href="/support"
            className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
          >
            Back to support
          </Link>
        }
      >
        <IncidentCommandPanel incidentId={params.id} />
      </PortalPageFrame>
    </AdminShell>
  );
}
