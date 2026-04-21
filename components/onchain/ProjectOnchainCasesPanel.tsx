"use client";

import type { OnchainCaseListRow } from "./types";
import OnchainQueuePanel from "./OnchainQueuePanel";

export default function ProjectOnchainCasesPanel(props: {
  rows: OnchainCaseListRow[];
  loading?: boolean;
  selectedCaseId?: string | null;
  onSelect?: (caseId: string) => void;
  emptyState: string;
}) {
  return (
    <OnchainQueuePanel
      eyebrow="Project queue"
      title="Project on-chain cases"
      description="Inspect the bounded on-chain issues that are visible to this project team."
      scope="project"
      {...props}
    />
  );
}
