"use client";

import TrustQueuePanel from "./TrustQueuePanel";
import type { TrustCaseListRow } from "./types";

export default function ProjectTrustCasesPanel(props: {
  rows: TrustCaseListRow[];
  loading?: boolean;
  selectedCaseId?: string | null;
  onSelect?: (caseId: string) => void;
  emptyState: string;
}) {
  return (
    <TrustQueuePanel
      eyebrow="Project queue"
      title="Project trust cases"
      description="Work the cases this project was allowed to inspect, escalate or resolve."
      scope="project"
      {...props}
    />
  );
}
