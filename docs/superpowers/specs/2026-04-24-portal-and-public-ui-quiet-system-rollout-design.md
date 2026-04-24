# Portal And Public UI Quiet-System Rollout Design

Date: 2026-04-24
Status: Ready for review
Scope: Portal-first UI system refinement, followed by public surfaces, builders, internal ops, and docs

## 1. Goal

Make Veltrix feel calmer, clearer, and more intentional without flattening the product into generic SaaS UI.

This UI program should solve the biggest current experience gap:

- users and visitors should know where to look first
- each page should make its purpose obvious within a few seconds
- the portal should stop feeling like a wall of bordered modules
- the public product should feel focused and trustworthy instead of visually busy

The target is not to copy Zealy, TaskOn, or Galxe.

The target is to learn from what they do well:

- calm first impression
- clear visual focus
- strong reading direction
- restrained use of cards, borders, and badges

## 2. Problem Statement

Veltrix has already improved hierarchy significantly, but the next UI problem is now more specific:

- too many bordered cards
- too many box-on-box compositions
- too much visual chrome competing with the content
- too many modules reading as equally important

This creates a subtle but important cost:

- users do not instantly know where to look
- screens feel denser than they need to
- powerful pages can read like dashboards before they read like workflows

The product is already strong in scope and capability.

This program is about making the interface feel more like a calm command system and less like a collection of adjacent widgets.

## 3. Recommended Approach

### Option A: Polish-only pass

Keep current layouts mostly intact and only reduce some spacing, borders, and colors.

Pros:

- fastest path
- low implementation risk

Cons:

- does not fix the deeper surface-language problem
- likely leaves the portal feeling too modular

### Option B: Full redesign

Rebuild the visual system and page structures across the whole product at once.

Pros:

- maximum visual reset
- strongest transformation

Cons:

- too risky
- too disruptive
- too easy to lose product coherence

### Option C: Quiet-system rollout

Introduce a calmer surface language first, then apply it page family by page family in a fixed order.

Pros:

- highest clarity with controlled risk
- preserves product depth while improving calmness
- lets the team validate the new language on pilot pages before broad rollout

Cons:

- requires discipline and sequencing
- not as instantly dramatic as a full redesign

### Recommendation

Build `Option C`.

Veltrix should become calmer through a controlled system rollout, not through isolated style tweaks and not through an all-at-once visual rewrite.

## 4. Core UX Objective

Every page should answer these questions in roughly three seconds:

- what page is this
- why is it important right now
- what should I do first

This is the primary rule behind the whole program.

If a page fails this test, it is not finished, even if the styling looks better.

## 5. Surface Language

The new Veltrix UI language should follow these rules.

### 5.1 Sections Before Cards

Not every section needs a card.

Use open canvas and grouped sections by default.

Only use cards when a block is truly:

- a discrete object
- a comparable item
- a focused status module
- an actionable unit

### 5.2 Typography Before Borders

Hierarchy should come more from:

- page title scale
- section headings
- short explanatory copy
- spacing

and less from:

- borders around everything
- repeated pills and chips
- repeated container backgrounds

### 5.3 One Primary Action Per Viewport

Every page should have one primary action in the visible area above the fold.

Secondary actions can exist, but they must not visually compete with the primary task.

### 5.4 Calm Side Rails

Side rails are allowed when they help with:

- status
- metadata
- quick actions
- next-step support

They should not become a second dashboard column.

### 5.5 Color As Meaning, Not Decoration

Color should mainly indicate:

- primary CTA
- success
- warning
- risk
- reward or emphasis

Color should not be used to make every panel feel important.

## 6. Page Family Model

The rollout should not be page-by-page in a vacuum.

Veltrix should treat pages as families with shared reading patterns.

### 6.1 Overview Pattern

Used for:

- `/overview`
- `/analytics`
- `/business`
- `/success`
- `/security`
- `/growth`
- `/support`
- `/releases`
- `/qa`

Structure:

- hero or orientation header
- compact status strip
- main priority section
- grouped secondary sections
- dense supporting detail lower on the page

Goal:

- read like a calm command surface
- direction first, metrics second

### 6.2 Index And Workspace Pattern

Used for:

- `/projects`
- `/campaigns`
- `/quests`
- `/raids`
- `/rewards`
- `/users`
- `/claims`
- `/submissions`

Structure:

- title, explanation, and one primary action
- light filters or controls
- quiet list or grid of entities
- limited summary modules

Goal:

- read like a management surface, not a dashboard

### 6.3 Workspace And Detail Pattern

Used for:

- `/projects/[id]`
- `/projects/[id]/launch`
- `/projects/[id]/settings`
- detail routes across claims, submissions, users, and internal ops

Structure:

- summary zone at top
- main content or action zone as the dominant column
- quiet side rail for context and actions
- lower sections for secondary detail

Goal:

- read like a dossier or command surface
- remove the feeling of many equal widgets

### 6.4 Builder Pattern

Used for:

- `/campaigns/new`
- `/campaigns/[id]`
- `/quests/new`
- `/quests/[id]`
- `/raids/new`
- `/raids/[id]`
- `/rewards/new`
- `/rewards/[id]`

Structure:

- builder header with clear intent
- large form or content zones
- quiet summary or preview area
- strong primary action

Goal:

- read like a guided flow
- reduce dashboard noise inside builders

## 7. Visual Rules

### 7.1 Card Rules

Do not wrap entire pages in stacked cards.

Do not nest cards inside cards unless a sub-object truly needs local framing.

Use cards sparingly for:

- objects in a list
- isolated queue items
- compact metrics
- focused action modules

### 7.2 Border Rules

Borders should be structural, not decorative.

Prefer:

- spacing
- tone shifts
- subtle background separation

over repeated outlines.

### 7.3 Header Rules

Each major page should begin with:

- small page label
- strong title
- short explanation
- one primary action
- optional status strip

It should not begin with:

- six metric cards
- several equally strong buttons
- dense metadata clusters

### 7.4 Detail Rules

Detail pages should prioritize the main action and the main narrative.

Supporting information can be visible, but should not compete visually with the task.

### 7.5 Badge Rules

Badges and status pills should be reduced and used intentionally.

If everything has a chip, nothing feels important.

## 8. Rollout Strategy

This program should run in waves, not as a giant rewrite.

### Wave 1: Portal Pilot

Pilot pages:

- `/overview`
- `/projects`
- `/projects/[id]`

Why first:

- these three pages define the product feel
- they are high-visibility
- they are enough to validate the new language

### Wave 2: Portal Orientation

Pages:

- `/getting-started`
- `/account`
- `/projects/[id]/launch`
- `/projects/[id]/settings`

Why next:

- these pages are where users orient themselves inside the product
- they must feel calm and directional

### Wave 3: Public Entry

Pages:

- `/`
- `/start`
- `/pricing`
- `/trust`
- `/talk-to-sales`

Why next:

- public and portal language should feel coherent
- once the portal pilots are right, the public surface can inherit the calmer system

### Wave 4: Core Builders

Pages:

- `/campaigns`
- `/campaigns/new`
- `/campaigns/[id]`
- `/quests`
- `/quests/new`
- `/quests/[id]`
- `/raids`
- `/raids/new`
- `/raids/[id]`
- `/rewards`
- `/rewards/new`
- `/rewards/[id]`

Why next:

- builders benefit heavily from clarity and low noise
- their patterns should inherit from the validated portal language

### Wave 5: Community And Execution

Pages:

- `/projects/[id]/community`
- related captain, playbook, automation, and command surfaces

Why next:

- these pages are rich and potentially noisy
- better to refine them after the core language is proven

### Wave 6: Review And Action Detail

Pages:

- `/submissions`
- `/submissions/[id]`
- `/claims`
- `/claims/[id]`
- `/users`
- `/users/[id]`

Why next:

- these are action-heavy and detail-heavy
- they should read more like dossiers and less like widget boards

### Wave 7: Internal Ops

Pages:

- `/analytics`
- `/business`
- `/business/accounts/[id]`
- `/success`
- `/success/accounts/[id]`
- `/security`
- `/security/accounts/[id]`
- `/support`
- `/support/tickets/[id]`
- `/support/incidents/[id]`
- `/growth`
- `/growth/leads/[id]`
- `/releases`
- `/releases/[id]`
- `/qa`

Why later:

- these are powerful internal pages
- they are data-dense and benefit from a mature surface system

### Wave 8: Docs

Pages:

- docs home
- `/buyer-guides`
- flagship docs surfaces

Why last:

- docs should reflect the final commercial and product language
- not define it too early

## 9. Definition Of Done

This UI program is only complete when:

- the portal no longer feels dominated by repeated bordered cards
- overview pages read direction-first instead of module-first
- workspace and detail pages make the main task obvious
- builders feel like flows instead of dashboards
- public pages communicate product intent clearly and calmly
- docs visually align with the mature product posture
- users can identify page purpose and first action in seconds

## 10. Non-Goals

This program should not:

- copy competitor layouts directly
- flatten Veltrix into minimal generic SaaS UI
- remove useful depth in favor of empty aesthetic space
- treat every page as the same pattern
- prioritize polish over orientation and clarity

## 11. First Implementation Target

The first implementation tranche should focus only on:

- `/overview`
- `/projects`
- `/projects/[id]`

These three pages should become the proving ground for the new quiet-system language.

If they work, the rest of the rollout becomes much safer and much faster.
