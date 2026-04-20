# Campaign And Quest Studio v2 Design

> Date: 2026-04-20
> Scope: `crypto-raid-admin-portal`
> Goal: Turn campaign and quest creation into premium, project-first builder experiences that are easier to understand, faster to launch, and stronger than the current form-heavy admin flows.

## Problem

Campaigns, quests, and raids are the most important product tools for projects.

Right now the portal can create them, but the creation experience still feels too much like:

- a powerful admin form
- an internal system configuration surface
- a sequence of fields that only makes full sense if you already understand Veltrix deeply

That creates three product problems:

1. projects do not always know where to start
2. projects do not immediately see the logic of the mission architecture they are building
3. projects do not get enough feedback about how the flow will feel for members

The current builders are already stronger than a thin CRUD flow, but they still lean too hard on portal logic and not hard enough on outcome, narrative, and launch clarity.

## Research Synthesis

The strongest competitors each solve a different part of the problem well:

- `Zealy` is strongest at quest structure and consistency
- `Galxe` is strongest at eligibility and reward logic
- `TaskOn` is strongest at step-by-step campaign sequencing
- `Layer3` is strongest at journey framing, retention, and identity

Veltrix should not copy one of them directly.

Veltrix should combine the best of each:

- Zealy-style task clarity
- Galxe-style reward and verification confidence
- TaskOn-style flow sequencing
- Layer3-style journey framing

while keeping the product's biggest advantage:

`project-first campaign and community operations with deeper verification, playbooks, and activation rails`

## Product Intent

The builders should feel like:

- `Campaign Studio`
- `Quest Studio`

not:

- `campaign form`
- `quest form`

The desired feeling is:

`high-trust mission studio with clear intent, guided setup, strong defaults, progressive disclosure, and visible launch outcomes`

Projects should be able to answer these questions quickly while building:

- what is this campaign or quest trying to achieve?
- what member action am I asking for?
- how is it verified?
- what does the member earn?
- where does this fit in the wider mission flow?
- is this ready to launch?

## Core Design Decision

The redesign will follow an **intent-first studio model with progressive disclosure**.

That means:

- users start with outcome and mechanic before low-level settings
- basic setup is guided and easy to scan
- advanced controls are available, but not forced into the primary path
- campaign and quest builders both include structured preview states
- project and campaign context are always visible and prefilled where possible

Rejected alternatives:

### 1. Keep the current builders and only polish styling

This would improve presentation but not solve the deeper clarity problem.

### 2. Convert everything into a long wizard with many hard steps

This would reduce flexibility and become frustrating for power users.

### 3. Force all creation through templates only

This would be fast for repeated use cases but too restrictive for projects with novel mission structures.

## Builder Principles

Both studios must follow the same core rules:

- project-first
- intent-first
- guided before advanced
- member-aware
- preview-rich
- fast to scan
- easy to resume later

Operational rules:

- no giant vertical form walls
- no ungrouped advanced options in the primary flow
- no route knowledge required to start creating
- every studio shows what happens next after save
- every studio has a visible readiness state

## Entry Model

Creation entry must be available from the places where projects already think about work:

- project overview
- project campaigns board
- campaign detail
- quest and campaign indexes

Entries must preserve context:

- `projectId`
- `campaignId` when applicable

The user should always know:

- which project they are building for
- whether they are creating a top-level campaign or a campaign-scoped mission

## Campaign Studio v2

## Purpose

`Campaign Studio` is the place where a project defines a mission lane or launch program.

It is not just metadata entry.

It should help a project shape:

- goal
- audience
- mechanic mix
- reward posture
- mission flow
- launch readiness

## Campaign Studio Structure

The studio should have three primary layers:

### 1. Intent

This layer helps the project define:

- what this campaign is for
- who it targets
- what pressure it should create

Recommended intent choices:

- grow community
- launch a feature or campaign
- drive onchain activity
- reactivate existing members
- reward core contributors
- run a hybrid launch

This layer should feel closer to selecting a strategic objective than filling campaign metadata.

### 2. Flow

This layer turns the chosen intent into a concrete mission system.

It should define:

- campaign posture
- included quest archetypes
- included raid posture
- included reward posture
- sequencing suggestions

This is where the builder becomes a real `Campaign Studio` instead of just a top-level object editor.

### 3. Launch

This layer covers:

- timing
- visibility
- launch posture
- readiness checks
- what gets generated or published after save

The launch layer should make it obvious whether the campaign is:

- draft
- structurally ready
- context-incomplete
- launch-ready

## Campaign Studio Sections

The recommended experience is:

### `Goal`

Questions answered:

- why does this campaign exist?
- what kind of result should it drive?

### `Audience`

Questions answered:

- who is this for?
- newcomers, core members, power users, onchain participants, refocused members?

### `Mechanics`

Questions answered:

- is this mostly quests, mostly raids, mostly rewards, or hybrid?
- which mechanics are in the first wave?

### `Mission Map`

This is the missing piece in the current system.

The campaign builder should show a visible flow map that previews:

- launch entry points
- suggested quests
- suggested raids
- reward endpoints
- sequencing or grouped lanes

This can start as a structured rail or stacked architecture panel before becoming a visual node graph later.

### `Context Autofill`

Veltrix should show:

- what project context it already knows
- what is missing
- what must be patched before the generated flow is strong

Examples:

- Discord URL missing
- X URL missing
- wallet or asset config missing
- docs or landing page missing

This keeps the builder smart without hiding the data dependency.

### `Draft Generation`

Campaign Studio should be able to generate:

- recommended quests
- recommended rewards
- optional raid prompts

The user can then:

- keep
- remove
- edit
- save as reusable project playbook

### `Launch Preview`

Before saving, the studio must show:

- what gets created
- what remains draft
- what is missing
- what the first member-facing flow will look like at a high level

## Campaign Studio UX Rules

- the first screen must talk in goals, not technical fields
- generated flow must be visible before final save
- advanced tuning must live in expandable sections or side rails
- the project context and campaign context must remain visible through the full flow
- save-as-playbook should feel native, not bolted on

## Quest Studio v2

## Purpose

`Quest Studio` is the place where a project defines one contributor action with clear verification and reward logic.

It is not a generic quest schema editor.

It should help the project define:

- the member action
- the destination
- the proof model
- the reward model
- the member-facing experience

## Quest Studio Structure

The studio should use a mission-first flow with strong blueprint selection.

Recommended high-level structure:

### 1. Blueprint

The first choice is not raw form fields.

The first choice is:

- what kind of mission is this?

Recommended blueprint groups:

- social
- community
- wallet
- onchain
- traffic
- referral
- proof-based
- custom

This already exists partially in the current quest builder, but it should become visually stronger and more central to the experience.

### 2. Destination

This defines:

- project
- campaign
- target URL or action location
- CTA copy
- what the member is being sent to do

This step should make the destination feel concrete, not hidden inside mixed configuration fields.

### 3. Verification

This defines:

- how completion is checked
- whether proof is required
- whether review is manual or automatic
- which provider or signal confirms completion

This is one of Veltrix's biggest advantages and should be treated like a hero section of the builder.

### 4. Reward

This defines:

- XP
- optional reward or unlock impact
- frequency and cooldown posture
- whether the action is worth doing

This should feel clear and motivating, not buried among operational toggles.

### 5. Preview

This is the second missing piece in the current builder.

Quest Studio should show:

- how the quest appears in the member app
- the action label and short copy
- the reward signal
- the verification posture
- how strict or easy it will feel

This preview does not need full visual fidelity in v2, but it must exist.

### 6. Launch

This defines:

- state
- timing
- gating
- limits
- readiness

## Quest Studio Sections

Recommended sections:

### `Mission Blueprint`

Choose the mechanic and show a short explanation of what it is good for.

### `Destination And CTA`

Set:

- where the user goes
- what they do
- what button they click

### `Verification Rail`

Explain:

- provider
- proof
- review route
- event or signal used

This section should include a plain-language explanation of how verification will behave.

### `Reward And Pressure`

Set:

- XP
- optional reward linkage
- quest importance
- repeatability

### `Member Preview`

Show:

- quest card title
- subcopy
- button label
- reward amount
- verification style

### `Launch Readiness`

Show:

- ready
- missing context
- weak verification
- review-heavy
- launch-safe

## Basic vs Advanced Model

Both studios need explicit progressive disclosure.

### Basic path

Show the fields that most projects need to finish a launch-quality setup.

### Advanced path

Reveal:

- low-level configuration
- raw payload tuning
- extra thresholds
- uncommon provider options
- edge-case overrides

Advanced settings should live in:

- expandable sections
- side drawers
- advanced mode blocks

They should not dominate the main path.

## Shared Visual Model

Campaign Studio and Quest Studio should look like members of the same family.

Both should use:

- a premium studio header
- strong project context pills
- step rail or segmented builder navigation
- main creation rail
- side rail for readiness, preview, and guidance
- clear bottom navigation with `Back`, `Continue`, `Save draft`, `Launch`

The studios should feel closer to product tools like:

- modern onboarding builders
- journey designers
- high-end workflow configuration surfaces

than to an internal CRUD panel.

## Relationship To Raid Studio

`Raid Studio` should eventually follow the same philosophy, but it is not the primary scope of this redesign.

For now:

- Campaign Studio v2 and Quest Studio v2 define the pattern
- Raid Studio can later inherit the same architecture with pressure, reminder, and result-specific logic

This keeps scope focused while still giving a clear system direction.

## Data And Architecture Implications

This redesign should prefer reuse over schema expansion where possible.

Likely v2 can be built primarily through:

- builder flow restructuring
- better grouping of existing fields
- stronger presets and previews
- clearer readiness logic
- generated mission architecture presentation

New schema work should only be introduced when it unlocks clearly missing capability, such as:

- reusable mission playbooks beyond current template scope
- richer member preview mapping
- explicit generated mission map state

The first implementation goal is a better experience, not a new data model for its own sake.

## Non-Goals

This redesign does not attempt to:

- rebuild the member-facing webapp
- redesign every detail editor in the portal
- fully redesign Raid Studio in the same tranche
- replace the existing campaign and quest entities
- add a brand new workflow engine

This is a creation experience redesign, not a full mission-system rewrite.

## Success Criteria

The redesign is successful when:

- projects can create campaigns and quests without knowing internal Veltrix concepts first
- the starting point feels strategic and intuitive
- verification logic is easier to understand
- rewards and readiness are easier to scan
- campaign creation clearly shows a mission architecture
- quest creation clearly shows member-facing outcome
- project and campaign context stay obvious through the whole flow
- creation feels premium, guided, and launch-oriented

## Final Recommendation

Veltrix should evolve campaign and quest creation into:

- `Campaign Studio v2`
- `Quest Studio v2`

with:

- intent-first entry
- mission-first structure
- clearer verification and reward rails
- project-context autofill
- visible mission map
- member-facing preview
- progressive disclosure for advanced controls

This is the highest-leverage path to making the most important project tool in the portal feel differentiated, easier to use, and more valuable than the current generation of quest platforms.
