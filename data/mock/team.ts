import { AdminTeamMember } from "@/types/entities/team-member";

export const mockTeamMembers: AdminTeamMember[] = [
  {
    id: "tm1",
    name: "Jordi Murset",
    email: "jordi@project.com",
    role: "owner",
    status: "active",
  },
  {
    id: "tm2",
    name: "Lena Growth",
    email: "lena@project.com",
    role: "admin",
    status: "active",
  },
  {
    id: "tm3",
    name: "Mark Review",
    email: "mark@project.com",
    role: "reviewer",
    status: "invited",
  },
];