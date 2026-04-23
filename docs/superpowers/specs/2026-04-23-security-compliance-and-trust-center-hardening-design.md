# Security, Compliance, And Trust-Center Hardening Design

Date: 2026-04-23
Status: Approved design
Scope: Shared security and compliance substrate with public trust surfaces, customer-facing security controls, and internal security/compliance operations

## 1. Goal

Build the first complete Veltrix security and compliance operating layer so the platform can be sold, reviewed, and operated with real trust posture instead of scattered auth settings, public-launch legal copy, and internal memory.

Phase 14 should make it possible to answer all of the following from one connected system:

- how Veltrix secures operator access
- how enterprise accounts can use live `SSO/SAML`
- how `2FA` is offered and enforced
- how sessions are reviewed and revoked
- how export and delete requests move through a real lifecycle
- how privacy, subprocessors, incident reporting, and backup posture are explained publicly
- how internal teams review security posture, incidents, evidence, and compliance readiness

## 2. Product Posture

Veltrix already has:

- account and onboarding rails
- billing and internal business control
- support and incident operations
- customer success and growth analytics
- existing audit logs, trust consoles, and workspace settings
- public `privacy` and `terms` pages

What is still missing is one security and compliance truth that connects:

- public trust posture
- customer-facing security controls
- enterprise identity requirements
- session and account risk review
- data lifecycle controls
- internal compliance and evidence posture

Phase 14 should not create disconnected security islands.

It should create one security substrate with three views:

- public trust center
- customer-facing portal security controls
- internal security and compliance control panel

## 3. Scope

### 3.1 In Scope

- public trust center
- hardening of `privacy` and `terms`
- public subprocessor surface
- customer-facing security settings
- `2FA` posture and enforcement controls
- session visibility and revocation
- enterprise `SSO/SAML` for `admin portal / workspace operators`
- export and delete request lifecycle
- internal security and compliance control panel
- security incidents and evidence posture
- backup, restore, and recovery posture tracking
- security reporting and DPA/contact routes
- audit-ready evidence posture for future `SOC 2 / ISO` readiness

### 3.2 Out Of Scope

- enterprise `SSO/SAML` for the member webapp
- full GRC platform replacement
- fully automated evidence collection across every provider
- legal certification completion inside this phase
- customer-visible raw incident internals
- deep device fingerprinting or invasive surveillance posture

## 4. Recommended Approach

### Option A: Compliance-first giant pass

Build everything at once with maximum policy, evidence, certification, and enterprise depth.

Pros:

- strongest paper posture
- ambitious

Cons:

- highest delivery risk
- too easy to sprawl into a pseudo-GRC platform

### Option B: One security substrate, three surfaces

Build one shared security and compliance layer that powers:

- public trust center
- portal security workspace
- internal security/compliance control panel

Pros:

- strongest architectural posture
- cleanest separation between public trust, customer control, and internal ops
- maps cleanly onto current Veltrix surfaces
- supports both enterprise credibility and practical operator control

Cons:

- broader than a pure settings-page pass

### Option C: Internal security ops first

Build only internal controls first, then add public and customer-facing posture later.

Pros:

- operationally safe
- narrower scope

Cons:

- too weak for enterprise review
- too little buyer-facing trust signal

### Recommendation

Build `Option B`.

This phase should produce one shared security operating layer with different read and control surfaces for:

- buyers and enterprise reviewers
- workspace admins and operators
- internal Veltrix security and compliance operators

## 5. Security System Model

Phase 14 should be structured as six connected truths.

### 5.1 Public Trust Truth

Track and present the customer-facing trust posture:

- authentication and access model
- `2FA` availability
- `SSO/SAML` availability
- privacy and data handling summary
- subprocessor list
- backup and recovery summary
- incident and security reporting route
- compliance and evidence posture summary

### 5.2 Customer Security Truth

Track what a real workspace operator can manage:

- personal `2FA` state
- account security posture
- active sessions
- session revocation
- export/delete request state
- account policy summary
- enterprise identity posture

### 5.3 Enterprise Identity Truth

Track the enterprise access model for workspace operators:

- `SSO/SAML` connection status
- verified domains
- allowed auth methods
- `SSO` requirement state
- `2FA` enforcement state

### 5.4 Data Lifecycle Truth

Track account and customer data lifecycle requests:

- export request state
- delete request state
- verification state
- review state
- completion state
- audit and notes trail

### 5.5 Internal Security And Compliance Truth

Track what internal operators need to run calmly:

- weak-posture accounts
- enterprise security policy posture
- request queues
- control review status
- evidence notes
- backup and restore readiness
- incident readiness and drill posture

### 5.6 Security Incident Truth

Track internal security incidents as real operational objects:

- incident status
- owner
- scope
- timeline
- customer impact
- containment
- postmortem and follow-up posture

## 6. Controls And Policy Model

### 6.1 Authentication Baseline

Veltrix should continue to support:

- password and email authentication as the baseline
- current account verification and recovery rails

Phase 14 adds:

- `2FA optional` for everyone
- `2FA enforceable` per enterprise account
- `2FA` enforcement in v1 for `owner` and `admin`
- live `SSO/SAML` for `admin portal / workspace operators`

### 6.2 Session Controls

Veltrix should expose:

- active sessions
- last seen activity
- browser/device summary where available
- approximate network or location summary where appropriate
- revoke session control

Internal posture should additionally support:

- suspicious session review
- re-auth or recovery review
- audit trail of session revocations and security events

### 6.3 Account Security Policies

Each enterprise account should support a policy layer with at least:

- `sso_required`
- `two_factor_required_for_admins`
- `allowed_auth_methods`
- `session_review_required`
- `high_risk_reauth_required`

### 6.4 Data Request Lifecycle

Veltrix should support:

- export requests
- delete requests
- internal review and verification
- customer-visible status where appropriate

Lifecycle states:

- `submitted`
- `in_review`
- `awaiting_verification`
- `approved`
- `rejected`
- `completed`

### 6.5 Security Incident States

Internal security incident states should include:

- `open`
- `triaging`
- `contained`
- `monitoring`
- `resolved`
- `postmortem_due`

## 7. Surface And Route Model

### 7.1 Public Trust Center

Public routes:

- `/trust`
- `/privacy`
- `/terms`
- `/subprocessors`

The trust center should explain:

- authentication model
- `2FA` posture
- enterprise `SSO/SAML`
- privacy and data lifecycle summary
- subprocessor posture
- incident/security reporting path
- backup and restore summary
- compliance and evidence posture

### 7.2 Customer-Facing Security Workspace

Portal routes:

- `/settings/security`
- optional `/account/security`

This surface should let workspace operators:

- review personal security posture
- see `2FA` state
- review and revoke sessions
- understand enterprise security policy
- understand `SSO/SAML` status
- submit and track export/delete requests

### 7.3 Internal Security And Compliance Panel

Internal routes:

- `/security`
- `/security/accounts/[id]`
- `/security/incidents/[id]` if incident volume later justifies a dedicated detail route

This surface should let internal Veltrix operators:

- see weak-posture accounts
- review enterprise security policy posture
- work export/delete queues
- review suspicious sessions and recovery events
- review evidence posture and control status
- track backup, restore, and incident readiness

## 8. Data Model

Phase 14 should introduce the following core entities.

### 8.1 Account Security Posture

- `customer_account_security_policies`
- `customer_account_security_events`
- `user_security_posture`

These entities should store:

- enterprise policy posture
- `2FA` and auth requirement state
- user-level security posture
- audit trail of security changes and reviews

### 8.2 Sessions And Access Review

- `auth_sessions`
- `auth_session_events`

These entities should store:

- active and revoked sessions
- last activity
- device/network summary
- suspicious markers
- revocation trail

### 8.3 Data Lifecycle

- `data_access_requests`
- `data_access_request_events`

These entities should store:

- export and delete request type
- status
- verification and review trail
- completion timestamps
- internal notes

### 8.4 Compliance And Trust Ops

- `compliance_controls`
- `compliance_evidence_items`
- `security_incidents`
- `security_incident_events`
- `subprocessors`

These entities should store:

- control catalog and review state
- evidence notes and links
- incident ownership and timeline
- public subprocessor truth

### 8.5 Enterprise Identity

- `customer_account_sso_connections`
- `customer_account_sso_domains`

These entities should store:

- `SAML/SSO` provider config summary
- status
- verified domains
- metadata
- enable and disable posture

## 9. Ownership Model

### 9.1 `veltrix-web`

Owns:

- public trust center
- public `privacy`
- public `terms`
- public `subprocessors`

### 9.2 `admin-portal`

Owns:

- customer-facing security workspace
- internal security and compliance control panel
- enterprise policy and `SSO/SAML` management
- request queues and review surfaces

### 9.3 Shared Postgres

Owns:

- security posture truth
- sessions and request lifecycle truth
- compliance and evidence truth
- incident truth

## 10. Build Order

### 10.1 Security Foundation

- SQL migration
- entity and contract layer
- policy model
- session model
- data request model
- compliance and evidence model
- `SSO/SAML` connection model

### 10.2 Customer-Facing Security Controls

- `/settings/security`
- `2FA` state
- sessions
- revoke session
- request submission and status
- enterprise policy summary

### 10.3 Internal Security And Compliance Panel

- `/security`
- `/security/accounts/[id]`
- weak-posture queue
- export/delete queue
- incident and evidence summary

### 10.4 Public Trust Center

- `/trust`
- hardened `privacy`
- hardened `terms`
- `/subprocessors`
- DPA and security reporting posture

### 10.5 Enterprise `SSO/SAML`

- SSO config surface
- verified domains
- enable and disable posture
- live enforcement for portal/workspace operators
- interaction with `2FA` and account policy

### 10.6 Compliance Hardening

- backup and recovery posture
- restore drill tracking
- incident drill posture
- control review cadence
- evidence trail

### 10.7 Rollout And Verification

- migration review
- deploys
- `2FA` tests
- `SSO/SAML` tests
- session revoke tests
- export/delete request tests
- trust center content review
- security incident tabletop and runbook pass

## 11. Risks And Mitigations

### 11.1 Scope Sprawl

Risk:

- security and compliance can expand into an endless platform rewrite

Mitigation:

- keep member webapp `SSO` out of scope
- keep v1 focused on operator security and trust posture

### 11.2 Enterprise Identity Complexity

Risk:

- `SSO/SAML` can create rollout and support complexity

Mitigation:

- limit v1 to portal/workspace operators
- keep policy model explicit and auditable

### 11.3 Compliance Theater

Risk:

- public trust content becomes vague enterprise language without operational truth

Mitigation:

- every public claim should map to a real internal control, surface, or runbook

## 12. Definition Of Done

Phase 14 is only complete when:

- Veltrix has a public trust center that explains security and data posture honestly
- `privacy` and `terms` are hardened into true customer-ready operating documents
- a public subprocessor surface exists
- workspace operators can manage their security posture in the portal
- `2FA` is optional globally and enforceable for enterprise `owner/admin`
- enterprise accounts can use live `SSO/SAML` for portal/workspace access
- sessions are visible and revocable
- export/delete requests move through a real lifecycle
- internal teams can operate a real `/security` control panel
- compliance, evidence, backup, restore, and incident posture are visible enough to support real buyer and audit review
