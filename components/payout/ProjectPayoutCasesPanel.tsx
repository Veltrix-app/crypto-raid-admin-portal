"use client";

import type { PayoutCaseListRow } from "./types";
import PayoutQueuePanel from "./PayoutQueuePanel";

export default function ProjectPayoutCasesPanel(props: {
  rows: PayoutCaseListRow[];
  loading?: boolean;
  selectedCaseId?: string | null;
  onSelect?: (caseId: string) => void;
  emptyState: string;
}) {
  return (
    <PayoutQueuePanel
      eyebrow="Project queue"
      title="Project payout cases"
      description="Inspect the bounded payout issues that are visible to this project team."
      scope="project"
      {...props}
    />
  );
}
