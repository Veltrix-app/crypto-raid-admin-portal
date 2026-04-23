# Customer Success, Activation, And Expansion Operations Design

## Goal

Build the first complete Veltrix success layer so activation, adoption, reactivation, retention pressure, and expansion opportunity are visible and actionable across three connected views:

- `internal Veltrix success ops`
- `customer-facing workspace activation`
- `member-facing activation and reactivation`

The outcome of Phase 12 should be that Veltrix can explain:

- where every account is in its activation journey
- what is blocked
- what the next best move is
- which members are active, drifting, or recovering
- which accounts are expansion-ready or churn-risk

## Product posture

Veltrix already has:

- account and onboarding rails
- billing and business control
- support, incident, and status operations
- strong portal and member journey surfaces

What is missing is a true customer success system above those surfaces.

Phase 12 should turn activation from something users may or may not discover into a deliberate operating layer.

## Scope framing

Phase 12 includes both:

- internal-only customer success operations
- customer-visible activation guidance

It also includes both:

- workspace and team activation
- member activation and reactivation

The nudge channels for v1 are:

- `in_product`
- `email`

Discord and Telegram success nudges are intentionally out of scope for this phase.

## Recommended approach

### Option A: Internal-only success ops

Build only the internal success cockpit and keep customer/member-facing activation for later.

Pros:

- fastest
- safest
- easiest to reason about

Cons:

- customers do not feel the activation system directly
- member reactivation remains underpowered

### Option B: Twin-rail activation system

Build one shared activation truth layer that powers:

- internal `/success`
- customer-facing activation checklists and guidance
- member-facing progress and reactivation nudges

Pros:

- strongest product and company outcome
- keeps all activation logic on one truth model
- lets internal CS and customers see the same journey from different angles

Cons:

- broader than a dashboard-only phase

### Option C: Full automation-heavy lifecycle engine

Add deep sequencing, advanced automated playbooks, and broad lifecycle orchestration now.

Pros:

- closest to long-term end state

Cons:

- too broad for the current tranche
- would blur into future analytics and commercial automation phases

### Recommendation

Build `Option B`.

That means:

- one shared activation truth layer
- one internal success workspace
- one customer-facing activation layer
- one member-facing activation and reactivation layer

## Architecture

Phase 12 should be split into four connected rails.

### 1. Activation truth layer

This is the system of record for:

- milestones
- health states
- blockers
- next best actions
- activation movement
- reactivation outcomes
- expansion and churn signals

Without this layer, the rest becomes a collection of disconnected checklists and dashboards.

### 2. Internal success operations

This is a Veltrix-only control surface at:

- `/success`
- `/success/accounts/[id]`

It should show:

- activation progress
- stalled accounts
- blocked launches
- follow-up tasks
- member health rollups
- expansion opportunity
- churn risk
- success notes and ownership

### 3. Customer-facing activation layer

This should live inside existing portal surfaces rather than as a separate app.

Primary surfaces:

- `/getting-started`
- `/account`
- project and launch workspace surfaces

It should show:

- progress state
- milestone checklist
- blockers
- next recommended move
- what unlocks next
- why each step matters

### 4. Member activation and reactivation

This should extend existing member journey and comeback surfaces in the webapp.

Primary surfaces:

- member onboarding
- active journey surfaces
- comeback and reactivation surfaces
- key member home/dashboard entry points

It should show:

- next mission
- momentum state
- drift warnings
- comeback prompts
- reactivation recovery
- reward and streak cues

## Route model

### Internal

- `/success`
- `/success/accounts/[id]`

### Portal customer-facing

Use existing surfaces, especially:

- `/getting-started`
- `/account`
- project and launch workspace pages

### Member-facing webapp

Extend existing member journey and comeback routes instead of adding a new separate success app.

## Activation milestones

### Account and workspace milestones

- `account_created`
- `workspace_created`
- `first_team_member_invited`
- `first_project_created`
- `first_provider_connected`
- `launch_workspace_opened`
- `first_campaign_published`
- `first_live_member_activity`
- `first_reward_or_payout_cycle`
- `repeat_launch_motion_started`

### Project activation milestones

- `project_profile_complete`
- `launch_readiness_started`
- `campaign_system_configured`
- `community_surface_active`
- `rewards_configured`
- `first_live_campaign`
- `first_healthy_post_launch_loop`

### Member milestones

- `member_joined`
- `identity_completed`
- `first_quest_started`
- `first_quest_completed`
- `first_return_session`
- `streak_established`
- `reward_claimed`
- `comeback_recovered`

## Health states

### Workspace activation state

- `not_started`
- `activating`
- `live`
- `stalled`

### Commercial and success health

- `healthy`
- `watching`
- `expansion_ready`
- `churn_risk`

### Member health

- `new`
- `active`
- `drifting`
- `reactivation_needed`

## Signal model

Signals should be divided into three categories.

### Direct signals

- project created
- campaign published
- provider connected
- live member activity
- reward claimed

### Derived signals

- no first campaign after a configured time window
- no member activity after launch
- paid account with low activation
- many invites but weak project progress
- members drifting after first engagement

### Recovery and expansion signals

- usage near plan ceilings
- repeat launches
- multiple active projects
- member reactivation success
- stronger team usage across surfaces

Each tracked object should resolve to:

- milestone posture
- health state
- blockers
- next best action

## Page model

### `/success`

This should contain:

- activation overview
- stalled accounts
- accounts at risk
- expansion-ready accounts
- follow-up queue
- recent activation movement

### `/success/accounts/[id]`

This should contain:

- account identity
- workspace and activation posture
- linked projects
- blockers
- next CS actions
- member health summary
- support and billing context
- internal notes
- follow-up ownership

### Portal customer activation modules

Embed these into:

- `getting started`
- `account`
- relevant project and launch surfaces

The module should include:

- current activation stage
- checklist
- blockers
- next best action
- why the step matters
- what the next completed step unlocks

### Member activation modules

Embed these into existing webapp journey surfaces.

The module should include:

- progress state
- next mission
- drift or comeback prompt
- momentum explanation
- reward and streak cues

## Data model

### New entities

- `customer_account_activation`
- `customer_account_success_notes`
- `customer_account_success_tasks`
- `customer_account_success_signals`
- `member_activation_states`
- `member_reactivation_events`
- `activation_nudges`

### Responsibilities

#### `customer_account_activation`

Stores:

- current activation stage
- completed milestones
- blockers
- last movement
- workspace health

#### `customer_account_success_notes`

Stores:

- internal CS notes
- ownership context
- account narrative

#### `customer_account_success_tasks`

Stores:

- follow-up tasks
- owner
- status
- due state
- related account and project

#### `customer_account_success_signals`

Stores:

- derived success health signals
- expansion signals
- churn risk signals
- explanations and timestamps

#### `member_activation_states`

Stores:

- current member activation posture
- milestone state
- health label
- last activity
- comeback state

#### `member_reactivation_events`

Stores:

- reactivation attempts
- channel
- reason
- whether the member returned

#### `activation_nudges`

Stores:

- nudge target
- target type
- channel
- reason
- send and display state
- outcome

### Derived fields

The following should be derived at read time in v1 unless persistence becomes necessary:

- `workspace_health_state`
- `expansion_readiness`
- `churn_risk`
- `member_drift_score`
- `next_best_action`

## Nudge model

### Channels

- `in_product`
- `email`

### Targets

- `account`
- `project`
- `member`

### Nudge categories

- onboarding reminder
- stalled launch follow-up
- no-first-campaign follow-up
- member drift prompt
- comeback prompt
- expansion recommendation

### Rules

- nudges must come from shared activation truth
- internal CS must be able to see why a nudge was sent
- customers should not receive confusing or duplicate nudges across surfaces
- member nudges should stay tightly connected to real journey state, not generic marketing copy

## Integration with existing systems

Phase 12 must be connected to:

- Phase 9 account onboarding
- Phase 10 billing and plan pressure
- Phase 11 support and incident posture
- portal launch and community surfaces
- webapp member journey and comeback flows

This should not become a separate island.

It is one activation system expressed through:

- Veltrix internal view
- customer workspace view
- member journey view

## Out of scope

Phase 12 does not include:

- CRM
- sales pipeline
- support desk expansion
- Discord or Telegram success nudges
- deep revenue analytics
- compliance posture
- broad lifecycle automation engine

Those belong in later phases.

## Build order

1. `activation truth layer`
2. `internal /success workspace`
3. `customer-facing activation modules`
4. `member activation and reactivation modules`
5. `nudge delivery and follow-up`
6. `verification and rollout`

## Definition of done

Phase 12 is complete when:

- every account has a visible activation posture
- stalled accounts and blocked launches are visible early
- internal Veltrix operators can manage activation and follow-up from `/success`
- customer-facing activation guidance is visible inside portal surfaces
- member-facing activation and reactivation is visible in the webapp
- nudges work through in-product and email channels
- expansion-ready and churn-risk states are visible and reasoned, not intuitive guesswork
