"use client";

import type { TrustCaseAction } from "@/lib/trust/trust-actions";
import TrustCaseDetailPanel from "./TrustCaseDetailPanel";
import type { TrustCaseDetailRecord } from "./types";

export default function ProjectTrustCaseDetailPanel(props: {
  trustCase: TrustCaseDetailRecord | null;
  loading?: boolean;
  availableActions: TrustCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: TrustCaseAction, notes: string) => void;
}) {
  return <TrustCaseDetailPanel scope="project" {...props} />;
}
