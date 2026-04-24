# Portal Operator Workspace Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the portal after the current premium visual pass so it behaves like a fast operator workspace again. The portal should keep its premium dark-language, but it must prioritize navigation clarity, project management speed, and direct routes into work over visual theater.

**Architecture:** Treat this as a correction pass, not a redesign reset. Keep the current portal data model, routes, and product logic intact. Change only the shell, information hierarchy, and layout grammar needed to restore fast operator flow. The first focus is the shell, then `/projects`, then `/projects/[id]`, and only then a light alignment pass across the rest of the portal.

**Tech Stack:** Next.js App Router, React, TypeScript, current `admin-portal` shell/layout system, Zustand stores, Tailwind utility styling, approved spec in `docs/superpowers/specs`, and the existing operator data/selectors already used by project and ops pages.

---

## Scope framing

This plan is intentionally focused.

It does not replace the current portal product architecture.

It restores usability in the places where the visual phase over-rotated from workspace clarity into presentation.

This pass includes:

- shell correction
- `/projects` workbench correction
- `/projects/[id]` workspace-command correction
- targeted alignment of the heaviest ops pages so the corrected shell language carries through

This pass does **not** include:

- new portal features
- route rewrites
- data model changes
- auth/navigation permission changes
- a second full visual redesign

---

## Relationship to earlier planning

This plan executes the approved correction spec:

- [2026-04-25-portal-operator-workspace-correction-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-25-portal-operator-workspace-correction-design.md)

It also acts as a corrective follow-on to the earlier visual work, especially:

- [2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md)
- [2026-04-24-flagship-redesign-galxe-translated-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-flagship-redesign-galxe-translated-design.md)

This correction pass does not reject those directions.

It narrows the portal back toward operator software while leaving the webapp free to stay more browse-driven and expressive.

---

## Working assumptions

- The webapp and portal are now intentionally different in intensity.
- The portal should remain premium, but more utilitarian than the webapp.
- The portal shell currently consumes too much cognitive and spatial budget.
- `/projects` must return to being the primary project-management workbench.
- `/projects/[id]` must return to being a command page instead of a summary showcase.
- Existing route structure and business actions should remain stable.
- Existing stores and selectors should be reused rather than replaced.

## Out of scope for this tranche

- changing the current global route map
- removing the thin icon rail completely
- replacing Zustand stores
- rewriting project forms or launch flows from scratch
- altering support, billing, success, or security behavior

---

## Product contract for the correction pass

### Core UX rule

Every primary portal screen must answer these questions quickly:

- where am I
- what am I managing here
- what should I do next

### Portal shell contract

The shell should feel:

- compact
- supportive
- fast
- secondary to page content

It should not feel like the most visually important thing on the screen.

### Project workspace contract

`/projects` and `/projects/[id]` must make project work feel:

- obvious
- fast to scan
- action-led
- less theatrical
- more reliable as an operator surface

---

## File structure for this tranche

### Shell correction files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\AdminShell.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`
- any directly affected shell primitives only if required

### Projects workbench files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx`

### Project workspace detail files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
- directly used project overview blocks only where needed

### Ops alignment files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- only the minimum supporting primitives/components needed for consistency

### Rollout notes

- create a dedicated rollout note file under `docs/superpowers/specs`

---

## Task 1: Correct the shell so content wins again

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\AdminShell.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`

- [ ] Reduce topbar height and visual dominance.
- [ ] Compress page title, page description, search, workspace switch, and profile cluster.
- [ ] Keep the thin icon rail, but make its active state clearer while reducing decorative weight.
- [ ] Return more horizontal and vertical space to page content.
- [ ] Preserve current auth, account-entry, and security-enforcement behavior.

## Task 2: Restore `/projects` as the primary workbench

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx` only if needed

- [ ] Rebuild the top of the page into a compact workbench header.
- [ ] Keep only a small stats row above filters and roster.
- [ ] Make filters and create-action immediately useful instead of visually secondary.
- [ ] Make the roster the primary screen again.
- [ ] Move onboarding/intake to a clearly secondary position so it no longer competes with core project management.

## Task 3: Restore `/projects/[id]` as a workspace command page

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
- Modify only the project overview blocks needed for layout correction

- [ ] Replace summary-heavy opening composition with a compact workspace header.
- [ ] Add a clear signal row with only the most useful project state.
- [ ] Organize the main content around `Launch`, `Operate`, and `Watch`.
- [ ] Put direct routes to work ahead of supporting summary content.
- [ ] Keep all existing project actions intact while making them easier to reach.

## Task 4: Align the heaviest ops pages behind the corrected operator language

**Files:**
- Modify only the minimum ops overview/detail files needed for consistency

- [ ] Let the shell correction flow into the ops pages without reintroducing big heroic top zones.
- [ ] Keep command reads and important metrics, but reduce decorative density and extra copy.
- [ ] Make action lanes and queues feel more like working surfaces than showcase panels.
- [ ] Preserve page-specific meaning while aligning spacing, emphasis, and operator rhythm.

## Task 5: Verification and rollout notes

**Files:**
- Add rollout notes under `docs/superpowers/specs`

- [ ] Run build verification for `admin-portal`.
- [ ] Write rollout notes that call out shell changes, `/projects`, `/projects/[id]`, and ops-page alignment.
- [ ] Document the new portal rule: premium operator workspace first, browse/showcase second.

---

## Verification requirements

Before this tranche is considered complete, run:

### `admin-portal`

```bash
npm run build
```

Executed in:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

---

## Smoke pass requirements

After deploy, verify:

### Portal shell

- the shell no longer dominates the page
- the topbar feels compact and functional
- the icon rail is still usable for power users
- page content has visibly more breathing room

### `/projects`

- the roster is the obvious primary surface
- it is easy to see project status and open the next workspace
- create, filter, and reset actions are fast to find
- onboarding does not distract from project management

### `/projects/[id]`

- the page opens with command clarity instead of summary theater
- the next useful action is easy to identify
- launch, operate, and watch areas are easier to scan than before
- supporting context is still available without overwhelming the page

### Ops alignment

- the heaviest ops pages feel calmer and more work-oriented
- shell correction carries across the portal without flattening page meaning

---

## Definition of done

This correction tranche is complete when:

- the portal shell feels secondary to the work instead of visually dominant
- `/projects` is clearly a workbench again
- `/projects/[id]` is clearly a command page again
- the portal remains premium, but no longer feels like a showcase-first surface
- internal ops pages inherit the corrected operator language cleanly
- the implementation builds cleanly and is documented for rollout

---

## Next wave recommendation

If this correction lands well, the next portal wave should focus on:

- deeper project subroutes such as launch and settings
- builder forms where oversized composition still slows the operator path
- only then any further premium visual polish

That keeps usability ahead of taste and prevents the portal from drifting back into presentation-first territory.
