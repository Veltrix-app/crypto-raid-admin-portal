"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  FolderKanban,
  Gift,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  Swords,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAdminUIStore } from "@/store/ui/useAdminUIStore";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/campaigns", label: "Campaigns", icon: ScrollText },
  { href: "/raids", label: "Raids", icon: Megaphone },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/users", label: "Users", icon: Users },
  { href: "/moderation", label: "Moderation", icon: ClipboardCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useAdminUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-line bg-card/80 p-5 transition-all",
        sidebarCollapsed ? "w-[96px]" : "w-[260px]"
      )}
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-neon">
          <Shield size={20} />
        </div>
        {!sidebarCollapsed ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Admin Portal
            </p>
            <p className="text-sm text-sub">Crypto Raid Control</p>
          </div>
        ) : null}
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                active
                  ? "border-primary/30 bg-primary/10 text-primary shadow-neon"
                  : "border-transparent text-sub hover:border-line hover:bg-card2 hover:text-text",
                sidebarCollapsed && "justify-center px-0"
              )}
              title={link.label}
            >
              <Icon size={18} />
              {!sidebarCollapsed ? <span className="font-semibold">{link.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}