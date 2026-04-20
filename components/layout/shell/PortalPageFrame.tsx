"use client";

import type { ReactNode } from "react";
import { OpsHero } from "@/components/layout/ops/OpsPrimitives";

type PortalPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  statusBand?: ReactNode;
  children: ReactNode;
};

export default function PortalPageFrame({
  eyebrow,
  title,
  description,
  actions,
  statusBand,
  children,
}: PortalPageFrameProps) {
  return (
    <div className="space-y-6">
      <OpsHero eyebrow={eyebrow} title={title} description={description} aside={actions} />
      {statusBand ? <div>{statusBand}</div> : null}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
