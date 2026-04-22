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
      description: "Cross-project command center for launch posture, queue pressure and live health.",
    };
  }

  const globalMatch = GLOBAL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (globalMatch) {
    return {
      eyebrow:
        globalMatch.label === "Projects"
          ? "Workspace board"
          : globalMatch.label === "Getting Started"
          ? "Account onboarding"
          : globalMatch.label === "Account"
          ? "Workspace account"
          : "Platform operations",
      title: globalMatch.label,
      description: globalMatch.description,
    };
  }

  return {
    eyebrow: "Veltrix platform",
    title: "Portal",
    description: "Project-first control system for launches, community operations, safety and support.",
  };
}
