export type AdminUser = {
  id: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  status: "active" | "flagged";
};