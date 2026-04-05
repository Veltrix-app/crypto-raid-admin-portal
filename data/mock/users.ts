import { AdminUser } from "@/types/entities/user";

export const mockUsers: AdminUser[] = [
  {
    id: "u1",
    username: "RaidKing",
    xp: 12440,
    level: 12,
    streak: 7,
    status: "active"
  },
  {
    id: "u2",
    username: "MoonMila",
    xp: 11120,
    level: 11,
    streak: 5,
    status: "active"
  },
  {
    id: "u3",
    username: "NovaWolf",
    xp: 8410,
    level: 8,
    streak: 2,
    status: "flagged"
  }
];