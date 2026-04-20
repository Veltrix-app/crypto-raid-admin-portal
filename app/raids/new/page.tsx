"use client";

import { useRouter } from "next/navigation";
import RaidForm from "@/components/forms/raid/RaidForm";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRaidPage() {
  const router = useRouter();
  const createRaid = useAdminPortalStore((s) => s.createRaid);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const liveCampaigns = campaigns.filter((campaign) => campaign.status === "active");

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Raid builder"
        title="New Raid"
        description="A cleaner launch rail for pressure-based missions, with live campaign context visible before the raid goes out."
        statusBand={
          <div className="grid gap-4 md:grid-cols-3">
            <OpsMetricCard label="Projects" value={projects.length} />
            <OpsMetricCard label="Campaigns" value={campaigns.length} />
            <OpsMetricCard
              label="Live campaigns"
              value={liveCampaigns.length}
              emphasis={liveCampaigns.length > 0 ? "primary" : "warning"}
            />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Raid setup"
            title="Pressure mission configuration"
            description="Shape the raid, attach it to the right campaign and make sure it lands as an intentional pressure moment rather than a loose alert."
          >
            <RaidForm
              projects={projects}
              campaigns={campaigns}
              onSubmit={async (values) => {
                const id = await createRaid(values);
                router.push(`/raids/${id}`);
              }}
            />
          </OpsPanel>

          <div className="space-y-6">
            <OpsPanel
              eyebrow="Builder checklist"
              title="What makes a clean raid"
              description="A short guide so raids ship with the right pressure shape and timing."
              tone="accent"
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Timing" value="Live window and urgency feel intentional" />
                <OpsSnapshotRow label="Destination" value="Attached to the right active campaign" />
                <OpsSnapshotRow label="Pressure" value="Objective and CTA are crystal clear" />
                <OpsSnapshotRow label="Aftercare" value="Result and reminder flows are easy to add next" />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Campaign context"
              title="Current launch posture"
              description="A quick read on whether the raid is being created into a live operating lane."
            >
              <div className="space-y-3">
                <OpsSnapshotRow
                  label="Live campaign inventory"
                  value={
                    liveCampaigns.length > 0
                      ? `${liveCampaigns.length} active campaigns available`
                      : "No active campaigns right now"
                  }
                />
                <OpsSnapshotRow label="After submit" value="Redirects into raid detail for operate/configure tuning" />
              </div>
            </OpsPanel>
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
