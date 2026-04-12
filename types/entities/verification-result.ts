export type AdminVerificationResult = {
  id: string;
  authUserId?: string;
  projectId?: string;
  questId?: string;
  sourceTable: string;
  sourceId: string;
  verificationType: string;
  route: string;
  decisionStatus: "pending" | "approved" | "rejected";
  decisionReason: string;
  confidenceScore: number;
  requiredConfigKeys: string[];
  missingConfigKeys: string[];
  duplicateSignalTypes: string[];
  metadata?: string;
  createdAt: string;
};
