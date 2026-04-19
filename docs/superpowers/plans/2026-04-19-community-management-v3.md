# Community Management V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Community OS into a project-private community growth system with captains, contributor cohorts, newcomer/reactivation funnels, advanced trust overlays, campaign-specific activation boards, and community analytics.

**Architecture:** Keep `/projects/[id]/community` as the only project-owned control room, extend the existing `community_bot_settings.metadata` contract for v3 controls, add project-scoped insight and action routes in the portal, and reuse existing reputation, review-flag, trust, wallet, campaign, quest, raid, and audit data to compute cohorts and activation posture. Keep posting on the existing provider push rail rather than introducing a second community delivery system.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase service-role APIs, existing Veltrix community push/runtime endpoints, existing project-scoped audit and reputation tables.

---

## File Structure

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainsPanel.tsx`
  - captain roster, assignment UI, and captain health surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCohortsPanel.tsx`
  - newcomer/reactivation cohorts, trust overlays, and funnel actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAnalyticsPanel.tsx`
  - project-scoped growth, readiness, and quality analytics
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivationBoardsPanel.tsx`
  - campaign-specific activation boards and push actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-insights.ts`
  - shared server-side loaders/calculations for captains, cohorts, trust posture, analytics, and activation boards
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-growth\route.ts`
  - project-private read API for v3 insight payloads
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captains\route.ts`
  - save/update captain assignments in project-owned metadata
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-funnel-post\route.ts`
  - send newcomer/reactivation funnel posts
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-activation-board\route.ts`
  - send campaign activation board posts

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
  - extend the shared settings contract with v3 metadata fields
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
  - read/write v3 metadata fields cleanly
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - compose new v3 sections and wire their project-private APIs/actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
  - surface captain count, cohort posture, analytics/trust metrics, and new timestamps
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
  - include funnel/activation incidents and quality posture summaries

### No new SQL required

- Persist captain assignments and v3 toggles in `community_bot_settings.metadata`.
- Compute cohorts, trust overlays, analytics, and activation boards from existing project-scoped data.

---

## Task 1: Extend the shared Community OS v3 settings contract

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
- Test: `npm run build`

- [ ] Add v3 metadata-backed fields for captain roster, funnels, activation boards, analytics timestamps, and last v3 actions.
- [ ] Keep defaults safe: all new funnels/activation pushes start opt-in, empty captain roster, and timestamps default to empty strings.
- [ ] Preserve existing v1/v2 fields without renaming or changing their meaning.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 2: Build shared project-scoped insight loaders for v3

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-insights.ts`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-ops.ts`
- Test: `npm run build`

- [ ] Build one shared loader that reads project contributors, linked accounts, wallet verification, review flags, trust snapshots, reputation rows, audit logs, campaigns, quests, raids, and rewards.
- [ ] Compute v3 contributor cohorts: newcomer, warming up, core, watchlist, reactivation.
- [ ] Compute trust/quality posture from trust score, wallet risk labels, open review flags, and recent suspicious/trust audit signals.
- [ ] Compute campaign activation boards using project-owned campaigns plus readiness/coverage metrics.
- [ ] Compute project-private analytics summaries for contributor growth, readiness, trust posture, and campaign pressure.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Add project-private v3 read and action routes

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-growth\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captains\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-funnel-post\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-activation-board\route.ts`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-ops.ts`
- Test: `npm run build`

- [ ] Add a single project-private GET route that returns captains, cohorts, analytics, trust posture, and activation board summaries.
- [ ] Add a captain-assignment route that writes only to the current project's metadata and logs the action into `admin_audit_logs`.
- [ ] Add funnel and activation-board post routes that only allow content owned by the current project and dispatch via the existing provider push rail.
- [ ] Keep every route hard-scoped to `project_id`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Build the new v3 Community OS panels

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCohortsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAnalyticsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivationBoardsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Test: `npm run build`

- [ ] Build a captain-management panel that lets project owners assign community captains from project members or high-signal contributors, shows readiness and trust posture, and supports manual save.
- [ ] Build a cohort/funnel panel that surfaces newcomer and reactivation groups, trust overlays, recommended next actions, and manual funnel push triggers.
- [ ] Build an analytics panel that makes contributor growth, readiness coverage, trust drift, and campaign pressure readable at a glance.
- [ ] Build an activation boards panel that surfaces campaign-level activation health and supports manual community board pushes.
- [ ] Update overview/activity so v3 status is visible without scrolling through every section.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Wire Community OS page state, actions, and refresh loops

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Reuse: v2 project routes and new v3 routes
- Test: `npm run build`

- [ ] Load the new v3 insight payload alongside existing v1/v2 data.
- [ ] Add local state, notices, and refresh behavior for captain saves, funnel posts, and activation board pushes.
- [ ] Keep the composition readable: members, missions, raids, automations, captains, cohorts, analytics, and activation boards should feel like one control room, not a dump of cards.
- [ ] Ensure everything remains project-private and no cross-project community identifiers leak.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 6: Final verification

**Files:**
- Review all changed portal files
- Test:
  - `npm run build`

- [ ] Run the full `admin-portal` build from a clean state.
- [ ] Re-read the Community OS page flow to confirm v1/v2 features still render and v3 sections are project-scoped.
- [ ] Confirm no new SQL/manual migration is required for this tranche.

---

## Self-Review

### Spec coverage

Covered in this plan:
- Captains
- contributor cohorts
- newcomer funnels
- reactivation funnels
- community analytics
- advanced trust and quality overlays
- campaign-specific activation boards

Not covered intentionally:
- new bot command families
- cross-project admin tooling
- separate scheduling infrastructure beyond the existing manual/metadata-backed rails

### Placeholder scan

No `TODO`, `TBD`, or deferred implementation placeholders are left in the task structure.

### Type consistency

The plan keeps one shared metadata contract in `community_bot_settings`, one shared server-side insight loader, and one project-private route family for v3 actions so the portal does not fork into competing community data models.
