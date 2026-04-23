# Success Language And Nudge Posture

## Purpose

Phase 12 needs one consistent success language model across:

- internal `/success`
- portal activation guidance
- member onboarding and comeback surfaces
- activation and reactivation nudges

This document fixes the wording posture for activation, stall, recovery, and expansion so Veltrix does not sound generic, punitive, or confusing while accounts and members are moving through the product.

## Core language rules

- Always explain what is complete.
- Always explain what is missing.
- Always explain why the missing step matters.
- Always point to one next best move.
- Never shame the customer or member for low usage.
- Never present churn or stall language directly to customers in a harsh way.
- Keep internal operator language sharper than customer-facing language.

## Activation posture

Use activation language when the workspace or member is still building first value.

Customer-facing examples:

- `Create the first project to turn this workspace into a live operating surface.`
- `Connect the first provider so members can actually enter the flow.`
- `Publish the first campaign to move from setup into visible launch motion.`
- `Drive the first member activity so the workspace closes the launch-to-usage loop.`

Member-facing examples:

- `Link your first provider to unlock community actions.`
- `Verify your wallet so reward and on-chain rails can open cleanly.`
- `Complete your first quest to move into the active lane.`

Internal operator language:

- `Workspace still has no first project.`
- `Project structure exists but the first live campaign is still missing.`
- `Member has not crossed the first completion milestone yet.`

## Stalled posture

Use stalled language when setup has remained incomplete longer than the expected activation window.

Customer-facing examples:

- `This workspace has solid setup progress, but it still needs one launch move to become active.`
- `The next strongest move is to publish the first live campaign.`
- `Member activity has not started yet, so the workspace still looks unfinished from a launch perspective.`

Internal operator language:

- `Activation stalled after workspace creation.`
- `Paid account is stalled without a first live campaign.`
- `Member drift is visible after the first join event.`

Rules:

- Customer-facing copy should sound like guidance, not failure.
- Internal copy can use sharper state labels such as `stalled`, `watching`, or `churn risk`.

## Recovery posture

Use recovery language when a workspace or member needs to return to motion after inactivity.

Customer-facing examples:

- `Re-open the launch flow and restore the next live step.`
- `Bring members back into motion with a comeback pass.`
- `Resume momentum by returning through the comeback lane.`

Member-facing examples:

- `Pick up where you left off and get back into live missions.`
- `Open the comeback lane to restore your visible momentum.`

Internal operator language:

- `Workspace needs a recovery follow-up.`
- `Member needs a comeback prompt.`
- `Low-activity paid account needs guided recovery before renewal pressure increases.`

## Expansion posture

Use expansion language when a workspace is healthy enough for a bigger operating footprint.

Customer-facing examples:

- `This workspace is ready for a bigger operating cadence.`
- `You now have enough motion to expand projects, campaigns, or team coordination.`

Internal operator language:

- `Account is expansion-ready.`
- `Healthy repeat usage is visible.`
- `This workspace can move from activation support to growth support.`

Rules:

- Expansion prompts should sound earned, not pushy.
- Expansion should only show when the workspace is already healthy or clearly scaling.

## Nudge posture

### In-product nudges

Use for:

- activation blockers
- first-step guidance
- comeback prompts
- bounded next moves

Rules:

- one primary action
- one clear reason
- one route to continue
- no stacked alerts with conflicting asks

### Email nudges

Use for:

- member comeback
- workspace reactivation
- stalled paid accounts

Rules:

- email should echo the same next move as the in-product surface
- email should never invent a different urgency model
- duplicate nudges must be rate-limited and logged

## State-to-language mapping

### Workspace health

- `not_started`
  - customer: `Start your first workspace move`
  - internal: `No real activation movement yet`
- `activating`
  - customer: `You are moving through setup`
  - internal: `Activation in progress`
- `live`
  - customer: `Workspace is live and moving`
  - internal: `Healthy live posture`
- `stalled`
  - customer: `One important move is still missing`
  - internal: `Activation stalled`

### Success health

- `healthy`
  - customer: `Healthy momentum`
  - internal: `Healthy`
- `watching`
  - customer: `Needs one more move`
  - internal: `Watching`
- `expansion_ready`
  - customer: `Ready to scale`
  - internal: `Expansion ready`
- `churn_risk`
  - customer: do not expose the raw label
  - internal: `Churn risk`

### Member health

- `new`
  - member: `Finish your first setup steps`
- `active`
  - member: `Keep your momentum moving`
- `drifting`
  - member: `Open the comeback lane`
- `reactivation_needed`
  - member: `Come back to live missions`

## Acceptance bar

This language model is working when:

- the same activation truth reads coherently in internal, customer, and member surfaces
- customers always know the next best move
- members do not get vague or spammy comeback prompts
- internal teams can quickly distinguish activation, recovery, and expansion posture
- nudges stay bounded, explainable, and non-contradictory
