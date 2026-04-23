# Security, Compliance, And Trust-Center Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Veltrix security and compliance operating layer: a public trust center, real customer-facing security controls in the portal, an internal `/security` control panel for Veltrix operators, live enterprise `SSO/SAML` for portal/workspace operators, enforceable `2FA` policy for enterprise `owner/admin`, session review and revocation, export/delete lifecycle handling, and a concrete compliance/evidence posture that supports buyer review and future audit readiness.

**Architecture:** Keep Phase 14 as one shared security substrate with three views. `veltrix-web` owns the public trust center, hardened `privacy` and `terms`, and the public subprocessor surface. `admin-portal` owns `/settings/security`, account-facing security posture, enterprise identity controls, data request tracking, and the internal `/security` control panel. Supabase/Postgres stores enterprise security policies, user security posture, auth sessions and session events, data access requests, compliance controls, evidence items, security incidents, and subprocessor truth. Existing audit logs remain part of the evidence trail instead of being replaced.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-web`, existing account/billing/support/success/analytics phases, public docs/legal surfaces, existing trust and audit rails, Vercel, current auth provider integration, and `docs/superpowers` rollout notes.

---

## Scope framing

This is the concrete Phase 14 build tranche for:

- public trust posture
- customer-facing workspace and account security controls
- internal security and compliance operations
- enterprise identity posture
- data lifecycle requests
- compliance and evidence readiness

This plan intentionally combines:

- public buyer trust surfaces
- real operator-facing security controls
- internal security/compliance operations

because these all depend on the same policy and security truth.

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 14: Security, Compliance, And Trust-Center Hardening`

from:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-22-business-systems-and-commercialization-roadmap.md`

It should be executed after:

- Phase 9 account and onboarding
- Phase 10 billing and business control
- Phase 11 support and incident operations
- Phase 12 customer success
- Phase 13 analytics

so security posture can be account-aware, billing-aware, support-aware, and buyer-visible instead of becoming a disconnected compliance appendix.

## Working assumptions

- Public trust surfaces live in `veltrix-web`, not inside the portal.
- Customer-facing security controls live primarily in `admin-portal`.
- Internal security and compliance operations are Veltrix-only and visible only to internal admins.
- Enterprise `SSO/SAML` is in scope only for `admin portal / workspace operators`.
- The member webapp stays on the existing flexible identity posture in this phase.
- `2FA` remains optional globally, but is enforceable per enterprise account.
- In v1, enterprise `2FA` enforcement applies to `owner` and `admin`.
- Existing audit logs stay valuable and should be linked into evidence posture instead of duplicated.
- Export/delete requests should move through a real reviewed lifecycle, not a mailto process.
- The public trust center should only claim controls that genuinely exist in the product or internal ops posture.

## Out of scope for this tranche

- enterprise `SSO/SAML` for the member webapp
- a full GRC platform replacement
- deep device fingerprinting
- fully automated evidence harvesting across every provider
- legal certification completion inside this phase
- public exposure of internal security incident internals
- fine-grained per-role `2FA` policy beyond the v1 `owner/admin` enforcement target

---

## Product contract for v1

### Public trust surfaces

- `/trust`
  - security overview
  - auth and access posture
  - `2FA` summary
  - `Enterprise SSO/SAML` summary
  - incident/security reporting route
  - backup/recovery summary
  - compliance and evidence posture
- `/privacy`
  - hardened privacy and data handling language
- `/terms`
  - hardened legal and acceptable use posture
- `/subprocessors`
  - public subprocessor source of truth

### Customer-facing portal surfaces

- `/settings/security`
  - personal security posture
  - `2FA` state
  - active sessions
  - revoke session
  - export/delete request entry and status
  - enterprise policy summary
- optional account-aware security summary inside `/account`

### Internal Veltrix surfaces

- `/security`
  - security overview
  - weak-posture accounts
  - enterprise policy posture
  - request queues
  - compliance controls and evidence summary
  - security incident readiness
- `/security/accounts/[id]`
  - account security drilldown
  - policy state
  - user posture
  - request history
  - event trail
  - enterprise identity state
  - compliance notes and evidence links

### Security and lifecycle states in v1

- security incidents:
  - `open`
  - `triaging`
  - `contained`
  - `monitoring`
  - `resolved`
  - `postmortem_due`
- data requests:
  - `submitted`
  - `in_review`
  - `awaiting_verification`
  - `approved`
  - `rejected`
  - `completed`

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_security_compliance_and_trust_center_hardening_v1.sql`
  - enterprise security policies, user posture, sessions, data requests, compliance controls, evidence items, security incidents, SSO connections, and subprocessors

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\security\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\accounts\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\account\current\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\requests\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\policies\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\sessions\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\sessions\[id]\revoke\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityOverviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityQueueTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityAccountDetail.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecuritySettingsCard.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SessionReviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\DataRequestPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\ComplianceControlsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SsoConfigurationPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-overview.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-actions.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-policies.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\session-review.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\data-requests.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\compliance-posture.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\sso-connections.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\security.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\auth\session.ts`

### New webapp/public files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\trust\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\subprocessors\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\trust\subprocessors\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\trust-center-shell.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\subprocessor-table.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\trust\public-trust.ts`

### Modified webapp/public files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\privacy\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\terms\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\launch\public-site-content.ts`

---

## Task 1: Add security, compliance, and trust schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_security_compliance_and_trust_center_hardening_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\security.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `customer_account_security_policies` with `sso_required`, `two_factor_required_for_admins`, `allowed_auth_methods`, and review metadata.
- [ ] Create `customer_account_security_events` for policy changes, review actions, and security posture changes.
- [ ] Create `user_security_posture` for per-user `2FA` state, recovery posture, risk posture, and enforcement state.
- [ ] Create `auth_sessions` and `auth_session_events` for active session visibility, revocation, and suspicious markers.
- [ ] Create `data_access_requests` and `data_access_request_events` for export/delete lifecycle.
- [ ] Create `compliance_controls` and `compliance_evidence_items` for control review and evidence notes.
- [ ] Create `security_incidents` and `security_incident_events` for internal security ops posture.
- [ ] Create `customer_account_sso_connections` and `customer_account_sso_domains` for enterprise identity posture.
- [ ] Create `subprocessors` as the public source of truth for trust-center disclosures.
- [ ] Add indexes for:
  - account policy posture
  - `2FA` enforcement state
  - session status
  - data request status
  - incident status
  - control review status
  - SSO connection status

## Task 2: Define the policy, auth, and lifecycle contract

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-contract.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-security-language-and-review-posture.md`

- [ ] Define customer-facing security language for:
  - `2FA`
  - `SSO/SAML`
  - session review
  - export/delete requests
  - security reporting
- [ ] Define internal policy states and enforcement semantics for enterprise accounts.
- [ ] Define request lifecycle behavior for export/delete review and completion.
- [ ] Define public trust-center copy posture so claims stay honest and tied to real controls.
- [ ] Define internal evidence posture for control reviews, backups, restore drills, and incident readiness.

## Task 3: Build customer-facing portal security controls

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\security\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\account\current\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\sessions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\sessions\[id]\revoke\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecuritySettingsCard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SessionReviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\DataRequestPanel.tsx`

- [ ] Add a real `/settings/security` route to workspace settings.
- [ ] Show personal security posture with `2FA`, session visibility, and enterprise policy summary.
- [ ] Show active sessions with revoke controls.
- [ ] Allow export/delete request submission and status tracking.
- [ ] Show security reporting and support path without pushing users into raw legal text.
- [ ] Keep the surface action-oriented, not only informational.

## Task 4: Build the internal security and compliance control panel

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\accounts\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\requests\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\security\accounts\[id]\policies\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityOverviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityQueueTable.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SecurityAccountDetail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\ComplianceControlsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-overview.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-actions.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\compliance-posture.ts`

- [ ] Build `/security` as the internal Veltrix control panel.
- [ ] Show weak-posture accounts, enterprise-policy accounts, pending data requests, and readiness snapshots.
- [ ] Add `/security/accounts/[id]` drilldown with policy, request history, session posture, SSO state, and compliance notes.
- [ ] Make the internal panel visible only to Veltrix admins.
- [ ] Expose compliance controls and evidence summaries without turning the UI into a full GRC product.

## Task 5: Build the public trust center and harden public policy surfaces

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\trust\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\subprocessors\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\trust\subprocessors\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\trust-center-shell.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\subprocessor-table.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\trust\public-trust.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\privacy\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\terms\page.tsx`

- [ ] Add public `/trust` as a real buyer and security-review surface.
- [ ] Add public `/subprocessors` backed by the database source of truth.
- [ ] Harden `privacy` and `terms` so they move beyond public-launch summary copy.
- [ ] Add clear security-reporting and DPA/contact paths.
- [ ] Keep trust-center claims aligned with real controls and internal posture.

## Task 6: Build enterprise `SSO/SAML` and enforceable `2FA` policy

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\security\SsoConfigurationPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\security-policies.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\security\sso-connections.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\auth\session.ts`
- Modify: any current auth gate files required to enforce enterprise policy at portal/workspace entry

- [ ] Add enterprise SSO connection state and verified-domain posture.
- [ ] Add portal surfaces to configure or review `SSO/SAML` state.
- [ ] Enforce enterprise `SSO` for portal/workspace operators where configured.
- [ ] Enforce `2FA` in v1 for `owner/admin` on enterprise accounts where configured.
- [ ] Keep member webapp auth out of the enforcement path for this phase.
- [ ] Record policy and auth changes in audit/security events.

## Task 7: Add compliance, backup, and incident readiness posture

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase14-rollout-notes.md`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\trust\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\security\page.tsx`

- [ ] Add internal posture for backup review, restore drill tracking, and incident drill status.
- [ ] Add control-review cadence and evidence-note posture.
- [ ] Add internal security-incident summary states and readiness cues.
- [ ] Surface only the right public summary in the trust center, not the full internal detail.

## Task 8: Rollout and verification

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase14-rollout-notes.md`

- [ ] Run the security/compliance migration in Supabase.
- [ ] Deploy `veltrix-web`.
- [ ] Deploy `admin-portal`.
- [ ] Verify `/trust`, `/privacy`, `/terms`, and `/subprocessors`.
- [ ] Verify `/settings/security` and internal `/security`.
- [ ] Test session visibility and revoke.
- [ ] Test export/delete request submission and state transitions.
- [ ] Test enterprise `2FA` policy behavior for `owner/admin`.
- [ ] Test enterprise `SSO/SAML` flow on portal/workspace operator access.
- [ ] Review public copy for trust-center honesty and internal consistency.
- [ ] Run a tabletop pass for security incident and restore posture.

---

## Definition of done for this tranche

- [ ] Veltrix has a public trust center that is credible, public, and non-placeholder.
- [ ] `privacy` and `terms` are hardened into real operating documents.
- [ ] Public subprocessors are visible from a true source of truth.
- [ ] Workspace operators can manage their security posture from `/settings/security`.
- [ ] Active sessions are visible and revocable.
- [ ] Export/delete requests move through a real lifecycle.
- [ ] Internal Veltrix admins can run a real `/security` control panel.
- [ ] Enterprise accounts can use live `SSO/SAML` for portal/workspace operator access.
- [ ] Enterprise policy can enforce `2FA` for `owner/admin`.
- [ ] Compliance, evidence, backup, restore, and incident posture are visible enough to support real buyer review and future audit readiness.
