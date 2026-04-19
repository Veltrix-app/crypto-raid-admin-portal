# Community OS V5 Design

**Date:** 2026-04-19  
**Product Surface:** `admin-portal` + `veltrix-web` + `veltrix-community-bot`  
**Primary Route:** `/projects/[id]/community`

## Goal

Turn Community OS from a project-private execution engine into a true **dual-track community operating system** that serves:

- project owners
- project captains
- project members

V5 should make Veltrix feel indispensable because it no longer only helps teams run community actions. It should also give members a clear, personal community journey in the webapp and let captains operate daily from a real workspace.

The core product promise becomes:

> Veltrix helps owners steer the community, captains operate the community, and members progress through the community.

## Product Positioning

Community OS V5 is not:

- a member CRM inside the portal
- a larger collection of portal settings
- a generic quest dashboard with extra community metrics

It is:

- a project-private operations layer for owners
- a project-private execution workspace for captains
- a member-facing journey layer in the webapp
- a bot-assisted activation system that drives members back into the webapp

The moat is created by combining:

- execution hardening
- captain-led community operations
- personalized member journeys
- visible conversion and retention outcomes

## Core Shift

V4 focused on durable execution:

- automations
- playbooks
- captain permissions
- funnels
- execution history

V5 must connect that execution layer to the actual people in the system without turning the portal into a CRM.

That means:

- owners should see what the community machine is doing and whether it works
- captains should know what to do next and what they are allowed to do
- members should land in a clear next-step journey inside the webapp

This is the tranche where Community OS becomes both:

- **launch-proof**
- **selling-point strong**

## Surface Split

V5 uses three connected surfaces with clear boundaries.

### Portal: Owner and Captain Operating System

The portal remains the project-private operations layer.

It should contain:

- owner overview
- captain workspace
- automation center
- playbooks
- funnel performance
- activation insights
- execution and outcome history

It should not become a member management console. Projects should not browse a general community member directory as a primary workflow.

The portal may show:

- aggregate cohort counts
- aggregate readiness
- aggregate conversion
- aggregate retention
- aggregate trust posture

It should avoid:

- broad member CRM screens
- detailed member-by-member management as a core daily surface

### Webapp: Member Journey Layer

The webapp becomes the member-facing community surface.

It should contain:

- Community Home
- onboarding rail
- comeback rail
- next best action
- personal status
- recognition
- streaks
- next unlock
- community mission lane

The webapp is where members understand:

- where they stand
- what their next step is
- why it matters
- what they unlock by participating

### Bots: Activation Rail

Discord and Telegram remain activation rails, not the primary place where the full journey is consumed.

Bots should:

- alert
- remind
- nudge
- prompt
- deep link into the webapp

The rule is:

- bots start movement
- the webapp converts the member
- the portal steers the machine

## Access Model

All Community OS V5 features remain strictly project-private.

Rules:

- only team members of the current project may access the current project's Community OS portal state
- captain permissions are project-scoped and never cross-project
- automation, playbook, captain, funnel, and outcome data must be filtered by `project_id`
- member journey data may be stored by project scope and user scope, but portal visibility should remain aggregate-first
- Veltrix global moderation and claims tooling remain separate internal rails

## Primary Users

### 1. Project Owners

Owners need to know:

- how healthy the community is
- where conversion is dropping
- what play should run next
- whether captains and automations are effective

Owners need control over:

- automations
- playbooks
- captain seats
- campaign activation
- outcomes and escalation

### 2. Captains

Captains need an actual operational workspace, not only a title or Discord role.

Captains need:

- an action queue
- clear permissions
- run-now actions
- blocked and escalated actions
- a record of what they have already done

Captains should feel like operators inside the system, not symbolic moderators.

### 3. Members

Members need a personal journey in the webapp that explains:

- current community status
- next best action
- onboarding progress
- comeback path
- streak and recognition
- community unlocks

Members should not feel like they are just staring at a generic quest list.

## V5 Capability Model

V5 is built from four capability layers.

### A. Execution Core

This is the launch-proof foundation.

Capabilities:

- durable automations
- retries
- run health
- execution history
- idempotent execution
- permission checks
- outcome tracking

This continues the V4 direction but makes it more central and measurable.

### B. Captain Workspace

This is the daily-use layer for community leads.

Capabilities:

- assigned actions
- permission-scoped action rails
- run-now flows
- blocked and escalated work
- captain action history
- captain effectiveness signals

The captain workspace should feel operational, not administrative.

### C. Member Journey Layer

This is the webapp layer that turns participation into a guided path.

Capabilities:

- onboarding state
- comeback state
- next best action
- journey milestones
- status explanation
- streaks and recognition
- mission lane prioritization

The member journey should reduce confusion and increase conversion.

### D. Measurement Layer

This is the owner-facing proof layer.

Capabilities:

- onboarding conversion
- comeback conversion
- captain effectiveness
- automation effectiveness
- activation rate
- lane completion
- retention movement
- campaign and community impact

The point is not to add vanity dashboards. The point is to show whether the machine is working.

## Data Model Direction

V5 should stay event-driven and read-model oriented.

### Existing execution source tables

V5 continues to rely on the V4 execution foundation:

- `community_automations`
- `community_automation_runs`
- `community_playbook_runs`
- `community_captain_actions`

### New source-of-truth tables

V5 should add:

- `community_captain_assignments`
  - project-scoped captain seats and role ownership
- `community_captain_action_queue`
  - queued captain work with status and assignment
- `community_member_journeys`
  - durable project-scoped journey definition per user
- `community_member_journey_events`
  - progression, nudges, completions, resets, and returns

### New read models

V5 should add:

- `community_member_status_snapshots`
  - current member-facing status for fast webapp reads
- project-scoped aggregate read models for:
  - funnel conversion
  - captain effectiveness
  - activation performance
  - comeback performance

### What not to build

Avoid introducing:

- a generic member CRM table as the main model
- large hand-mutated JSON-only journey state
- duplicated status logic across portal, webapp, and bot layers

The preferred pattern is:

- execution and journey events are the source of truth
- snapshots and aggregates are derived read models

## Information Architecture

### Portal: `/projects/[id]/community`

The portal route remains the project-private Community OS home.

V5 should make two clear operating modes visible inside this surface:

- Owner mode
- Captain mode

#### Owner mode sections

- Overview
- Automation Center
- Playbooks
- Funnels and Health
- Campaign Activation
- Captain Ops
- Activity and Outcomes

#### Captain mode sections

- My actions
- Today's priorities
- Assigned playbooks
- Run-now actions
- Blocked and escalated actions
- Recent results

The same route can host both modes as long as the interface keeps them distinct and role-appropriate.

### Webapp member surfaces

V5 should add or expand these member-facing surfaces:

- Community Home
- Onboarding Rail
- Comeback Rail
- Community Status
- Mission Lane
- Recognition and streak surfaces

The most important member-facing idea is that the community layer becomes personalized.

### Bot surfaces

Bots should support:

- onboarding nudges
- comeback nudges
- mission prompts
- raid prompts
- leaderboard prompts
- captain deep links

Every meaningful nudge should land the user into the right webapp destination, not a generic page.

## Core User Flows

### Owner Flow

The owner should be able to open Community OS and immediately understand:

- what is healthy
- what is underperforming
- what action should happen next
- whether captains and automations are delivering outcomes

The owner should be able to act without digging through member-level records.

### Captain Flow

The captain should be able to open a focused workspace and immediately understand:

- what they are responsible for
- what they are allowed to run
- what is blocked
- what already happened

The captain should feel operationally useful within minutes.

### Member Onboarding Flow

A new member should land in the webapp and see:

- current onboarding stage
- next best action
- why that action matters
- what unlock comes next

The flow should move them from:

1. new member
2. linked member
3. ready member
4. first-mission contributor
5. active community participant

### Member Comeback Flow

A dormant member should be able to re-enter through a targeted lane that shows:

- what changed
- what is relevant now
- what they can quickly re-unlock
- what action gets them back into the active rail

### Bot-Assisted Re-entry Flow

Bots should trigger movement by sending:

- targeted nudges
- reminders
- lane prompts
- raid prompts

Those messages should deep link into the correct webapp destination:

- onboarding
- comeback
- mission lane
- raid lane
- status surface

## Launch Scope

The launch-scope V5 tranche should include:

### Portal

- owner overview with recommended next play
- captain workspace with action queue
- captain permission enforcement
- automation center with visible run health
- playbook execution with outcome history
- aggregate funnel performance
- aggregate campaign and community activation insights

### Webapp

- Community Home
- onboarding rail
- comeback rail
- next best action
- status and recognition
- streak and next unlock
- deep-link landings for bot nudges

### Bots

- onboarding nudges
- comeback nudges
- raid and mission prompts with deep links
- captain prompts that link back to the correct workspace or action

### Runtime and data

- journey source tables
- journey event recording
- status snapshot generation
- captain action queue
- captain action result logging
- durable execution logging for journey nudges and captain actions

## Explicitly Out of Scope for This Tranche

The following should not be in launch-scope V5:

- advanced experiments UI
- rich A/B testing systems
- seasonal collectible systems
- social graph features
- cross-project community federation
- CRM-style member exploration as a primary product surface
- advanced predictive or ML-driven recommendations

These may become useful later, but they are not needed to make V5 powerful.

## Success Criteria

V5 is successful when:

- owners can see what community action should happen next without guesswork
- captains can operate from a real queue instead of acting ad hoc
- members see a personal community path in the webapp
- bots drive members into the right webapp experience instead of generic screens
- projects can feel both operational control and stronger community stickiness

## Risks and Design Guardrails

### Risk: Portal becomes a member CRM

Guardrail:

- keep member state aggregate-first in the portal
- keep personal journey state in the webapp

### Risk: V5 becomes too broad

Guardrail:

- keep launch-scope focused on owner, captain, and member journeys that directly increase daily utility

### Risk: Too many overlapping action surfaces

Guardrail:

- enforce a clean split:
  - portal for operations
  - webapp for member journey
  - bots for activation

### Risk: Hard-to-maintain state duplication

Guardrail:

- keep events and runs as source-of-truth
- derive snapshots and read models

## Recommendation

Community OS V5 should be built as a **dual-track operating system**:

- **operations-first enough** to be launch-proof
- **journey-first enough** to become a moat

That means building one connected machine where:

- owners steer
- captains execute
- members progress

This is the strongest next step because it improves reliability and product differentiation at the same time.
