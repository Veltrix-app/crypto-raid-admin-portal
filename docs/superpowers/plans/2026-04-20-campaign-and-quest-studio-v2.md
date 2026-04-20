# Campaign And Quest Studio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn campaign and quest creation into project-first premium studios with clearer intent, better previews, progressive disclosure, and a much more obvious mission architecture.

**Architecture:** Reuse the existing builder foundation instead of inventing a new workflow engine, split the redesign into shared builder primitives plus two focused studio upgrades, and keep project/campaign context visible through every step. `Campaign Studio v2` becomes an intent and mission-map surface, while `Quest Studio v2` becomes a mission-first action and verification studio with a stronger member preview.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `BuilderPrimitives`, existing `useAdminPortalStore` create flows, existing campaign template helpers, existing quest verification preview helper, and existing portal shell/layout system.

---

## File Structure

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
  - shared studio page shell for header, context pills, step rail, main rail, and side rail
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioModeToggle.tsx`
  - reusable basic/advanced and strategy/launch mode toggle
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioReadinessCard.tsx`
  - reusable readiness and missing-context card
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioPreviewCard.tsx`
  - reusable member-facing preview surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignMissionMap.tsx`
  - visual mission architecture rail for generated quests, raids, and rewards
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignIntentStep.tsx`
  - strategic goal and audience selection UI for Campaign Studio
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignLaunchPreview.tsx`
  - launch readiness, generated outputs, and next-step summary for Campaign Studio
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestMemberPreview.tsx`
  - member-facing quest card preview
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestVerificationRail.tsx`
  - plain-language verification explanation, provider, proof route, and missing-key rail
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-studio.ts`
  - campaign studio helpers for intent state, readiness summaries, and mission map projections
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\quest-studio.ts`
  - quest studio helpers for blueprint grouping, member preview mapping, and launch posture

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
  - simplify builder posture and adopt the new Campaign Studio shell
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
  - restructure the existing form into intent, flow, and launch sections with progressive disclosure
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
  - simplify page posture and adopt the new Quest Studio shell
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
  - restructure the builder into blueprint, destination, verification, reward, preview, and launch
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\builder\BuilderPrimitives.tsx`
  - extend shared builder primitives only where both studios need the same treatment
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
  - sharpen project overview creation CTAs around Campaign Studio and Quest Studio naming
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
  - align project campaign board CTAs with the new studio naming and flow
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
  - improve creation handoffs from campaign detail into prefilled Quest Studio

### Verification targets

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run build`

---

## Task 1: Build shared studio scaffolding for both builders

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioShell.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioModeToggle.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioReadinessCard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\studio\StudioPreviewCard.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\builder\BuilderPrimitives.tsx`
- Test: `npm run build`

- [ ] Add a shared `StudioShell` wrapper that composes a studio hero, context pills, main builder rail, and side rail without forcing each builder page to hand-roll the same layout.
- [ ] Add a `StudioModeToggle` that can switch between `Basic` and `Advanced`, or between strategy-style modes such as `Intent` and `Launch`.
- [ ] Add a `StudioReadinessCard` that accepts labeled readiness signals and missing-context rows so both Campaign Studio and Quest Studio can speak the same status language.
- [ ] Add a `StudioPreviewCard` that can host a campaign or quest preview surface with one consistent premium chrome.
- [ ] Extend `BuilderPrimitives.tsx` only where the current primitives are truly shared, and keep campaign-specific or quest-specific logic out of it.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 2: Add Campaign Studio helpers for intent, readiness, and mission map projection

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\campaign-studio.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignMissionMap.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignIntentStep.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignLaunchPreview.tsx`
- Test: `npm run build`

- [ ] Add a `campaign-studio.ts` helper that translates existing template outputs into intent labels, audience posture, missing-context summaries, and a lightweight mission map model.
- [ ] Build `CampaignIntentStep.tsx` so a project starts with goal and audience framing before dropping into flow details.
- [ ] Build `CampaignMissionMap.tsx` so the generated quest and reward architecture is visible as a structured rail instead of hidden in a long list.
- [ ] Build `CampaignLaunchPreview.tsx` so the builder clearly shows what gets created, what remains draft, and what still blocks launch quality.
- [ ] Keep all of this schema-light by projecting from existing template and draft state instead of inventing a new persistence layer.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Restructure `CampaignForm` into Campaign Studio v2

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignMissionMap.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignIntentStep.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\campaign\CampaignLaunchPreview.tsx`
- Test: `npm run build`

- [ ] Replace the current form-first posture in `CampaignForm.tsx` with a three-layer studio flow: `Intent`, `Flow`, and `Launch`.
- [ ] Keep the existing presets and template generation logic, but move them behind intent framing so the first user decision is strategic instead of schema-shaped.
- [ ] Bring project context autofill forward in the flow, and make missing context feel like a structured readiness issue rather than a hidden configuration trap.
- [ ] Add the mission map directly into the builder so generated quests and rewards are visible before final save.
- [ ] Move advanced campaign controls such as low-level reward posture and timing details into expandable advanced sections so the main path stays calm.
- [ ] Update `app/campaigns/new/page.tsx` to describe the route as `Campaign Studio`, not just `New Campaign`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Add Quest Studio helpers for blueprint grouping, preview, and verification explanation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\studio\quest-studio.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestMemberPreview.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestVerificationRail.tsx`
- Test: `npm run build`

- [ ] Add a `quest-studio.ts` helper that groups existing blueprints into cleaner mission families and maps quest state into a member preview model and readiness model.
- [ ] Build `QuestMemberPreview.tsx` so the quest card and CTA are shown in a member-facing posture instead of only in raw builder copy.
- [ ] Build `QuestVerificationRail.tsx` so verification explains itself in plain language: provider, proof path, auto/manual route, and missing config keys.
- [ ] Keep the helper layer purely derived from existing quest values and `getQuestVerificationPreview` so the upgrade stays focused on UX and clarity.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Restructure `QuestForm` into Quest Studio v2

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestForm.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestMemberPreview.tsx`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms\quest\QuestVerificationRail.tsx`
- Test: `npm run build`

- [ ] Keep the current step structure, but rename and rebalance the flow around `Blueprint`, `Destination`, `Verification`, `Reward`, `Preview`, and `Launch`.
- [ ] Make blueprint selection more central and more visual by grouping mechanics into mission families instead of leaving everything as a flat preset list.
- [ ] Split destination and CTA concerns from reward and launch concerns so the user can reason about the member action before low-level quest controls.
- [ ] Elevate verification into a hero section using `QuestVerificationRail.tsx`, and explain the route in plain language before exposing raw config JSON.
- [ ] Add a real member-facing preview card that stays visible through the builder and makes the quest feel like a product surface, not a back-office object.
- [ ] Push advanced knobs such as lower-frequency controls, payload tuning, and uncommon overrides into a basic/advanced toggle instead of front-loading them.
- [ ] Update `app/quests/new/page.tsx` to describe the route as `Quest Studio`, not just `New Quest`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 6: Sharpen project-first entry flows into the new studios

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
- Test: `npm run build`

- [ ] Update project overview quick actions so they speak in studio language and make the highest-value creation routes obvious.
- [ ] Update the project campaigns board so `New campaign` and `New quest` feel like the natural next actions from campaign operations, not hidden admin links.
- [ ] Tighten campaign detail handoffs so a project creating its first or next quest lands in the prefilled Quest Studio with no route knowledge required.
- [ ] Preserve `projectId` and `campaignId` through every entry path so the studios feel anchored and ready on arrival.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 7: Final polish, consistency pass, and rollout verification

**Files:**
- Review all changed studio and entry-flow files
- Test: `npm run build`

- [ ] Do one consistency pass across Campaign Studio and Quest Studio for header language, action placement, readiness copy, and preview rhythm.
- [ ] Ensure both studios use the same visual rules for context pills, side rails, segmented toggles, and bottom navigation.
- [ ] Check that advanced sections stay hidden by default and do not reintroduce the original long-form clutter.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Prepare rollout notes for the user that explain the new entry points, the renamed studio surfaces, and any behavior change around templates, readiness, or preview.

---

## Self-Review

### Spec coverage

Covered:

- intent-first Campaign Studio
- mission map
- context autofill
- launch preview
- mission-first Quest Studio
- stronger verification rail
- member-facing preview
- progressive disclosure
- project-first entry flows

Intentionally deferred:

- full `Raid Studio` redesign
- new persistence model for mission maps
- any member-facing webapp changes

### Placeholder scan

No `TBD`, `TODO`, or undefined implementation buckets remain. Each task names exact files and one verification command.

### Type consistency

Shared studio primitives live under `components/forms/studio`, Campaign Studio helpers under `lib/studio/campaign-studio.ts`, and Quest Studio helpers under `lib/studio/quest-studio.ts`. The task list keeps those names consistent throughout.

