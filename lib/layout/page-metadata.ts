import { GLOBAL_NAV_ITEMS, PROJECT_WORKSPACE_TABS } from "@/lib/navigation/portal-nav";

type PortalPageMetadata = {
  eyebrow: string;
  title: string;
  description: string;
};

export function getPortalPageMetadata(
  pathname: string | null | undefined,
  activeProjectName?: string | null
): PortalPageMetadata {
  const safePathname = pathname ?? "";

  if (safePathname.startsWith("/projects/")) {
    const parts = safePathname.split("/").filter(Boolean);
    const slug = parts[2] ?? "";
    const workspaceTab =
      PROJECT_WORKSPACE_TABS.find((item) => item.slug === slug) ?? PROJECT_WORKSPACE_TABS[0];

    return {
      eyebrow: activeProjectName ? `${activeProjectName} workspace` : "Project workspace",
      title: workspaceTab.label,
      description: workspaceTab.description,
    };
  }

  if (safePathname === "/dashboard") {
    return {
      eyebrow: "Control center",
      title: "Overview",
      description: "Cross-project command center for launch posture, queue pressure and live health.",
    };
  }

  const globalMatch = GLOBAL_NAV_ITEMS.find(
    (item) => safePathname === item.href || safePathname.startsWith(`${item.href}/`)
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
    eyebrow: "VYNTRO platform",
    title: "Portal",
    description: "Project-first control system for launches, community operations, safety and support.",
  };
}
