import { GLOBAL_NAV_ITEMS, PROJECT_WORKSPACE_TABS } from "@/lib/navigation/portal-nav";

type PortalPageMetadata = {
  eyebrow: string;
  title: string;
  description: string;
};

export function getPortalPageMetadata(
  pathname: string,
  activeProjectName?: string | null
): PortalPageMetadata {
  if (pathname.startsWith("/projects/")) {
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[2] ?? "";
    const workspaceTab =
      PROJECT_WORKSPACE_TABS.find((item) => item.slug === slug) ?? PROJECT_WORKSPACE_TABS[0];

    return {
      eyebrow: activeProjectName ? `${activeProjectName} workspace` : "Project workspace",
      title: workspaceTab.label,
      description: workspaceTab.description,
    };
  }

  if (pathname === "/dashboard") {
    return {
      eyebrow: "Control center",
      title: "Overview",
      description: "Cross-project executive view for queue pressure, launch health and operator momentum.",
    };
  }

  const globalMatch = GLOBAL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (globalMatch) {
    return {
      eyebrow: globalMatch.label === "Projects" ? "Workspace board" : "Global operations",
      title: globalMatch.label,
      description: globalMatch.description,
    };
  }

  return {
    eyebrow: "Veltrix OS",
    title: "Portal",
    description: "Project-first operator workspace for campaigns, community, trust and rewards.",
  };
}
