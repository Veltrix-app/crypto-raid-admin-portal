# Campaign And Quest Studio v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current studio-v2 builder layouts with a premium `Campaign Studio v3` storyboard builder and a cleaner `Quest Studio v3` guided experience builder.

**Architecture:** Reuse the existing portal create routes and builder state logic, but replace the presentation layer with two clearly different studio systems. `Campaign Studio v3` becomes a journey architecture surface built around storyboard blocks, while `Quest Studio v3` becomes a focused step-led builder with one active decision canvas and a stable preview rail.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `useAdminPortalStore` create flows, existing studio-v2 helpers, existing builder primitives, existing portal shell/layout system.

---

## File Structure

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioTopFrame.tsx`
  - compact persistent studio header for context, save state, mode toggles, and step posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioStepRail.tsx`
  - minimal left rail for active step navigation
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioWarningRail.tsx`
  - compact warnings and readiness-only rail component
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardCanvas.tsx`
  - storyboard-style campaign architecture canvas with journey blocks
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardBlock.tsx`
  - reusable campaign storyboard block surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardInspector.tsx`
  - focused campaign block editor shown for the selected storyboard node
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-storyboard.ts`
  - derived storyboard model, selected block summaries, and rollout posture helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestActionCanvas.tsx`
  - focused action-step canvas for CTA, destination, and member-facing copy
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestLaunchRail.tsx`
  - compact quest launch summary for timing, status, and next effect

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
  - reduce its role so it supports the new top frame, left rail, main canvas, and right rail layout
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioPreviewCard.tsx`
  - align with the new cleaner preview rail posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioReadinessCard.tsx`
  - simplify it so only high-value missing or risky items remain visible
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-studio.ts`
  - trim and reshape v2 helpers to feed storyboard decisions cleanly
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\quest-studio.ts`
  - trim and reshape v2 helpers to feed the guided quest builder cleanly
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
  - strip out the old form-heavy posture and move to storyboard-first interactions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
  - swap the v2 campaign page framing for the v3 storyboard shell
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
  - strip out the old stacked builder posture and move to the focused guided-builder layout
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
  - tighten the route around the v3 quest experience
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
  - refresh project-level create-entry language if the v3 naming or launch posture changes
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
  - align campaign-board CTAs with the final v3 create entry posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
  - align quest handoff copy with the final v3 quest studio language

### Verification targets

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run build`

---

## Task 1: Build the shared Studio v3 layout system

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioTopFrame.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioStepRail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioWarningRail.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioPreviewCard.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioReadinessCard.tsx`
- Test: `npm run build`

- [ ] Create a compact `StudioTopFrame` that holds project context, builder identity, save posture, and mode toggles without consuming the main canvas.
- [ ] Create a minimal `StudioStepRail` that supports a small left navigation rail and does not try to explain the step content itself.
- [ ] Create a `StudioWarningRail` that only shows blockers, missing config, or high-signal readiness gaps.
- [ ] Refactor `StudioShell.tsx` so it becomes the layout grid only: top frame, left rail, center canvas, right rail.
- [ ] Update the preview and readiness primitives so they look like stable side-rail tools instead of extra stacked cards.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 2: Add the Campaign Studio v3 storyboard model

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-storyboard.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-studio.ts`
- Test: `npm run build`

- [ ] Add a dedicated storyboard helper that turns campaign state into a clean set of blocks like `goal`, `quest_lane`, `raid_pressure`, `reward_outcome`, and `launch_posture`.
- [ ] Keep the new storyboard helper derived from the existing project, template, quest-draft, and reward-draft state instead of adding new persistence.
- [ ] Reduce `campaign-studio.ts` to what still matters for v3: intent summaries, launch posture, and compact readiness feeds.
- [ ] Make sure the storyboard model explicitly supports selecting a single block for focused editing instead of pushing all campaign options into one long form.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Build the Campaign Studio v3 storyboard components

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardCanvas.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardBlock.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardInspector.tsx`
- Test: `npm run build`

- [ ] Build a storyboard canvas that shows the campaign as a sequence of blocks instead of a stacked admin form.
- [ ] Build a reusable block surface that visually distinguishes selected, ready, and incomplete journey blocks.
- [ ] Build an inspector panel that edits only the selected block and keeps the rest of the journey visible but quiet.
- [ ] Keep the storyboard interactions intentional: one selected block, one focused edit surface, one clear next action.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Restructure Campaign Studio into the v3 storyboard builder

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardCanvas.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignStoryboardInspector.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioTopFrame.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
- Test: `npm run build`

- [ ] Replace the v2 campaign layout so the main interaction is the storyboard, not the form fields.
- [ ] Move campaign settings into block-specific inspector views like `Goal`, `Architecture`, `Rewards`, and `Launch`.
- [ ] Keep the right rail minimal: launch preview plus blockers only.
- [ ] Collapse or hide advanced controls unless the relevant block is selected and the operator is in advanced mode.
- [ ] Update the route framing so the page clearly reads as a campaign journey architecture tool, not a wizard with a few extra cards.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Add the Quest Studio v3 focused-builder components

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestActionCanvas.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestLaunchRail.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\quest-studio.ts`
- Test: `npm run build`

- [ ] Build a focused action canvas for the quest action step so CTA, destination, and member-facing copy feel like one primary decision surface.
- [ ] Build a compact launch summary rail for the launch step so timing and final posture feel contained and readable.
- [ ] Reshape `quest-studio.ts` around the v3 hierarchy: member action first, verification second, reward third, launch fourth.
- [ ] Keep all helper output lightweight enough for a calm left-rail / center-canvas / right-rail layout.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 6: Restructure Quest Studio into the v3 guided experience builder

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioTopFrame.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioStepRail.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestActionCanvas.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestMemberPreview.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestVerificationRail.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestLaunchRail.tsx`
- Test: `npm run build`

- [ ] Strip the current quest layout down to one active decision canvas per step.
- [ ] Keep the left rail compact and navigational only.
- [ ] Keep the right rail stable with only `Member Preview` and `Warnings / Readiness`.
- [ ] Make the verification step a true first-class screen rather than one more panel in a crowded canvas.
- [ ] Push advanced settings fully behind the existing basic/advanced posture so the default route stays calm.
- [ ] Update the route framing so the page reads as a guided builder for one member action, not a boosted admin form.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 7: Align entry flows and final language with Studio v3

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
- Review: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- Test: `npm run build`

- [ ] Update project overview and campaign-board CTAs if the v3 builder language needs to shift from generic studio entry to more explicit storyboard or guided-builder language.
- [ ] Keep `projectId` and `campaignId` handoffs intact through every entry path.
- [ ] Align campaign detail next-action copy with the final v3 quest create language.
- [ ] Ensure the create-entry points now match the actual feel of the builders and do not overpromise the old wizard posture.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 8: Final consistency pass and rollout verification

**Files:**
- Review all changed studio-v3 files
- Test: `npm run build`

- [ ] Check that Campaign Studio and Quest Studio still feel like one family while clearly serving different object types.
- [ ] Check that context is compact everywhere and no old heavy context cards remain.
- [ ] Check that the right rails are truly restrained and only show preview plus high-signal warnings.
- [ ] Check that advanced controls stay hidden by default and do not recreate the original clutter.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Prepare rollout notes that explain the new campaign storyboard posture, the new quest guided-builder posture, and any changed entry cues.

---

## Self-Review

### Spec coverage

Covered:

- `Campaign Studio v3 = storyboard builder`
- `Quest Studio v3 = guided experience builder`
- compact context headers
- minimal left rails
- restrained right rails
- one primary job per step
- advanced controls hidden by default
- project-first entry alignment

Intentionally deferred:

- any new persistence model for storyboard state
- a full `Raid Studio` redesign
- member-facing webapp changes

### Placeholder scan

No `TBD`, `TODO`, or undefined buckets remain. Each task names exact files and the verification command.

### Type consistency

Shared layout files stay under `components/forms/studio`, campaign-specific storyboard files stay under `components/forms/campaign`, quest-specific guided-builder files stay under `components/forms/quest`, and helper logic stays under `lib/studio`.
