# Portal Hierarchy Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the VYNTRO portal so every project-facing page has one clear job, one primary next action, and at most one secondary rail.

**Architecture:** Keep the existing Next.js App Router, portal shell, `OpsPrimitives`, and project workspace routes. Add a thin command-center composition layer inside the existing primitives, then refactor the heaviest pages by moving deep modules behind explicit surfaces instead of stacking everything on one canvas.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, existing Supabase-backed page loaders, existing `OpsPrimitives` and `ProjectWorkspaceFrame`.

---

## File Map

- Modify `components/layout/ops/OpsPrimitives.tsx`: add reusable command-center layout primitives for primary canvas, route cards, compact rails, and surface summaries.
- Modify `components/layout/shell/ProjectWorkspaceFrame.tsx`: make the project workspace tabs read as one project command bar with Core, Safety, and Control groups staying compact.
- Modify `lib/navigation/portal-nav.ts`: keep all existing routes, tighten labels/descriptions, and make Safety grouping explicit for Payouts, On-chain, and Trust.
- Modify `app/projects/[id]/page.tsx`: turn the project home into a calm overview and routing surface; remove inline editing from the home canvas.
- Modify `app/projects/[id]/settings/page.tsx`: make project setup the dedicated builder surface with horizontal progress and focused edit context.
- Modify `components/forms/project/ProjectForm.tsx`: support compact command-center layout inside Settings without changing create/edit behavior.
- Modify `app/projects/[id]/community/page.tsx`: split Community OS into one active surface at a time: Overview, Raid Ops, Automations, Commands, Captains, Members, and Outcomes.
- Modify `components/community/CommunityAutomationCenterPanel.tsx`: make Automation Center read like a reliability console, with grouped sequences and the next operator move visible first.
- Modify `components/community/CommunityCommandsPanel.tsx`: make `/newraid`, Telegram, Discord, and command readiness easier to scan from Community surfaces.
- Modify `app/settings/billing/page.tsx`: turn Billing into a selling and upgrade page first, with ops diagnostics below the fold.
- Modify `app/analytics/page.tsx`: keep analytics as a read-and-decide page; remove competing cockpit behavior from the default view.

## Guardrails

- Preserve all routes and database calls.
- Do not remove Payouts, On-chain, or Trust routes; group them visually under Safety.
- Do not change authorization checks.
- Do not introduce new dependencies.
- Do not push from the services repo; this work belongs to `C:\Users\jordi\OneDrive\Documenten\crypto-raid-admin-portal`.
- Use `npm run lint` and `npm run build` as the verification gate because this portal repo has no test script.

---

### Task 1: Add Command-Center Layout Primitives

**Files:**
- Modify: `components/layout/ops/OpsPrimitives.tsx`

- [ ] **Step 1: Add compact layout primitives after `OpsCommandRead`**

Add these exports below `OpsCommandRead`. They use the local `cx` helper that already exists in the file.

```tsx
export function OpsCommandCanvas({
  children,
  rail,
}: {
  children: ReactNode;
  rail?: ReactNode;
}) {
  return (
    <div className={cx("grid gap-3.5", rail ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "")}>
      <div className="min-w-0 space-y-3.5">{children}</div>
      {rail ? <aside className="min-w-0 space-y-3.5">{rail}</aside> : null}
    </div>
  );
}

export function OpsRouteGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function OpsRouteCard({
  href,
  eyebrow,
  title,
  description,
  meta,
  cta = "Open",
  emphasis = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  cta?: string;
  emphasis?: boolean;
}) {
  return (
    <a
      href={href}
      className={cx(
        "group block min-w-0 rounded-[18px] border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24",
        emphasis
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.08),transparent_34%),linear-gradient(180deg,rgba(13,18,16,0.98),rgba(7,9,14,0.98))]"
          : "border-white/[0.028] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
            {eyebrow}
          </p>
          <h3 className="mt-2 break-words text-[0.94rem] font-semibold tracking-[-0.025em] text-text [overflow-wrap:anywhere]">
            {title}
          </h3>
          <p className="mt-1.5 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
            {description}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
          {cta}
        </span>
      </div>
      {meta ? <div className="mt-3">{meta}</div> : null}
    </a>
  );
}

export function OpsRailCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-white/[0.026] bg-white/[0.015] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-[0.9rem] font-semibold tracking-[-0.02em] text-text">{title}</h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Run lint for primitive syntax**

Run:

```powershell
npm run lint
```

Expected: `eslint .` completes without errors.

- [ ] **Step 3: Commit**

```powershell
git add components/layout/ops/OpsPrimitives.tsx
git commit -m "Add portal command center primitives"
```

---

### Task 2: Tighten Project Workspace Navigation

**Files:**
- Modify: `components/layout/shell/ProjectWorkspaceFrame.tsx`
- Modify: `lib/navigation/portal-nav.ts`

- [ ] **Step 1: Update tab labels and descriptions**

In `lib/navigation/portal-nav.ts`, keep the same slugs and groups. Use these descriptions so the labels describe decisions, not internal modules.

```ts
export const PROJECT_WORKSPACE_TABS: readonly ProjectWorkspaceTab[] = [
  {
    slug: "",
    label: "Overview",
    description: "Project status, next move and the shortest route into daily operation.",
    group: "Core",
  },
  {
    slug: "launch",
    label: "Launch",
    description: "Readiness, campaign handoff and launch blockers.",
    group: "Core",
  },
  {
    slug: "campaigns",
    label: "Campaigns",
    description: "Campaign board, quest handoff and live activation pressure.",
    group: "Core",
  },
  {
    slug: "community",
    label: "Community",
    description: "Raid ops, commands, automations, captains and member motion.",
    group: "Core",
  },
  {
    slug: "rewards",
    label: "Rewards",
    description: "Reward stock, distributions, claim pressure and incentive readiness.",
    group: "Core",
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Claim delivery, payout failures and resolution workflow.",
    group: "Safety",
  },
  {
    slug: "onchain",
    label: "On-chain",
    description: "Wallets, assets, provider sync and project-safe chain operations.",
    group: "Safety",
  },
  {
    slug: "trust",
    label: "Trust",
    description: "Fraud posture, suspicious users, review status and safety controls.",
    group: "Safety",
  },
  {
    slug: "settings",
    label: "Settings",
    description: "Identity, integrations, brand controls and project setup.",
    group: "Control",
  },
] as const;
```

- [ ] **Step 2: Make the workspace frame language project-first**

In `ProjectWorkspaceFrame`, keep the existing data props and replace the title area copy with:

```tsx
<p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-sub">
  One project workspace. Start with the next move, then open the exact surface you need.
</p>
```

Set the focus card text to:

```tsx
<p className="mt-1 text-[11px] font-semibold text-text">
  Overview first. Deep work by surface.
</p>
```

- [ ] **Step 3: Reduce visual weight of grouped tabs**

In `ProjectWorkspaceFrame`, keep grouped tabs but use smaller group labels and softer active styling:

```tsx
active
  ? "bg-white/[0.08] text-text shadow-[inset_0_0_0_1px_rgba(186,255,59,0.12)]"
  : "text-sub hover:bg-white/[0.028] hover:text-text"
```

- [ ] **Step 4: Verify navigation still resolves the same routes**

Run:

```powershell
npm run lint
npm run build
```

Expected: build completes and project workspace routes still compile.

- [ ] **Step 5: Commit**

```powershell
git add components/layout/shell/ProjectWorkspaceFrame.tsx lib/navigation/portal-nav.ts
git commit -m "Tighten project workspace navigation"
```

---

### Task 3: Rebuild Project Home as a Calm Command Surface

**Files:**
- Modify: `app/projects/[id]/page.tsx`

- [ ] **Step 1: Remove the inline project builder from home**

Remove the `ProjectForm` import from `app/projects/[id]/page.tsx` and remove the JSX block that renders `<ProjectForm ... />` around the current builder section. Replace that block with an `OpsRouteCard` linking to `/projects/${project.id}/settings`.

```tsx
<OpsRouteCard
  href={`/projects/${project.id}/settings`}
  eyebrow="Project setup"
  title="Edit workspace identity and integrations"
  description="Open the dedicated settings surface for brand, links, connected modules and public readiness."
  cta="Open settings"
/>
```

- [ ] **Step 2: Import the command-center primitives**

Extend the existing `OpsPrimitives` import with:

```tsx
OpsCommandCanvas,
OpsRailCard,
OpsRouteCard,
OpsRouteGrid,
```

- [ ] **Step 3: Make the first body section a command read**

Near the top of the `ProjectWorkspaceFrame` children, render `OpsCommandRead` with exactly one next move.

```tsx
<OpsCommandRead
  eyebrow="Project command read"
  title="Open the next workspace move"
  description="The project home should orient owners first, then route them into launch, community, rewards or safety work."
  now={project.status === "active" ? "Workspace is active" : "Workspace needs readiness"}
  next={launchReady ? "Open Launch and clear readiness blockers" : "Finish project setup in Settings"}
  watch={openIncidentCount > 0 ? `${openIncidentCount} open incident signals` : "No open incident pressure"}
/>
```

Use the existing variables already computed on the page. When a variable name differs, map it once above render instead of adding new database calls.

- [ ] **Step 4: Add route cards for the main project actions**

After the command read, add route cards for Launch, Campaigns, Community, Rewards, Safety, and Settings.

```tsx
<OpsRouteGrid>
  <OpsRouteCard
    href={`/projects/${project.id}/launch`}
    eyebrow="Launch"
    title="Clear launch readiness"
    description="Review blockers, campaign handoff and the next safe launch action."
    emphasis={!launchReady}
  />
  <OpsRouteCard
    href={`/projects/${project.id}/campaigns`}
    eyebrow="Campaigns"
    title="Manage activation work"
    description="Open the campaign board and keep quest or raid work connected to launch pressure."
  />
  <OpsRouteCard
    href={`/projects/${project.id}/community?surface=raid-ops`}
    eyebrow="Community"
    title="Run raid and command ops"
    description="Manage Tweet-to-Raid, /newraid, Telegram, Discord and captain execution."
  />
  <OpsRouteCard
    href={`/projects/${project.id}/rewards`}
    eyebrow="Rewards"
    title="Check reward readiness"
    description="Keep reward stock, claim pressure and payout readiness aligned."
  />
  <OpsRouteCard
    href={`/projects/${project.id}/trust`}
    eyebrow="Safety"
    title="Review trust posture"
    description="Open fraud posture, suspicious users and project-visible review signals."
  />
  <OpsRouteCard
    href={`/projects/${project.id}/settings`}
    eyebrow="Control"
    title="Edit project setup"
    description="Change identity, integrations, links and public readiness from one dedicated surface."
  />
</OpsRouteGrid>
```

- [ ] **Step 5: Keep only one secondary rail**

Wrap the remaining overview content in `OpsCommandCanvas`. Put project snapshot, launch watch and safety watch inside `rail`, each as `OpsRailCard`. Keep detailed project assets, on-chain forms and setup wizard off the home page.

- [ ] **Step 6: Verify long strings wrap**

Search the project home for visible text containers holding project name, slug, URL, wallet, contract or narrative fields. Ensure those elements contain:

```tsx
className="break-words [overflow-wrap:anywhere]"
```

- [ ] **Step 7: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and `/projects/[id]` compiles without importing `ProjectForm`.

- [ ] **Step 8: Commit**

```powershell
git add app/projects/[id]/page.tsx
git commit -m "Simplify project home command surface"
```

---

### Task 4: Make Project Settings the Dedicated Builder Surface

**Files:**
- Modify: `app/projects/[id]/settings/page.tsx`
- Modify: `components/forms/project/ProjectForm.tsx`

- [ ] **Step 1: Make Settings own the full builder flow**

In `app/projects/[id]/settings/page.tsx`, keep `ProjectForm` as the primary body content. Add a compact command read above it:

```tsx
<OpsCommandRead
  eyebrow="Project setup"
  title="Change identity, links and integrations"
  description="Settings is the only surface where project configuration changes happen."
  now={`${project.name} is ${project.status}`}
  next="Update the field group that blocks readiness"
  watch={project.onboarding_status === "approved" ? "Public posture is approved" : "Public posture still needs approval"}
/>
```

- [ ] **Step 2: Change builder progress from vertical to horizontal**

In `ProjectForm`, replace the narrow vertical progress sidebar with a horizontal step rail above the active form. Use the existing step array and status labels, but render:

```tsx
<div className="grid gap-2 md:grid-cols-6">
  {steps.map((step) => (
    <button
      key={step.id}
      type="button"
      onClick={() => setCurrentStep(step.id)}
      className={cn(
        "rounded-[14px] border px-3 py-2 text-left transition",
        currentStep === step.id
          ? "border-primary/24 bg-primary/10 text-text"
          : "border-white/[0.028] bg-white/[0.016] text-sub hover:bg-white/[0.03] hover:text-text"
      )}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.16em]">Step {step.id}</p>
      <p className="mt-1 text-[11px] font-semibold">{step.title}</p>
      <p className="mt-1 text-[10px]">{step.status}</p>
    </button>
  ))}
</div>
```

Use the actual state setter and step property names from `ProjectForm`.

- [ ] **Step 3: Keep preview and readiness as the only rail**

In `ProjectForm`, place public preview, readiness guide and connected modules in one right rail. The active form remains the primary canvas. Project assets and on-chain configuration stay below only when their step is active.

- [ ] **Step 4: Verify create flow still works**

Open `app/projects/new/page.tsx` and confirm it still passes props required by `ProjectForm`. Do not remove the new project route behavior.

- [ ] **Step 5: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds for `/projects/new` and `/projects/[id]/settings`.

- [ ] **Step 6: Commit**

```powershell
git add app/projects/[id]/settings/page.tsx components/forms/project/ProjectForm.tsx
git commit -m "Focus project settings builder surface"
```

---

### Task 5: Split Community OS Into Explicit Surfaces

**Files:**
- Modify: `app/projects/[id]/community/page.tsx`

- [ ] **Step 1: Define the surface union near the current surface state**

Use the existing client component surface state and replace broad labels with:

```ts
type CommunitySurface =
  | "overview"
  | "raid-ops"
  | "automations"
  | "commands"
  | "captains"
  | "members"
  | "outcomes";

const COMMUNITY_SURFACES: Array<{ value: CommunitySurface; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "raid-ops", label: "Raid Ops" },
  { value: "automations", label: "Automations" },
  { value: "commands", label: "Commands" },
  { value: "captains", label: "Captains" },
  { value: "members", label: "Members" },
  { value: "outcomes", label: "Outcomes" },
];
```

- [ ] **Step 2: Read `surface` from the query string**

Use the existing router/search params pattern in this file. When the query contains a valid `surface`, make it active. When a user clicks a surface, update the URL to `/projects/${project.id}/community?surface=${next}`.

- [ ] **Step 3: Add a Community command read above surfaces**

Render:

```tsx
<OpsCommandRead
  eyebrow="Community command read"
  title="Choose the operating surface"
  description="Community OS should not stack every module at once. Pick the surface that matches the job: raid ops, automations, commands, captains, members or outcomes."
  now={tweetToRaidEnabled ? "Raid ops can create live work" : "Raid ops needs configuration"}
  next={telegramCommandsEnabled ? "Prove /newraid with a controlled post" : "Enable Telegram commands before live raid commands"}
  watch={blockedAutomationCount > 0 ? `${blockedAutomationCount} blocked automations` : "Automation rail is clear"}
/>
```

Map variable names from the existing computed values in the page.

- [ ] **Step 4: Render only one deep surface at a time**

Replace stacked panel rendering with a switch:

```tsx
{activeSurface === "overview" ? (
  <CommunityOverviewPanel ... />
) : null}
{activeSurface === "raid-ops" ? (
  <TweetToRaidAutopilotPanel projectId={project.id} projectName={project.name} campaigns={campaigns} />
) : null}
{activeSurface === "automations" ? (
  <CommunityAutomationCenterPanel ... />
) : null}
{activeSurface === "commands" ? (
  <CommunityCommandsPanel ... />
) : null}
{activeSurface === "captains" ? (
  <CommunityCaptainsPanel ... />
) : null}
{activeSurface === "members" ? (
  <CommunityMembersPanel ... />
) : null}
{activeSurface === "outcomes" ? (
  <CommunityOutcomesPanel ... />
) : null}
```

Keep all existing props and handlers. Move panels that are currently always visible into the matching surface.

- [ ] **Step 5: Keep a single right rail**

Use one rail with command readiness, automation health and next safe action. Do not render support, incidents, playbooks and members as separate always-visible sections.

- [ ] **Step 6: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and `/projects/[id]/community?surface=raid-ops` compiles.

- [ ] **Step 7: Commit**

```powershell
git add app/projects/[id]/community/page.tsx
git commit -m "Split community workspace surfaces"
```

---

### Task 6: Make Automation Center a Reliability Console

**Files:**
- Modify: `components/community/CommunityAutomationCenterPanel.tsx`

- [ ] **Step 1: Group automations by sequence**

Add this helper above `CommunityAutomationCenterPanel`:

```ts
function groupAutomationsBySequence(automations: CommunityAutomationRecord[]) {
  return automations.reduce<Record<string, CommunityAutomationRecord[]>>((groups, automation) => {
    const key = automation.sequencingKey ?? "standalone";
    groups[key] = [...(groups[key] ?? []), automation];
    return groups;
  }, {});
}
```

- [ ] **Step 2: Put status summary before settings controls**

Inside the panel, render active, ready, due, blocked and failed counts first. Show controls below the summary, not above it.

- [ ] **Step 3: Render sequence groups**

Replace the flat `automations.map` block with grouped sections:

```tsx
{Object.entries(groupedAutomations).map(([sequence, sequenceAutomations]) => (
  <div key={sequence} className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary/90">
          {sequence === "standalone"
            ? "Standalone"
            : COMMUNITY_AUTOMATION_SEQUENCE_LABELS[sequence as keyof typeof COMMUNITY_AUTOMATION_SEQUENCE_LABELS]}
        </p>
        <p className="mt-1 text-[12px] font-semibold text-text">
          {sequenceAutomations.length} automation rails
        </p>
      </div>
      <OpsStatusPill tone={sequenceAutomations.some((automation) => automation.executionPosture === "blocked") ? "warning" : "success"}>
        {sequenceAutomations.some((automation) => automation.executionPosture === "blocked") ? "Needs action" : "Readable"}
      </OpsStatusPill>
    </div>
    <div className="mt-3 space-y-2">
      {sequenceAutomations.map((automation) => (
        <AutomationRow key={automation.id} automation={automation} />
      ))}
    </div>
  </div>
))}
```

Create `AutomationRow` in the same file with the existing select fields and run button moved into a compact row.

- [ ] **Step 4: Preserve save and run handlers**

Ensure `AutomationRow` receives `onUpdateAutomation`, `onRunAutomation`, `runningAutomationId`, and `saving`. Every existing select still calls `onUpdateAutomation(automation.id, patch)`.

- [ ] **Step 5: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and automation type imports remain valid.

- [ ] **Step 6: Commit**

```powershell
git add components/community/CommunityAutomationCenterPanel.tsx
git commit -m "Clarify community automation reliability console"
```

---

### Task 7: Make Commands and `/newraid` Readiness Obvious

**Files:**
- Modify: `components/community/CommunityCommandsPanel.tsx`
- Modify: `app/projects/[id]/community/page.tsx`

- [ ] **Step 1: Add a live command readiness summary**

At the top of `CommunityCommandsPanel`, before toggles, render three rows:

```tsx
<div className="grid gap-2.5 md:grid-cols-3">
  <OpsMetricCard
    label="/newraid"
    value={telegramCommandsEnabled && raidOpsEnabled ? "Ready" : "Blocked"}
    sub={telegramCommandsEnabled && raidOpsEnabled ? "Telegram can create live raids." : "Enable Telegram commands and raid ops."}
    emphasis={telegramCommandsEnabled && raidOpsEnabled ? "primary" : "warning"}
  />
  <OpsMetricCard
    label="Discord"
    value={slashCommandsEnabled ? "Ready" : "Off"}
    sub="Discord remains the richer admin command surface."
    emphasis={slashCommandsEnabled ? "primary" : "default"}
  />
  <OpsMetricCard
    label="Deep links"
    value={keepDeepLinksInReplies ? "On" : "Off"}
    sub="Replies route admins and members back into the correct surface."
    emphasis={keepDeepLinksInReplies ? "primary" : "default"}
  />
</div>
```

Use the actual prop names already passed into the component.

- [ ] **Step 2: Add a `/newraid` help card**

Under the readiness summary, add:

```tsx
<div className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] p-3">
  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary/90">Telegram live raid</p>
  <p className="mt-2 text-[13px] font-semibold text-text">/newraid https://x.com/.../status/...</p>
  <p className="mt-1.5 text-[12px] leading-5 text-sub">
    Authorized project admins can create a live raid immediately when Telegram commands, raid ops and the default campaign are configured.
  </p>
</div>
```

- [ ] **Step 3: Link Community command read to Commands when blocked**

In `app/projects/[id]/community/page.tsx`, set the command read `next` text so a blocked `/newraid` route points owners to Commands.

- [ ] **Step 4: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and command settings still save.

- [ ] **Step 5: Commit**

```powershell
git add components/community/CommunityCommandsPanel.tsx app/projects/[id]/community/page.tsx
git commit -m "Clarify community command readiness"
```

---

### Task 8: Rebuild Billing as an Upgrade Page

**Files:**
- Modify: `app/settings/billing/page.tsx`

- [ ] **Step 1: Make upgrade value the first visible body**

Keep `BillingUpgradeHero`, but place it directly below the page frame and before usage diagnostics.

- [ ] **Step 2: Reorder page into four sections**

Use this order:

```tsx
<BillingUpgradeHero ... />
<OpsCommandRead ... />
<CriticalUsageStrip ... />
<PlanComparisonGrid ... />
<BillingOpsDiagnostics ... />
```

These component names can be local functions in `app/settings/billing/page.tsx`. Move existing JSX into those functions so the page render is readable.

- [ ] **Step 3: Keep plan cards compact and premium**

Plan cards should show plan name, buyer fit, price, included capacity, upgrade CTA and one risk line. Do not render every diagnostic inside each plan card.

- [ ] **Step 4: Move pink or emergency usage styling below the upgrade section**

Any danger usage bars stay under `BillingOpsDiagnostics`. The first screen sells value; the lower section explains operational pressure.

- [ ] **Step 5: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and `/settings/billing` compiles.

- [ ] **Step 6: Commit**

```powershell
git add app/settings/billing/page.tsx
git commit -m "Refocus billing upgrade flow"
```

---

### Task 9: Make Analytics Summary-First

**Files:**
- Modify: `app/analytics/page.tsx`

- [ ] **Step 1: Make Growth the default read, not a dashboard pile**

Keep the existing `analyticsView` state. The default surface shows command read, one outcome summary grid and one recommended action rail.

- [ ] **Step 2: Move commercial, campaign and verification details behind active lenses**

Keep the existing segment options. Render only the active lens body:

```tsx
{analyticsView === "growth" ? <GrowthAnalyticsLens ... /> : null}
{analyticsView === "outcomes" ? <OutcomeAnalyticsLens ... /> : null}
{analyticsView === "campaigns" ? <CampaignAnalyticsLens ... /> : null}
{analyticsView === "verification" ? <VerificationAnalyticsLens ... /> : null}
```

Create these local functions in `app/analytics/page.tsx` and move existing JSX into them.

- [ ] **Step 3: Downgrade snapshot errors to context**

The snapshot error block should be a compact rail or small status note after the command read. It must not dominate the page when analytics fallback data still renders.

- [ ] **Step 4: Keep execution links as a small bottom panel**

Execution links stay at the bottom and should not look like the primary task of Analytics.

- [ ] **Step 5: Run build**

```powershell
npm run lint
npm run build
```

Expected: build succeeds and `/analytics` compiles.

- [ ] **Step 6: Commit**

```powershell
git add app/analytics/page.tsx
git commit -m "Simplify analytics command read"
```

---

### Task 10: Final Portal Verification and Production Push

**Files:**
- Review: all modified files from Tasks 1-9

- [ ] **Step 1: Check git scope**

Run:

```powershell
git status --short --branch
```

Expected: branch is `main` and only intentional portal files are changed.

- [ ] **Step 2: Run final verification**

Run:

```powershell
npm run lint
npm run build
```

Expected:

```text
eslint .
```

and:

```text
Compiled successfully
```

- [ ] **Step 3: Manual browser QA checklist**

Open these production-equivalent routes locally or on the preview deployment:

```text
/projects
/projects/[id]
/projects/[id]/settings
/projects/[id]/community
/projects/[id]/community?surface=raid-ops
/projects/[id]/community?surface=automations
/settings/billing
/analytics
```

Confirm:

- [ ] Every page has one obvious title and one primary next action.
- [ ] No page duplicates the shell title with a second oversized hero.
- [ ] Project home does not render the full setup form.
- [ ] Community renders one deep surface at a time.
- [ ] Billing sells the upgrade before showing operational warnings.
- [ ] Analytics reads as outcome analysis, not an operations cockpit.
- [ ] Long project strings wrap instead of creating vertical overflow.

- [ ] **Step 4: Commit final polish**

When final QA changes exist:

```powershell
git add .
git commit -m "Polish portal command center hierarchy"
```

- [ ] **Step 5: Push portal production branch**

Push only from:

```powershell
C:\Users\jordi\OneDrive\Documenten\crypto-raid-admin-portal
```

Run:

```powershell
git push origin main
```

Expected: Vercel production for `crypto-raid-admin-portal.vercel.app` receives the portal repo update from `main`.

---

## Self-Review

- Spec coverage: Project Workspace, Community, Billing and Analytics are covered directly. Automation Center is covered as the main Community reliability surface. Navigation and Safety grouping are covered without removing routes.
- Placeholder scan: The plan contains no open implementation placeholders.
- Type consistency: New primitive names are defined in Task 1 before usage in subsequent tasks. Community surface names are defined once and reused by query string, toggle state and rendering.
