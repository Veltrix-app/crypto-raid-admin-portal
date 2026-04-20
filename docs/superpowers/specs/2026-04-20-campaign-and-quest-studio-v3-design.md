# Campaign And Quest Studio v3 Design

## Why v2 is still not enough

`Campaign Studio v2` and `Quest Studio v2` are materially better than the old long-form builders, but they still behave too much like admin forms with premium chrome around them.

The current problems are:

- too many simultaneous panels with similar visual weight
- too much orientation, configuration, preview, and checklist logic on one screen
- not enough distinction between `designing a journey` and `configuring an object`
- verification and member-facing outcomes still compete with generic admin framing
- the layouts still feel like upgraded forms instead of category-defining product tools

Veltrix should not stop at "better admin pages."
It should turn campaign and quest creation into a differentiated growth system that feels closer to a journey builder than a back-office form.

## Product direction

The strongest direction for Veltrix is:

- `Campaign Studio v3` becomes a **storyboard builder**
- `Quest Studio v3` becomes a **guided experience builder**

This split matches the actual product model:

- a `campaign` is a multi-step journey with goals, quest lanes, raid pressure, rewards, and launch posture
- a `quest` is a precise member action that still needs strong UX, but should not carry the full weight of a storyboard canvas

## Design principles

### 1. One primary job per surface

Every studio step should have one dominant responsibility.

- no mixed checklist + context + preview + verification stacks competing at once
- no "everything visible because it might be useful"
- no repeated explanation panels with nearly equal hierarchy

### 2. Experience-first, not schema-first

Projects think in:

- what are we trying to achieve
- what will the member experience
- how will this launch

They do not think in raw fields first.

### 3. Context should stay visible, but compact

Project and campaign context matters, but it should live in a slim persistent header or compact context strip, not in separate heavy cards that consume the canvas.

### 4. Preview should be premium and always useful

The member-facing preview should survive the redesign, but it should be:

- bigger
- cleaner
- more product-like
- less buried between admin helper panels

### 5. Advanced controls must truly recede

Advanced controls should be behind:

- a mode toggle
- collapsible sections
- or a drawer / secondary reveal

They should not visually compete with the main creation path.

## Competitive framing

The best outside cues are:

- `Zealy`: lightweight creation and module grouping
- `TaskOn`: linear step clarity
- `Galxe`: strong task/eligibility/verification separation
- `Layer3`: journey, streak, achievement, and member experience framing

Veltrix should not copy one of them directly.
Veltrix should combine:

- Zealy's speed
- TaskOn's step clarity
- Galxe's verification structure
- Layer3's experience framing

while staying distinct through:

- project-first context
- quest + raid + reward architecture
- community operating system integration
- member-facing journey awareness

## Campaign Studio v3

### Role

`Campaign Studio v3` is a **journey architecture tool**.

Its job is to help a project design:

- the goal of the campaign
- the sequence of mechanics
- the reward logic
- the launch posture

### Layout model

Campaign Studio should move to a storyboard-style layout.

#### Top frame

- compact project context
- campaign name / draft state
- intent tag
- audience tag
- mode toggle for `Design` / `Launch`

#### Main canvas

A horizontal or board-like architecture surface with blocks such as:

- `Goal`
- `Quest Lane`
- `Raid Pressure`
- `Reward Outcome`
- `Launch Posture`

The user should feel like they are shaping a campaign system, not filling fields.

#### Right rail

The right rail should contain only:

- high-value launch preview
- readiness or blockers

No extra side cards unless they are truly blocking or highly relevant.

### Core sections

#### 1. Goal

- why this campaign exists
- which audience it targets
- which growth posture it serves

#### 2. Architecture

- which quest lane structure it uses
- whether raids are part of the loop
- where momentum and community pressure enter

#### 3. Rewards

- what the contributor is working toward
- how rewards map to the journey
- whether the loop is immediate, pooled, gated, or layered

#### 4. Launch

- draft vs live posture
- what gets generated
- what is still missing
- what happens next after save

### What must disappear

- stacked helper cards that restate the same story in different words
- big sidebars full of explanatory metadata
- field-first framing before goal framing
- equal visual emphasis on minor controls and major journey choices

## Quest Studio v3

### Role

`Quest Studio v3` is a **guided experience builder**.

Its job is to help a project define one high-quality member action:

- what the member does
- how we verify it
- what they earn
- how it launches

### Layout model

Quest Studio should not become a full storyboard canvas.

Instead it should adopt a focused three-part structure:

#### Compact header

- project
- campaign
- quest family
- basic / advanced toggle
- save state

#### Left rail

A minimal step rail only:

- `Action`
- `Verification`
- `Reward`
- `Launch`

This rail should be compact and navigational, not content-heavy.

#### Center canvas

Only the active step should dominate the screen.

Examples:

- on `Action`, show the action blueprint, CTA, destination, and copy
- on `Verification`, show proof route and verification structure only
- on `Reward`, show XP, repeatability, and reward posture
- on `Launch`, show state, timing, and final posture

#### Right rail

The right rail should be stable and restrained:

- `Member Preview`
- `Warnings / Readiness`

Nothing else should permanently live there.

### Core sections

#### 1. Action

- blueprint family
- quest mechanic
- CTA copy
- target link or destination
- member-facing description

#### 2. Verification

- provider
- proof route
- manual vs automated path
- missing config only when relevant

Verification should be a primary experience section, not a buried admin block.

#### 3. Reward

- XP
- repeatability
- cooldown / max completions only when needed

#### 4. Launch

- status
- start and end timing
- final preview of how this lands

### What must disappear

- always-visible checklist cards
- separate context panel competing with the header
- verification summary cards outside the verification step
- multiple mid-column blocks trying to explain the same quest simultaneously

## Shared studio rules

Both studios should share:

- one visual system
- one compact context language
- one bottom navigation posture
- one basic/advanced interaction model
- one preview card language
- one readiness language

This makes them feel like parts of the same tool family, while still honoring that campaigns and quests are different objects.

## Information hierarchy

### Campaign hierarchy

1. campaign goal
2. journey architecture
3. reward outcome
4. launch posture
5. advanced controls

### Quest hierarchy

1. member action
2. verification route
3. reward posture
4. launch
5. advanced controls

## Rollout recommendation

### Phase 1

Implement the structural reset first:

- new Campaign Studio storyboard layout
- new Quest Studio focused step layout
- compact context headers
- reduced right rails
- hidden-by-default advanced sections

### Phase 2

Upgrade the member preview surfaces:

- stronger card polish
- better reward and recognition signals
- clearer launch-state preview

### Phase 3

Expand the campaign storyboard with deeper mission architecture:

- explicit quest lane cards
- raid linkage
- reward milestones
- possible future achievement / recognition blocks

## Success criteria

The redesign is successful when:

- a project immediately understands where to start
- a quest no longer feels like a dense admin form
- a campaign feels like an orchestrated journey, not a schema
- verification reads as a first-class experience concern
- preview stays visible without cluttering the main action
- the studios feel more premium than Zealy/TaskOn/Galxe on layout and flow quality

## Final recommendation

The definitive v3 direction is:

- `Campaign Studio v3 = storyboard builder`
- `Quest Studio v3 = guided experience builder`

That is the cleanest line to where Veltrix wants to go:

- project-first
- community-aware
- journey-driven
- premium
- and meaningfully more sophisticated than a generic quest admin tool
