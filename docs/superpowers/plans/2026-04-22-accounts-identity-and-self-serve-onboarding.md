# Accounts, Identity, And Self-Serve Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a real customer move from public interest to verified account, active workspace, invited team, first project, and first launch-ready next step without internal backstage setup.

**Architecture:** Add a customer-account layer above the existing project-first product. The database will own customer accounts, memberships, invites, onboarding state, and account audit events; `veltrix-web` will host public entry, auth, verification, and first-run account entry; `admin-portal` will become the authenticated account workspace where owners create projects, invite teammates, assign roles, and move into the launch workspace. The existing project-first product remains the operational core, but account identity and onboarding become the safe wrapper around it.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, Supabase Auth, `veltrix-web`, `admin-portal`, public docs and support routes, existing project launch workspace, existing platform-core access helpers, and existing public-site copy/system language.

---

## Scope framing

This phase is not "add signup."

It is the full entry system for a public product:

- public `Start now`
- email/password or equivalent account creation
- verification and recovery posture
- first customer workspace
- first owner bootstrapping
- team invites
- role assignment
- first-run onboarding into project creation and launch setup

The result should be:

- a founder can create an account
- land in a clean first-run space
- create the first workspace and project
- invite teammates
- and move directly into the launch/product spine

without requiring internal manual setup.

## Out of scope for this phase

These are intentionally **not** part of this tranche:

- billing and subscription enforcement
- CRM and sales tracking
- enterprise SSO/SAML
- multi-workspace billing logic
- advanced support queueing
- deep customer-success operations

Those belong to later roadmap phases.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_accounts_identity_onboarding.sql`
  - customer account, membership, invite, onboarding-progress, and account-audit tables plus supporting indexes and policies

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\start\page.tsx`
  - public `Start now` entrypoint that frames signup and first-run posture clearly
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\sign-up\page.tsx`
  - dedicated account-creation route instead of relying only on sign-in fallback language
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\verify\page.tsx`
  - email verification result and next-step route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\recover\page.tsx`
  - password reset / recovery route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
  - authenticated handoff page that routes a freshly verified user into account setup or existing workspace entry
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\sign-up-screen.tsx`
  - public product-quality signup surface
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\verification-status-card.tsx`
  - account verification result UI with safe next actions
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\account-recovery-screen.tsx`
  - reset and account-recovery flow UI
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
  - routes users to create a workspace, accept an invite, or enter an existing one
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\account\public-auth.ts`
  - shared public-side auth helpers and safe redirects

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-auth.ts`
  - shared customer-account access helper for owner/member/invite acceptance flows
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-onboarding.ts`
  - derives first-run state, next actions, and onboarding completion progress
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-invites.ts`
  - invite creation, acceptance, expiry, and membership conversion helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-events.ts`
  - account audit and onboarding event write helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\bootstrap\route.ts`
  - creates the first customer account/workspace and owner membership for a verified user
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\current\route.ts`
  - returns current account membership and onboarding posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\[id]\invites\route.ts`
  - owner-managed invite creation and invite listing
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\accept-invite\route.ts`
  - converts a valid invite into a membership safely
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\[id]\projects\bootstrap\route.ts`
  - creates the first project and initial setup metadata from onboarding
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\getting-started\page.tsx`
  - authenticated account setup workspace for first-run portal onboarding
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
  - account overview with membership, workspace posture, and first-run completion state
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\team\page.tsx`
  - invite and team management surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountBootstrapCard.tsx`
  - first account/workspace creation surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountOnboardingChecklist.tsx`
  - checklist for workspace creation, first project, team invite, and launch handoff
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountInvitePanel.tsx`
  - invite list, role selection, resend/revoke posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountEntryGuard.tsx`
  - routes signed-in users to setup, invite acceptance, or portal entry
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
  - customer-account types, membership roles, invite status, onboarding state

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
  - stronger `Start now` handoff into signup and getting-started
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\sign-in-screen.tsx`
  - add clean routes into signup, recovery, and post-auth handoff
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\shared\protected-state.tsx`
  - support account bootstrap and invite-acceptance redirects
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\supabase\server.ts`
  - expose any auth/session helpers needed for verification and entry routing

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
  - add account/workspace identity posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
  - route first-run users into `Getting Started` instead of a full product nav immediately
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
  - include account and onboarding surfaces
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
  - handle zero-project posture more intentionally when an account exists but has not created a first project yet
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
  - accept first-run onboarding handoff from the new account setup layer

### Verification targets

- `C:\Users\jordi\OneDrive\Documenten\New project`
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run build`
- manual migration review in Supabase SQL editor for `veltrix_accounts_identity_onboarding.sql`

---

## Task 1: Add the account and onboarding schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_accounts_identity_onboarding.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`

- [ ] Add a `customer_accounts` table that represents the workspace or company-level account above projects.
- [ ] Add `customer_account_memberships` with explicit roles such as `owner`, `admin`, `member`, and `viewer`.
- [ ] Add `customer_account_invites` with invite token, email, intended role, inviter, expiry, and acceptance state.
- [ ] Add `customer_account_onboarding` or equivalent progress state so the product can derive first-run posture without guessing.
- [ ] Add `customer_account_events` for audit-grade records like account created, invite sent, invite accepted, first project created, and onboarding completed.
- [ ] Add indexes and safe constraints for uniqueness, invite expiry, and membership role checks.
- [ ] Review whether existing `projects` should reference `customer_accounts` directly and add that foreign key cleanly.

## Task 2: Build public auth entry, signup, verification, and recovery

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\start\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\sign-up\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\verify\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\recover\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\sign-up-screen.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\verification-status-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\account-recovery-screen.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\auth\sign-in-screen.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`

- [ ] Build a clean public `Start now` route that routes serious users into account creation instead of dropping them into ambiguous auth UI.
- [ ] Add a dedicated signup surface with clear product language and no portal-style admin framing.
- [ ] Add verification-result UX that explains whether the account can continue, resend verification, or recover from a stale link.
- [ ] Add password/account recovery posture so public signup is safe enough for real customers.
- [ ] Align sign-in and signup routes so the user always knows whether they are entering an existing account, creating a new one, or accepting an invite.
- [ ] Keep public auth copy consistent with the launch site and docs voice.

## Task 3: Build account bootstrap and first-run entry routing

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\bootstrap\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\current\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-auth.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-events.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\shared\protected-state.tsx`

- [ ] Build a post-auth router that decides whether the user should:
  - create a new account/workspace
  - accept an existing invite
  - or enter an already active workspace
- [ ] Add an account bootstrap route that creates the first `customer_account` and owner membership for a verified user.
- [ ] Write the initial account events so the first-run path is auditable and later customer-success flows can use it.
- [ ] Keep bootstrap idempotent so page refreshes and duplicate clicks do not create duplicate accounts.
- [ ] Make sure a user without an account is never dumped into the full portal nav by accident.

## Task 4: Build the portal getting-started workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\getting-started\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountBootstrapCard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountOnboardingChecklist.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountEntryGuard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-onboarding.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`

- [ ] Build a first-run portal workspace that feels like the account-level equivalent of the launch workspace.
- [ ] Add checklist items for:
  - account created
  - first workspace active
  - first project created
  - first invite sent
  - launch workspace opened
- [ ] Add a guard that routes incomplete users into `Getting Started` before they see the full portal information architecture.
- [ ] Keep this page calm and operational, not like a sales wizard or settings dump.
- [ ] Make the final handoff from account setup into project launch extremely obvious.

## Task 5: Build workspace and first-project bootstrap flows

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\[id]\projects\bootstrap\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`

- [ ] Add a first-project bootstrap route that creates the initial project from account onboarding context safely.
- [ ] Add a strong zero-project state so the product explains what a project is and why the user should create one now.
- [ ] Route successful first-project creation directly into launch workspace or project overview based on onboarding posture.
- [ ] Keep the bootstrap payload intentionally small: name, category, maybe community focus, but not every project setting up front.
- [ ] Make sure existing project users skip this flow cleanly.

## Task 6: Build team invites, membership conversion, and account team management

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\[id]\invites\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\accounts\accept-invite\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\team\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\accounts\AccountInvitePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\accounts\account-invites.ts`

- [ ] Add invite creation with explicit intended role and expiration state.
- [ ] Add invite acceptance flow that safely converts a valid invite into a workspace membership.
- [ ] Add resend, revoke, expired, and already-accepted posture.
- [ ] Build a team page where owners can see current members, pending invites, and role posture.
- [ ] Keep role language simple in this phase: workspace roles only, not deep project or console grants yet.

## Task 7: Add account overview, header identity, and entry consistency

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`

- [ ] Add an account overview page that shows workspace identity, membership role, onboarding state, and next actions.
- [ ] Surface workspace identity in the header so the user knows which account context they are operating inside.
- [ ] Make sidebar entry logic account-aware so users in first-run posture see a cleaner path than mature operators.
- [ ] Keep account posture visually aligned with the portal quality level already established.

## Task 8: Verification, redirects, and rollout quality pass

**Files:**
- Review all changed account/auth/onboarding files
- Review: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_accounts_identity_onboarding.sql`

- [ ] Run `npm run typecheck --workspace veltrix-web` in `C:\Users\jordi\OneDrive\Documenten\New project`.
- [ ] Run `npm run build --workspace veltrix-web -- --webpack` in `C:\Users\jordi\OneDrive\Documenten\New project`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Manually test these route stories:
  - public site -> start now -> signup
  - signup -> verify -> getting started
  - getting started -> create account -> create first project
  - owner -> invite teammate
  - invitee -> accept invite -> workspace entry
- [ ] Write rollout notes covering required Supabase auth config, redirect URLs, email template links, and post-deploy smoke checks.

---

## Self-Review

### Roadmap coverage

Covered:

- public start-now entry
- signup, verification, and recovery
- customer account and workspace model
- first owner bootstrap
- team invites and membership conversion
- first-run portal onboarding
- first project bootstrap
- clean routing into launch workspace

Intentionally deferred:

- billing gates and entitlements
- customer success ownership
- advanced support posture
- enterprise auth
- multi-workspace billing or CRM operations

### Placeholder scan

No `TODO`, `TBD`, or vague "finish later" placeholders remain in the plan. Every task points at concrete files and one specific system outcome.

### Scope check

This phase is large but coherent because it all revolves around one outcome:

- a new user becomes a verified owner inside a real workspace and reaches the project-first product spine cleanly

The internal order is stable:

1. schema
2. public auth entry
3. bootstrap routing
4. getting started workspace
5. first project
6. team invites
7. account identity surfaces
8. verification and rollout

That keeps the phase focused enough to execute without mixing in later billing or customer-success concerns.
