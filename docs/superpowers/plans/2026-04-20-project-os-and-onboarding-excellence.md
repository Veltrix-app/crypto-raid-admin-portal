# Project OS And Onboarding Excellence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make project setup, launch readiness, and project-side creation flows feel like a premium operating system from the first workspace through the first live campaign, quest, raid, reward, and community push.

**Architecture:** Keep the portal project-first and build `Phase 2` around one operating spine: a project-private onboarding and launch workspace, shared readiness helpers, durable starter templates, lifecycle-safe action routes, and a true `Raid Studio` that joins Campaign Studio and Quest Studio at the same quality level. Reuse the new platform-core hardening rails for lifecycle, incidents, overrides, and audit history so onboarding and launch execution stay visible and recoverable.

**Tech Stack:** Next.js App Router, React, TypeScript, Zustand admin stores, Supabase/Postgres, SQL migrations, existing `admin-portal` workspace shell, existing Studio v3 builder primitives, existing platform-core lifecycle and ops helpers.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_project_os_phase2.sql`
  - add generic project builder templates so campaigns, quests, raids, and starter playbooks can all live in one durable template rail

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\project-onboarding.ts`
  - derive project onboarding steps, next-best setup action, and missing prerequisites from existing project, integration, campaign, quest, raid, reward, and push state
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\project-launch-readiness.ts`
  - compute launch score, blockers, readiness groups, and recommended next launch action
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\templates\project-builder-library.ts`
  - shared template library definitions for starter campaign packs, quest kits, raid kits, and launch playbooks
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\raid-studio.ts`
  - shared raid-studio posture helpers, preview data, verification summaries, and launch warnings
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\launch-readiness\route.ts`
  - project-private API that returns onboarding and launch-readiness aggregates
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\builder-templates\route.ts`
  - project-private API for reading starter templates and saving project-scoped custom templates
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\content-actions\route.ts`
  - project-private API for duplicate, archive, publish, pause, resume, and version-friendly lifecycle actions on campaigns, quests, raids, and rewards
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
  - new project-private onboarding and launch workspace
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchRail.tsx`
  - left-side onboarding and launch-step navigation for the new workspace
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchChecklist.tsx`
  - grouped readiness checklist with blockers, soft gaps, and completed setup signals
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchScorecard.tsx`
  - launch score, readiness tier, and critical signals summary
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectNextActions.tsx`
  - next-best-action cards for integrations, first content, push tests, and launch cleanup
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\templates\ProjectTemplateLibrary.tsx`
  - starter pack browser for campaign packs, quest kits, raid kits, and project playbooks
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidActionCanvas.tsx`
  - focused raid action step with CTA, destination, and member-facing pressure copy
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidVerificationRail.tsx`
  - high-signal verification summary and warnings rail for raids
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidMemberPreview.tsx`
  - member-facing raid preview surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidLaunchRail.tsx`
  - compact raid launch summary and readiness rail
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\project-builder-template.ts`
  - generic template type that can represent campaign, quest, raid, and playbook templates

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
  - load generic builder templates, expose lifecycle-safe content actions, and preserve project-first handoffs
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\project-campaign-template.ts`
  - either bridge into the new generic template type or remain as a compatibility shim
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\campaign-templates.ts`
  - continue as the campaign pack source, but align with the broader project template library
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
  - add a clear path into the onboarding and launch workspace
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
  - surface starter packs, launch readiness, and stronger project-first creation actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\settings\page.tsx`
  - align project settings with readiness expectations and setup prompts
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
  - accept onboarding and starter-pack handoffs cleanly
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
  - surface launch-readiness and starter-pack context inside Campaign Studio without reintroducing clutter
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
  - accept onboarding, project-first, and starter-kit handoffs cleanly
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
  - surface readiness, starter-kit, and launch-sequence cues inside Quest Studio
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\new\page.tsx`
  - swap the current builder shell for the new Raid Studio flow
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidForm.tsx`
  - replace the current long-form builder with a studio-quality raid experience
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
  - add lifecycle-safe duplicate and archive actions plus launch posture cues
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\[id]\page.tsx`
  - add lifecycle-safe duplicate and archive actions plus launch posture cues
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\[id]\page.tsx`
  - add lifecycle-safe duplicate and archive actions plus launch posture cues
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\[id]\page.tsx`
  - add lifecycle-safe duplicate and archive actions plus launch posture cues
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
  - align quick actions with the new launch workspace and project-first creation system

### Verification targets

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run build`
- `C:\Users\jordi\OneDrive\Documenten\New project`
  - migration review only for `veltrix_project_os_phase2.sql`

---

## Task 1: Add the Phase 2 schema and template contracts

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_project_os_phase2.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\project-builder-template.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\project-campaign-template.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
- [ ] Add a generic `project_builder_templates` table with a `template_kind` field so the project can save campaign packs, quest kits, raid kits, and playbook starters in one place.
- [ ] Backfill or bridge existing `project_campaign_templates` into the new generic model without breaking the current campaign template flows.
- [ ] Add a generic admin type that can represent `campaign`, `quest`, `raid`, and `playbook` templates cleanly.
- [ ] Update the portal store so it loads the generic template inventory and keeps current campaign template consumers working during the transition.
- [ ] Review the migration text and type names before moving on.

## Task 2: Build shared onboarding and launch-readiness helpers

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\project-onboarding.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\projects\project-launch-readiness.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\launch-readiness\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
- [ ] Add one shared onboarding helper that derives setup steps like `integrations`, `community`, `first campaign`, `first quest`, `first raid`, `first reward`, and `first push test` from existing project and content state.
- [ ] Add one shared launch helper that derives readiness score, hard blockers, soft blockers, and recommended next action from project setup and live content state.
- [ ] Add a project-private API route that returns those aggregates so the launch workspace stays server-safe and predictable.
- [ ] Reuse the platform-core lifecycle and ops rails inside the readiness model instead of inventing a second operational vocabulary.
- [ ] Keep the helper outputs compact enough to drive both the new launch workspace and small readiness surfaces elsewhere in the project UI.

## Task 3: Build the project onboarding and launch workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchRail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchChecklist.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectLaunchScorecard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\launch\ProjectNextActions.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- [ ] Build a new project-private launch route that becomes the default setup surface for project owners once a workspace exists.
- [ ] Add a left-side setup rail so project teams can move through setup in a clear order without hunting through routes.
- [ ] Add a launch scorecard, grouped checklist, and next-best-actions area so the project always knows what to do next.
- [ ] Keep the route project-first and operator calm: no member CRM, no giant settings dump, only setup and launch orchestration.
- [ ] Add clear entry points from the project overview so this becomes the obvious place to finish setup and prepare launch.

## Task 4: Add lifecycle-safe duplicate, archive, and version-friendly actions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\content-actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\[id]\page.tsx`
- [ ] Add a project-private action route for `duplicate`, `archive`, `publish`, `pause`, and `resume` so those flows are audited and scoped correctly.
- [ ] Add store wrappers for those actions so the detail pages stop relying on ad-hoc edit-only flows for lifecycle work.
- [ ] Add explicit lifecycle actions to campaign, quest, raid, and reward detail surfaces with clear current-state posture.
- [ ] Make duplicate flows project-aware and content-aware so teams can version forward without rebuilding from scratch.
- [ ] Keep archive and pause behavior aligned with the platform-core lifecycle language from Phase 1.

## Task 5: Expand the template library into a real project starter system

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\templates\project-builder-library.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\templates\ProjectTemplateLibrary.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\campaign-templates.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
- [ ] Build one shared starter library that groups campaign packs, quest kits, raid kits, and playbook-style starter flows in project language.
- [ ] Reuse the existing campaign template definitions instead of replacing them, but wrap them in a broader library that the launch workspace can browse.
- [ ] Surface the starter library from the new launch workspace and the project campaign board so teams can begin from intent, not from blank forms.
- [ ] Keep starter packs project-context aware so they inherit the current project and can prefill the right builder routes automatically.
- [ ] Support both built-in starters and project-scoped saved templates through the same library surface.

## Task 6: Build Raid Studio so raids match Campaign and Quest quality

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\raid-studio.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidActionCanvas.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidVerificationRail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidMemberPreview.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidLaunchRail.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\raid\RaidForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\new\page.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioTopFrame.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioStepRail.tsx`
- [ ] Add a raid-studio helper that treats raids as pressure missions with four clear jobs: action, placement, verification, launch.
- [ ] Replace the current raid long-form builder with a proper studio shell using the same product family language as Campaign Studio and Quest Studio.
- [ ] Add a member-facing raid preview so teams can see how the raid actually lands before launch.
- [ ] Make verification a first-class step so raid trust and proof shape are obvious, not buried.
- [ ] Keep the right rail tight with preview and warnings only, so the raid builder feels premium rather than crowded.

## Task 7: Align Campaign Studio, Quest Studio, and project-first handoffs

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- [ ] Thread the new onboarding and launch-readiness language into Campaign Studio and Quest Studio without undoing the calmer Studio v3 layouts.
- [ ] Add stronger project-first handoffs from the launch workspace into campaign, quest, and raid creation with project and campaign context already locked in.
- [ ] Keep starter-pack and template selection visible from the project workspace before the user ever lands in a builder.
- [ ] Make the new project-first flow obvious: `launch workspace -> choose starter or create blank -> builder -> detail -> launch`.
- [ ] Remove any remaining hidden-route feeling from project creation and sequencing.

## Task 8: Final consistency pass and rollout verification

**Files:**
- Review all changed Phase 2 files
- Test: `npm run build`
- Review: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_project_os_phase2.sql`
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Check that onboarding, launch readiness, template selection, and object creation now feel like one product flow rather than separate admin screens.
- [ ] Check that lifecycle actions use the Phase 1 vocabulary everywhere and do not reintroduce silent or hidden state changes.
- [ ] Check that `Raid Studio` feels like the same family as Campaign Studio and Quest Studio while still serving pressure missions specifically.
- [ ] Write rollout notes covering the new launch workspace, starter library, lifecycle-safe content actions, and Raid Studio upgrade.

---

## Self-Review

### Roadmap coverage

Covered:

- guided project onboarding flow
- launch checklist and readiness scoring
- Raid Studio uplift
- template library and starter packs
- duplicate, archive, and version-friendly content flows
- project-first handoffs into campaign, quest, raid, and reward creation

Intentionally deferred to later phases:

- deeper Community OS work
- member-facing webapp journey expansion
- bot-surface excellence work beyond existing project handoffs
- trust, fraud, reward, and on-chain excellence beyond the lifecycle hooks already added in Phase 1

### Placeholder scan

No `TBD`, `TODO`, or vague "handle later" markers were left in the plan. Every task names concrete files and a specific product outcome.

### Scope check

This is still one phase, but it is internally grouped in a stable order:

1. template contracts
2. onboarding and readiness helpers
3. launch workspace
4. lifecycle-safe actions
5. starter library
6. Raid Studio
7. handoff alignment
8. final verification

That keeps `Phase 2` broad enough to matter, but still contained enough to execute as one focused roadmap tranche.
