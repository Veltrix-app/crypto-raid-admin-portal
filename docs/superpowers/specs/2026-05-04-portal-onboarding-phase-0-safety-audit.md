# Portal Onboarding Phase 0 Safety Audit

**Date:** 2026-05-04
**Repo:** `D:\VYNTRO\crypto-raid-admin-portal`
**Goal:** Confirm the portal onboarding UI work can move toward a more premium, project-owner-friendly experience without breaking existing backend, database, API, or auth flows.

## Scope

Phase 0 is a safety and product-flow audit. It should not introduce behavior changes by itself.

The Phase 1 UI work currently in the worktree touches:

- `app/projects/new/page.tsx`
- `app/projects/[id]/launch/page.tsx`
- `app/getting-started/page.tsx`
- `components/forms/project/ProjectForm.tsx`
- `components/projects/launch/ProjectLaunchChecklist.tsx`
- `components/projects/launch/ProjectLaunchRail.tsx`
- `components/projects/launch/ProjectNextActions.tsx`
- `components/projects/onboarding/ProjectOnboardingPrimitives.tsx`

No backend route, Supabase client, store action, database migration, entity type, or API handler was changed by the Phase 1 UI work.

## Contract Findings

### Project creation

`app/projects/new/page.tsx` still calls `createProject(values)` for super admins. The value object is still the same `Omit<AdminProject, "id">` emitted by `ProjectForm`.

`store/ui/useAdminPortalStore.ts` still maps `createProject` into the existing `projects` insert payload:

- `name`, `slug`
- `chain`, `category`
- `status`, `onboarding_status`
- `description`, `long_description`
- `members`, `campaigns`
- `logo`, `banner_url`
- `website`, `x_url`, `telegram_url`, `discord_url`
- `docs_url`, `waitlist_url`, `launch_post_url`
- `token_contract_address`, `nft_contract_address`, `primary_wallet`
- `brand_accent`, `brand_mood`
- `contact_email`
- `is_featured`, `is_public`

**Impact:** Backend contract is unchanged.

**Intentional UX flow change:** after direct super-admin creation, the user is routed to `/projects/{id}/launch?source=project_create` instead of `/projects/{id}`. This is frontend routing only.

**Risk:** If launch readiness fails for a just-created project in a real Supabase session, the operator lands on an error state instead of the overview.

**Guardrail:** Before shipping a larger onboarding phase, verify direct project creation against a real/staging Supabase environment and confirm `/projects/{id}/launch` loads for a brand-new project with zero campaigns, quests, raids, rewards, wallets, and integrations.

**Redirect decision:** keep the Launch redirect for super-admin project creation. `assertProjectAccess` explicitly allows active `super_admin` users, and the launch-readiness snapshot handles empty project content as blockers/next actions instead of requiring pre-existing campaigns, quests, raids, rewards, wallets, or integrations.

### Onboarding request submission

`app/projects/new/page.tsx` still calls `createOnboardingRequest` for non-super-admin users with the same field mapping:

- `projectName`
- `chain`
- `category`
- `website`
- `contactEmail`
- `shortDescription`
- `longDescription`
- `logo`
- `bannerUrl`
- `xUrl`
- `telegramUrl`
- `discordUrl`
- `requestedPlanId`

`store/ui/useAdminPortalStore.ts` still inserts into `project_onboarding_requests` with `status: "submitted"`.

**Impact:** Backend contract is unchanged.

### Project form payload

`components/forms/project/ProjectForm.tsx` still accepts:

- `initialValues?: Omit<AdminProject, "id">`
- `onSubmit: (values: Omit<AdminProject, "id">) => void`

The form still calls `onSubmit(values)` on submit. The Phase 1 work changed labels, readiness copy, visual priority pills, and an optional `layout` variant.

**Impact:** Form data shape is unchanged.

### Launch workspace

`app/projects/[id]/launch/page.tsx` still loads readiness through the existing endpoint:

- `GET /api/projects/{id}/launch-readiness`

The route still calls `loadProjectLaunchWorkspaceSnapshot(projectId)`, which still reads existing project facts from:

- `projects`
- `project_integrations`
- `project_wallets`
- `project_assets`
- `campaigns`
- `quests`
- `raids`
- `rewards`
- platform operation audits, incidents, and overrides

The existing account-onboarding completion write is still guarded by:

- `source === "account_onboarding"`
- `onboardingAccountId`
- `onboardingCurrentStep === "open_launch_workspace"`

The new `source=project_create` route value does not trigger that write.

**Impact:** API contract and account-onboarding write guard are unchanged.

### Getting started

`app/getting-started/page.tsx` still depends on the existing `useAccountEntryGuard` state and `fetchCurrentPortalAccountActivation`.

The Phase 1 work changed the onboarding presentation and step language only.

**Impact:** Account state contract is unchanged.

### New onboarding primitives

`components/projects/onboarding/ProjectOnboardingPrimitives.tsx` is a client-side presentational component module.

It imports:

- `next/link`
- `lucide-react`
- `ReactNode`
- `cn`

It does not import Supabase, stores, fetch, router, entity mutations, or API helpers.

**Impact:** No backend or data contract impact.

## Phase 0 Guardrails For Phase 2

1. Keep all project onboarding UI changes additive and presentational unless a backend contract is explicitly planned first.
2. Do not rename or remove fields from `AdminProject`, `createProject`, `createOnboardingRequest`, or `project_onboarding_requests`.
3. Keep route prefill behavior based on existing query params such as `projectId`, `campaignId`, and `source`; avoid adding required params to existing builders.
4. Any live token price, swap registry, AI contract scan, or Showcase Studio control must be introduced behind an additive API boundary with a fallback empty state.
5. Before production deploy, verify project creation and launch readiness in an environment with Supabase env vars configured.

## Current Correction

The user is correct: Phase 0 should have been explicit before Phase 1. The safe correction is to pause further Phase 2 work, document this audit, and only continue after the touched UI flow is verified against the existing contracts.

## Verification Performed

Fresh verification run on 2026-05-04:

- `git diff --check` passed.
- `npm.cmd run lint` passed with 0 errors and 213 existing warnings.
- `npm.cmd run build` passed with 0 errors and existing warnings.
- Local HTTP smoke checks passed for `http://localhost:3000/getting-started` and `http://localhost:3000/projects/new`.
- Local fake-project Launch URL returned 404 as expected because the project id does not exist.

Manual browser QA still needs an environment with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Local unauthenticated browser QA cannot fully validate these routes without those public Supabase env vars.
