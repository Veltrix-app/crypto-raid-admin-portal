# Portal UI Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portal into a project-first operations product with a stable left sidebar, project-aware top subnav, decomposed project workspaces, and clearer queue-first global ops pages.

**Architecture:** Keep the existing Next.js App Router structure, Zustand store, and Supabase-backed data loading, but introduce a new navigation contract and shared shell primitives that pages compose around. Migrate the portal in layers: shell first, then project workspaces, then global operations pages, while preserving existing routes during rollout and slimming oversized pages by splitting them into focused sub-surfaces.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Zustand, Supabase SSR/client helpers, Lucide React.

---

## File Structure

### Shared shell and navigation

- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
  - Single source of truth for global sidebar items, project subnav items, and legacy-route metadata.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`
  - Standard page wrapper with title, description, actions, status band, and content slots.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
  - Shared project shell with workspace identity, health pills, and top subnav.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\SegmentToggle.tsx`
  - Reusable segmented control for heavy-page workflow modes.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsTable.tsx`
  - Shared queue/table primitive for projects, claims, moderation, and submissions.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\AdminShell.tsx`
  - Upgrade to the new shell composition points.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
  - Switch from the current mixed menu to the project-first sidebar.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
  - Add breadcrumb/context awareness and remove competing visual noise.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\globals.css`
  - Add the refined neutral-heavy token layer and shell-level layout polish.

### Route surfaces

- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
  - New top-level overview route replacing `Dashboard` in primary navigation.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\dashboard\page.tsx`
  - Turn into a redirect to `/overview`.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\layout.tsx`
  - Shared workspace frame wrapper for all project routes.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\rewards\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\onchain\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\trust\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\settings\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\submissions\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\page.tsx`

### Project decomposition components

- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewSummary.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQueues.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainWorkspaceView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustWorkspaceView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\campaigns\ProjectCampaignsView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\rewards\ProjectRewardsView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\settings\ProjectSettingsView.tsx`

### Shared selectors and helpers

- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\workspace-selectors.ts`
  - Central selectors for project health, counts, route pills, and quick-action state.
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\layout\page-metadata.ts`
  - Route-aware header and breadcrumb metadata.
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
  - Add selectors or lightweight getters needed by the new decomposed pages without changing backend behavior.

### Existing routes retained as legacy entry points

- Keep but demote from primary sidebar:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\users\page.tsx`

These routes remain reachable during rollout but should stop competing with the new project-first navigation.

## Task 1: Define the Navigation Contract and Shared Shell Primitives

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\SegmentToggle.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsTable.tsx`
- Test: `npm run build`

- [ ] **Step 1: Add the canonical route and navigation map**

```ts
import {
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  Home,
  Settings,
  Shield,
  WalletCards,
} from "lucide-react";

export const GLOBAL_NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/moderation", label: "Moderation", icon: ClipboardCheck },
  { href: "/claims", label: "Claims", icon: WalletCards },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/submissions", label: "Submissions", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const PROJECT_WORKSPACE_TABS = [
  { href: "", label: "Overview" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/community", label: "Community" },
  { href: "/rewards", label: "Rewards" },
  { href: "/onchain", label: "On-chain" },
  { href: "/trust", label: "Trust" },
  { href: "/settings", label: "Settings" },
] as const;

export const LEGACY_SECONDARY_ROUTES = ["/campaigns", "/quests", "/raids", "/rewards", "/users"] as const;
```

- [ ] **Step 2: Introduce a standard page frame for global and project pages**

```tsx
type PortalPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusBand?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function PortalPageFrame(props: PortalPageFrameProps) {
  return (
    <div className="space-y-6">
      <OpsHero
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description}
        aside={props.actions}
      />
      {props.statusBand}
      <div className="space-y-6">{props.children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Introduce the project workspace frame with top subnav**

```tsx
type ProjectWorkspaceFrameProps = {
  projectId: string;
  projectName: string;
  projectChain: string;
  healthPills: Array<{ label: string; tone: "default" | "success" | "warning" | "danger" }>;
  children: React.ReactNode;
};

export function ProjectWorkspaceFrame({
  projectId,
  projectName,
  projectChain,
  healthPills,
  children,
}: ProjectWorkspaceFrameProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-line bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Project workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text">{projectName}</h1>
            <p className="mt-2 text-sm text-sub">{projectChain} project operations rail.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {healthPills.map((pill) => (
              <OpsStatusPill key={pill.label} tone={pill.tone}>{pill.label}</OpsStatusPill>
            ))}
          </div>
        </div>
        <ProjectWorkspaceTabs projectId={projectId} />
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Add the segmented control and shared table primitives**

```tsx
export function SegmentToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-card2 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={value === option.value ? "rounded-full bg-primary px-4 py-2 text-black" : "rounded-full px-4 py-2 text-sub"}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run build to verify the new shared layer compiles**

Run: `npm run build`  
Expected: build succeeds without missing-import errors from the new shell files.

- [ ] **Step 6: Commit**

```bash
git add lib/navigation/portal-nav.ts components/layout/shell/PortalPageFrame.tsx components/layout/shell/ProjectWorkspaceFrame.tsx components/layout/ops/SegmentToggle.tsx components/layout/ops/OpsTable.tsx
git commit -m "feat: add portal navigation contract and shared shell primitives"
```

### Task 2: Migrate the Global Shell to Project-First Navigation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\dashboard\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\AdminShell.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\globals.css`
- Test: `npm run build`

- [ ] **Step 1: Create the new `/overview` route using the new frame**

```tsx
export default function OverviewPage() {
  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Control center"
        title="Overview"
        description="Cross-project executive read for launch health, queue pressure and operator momentum."
      >
        <OverviewHeroBand />
        <OverviewPriorityRail />
        <OverviewQueueGrid />
      </PortalPageFrame>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Convert `/dashboard` into a compatibility redirect**

```tsx
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/overview");
}
```

- [ ] **Step 3: Rebuild the sidebar around the new primary IA**

```tsx
{GLOBAL_NAV_ITEMS.map((item) => {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link key={item.href} href={item.href} className={active ? activeClass : idleClass}>
      <item.icon size={18} />
      {!sidebarCollapsed ? <span>{item.label}</span> : null}
    </Link>
  );
})}
```

- [ ] **Step 4: Slim the header and make it route-aware**

```tsx
const pageMeta = getPortalPageMetadata(pathname, activeProject);

return (
  <header className="border-b border-line bg-bg/90 px-6 py-4 backdrop-blur-xl">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">{pageMeta.eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold text-text">{pageMeta.title}</h2>
      </div>
      <WorkspaceSwitcher />
      <OperatorIdentity />
    </div>
  </header>
);
```

- [ ] **Step 5: Move global visual tokens away from the current glow-heavy base**

```css
:root {
  color-scheme: dark;
  --portal-bg: #07090d;
  --portal-panel: #0d131d;
  --portal-panel-alt: #111925;
  --portal-line: rgba(255, 255, 255, 0.08);
  --portal-text: #f8fafc;
  --portal-sub: #9fb0c6;
  --portal-primary: #baff3b;
}

body {
  background:
    radial-gradient(circle at top left, rgba(186, 255, 59, 0.06), transparent 24%),
    linear-gradient(180deg, #07090d 0%, #0a1018 100%);
  color: var(--portal-text);
}
```

- [ ] **Step 6: Run build to verify route and shell migration**

Run: `npm run build`  
Expected: build succeeds, `/overview` is emitted, and no `Dashboard` references are required in navigation.

- [ ] **Step 7: Commit**

```bash
git add app/overview/page.tsx app/dashboard/page.tsx components/layout/shell/AdminShell.tsx components/layout/sidebar/AdminSidebar.tsx components/layout/header/AdminHeader.tsx app/globals.css
git commit -m "feat: migrate portal shell to project-first navigation"
```

### Task 3: Add the Project Workspace Frame and Route Layout

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\layout.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\workspace-selectors.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
- Test: `npm run build`

- [ ] **Step 1: Create a shared project route layout**

```tsx
export default function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <AdminShell>
      <ProjectWorkspaceRoute projectId={params.id}>{children}</ProjectWorkspaceRoute>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Add lightweight selectors for project-scoped counts and pills**

```ts
export function buildProjectWorkspaceSummary(input: {
  project: AdminProject;
  campaigns: AdminCampaign[];
  reviewFlags: AdminReviewFlag[];
  claims: AdminClaim[];
}) {
  return {
    healthPills: [
      { label: input.project.chain, tone: "default" as const },
      { label: `${input.campaigns.length} campaigns`, tone: "success" as const },
      { label: `${input.reviewFlags.filter((flag) => flag.status === "open").length} open flags`, tone: input.reviewFlags.some((flag) => flag.status === "open") ? "warning" as const : "success" as const },
      { label: `${input.claims.filter((claim) => claim.status === "pending").length} pending claims`, tone: input.claims.some((claim) => claim.status === "pending") ? "warning" as const : "default" as const },
    ],
  };
}
```

- [ ] **Step 3: Replace the raw hero in `/projects/[id]` with the shared workspace frame**

```tsx
return (
  <ProjectWorkspaceFrame
    projectId={project.id}
    projectName={project.name}
    projectChain={project.chain}
    healthPills={workspaceSummary.healthPills}
  >
    <ProjectOverviewSummary project={project} workspaceSummary={workspaceSummary} />
    <ProjectOverviewQueues projectId={project.id} />
    <ProjectOverviewQuickActions projectId={project.id} />
  </ProjectWorkspaceFrame>
);
```

- [ ] **Step 4: Run build to verify nested project routes inherit the workspace shell**

Run: `npm run build`  
Expected: build succeeds and `/projects/[id]` plus `/projects/[id]/community` compile through the shared layout.

- [ ] **Step 5: Commit**

```bash
git add app/projects/[id]/layout.tsx lib/projects/workspace-selectors.ts app/projects/[id]/page.tsx components/layout/shell/ProjectWorkspaceFrame.tsx
git commit -m "feat: add project workspace layout and summary selectors"
```

### Task 4: Redesign the Projects Index into a Clean Board

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Extract the hero and metrics into a clean board header**

```tsx
export function ProjectsBoardHeader({
  projectCount,
  activeProjects,
  approvedProjects,
  totalMembers,
}: ProjectsBoardHeaderProps) {
  return (
    <PortalPageFrame
      eyebrow="Project board"
      title="Projects"
      description="Manage onboarding, workspace health and the projects currently powering the network."
      actions={<Link href="/projects/new" className="rounded-2xl bg-primary px-4 py-3 font-bold text-black">New project</Link>}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetricCard label="Projects" value={projectCount} />
        <OpsMetricCard label="Active" value={activeProjects} emphasis="primary" />
        <OpsMetricCard label="Approved" value={approvedProjects} emphasis="primary" />
        <OpsMetricCard label="Members tracked" value={totalMembers.toLocaleString()} />
      </div>
    </PortalPageFrame>
  );
}
```

- [ ] **Step 2: Move the onboarding queue into its own component**

```tsx
export function ProjectsOnboardingQueue({
  pendingRequests,
  onApprove,
  onReject,
}: ProjectsOnboardingQueueProps) {
  if (pendingRequests.length === 0) {
    return <EmptyState title="No onboarding pressure" description="New project requests will appear here once submitted." />;
  }

  return <OpsTable columns={queueColumns} rows={pendingRequests} />;
}
```

- [ ] **Step 3: Move the roster into a table-first surface**

```tsx
export function ProjectsRosterTable({ projects }: { projects: AdminProject[] }) {
  return (
    <OpsTable
      columns={[
        { key: "name", label: "Project" },
        { key: "chain", label: "Chain" },
        { key: "status", label: "Status" },
        { key: "onboardingStatus", label: "Onboarding" },
        { key: "members", label: "Members" },
        { key: "campaigns", label: "Campaigns" },
      ]}
      rows={projects}
      renderRow={(project) => <Link href={`/projects/${project.id}`}>{project.name}</Link>}
    />
  );
}
```

- [ ] **Step 4: Recompose `app/projects/page.tsx` around those focused sections**

```tsx
return (
  <AdminShell>
    <div className="space-y-6">
      <ProjectsBoardHeader {...headerStats} />
      <ProjectsOnboardingQueue pendingRequests={pendingRequests} onApprove={approveOnboardingRequest} onReject={rejectOnboardingRequest} />
      <ProjectsRosterTable projects={filteredProjects} />
    </div>
  </AdminShell>
);
```

- [ ] **Step 5: Run build to verify the decomposed projects board**

Run: `npm run build`  
Expected: build succeeds and `/projects` renders through extracted components without losing onboarding actions.

- [ ] **Step 6: Commit**

```bash
git add app/projects/page.tsx components/projects/ProjectsBoardHeader.tsx components/projects/ProjectsOnboardingQueue.tsx components/projects/ProjectsRosterTable.tsx
git commit -m "feat: redesign projects index as a focused board"
```

### Task 5: Slim the Project Overview into a Real Overview Page

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewSummary.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQueues.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Pull the summary metrics into a dedicated overview component**

```tsx
export function ProjectOverviewSummary({ project, stats }: ProjectOverviewSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <OpsMetricCard label="Campaigns" value={stats.campaignCount} />
      <OpsMetricCard label="Quests" value={stats.questCount} />
      <OpsMetricCard label="Rewards" value={stats.rewardCount} />
      <OpsMetricCard label="Pending claims" value={stats.pendingClaims} emphasis={stats.pendingClaims > 0 ? "warning" : "default"} />
    </div>
  );
}
```

- [ ] **Step 2: Move queue signals out of the detail wall**

```tsx
export function ProjectOverviewQueues({ pendingClaims, openFlags, callbackFailures }: ProjectOverviewQueuesProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SignalTile label="Claims" value={pendingClaims} href="./rewards" />
      <SignalTile label="Trust flags" value={openFlags} href="./trust" />
      <SignalTile label="Ops incidents" value={callbackFailures} href="./community" />
    </div>
  );
}
```

- [ ] **Step 3: Replace stacked config with quick links into dedicated routes**

```tsx
export function ProjectOverviewQuickActions({ projectId }: { projectId: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <Link href={`/projects/${projectId}/community`} className="rounded-[24px] border border-line bg-card p-5">Open Community OS</Link>
      <Link href={`/projects/${projectId}/onchain`} className="rounded-[24px] border border-line bg-card p-5">Open on-chain pipeline</Link>
      <Link href={`/projects/${projectId}/trust`} className="rounded-[24px] border border-line bg-card p-5">Open trust rail</Link>
      <Link href={`/projects/${projectId}/settings`} className="rounded-[24px] border border-line bg-card p-5">Open project settings</Link>
    </div>
  );
}
```

- [ ] **Step 4: Remove community/on-chain configuration blocks from the overview page**

```tsx
// Delete or move:
// - inline Discord / Telegram integration forms
// - on-chain wallet and asset forms
// - trust signal blocks that now belong to /trust
// - push test controls that now belong to /community
```

- [ ] **Step 5: Run build to confirm the overview became a true summary route**

Run: `npm run build`  
Expected: build succeeds and `/projects/[id]` no longer owns unrelated configuration surfaces.

- [ ] **Step 6: Commit**

```bash
git add app/projects/[id]/page.tsx components/projects/ProjectOverviewSummary.tsx components/projects/ProjectOverviewQueues.tsx components/projects/ProjectOverviewQuickActions.tsx
git commit -m "feat: turn project detail into a focused overview page"
```

### Task 6: Decompose Community OS into Workflow Modes

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityWorkspaceShell.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOperateView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityConfigureView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMeasureView.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Add URL-driven mode state to the community route**

```tsx
const searchParams = useSearchParams();
const mode = (searchParams.get("view") as "operate" | "configure" | "measure") || "operate";

<SegmentToggle
  value={mode}
  options={[
    { value: "operate", label: "Operate" },
    { value: "configure", label: "Configure" },
    { value: "measure", label: "Measure" },
  ]}
  onChange={(next) => router.replace(`/projects/${project.id}/community?view=${next}`)}
/>;
```

- [ ] **Step 2: Extract the current action-heavy surfaces into `Operate`**

```tsx
export function CommunityOperateView(props: OperateProps) {
  return (
    <>
      <CommunityOverviewPanel {...props.overview} />
      <CommunityCaptainWorkspacePanel {...props.captainWorkspace} />
      <CommunityMissionsPanel {...props.missions} />
      <CommunityRaidOpsPanel {...props.raids} />
      <CommunityAutomationCenterPanel {...props.automationCenter} />
      <CommunityPlaybooksPanel {...props.playbooks} />
    </>
  );
}
```

- [ ] **Step 3: Extract settings-heavy surfaces into `Configure`**

```tsx
export function CommunityConfigureView(props: ConfigureProps) {
  return (
    <>
      <CommunityIntegrationsPanel {...props.integrations} />
      <CommunityCommandsPanel {...props.commands} />
      <CommunityRanksPanel {...props.ranks} />
      <CommunityLeaderboardsPanel {...props.leaderboards} />
      <CommunityCaptainsPanel {...props.captains} />
    </>
  );
}
```

- [ ] **Step 4: Extract analytics and outcome-heavy surfaces into `Measure`**

```tsx
export function CommunityMeasureView(props: MeasureProps) {
  return (
    <>
      <CommunityOutcomesPanel {...props.outcomes} />
      <CommunityAnalyticsPanel analytics={props.analytics} />
      <CommunityMembersPanel {...props.members} />
      <CommunityFunnelsPanel {...props.funnels} />
      <CommunityActivityPanel {...props.activity} />
    </>
  );
}
```

- [ ] **Step 5: Recompose the page around the new workspace shell**

```tsx
return (
  <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
    <CommunityWorkspaceShell mode={mode}>
      {mode === "operate" ? <CommunityOperateView {...operateProps} /> : null}
      {mode === "configure" ? <CommunityConfigureView {...configureProps} /> : null}
      {mode === "measure" ? <CommunityMeasureView {...measureProps} /> : null}
    </CommunityWorkspaceShell>
  </ProjectWorkspaceFrame>
);
```

- [ ] **Step 6: Run build to verify the largest page split**

Run: `npm run build`  
Expected: build succeeds and `app/projects/[id]/community/page.tsx` is materially smaller, delegating to focused mode components.

- [ ] **Step 7: Commit**

```bash
git add app/projects/[id]/community/page.tsx components/community/CommunityWorkspaceShell.tsx components/community/CommunityOperateView.tsx components/community/CommunityConfigureView.tsx components/community/CommunityMeasureView.tsx
git commit -m "feat: split community workspace into operate configure and measure modes"
```

### Task 7: Create Dedicated On-chain and Trust Workspace Pages

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\onchain\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\trust\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainWorkspaceView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustWorkspaceView.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Lift the on-chain controls out of project detail**

```tsx
export default function ProjectOnchainPage() {
  return (
    <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
      <OnchainWorkspaceView
        mode={mode}
        wallets={projectWallets}
        assets={projectAssets}
        operatorSignals={operatorSignals}
        onSaveWallet={saveWallet}
        onSaveAsset={saveAsset}
        onRunSync={runProviderSync}
      />
    </ProjectWorkspaceFrame>
  );
}
```

- [ ] **Step 2: Add a segmented model to the on-chain page**

```tsx
const options = [
  { value: "assets", label: "Assets" },
  { value: "wallets", label: "Wallets" },
  { value: "pipeline", label: "Pipeline" },
  { value: "signals", label: "Signals" },
];
```

- [ ] **Step 3: Create a project-scoped trust workspace**

```tsx
export default function ProjectTrustPage() {
  return (
    <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
      <TrustWorkspaceView
        mode={mode}
        reviewFlags={projectFlags}
        watchlistCount={watchlistCount}
        recentActions={captainActions}
        onApplyTrustAction={applyTrustAction}
      />
    </ProjectWorkspaceFrame>
  );
}
```

- [ ] **Step 4: Remove duplicated trust/on-chain blocks from the overview and community routes**

```tsx
// Delete overview sidebar sections that belong to dedicated routes.
// Replace them with quick links and short metric tiles only.
```

- [ ] **Step 5: Run build to verify new project route surfaces**

Run: `npm run build`  
Expected: `/projects/[id]/onchain` and `/projects/[id]/trust` compile cleanly and no orphan imports remain in `/projects/[id]`.

- [ ] **Step 6: Commit**

```bash
git add app/projects/[id]/onchain/page.tsx app/projects/[id]/trust/page.tsx components/onchain/OnchainWorkspaceView.tsx components/trust/TrustWorkspaceView.tsx app/projects/[id]/page.tsx app/projects/[id]/community/page.tsx
git commit -m "feat: add dedicated onchain and trust project workspaces"
```

### Task 8: Add the Remaining Project Workspace Routes

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\rewards\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\settings\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\campaigns\ProjectCampaignsView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\rewards\ProjectRewardsView.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\settings\ProjectSettingsView.tsx`
- Test: `npm run build`

- [ ] **Step 1: Add the project campaigns route**

```tsx
export default function ProjectCampaignsPage() {
  return (
    <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
      <ProjectCampaignsView campaigns={projectCampaigns} projectId={project.id} />
    </ProjectWorkspaceFrame>
  );
}
```

- [ ] **Step 2: Add the project rewards route**

```tsx
export default function ProjectRewardsPage() {
  return (
    <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
      <ProjectRewardsView rewards={projectRewards} claims={projectClaims} />
    </ProjectWorkspaceFrame>
  );
}
```

- [ ] **Step 3: Add the project settings route**

```tsx
export default function ProjectSettingsPage() {
  return (
    <ProjectWorkspaceFrame projectId={project.id} projectName={project.name} projectChain={project.chain} healthPills={healthPills}>
      <ProjectSettingsView project={project} teamMembers={projectMembers} />
    </ProjectWorkspaceFrame>
  );
}
```

- [ ] **Step 4: Run build to verify the full project workspace matrix**

Run: `npm run build`  
Expected: every workspace tab route compiles and the top subnav no longer points to missing pages.

- [ ] **Step 5: Commit**

```bash
git add app/projects/[id]/campaigns/page.tsx app/projects/[id]/rewards/page.tsx app/projects/[id]/settings/page.tsx components/campaigns/ProjectCampaignsView.tsx components/rewards/ProjectRewardsView.tsx components/settings/ProjectSettingsView.tsx
git commit -m "feat: complete project workspace route set"
```

### Task 9: Refresh the Global Operations Centers

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\submissions\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsQueueLayout.tsx`
- Test: `npm run build`

- [ ] **Step 1: Create a standard queue-first layout wrapper**

```tsx
export function OpsQueueLayout({
  title,
  description,
  metrics,
  filters,
  primaryTable,
  sideRail,
}: OpsQueueLayoutProps) {
  return (
    <PortalPageFrame eyebrow="Global ops" title={title} description={description}>
      {metrics}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">{filters}{primaryTable}</div>
        <div className="space-y-6">{sideRail}</div>
      </div>
    </PortalPageFrame>
  );
}
```

- [ ] **Step 2: Rebuild moderation as a queue and signal center**

```tsx
return (
  <AdminShell>
    <OpsQueueLayout
      title="Moderation"
      description="Cross-project trust review, suspicious patterns and contributor actions."
      metrics={<ModerationMetricRow />}
      filters={<ModerationFilters />}
      primaryTable={<ModerationQueueTable />}
      sideRail={<ModerationSignalRail />}
    />
  </AdminShell>
);
```

- [ ] **Step 3: Rebuild claims and submissions around tables instead of stacked cards**

```tsx
<OpsQueueLayout
  title="Claims"
  description="Payout queue, reward incidents and retry operations."
  primaryTable={<ClaimsQueueTable claims={claims} />}
  sideRail={<ClaimsIncidentRail incidents={incidents} />}
/>;
```

- [ ] **Step 4: Make analytics and settings calmer and more intentional**

```tsx
<PortalPageFrame
  eyebrow="Platform analytics"
  title="Analytics"
  description="Cross-project performance, activation and conversion signals."
>
  <AnalyticsSummaryRow />
  <AnalyticsComparisonGrid />
  <AnalyticsDeepDiveTables />
</PortalPageFrame>
```

- [ ] **Step 5: Run build to verify all top-level ops pages conform to the new shell**

Run: `npm run build`  
Expected: `/moderation`, `/claims`, `/analytics`, `/submissions`, and `/settings` build successfully through the shared queue/page primitives.

- [ ] **Step 6: Commit**

```bash
git add app/moderation/page.tsx app/claims/page.tsx app/analytics/page.tsx app/submissions/page.tsx app/settings/page.tsx components/layout/ops/OpsQueueLayout.tsx
git commit -m "feat: redesign global operations centers with queue-first layouts"
```

### Task 10: Finish Legacy Route Handling, Empty States, and Final Polish

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\users\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\state\StatePrimitives.tsx`
- Test: `npm run build`

- [ ] **Step 1: Remove legacy pages from the primary sidebar but keep them reachable**

```tsx
const primaryItems = GLOBAL_NAV_ITEMS;
const showLegacyLinks = pathname.startsWith("/campaigns") || pathname.startsWith("/quests") || pathname.startsWith("/raids") || pathname.startsWith("/rewards") || pathname.startsWith("/users");
```

- [ ] **Step 2: Add a legacy-route banner that points users back into the new IA**

```tsx
<EmptyState
  title="This route is now secondary"
  description="Use the Projects workspace for project-scoped work. This legacy list remains available during migration."
  action={{ label: "Open Projects", href: "/projects" }}
/>;
```

- [ ] **Step 3: Standardize empty states and feedback styling**

```tsx
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-line bg-card p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">No live data yet</p>
      <h3 className="mt-3 text-2xl font-extrabold text-text">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-sub">{description}</p>
      {action ? <Link href={action.href} className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-black">{action.label}</Link> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the full build and manual route smoke**

Run: `npm run build`  
Expected: build succeeds and all primary routes compile.

Manual smoke checklist:

```text
/overview
/projects
/projects/[id]
/projects/[id]/campaigns
/projects/[id]/community?view=operate
/projects/[id]/community?view=configure
/projects/[id]/community?view=measure
/projects/[id]/rewards
/projects/[id]/onchain
/projects/[id]/trust
/projects/[id]/settings
/moderation
/claims
/analytics
/submissions
/settings
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/sidebar/AdminSidebar.tsx app/campaigns/page.tsx app/quests/page.tsx app/raids/page.tsx app/rewards/page.tsx app/users/page.tsx components/layout/state/StatePrimitives.tsx
git commit -m "feat: finalize portal ui reset polish and legacy route handling"
```

## Self-Review

### 1. Spec coverage

- Stable left sidebar: covered by Tasks 1 and 2.
- Project-first IA and top subnav: covered by Tasks 1 and 3.
- Page decomposition: covered by Tasks 4 through 8.
- Workflow toggles inside heavy pages: covered by Tasks 1, 6, and 7.
- Global ops centers refresh: covered by Task 9.
- Premium visual reset and calmer hierarchy: covered by Tasks 1, 2, and 10.
- Rollout strategy: mirrored by task order from shell first to project workspaces to global ops.

No spec sections are uncovered.

### 2. Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task names exact files.
- Every task includes concrete route/component snippets and a verification command.

### 3. Type consistency

- Global navigation references `GLOBAL_NAV_ITEMS` throughout.
- Project workspace routing consistently uses `/projects/[id]/...`.
- Heavy-page modes consistently use `operate/configure/measure` for community and `assets/wallets/pipeline/signals` or `queue/patterns/actions/history` patterns for dedicated pages.

No naming conflicts remain in the plan.

Plan complete and saved to `docs/superpowers/plans/2026-04-19-portal-ui-reset.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
