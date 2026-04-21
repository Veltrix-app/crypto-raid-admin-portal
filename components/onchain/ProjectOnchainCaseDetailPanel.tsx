"use client";

import type { OnchainCaseAction } from "@/lib/onchain/onchain-actions";
import type { OnchainCaseDetailRecord } from "./types";
import OnchainCaseDetailPanel from "./OnchainCaseDetailPanel";

export default function ProjectOnchainCaseDetailPanel(props: {
  onchainCase: OnchainCaseDetailRecord | null;
  loading?: boolean;
  availableActions: OnchainCaseAction[];
  actionBusy?: string | null;
  onAction?: (action: OnchainCaseAction, notes: string) => void;
}) {
  return <OnchainCaseDetailPanel scope="project" {...props} />;
}
