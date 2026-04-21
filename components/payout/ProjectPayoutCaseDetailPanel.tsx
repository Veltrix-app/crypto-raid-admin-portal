"use client";

import type { PayoutCaseAction } from "@/lib/payout/payout-actions";
import type { PayoutCaseDetailRecord } from "./types";
import PayoutCaseDetailPanel from "./PayoutCaseDetailPanel";

export default function ProjectPayoutCaseDetailPanel(props: {
  payoutCase: PayoutCaseDetailRecord | null;
  loading?: boolean;
  availableActions: PayoutCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: PayoutCaseAction, notes: string) => void;
}) {
  return <PayoutCaseDetailPanel scope="project" {...props} />;
}
