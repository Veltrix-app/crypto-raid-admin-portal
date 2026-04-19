# Community Management V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a project-private `Community Management` page that centralizes Discord and Telegram community operations for a single project.

**Architecture:** Create a dedicated `projects/[id]/community` route in the admin portal, move the existing community bot controls out of the project detail page, and reorganize them into project-scoped sections: overview, integrations, ranks, leaderboards, commands, and activity. Reuse existing APIs and project-scoped tables where possible, and keep all reads and actions filtered by the selected project.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, existing admin portal UI primitives and project APIs.

---

## File Structure

### New files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - new dedicated Community Management route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverview.tsx`
  - top summary and health cards
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityIntegrationsPanel.tsx`
  - Discord and Telegram integration controls
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityRanksPanel.tsx`
  - rank ladders, presets, sync actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityLeaderboardsPanel.tsx`
  - leaderboard settings and post action
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCommandsPanel.tsx`
  - commands rail and command sync
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
  - project-scoped bot activity and incidents

### Modified files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
  - replace the heavy community config rail with a lighter summary + CTA into the new page
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
  - optionally enrich the response with summary fields needed by the new page
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\project-integrations\route.ts`
  - confirm project-scoped reads remain usable for the new page

### Existing files to reuse

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\discord-command-sync\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\discord-rank-sync\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\discord-leaderboard-post\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-push-test\route.ts`

---

### Task 1: Create the Community Management route shell

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Write the route skeleton**

Create a new route component that:
- reads `projectId` from params
- resolves the project from `useAdminPortalStore`
- redirects or renders `NotFoundState` if the project is missing
- renders `AdminShell`
- renders a hero for `Community Management`
- reserves placeholders for the six v1 sections

- [ ] **Step 2: Build to verify the route compiles**

Run: `npm run build`  
Expected: build passes and the new route is listed in Next.js output

- [ ] **Step 3: Commit**

Run:
```bash
git add "app/projects/[id]/community/page.tsx"
git commit -m "Add project community management route shell"
```

### Task 2: Extract reusable community page sections

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverview.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityIntegrationsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityRanksPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityLeaderboardsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCommandsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Move the section boundaries into dedicated components**

Each new component should receive only the props it needs and should not fetch independently unless required.

The first pass should keep the logic simple:
- Overview: project name, status cards, timestamps
- Integrations: existing Discord/Telegram integration fields and test actions
- Ranks: rank settings, presets, sync action
- Leaderboards: scope, cadence, top N, post action
- Commands: commands enabled + sync action
- Activity: project-scoped audit snippets

- [ ] **Step 2: Wire them into the community page**

Render the new section components in the route and pass state/actions down from the page.

- [ ] **Step 3: Build to verify the extraction passes**

Run: `npm run build`  
Expected: build passes with no missing imports or prop mismatches

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/community/page.tsx components/community
git commit -m "Extract community management page sections"
```

### Task 3: Reuse existing Discord and Telegram integration logic on the new page

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityIntegrationsPanel.tsx`
- Reuse APIs already present under `app/api/projects/[id]/*` and `app/api/project-integrations`
- Test: `npm run build`

- [ ] **Step 1: Move the existing integration load/save/test flows into the new page**

Use the existing project integration fetch/save behavior already working on the project detail page.

This task should preserve:
- Discord guild/channel config
- Telegram chat config
- push test buttons
- save actions

- [ ] **Step 2: Ensure the new page only loads project-owned integration data**

Keep all requests scoped to `project.id`. Do not add any global integration reads.

- [ ] **Step 3: Build to verify the community page preserves integration behavior**

Run: `npm run build`  
Expected: build passes and the old integration flows still compile on the new page

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/community/page.tsx components/community/CommunityIntegrationsPanel.tsx
git commit -m "Move project integration controls into community page"
```

### Task 4: Move Discord rank and leaderboard management into the new page

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityRanksPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityLeaderboardsPanel.tsx`
- Reuse:
  - `app/api/projects/[id]/community-bot-settings/route.ts`
  - `app/api/projects/[id]/discord-rank-sync/route.ts`
  - `app/api/projects/[id]/discord-leaderboard-post/route.ts`
  - `app/api/projects/[id]/discord-command-sync/route.ts`
- Test: `npm run build`

- [ ] **Step 1: Move the current Discord bot settings rail into the community page**

Preserve:
- commands enabled
- rank sync enabled
- default rank source
- quick ladders / presets
- rank rules list
- leaderboard settings
- sync / post / command sync actions

- [ ] **Step 2: Improve visual grouping**

Present commands, ranks, and leaderboards as separate operational surfaces instead of one long generic block.

- [ ] **Step 3: Build to confirm the moved controls compile**

Run: `npm run build`  
Expected: build passes and no duplicated state remains unresolved

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/community/page.tsx components/community/CommunityRanksPanel.tsx components/community/CommunityLeaderboardsPanel.tsx components/community/CommunityCommandsPanel.tsx
git commit -m "Move Discord bot management into community page"
```

### Task 5: Add the project-scoped community overview

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverview.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Surface the high-value overview metrics**

The overview should show:
- Discord connected / Telegram connected
- commands enabled
- rank sync enabled
- leaderboard enabled
- last rank sync
- last leaderboard post
- rough readiness summaries from existing page state

- [ ] **Step 2: Keep the overview read-heavy and action-light**

Only show lightweight CTA links, such as:
- jump to integrations
- jump to ranks
- jump to leaderboards

- [ ] **Step 3: Build to verify overview compiles**

Run: `npm run build`  
Expected: build passes

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/community/page.tsx components/community/CommunityOverview.tsx
git commit -m "Add project community overview surface"
```

### Task 6: Add project-scoped community activity and incidents

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Optionally reuse project-scoped audit reads already present on project detail
- Test: `npm run build`

- [ ] **Step 1: Add a project-scoped activity panel**

Show the latest project-owned items only:
- rank sync results
- leaderboard post results
- failed push attempts tied to the project
- latest community-related notices already available through audit logs or existing fetches

- [ ] **Step 2: Avoid global moderation leakage**

Do not pull unrelated trust or claim operations into this panel.

- [ ] **Step 3: Build to verify the new activity panel compiles**

Run: `npm run build`  
Expected: build passes

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/community/page.tsx components/community/CommunityActivityPanel.tsx
git commit -m "Add project-scoped community activity panel"
```

### Task 7: Slim down the project detail page and add the CTA

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Replace the heavy embedded community controls with a lighter summary**

Keep only:
- compact readiness summary
- maybe last sync / last post
- CTA button to `Open Community Management`

- [ ] **Step 2: Remove duplicated controls from project detail**

The source of truth for community operations should become the new page.

- [ ] **Step 3: Build to verify the page still compiles after slimming down**

Run: `npm run build`  
Expected: build passes and `/projects/[id]` remains healthy

- [ ] **Step 4: Commit**

Run:
```bash
git add app/projects/[id]/page.tsx
git commit -m "Move community operations off project detail page"
```

### Task 8: Final verification and cleanup

**Files:**
- Review all modified files in this plan
- Test: `npm run build`

- [ ] **Step 1: Run the final full build**

Run: `npm run build`  
Expected: clean successful production build

- [ ] **Step 2: Review for project-private boundaries**

Manually inspect the new community page code and confirm:
- all data is project-scoped
- no global ops leakage exists
- existing project APIs are reused instead of introducing broad cross-project reads

- [ ] **Step 3: Commit the final cleanup**

Run:
```bash
git add app components docs
git commit -m "Finish community management v1 extraction"
```

---

## Self-Review

### Spec coverage

Covered in this plan:
- dedicated project-private route
- sectioned Community Management page
- migration of community controls out of project detail
- overview, integrations, ranks, leaderboards, commands, activity

Deferred intentionally:
- raids
- automations
- missions
- captains
- analytics

### Placeholder scan

No `TODO`, `TBD`, or “implement later” placeholders remain in the plan tasks.

### Type consistency

The plan assumes existing Discord and Telegram state is preserved and moved into reusable components. It does not invent new schema names for v1 beyond what already exists.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-19-community-management-v1.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
