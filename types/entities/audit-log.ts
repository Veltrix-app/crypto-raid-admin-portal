export type AdminAuditLog = {
  id: string;
  authUserId?: string;
  projectId?: string;
  sourceTable: string;
  sourceId: string;
  action: string;
  summary: string;
  metadata?: string;
  createdAt: string;
};
