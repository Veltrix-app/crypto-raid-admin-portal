export function canManageBilling(role: "project_admin" | "super_admin" | null) {
  return role === "super_admin" || role === "project_admin";
}

export function canManageTeam(role: "project_admin" | "super_admin" | null) {
  return role === "super_admin" || role === "project_admin";
}

export function canApproveSubmissions(role: "project_admin" | "super_admin" | null) {
  return role === "super_admin" || role === "project_admin";
}