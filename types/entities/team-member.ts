export type AdminTeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "reviewer" | "analyst";
  status: "active" | "invited";
  projectId?: string;
  authUserId?: string;
  joinedAt?: string;
};
