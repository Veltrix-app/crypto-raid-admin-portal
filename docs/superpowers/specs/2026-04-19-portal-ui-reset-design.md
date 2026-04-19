# Portal UI Reset Design

> Date: 2026-04-19
> Scope: `crypto-raid-admin-portal`
> Goal: Turn the portal from a dense stacked admin dashboard into a project-first, premium operations product with clearer information architecture, cleaner workflows, and stronger visual hierarchy.

## Problem

The portal has grown functionally strong, but the UI and page structure no longer support that scope well.

Current issues:

- too many responsibilities are mixed into single pages
- project detail and Community OS carry too much stacked content at once
- pages often feel like "everything we built lives here" instead of one focused workflow
- global operations and project-scoped operations are not visually separated enough
- cards, metrics, actions, and configuration controls often compete for the same attention
- navigation does not yet match the operational complexity of the product

The result is that the portal feels powerful but messy. It needs to feel intentional, premium, and fast to operate for multiple roles:

- owner
- campaign manager
- community lead
- moderator
- ops/admin

## Product Intent

The portal should feel like a serious control surface for projects and platform operators.

It must become:

- project-first
- easy to scan
- easy to navigate
- role-friendly without becoming role-fragmented
- visually calm but high-signal
- scalable as Community OS, trust, on-chain, claims, and campaigns keep growing

The target feeling is:

`dark premium operations shell with project-first navigation, segmented workflows, strong status language, and fewer but more powerful surfaces`

## Core Design Decision

The redesign will follow a **domain-first portal with project workspaces**.

This means:

- `Projects` becomes the primary entry point
- global ops centers remain in the main menu
- each project gets a true workspace shell with context-aware top navigation
- overloaded pages are decomposed into dedicated project subpages
- heavy pages use segmented controls and structured subsections instead of long stacked scroll layouts

Rejected alternatives:

### 1. Polish without restructuring

This would improve styling but not solve the underlying navigation and cognitive load problems.

### 2. Operator cockpit by role

This would over-abstract the product and weaken the project-first model. It is better for a much larger enterprise system than for the current product stage.

## Information Architecture

## Global Navigation

The portal uses a **fixed left sidebar** as the primary navigation.

Global sidebar items:

- `Overview`
- `Projects`
- `Moderation`
- `Claims`
- `Analytics`
- `Submissions`
- `Settings`

Optional future additions:

- `Automations`
- `Integrations`

The sidebar answers:

`Where am I in the product?`

It must remain stable and low-noise across all pages.

## Project Workspace Model

Once a user enters a project, the portal switches into a project workspace with a context bar and top subnav.

Primary project routes:

- `/projects/[id]`
- `/projects/[id]/campaigns`
- `/projects/[id]/campaigns/[campaignId]`
- `/projects/[id]/community`
- `/projects/[id]/rewards`
- `/projects/[id]/onchain`
- `/projects/[id]/trust`
- `/projects/[id]/settings`

The project workspace top subnav:

- `Overview`
- `Campaigns`
- `Community`
- `Rewards`
- `On-chain`
- `Trust`
- `Settings`

The project subnav answers:

`Where am I inside this project?`

## Route Map

### Global routes

- `/overview`
- `/projects`
- `/moderation`
- `/claims`
- `/analytics`
- `/submissions`
- `/settings`

### Project routes

- `/projects/[id]`
- `/projects/[id]/campaigns`
- `/projects/[id]/campaigns/[campaignId]`
- `/projects/[id]/community`
- `/projects/[id]/rewards`
- `/projects/[id]/onchain`
- `/projects/[id]/trust`
- `/projects/[id]/settings`

The existing `/projects/[id]` route remains the project overview instead of introducing a separate `/overview` child route.

## Page Decomposition

Every page should have **one primary operational job**.

The main UI reset is not just visual. It is structural.

## Global pages

### `Overview`

Purpose:

- cross-project executive read
- recent incidents
- pending work
- platform health

### `Moderation`

Purpose:

- global trust queue
- review flags
- suspicious patterns
- contributor actions

### `Claims`

Purpose:

- payout queue
- reward finalization incidents
- claim retries
- payout operations

### `Analytics`

Purpose:

- cross-project performance
- conversion
- growth
- contributor and campaign metrics

### `Submissions`

Purpose:

- review queue
- submission handling

### `Settings`

Purpose:

- account settings
- team settings
- platform-level settings

## Project pages

### `Overview`

Purpose:

- project health
- campaign posture
- community posture
- trust posture
- on-chain posture
- recent activity
- quick actions

### `Campaigns`

Purpose:

- campaign list and detail
- campaign activation
- campaign-level reward/finalization context

Community bot settings and unrelated operational controls do not belong here.

### `Community`

Purpose:

- Community OS owner operations
- captain workspace
- commands
- ranks
- leaderboards
- missions
- raid ops
- automations
- playbooks
- outcomes

This remains the home of project-scoped community management.

### `Rewards`

Purpose:

- reward catalog
- distribution posture
- reward settings
- project-specific reward incidents

### `On-chain`

Purpose:

- assets
- wallets
- pipeline state
- sync controls
- ingestion health
- enrichment and retry operations
- project-scoped on-chain signals

### `Trust`

Purpose:

- trust posture
- contributor quality
- review flags for this project
- watch states
- abuse patterns

### `Settings`

Purpose:

- project configuration
- integrations
- branding
- advanced project options

## In-Page Workflow Modes

Heavy pages should not immediately show every panel at once.

They should use a **contextual segmented control** inside the page.

## Community page modes

Within `/projects/[id]/community`:

- `Operate`
- `Configure`
- `Measure`

Preferred implementation:

- URL-driven segmented state such as `?view=operate`
- not separate routes unless scale later demands it

## On-chain page modes

Within `/projects/[id]/onchain`:

- `Assets`
- `Wallets`
- `Pipeline`
- `Signals`

## Trust page modes

Within `/projects/[id]/trust`:

- `Queue`
- `Patterns`
- `Actions`
- `History`

These controls answer:

`Which mode of this workflow am I in right now?`

## Navigation Behavior

The navigation stack has three layers:

### 1. Left sidebar

Defines product domain.

Examples:

- Projects
- Moderation
- Claims

### 2. Top project subnav

Defines project domain.

Examples:

- Community
- On-chain
- Trust

### 3. Segmented page toggle

Defines workflow mode inside the page.

Examples:

- Operate
- Configure
- Measure

This is the main anti-chaos mechanism for the redesign.

## Visual Direction

The new portal should feel:

- calm
- precise
- premium
- operational
- high-trust

It should not feel like:

- a neon-heavy dashboard wall
- a generic admin template
- an infinite stack of equally weighted panels

## Visual language

- dark foundation
- stronger use of neutrals
- lime accent remains part of the brand but is used more selectively
- more matte surfaces, fewer repeated glow treatments
- stronger typography hierarchy
- more generous spacing
- fewer but more meaningful hero surfaces

## Color system

Base:

- charcoal
- graphite
- slate

Accent:

- lime for active state, primary action, and spotlight moments

Support:

- red or orange for failure and risk
- blue or cyan for info, sync, and background process state

The portal should rely more on hierarchy and composition than on bright borders.

## Typography

The typography system needs stronger contrast between:

- eyebrow labels
- hero titles
- section titles
- metrics
- body text

The current design often compresses too much into one typographic weight class.

## Layout Rules

Each page should follow a stable pattern:

1. page header
2. status band
3. primary actions
4. contextual subnav or segmented control
5. primary content surfaces
6. secondary utility surfaces

Rules:

- no more than 2 to 3 primary surfaces above the fold
- operational pages should not start with a dense grid of many small cards
- configuration-heavy secondary blocks should live lower or in drawers

## Component System Rules

The redesign should standardize on a dedicated portal UI system.

Recommended core building blocks:

- `PortalShell`
- `SidebarNav`
- `ProjectWorkspaceHeader`
- `SectionTabs`
- `SegmentToggle`
- `OpsHero`
- `MetricCluster`
- `OpsTable`
- `OpsDrawer`
- `StatusPill`
- `EmptyState`

## Usage rules

### Sidebar

- stable
- low-noise
- icon + label
- strong active state

### Project header

- project identity
- health pills
- mini status context
- sticky top subnav

### Segmented control

- premium pill/toggle styling
- subtle motion
- mode switching, not classic tabs

### Hero surfaces

- 1 or 2 per page at most
- reserved for status, summary, and major actions

### Tables

Use tables for operational lists:

- campaigns
- captains
- claims
- submissions
- wallets
- assets
- queue items

Do not force all operational data into cards.

### Drawers

Use drawers for:

- create
- edit
- configure
- assign
- run-now configuration

Do not use drawers as the primary content surface.

### Empty states

Every empty state must explain:

- what this screen does
- why it is empty
- what the next action is

## Workflow Rules

Each page should support one clear mental model.

The portal should never feel like:

`here is everything we have for this area`

It should feel like:

`this page helps me perform one class of work`

## Rollout Strategy

The redesign should be delivered in phases instead of a single big-bang rewrite.

## Phase 1: Shell and IA reset

Build:

- new global app shell
- fixed sidebar
- new page container system
- project workspace frame
- top subnav within project

This creates order before full page redesigns land.

## Phase 2: Highest-chaos project pages

Redesign first:

1. `/projects`
2. `/projects/[id]`
3. `/projects/[id]/community`
4. `/projects/[id]/onchain`
5. `/projects/[id]/trust`

These pages deliver the biggest gain in clarity and perceived product maturity.

## Phase 3: Global ops centers

Redesign:

- `/moderation`
- `/claims`
- `/analytics`
- `/submissions`

These should become more queue-first and table-first.

## Phase 4: Remaining project sections

Redesign:

- `/projects/[id]/campaigns`
- `/projects/[id]/rewards`
- `/projects/[id]/settings`

## Phase 5: Polish pass

Finalize:

- motion polish
- icon consistency
- status consistency
- empty states
- feedback states
- responsive behavior

## Non-Goals

This redesign does **not** attempt to:

- rebuild the member-facing webapp
- replace Community OS functionality
- redesign bot flows
- introduce role-specific portals
- add experimentation or A/B infrastructure

This is a portal information architecture and UI system reset.

## Success Criteria

The redesign is successful when:

- users can understand the portal structure quickly
- `Projects` feels like the natural starting point
- project detail is no longer overloaded
- Community, On-chain, and Trust each feel like separate, clear workspaces
- global ops pages feel like real cross-project operation centers
- the portal looks premium and intentional
- navigation feels fast and obvious even as scope continues to grow

## Final Recommendation

The portal should evolve into a **project-first operations product** with:

- stable left navigation
- context-aware project subnav
- segmented workflow modes for heavy pages
- cleaner visual hierarchy
- fewer but stronger surfaces
- dedicated pages for Community, On-chain, Trust, and Rewards

This is the highest-leverage path to making the portal feel next-level without losing the functional depth already built.
