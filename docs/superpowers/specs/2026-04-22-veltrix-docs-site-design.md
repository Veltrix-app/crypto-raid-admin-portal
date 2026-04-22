# Veltrix Docs Site Design

Date: 2026-04-22
Status: Approved design
Scope: Public docs product for Veltrix

## 1. Goal

Build a new public docs product for Veltrix that explains the full system clearly, visually and interactively.

This is not a markdown dump and not a hidden internal notes section.

It is a separate public product surface with:

- its own app in the same monorepo
- its own Vercel deploy
- its own domain
- interactive, read-only product snapshots
- encyclopedia-style coverage across project-facing and operator-facing functionality

The docs site should help people understand:

- what Veltrix is
- how each major surface works
- where each function lives
- how the system connects end to end
- what the important states, permissions, cases and workflows are

## 2. Product Position

Veltrix Docs should be positioned as:

the public operating manual for the full Veltrix product system

It must work for two audiences, clearly separated but both public:

- Project Docs
- Operator Docs

Project Docs serve:

- founders
- community and growth leads
- project operators

Operator Docs serve:

- internal operators
- support
- deeper operational readers

These tracks should feel distinct in navigation and content framing, but still live inside the same docs product.

## 3. Primary Outcomes

The docs site must make it possible to:

- find every major product surface quickly
- understand what each function does
- see how a function behaves through snapshots and state examples
- move from surface docs into workflows and reference pages without getting lost
- use the docs publicly without needing product access

The docs site must prove that Veltrix is:

- coherent
- deep
- premium
- explainable
- launch-ready

## 4. Non-Goals

This v1 docs product does not need:

- a CMS
- comments or discussion threads
- full raw public API explorer tooling
- multilingual support
- export or PDF systems
- private personalized docs dashboards
- a full historical versioning system

This is a public encyclopedia and operating manual first.

## 5. Repo and Deployment Model

The docs product should be built as a new app in the existing monorepo.

Recommended location:

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs`

Deployment model:

- separate Vercel project
- separate domain
- separate environment configuration from `veltrix-web`
- still able to share internal libraries and docs-safe loaders from the monorepo where useful

This keeps the setup consistent with the current multi-app product setup while avoiding the overhead of a separate repository.

## 6. Information Architecture

Top-level navigation should be:

- `Overview`
- `Project Docs`
- `Operator Docs`
- `Reference`
- `Release Notes`

### 6.1 Overview

The overview section is the landing area for new readers.

It should explain:

- what Veltrix is
- the major product pillars
- how the system connects
- where to start depending on role

It should include:

- system architecture overview
- quick-start links for project readers
- quick-start links for operator readers
- visual map of the product family

### 6.2 Project Docs

Project Docs should cover the project-facing surfaces and workflows.

Initial categories:

- Launch Workspace
- Campaign Studio
- Quest Studio
- Raid Studio
- Rewards
- Community OS
- Member Journey
- Bot Commands
- Integrations
- Project Settings

### 6.3 Operator Docs

Operator Docs should cover the deeper operational surfaces and workflows.

Initial categories:

- Trust Console
- Payout Console
- On-chain Console
- Claims and Resolution
- Escalations
- Overview and Analytics
- Runbooks
- Incident Handling

### 6.4 Reference

Reference is the exact system-truth layer.

Initial categories:

- Lifecycle States
- Permissions
- Trust Case Types
- Payout Case Types
- On-chain Case Types
- Automation Types
- Bot Commands
- Status Labels
- Snapshots and Health Signals
- Entities and Relationships

### 6.5 Release Notes

Release Notes should act as the public evolution log for the product.

They should summarize:

- meaningful product changes
- important new surfaces
- shifts in workflows
- roadmap milestone completions where relevant

## 7. Page Model

Most docs pages should use a consistent structure.

### 7.1 Standard Page Structure

Each major page should include:

1. Header
2. What It Is
3. Where To Find It
4. Live Snapshot
5. How It Works
6. Connected Surfaces
7. Key States or Rules
8. Related References
9. FAQ or Edge Cases

### 7.2 Page Families

The docs site should support three page families.

#### Surface Pages

For major product surfaces such as:

- Campaign Studio
- Community OS
- Trust Console
- Launch Workspace

These pages should be rich, visual and snapshot-led.

#### Workflow Pages

For process-driven explanations such as:

- launching a project
- building a campaign
- claiming rewards
- resolving trust cases
- rerunning on-chain recovery

These pages should be step-driven and sequence-oriented.

#### Reference Pages

For exact system definitions such as:

- permissions
- case statuses
- command sets
- automation types

These pages should be denser, more exact and less editorial.

## 8. Interactive and Live Data Model

The docs site should not expose raw production internals directly.

It should use a docs-safe, read-only presentation layer.

### 8.1 Data Types

The docs site should combine three data modes:

- curated live snapshots
- interactive state demos
- reference-fed data blocks

### 8.2 Curated Live Snapshots

These are read-only, shaped examples of real product surfaces.

Initial target snapshots:

- Campaign Studio
- Quest Studio
- Community OS
- Trust Console
- Payout Console
- On-chain Console
- Launch Workspace

Snapshots must:

- be docs-safe
- avoid private member-sensitive detail
- show representative product structure
- remain visually strong

### 8.3 Interactive State Demos

These are not required to use live production data.

They should show how the system behaves across state changes.

Initial state demo targets:

- lifecycle flows
- permission presets
- trust case flow
- payout case flow
- on-chain case flow
- automation posture
- bot command state examples

### 8.4 Reference-Fed Blocks

Reference pages should be powered by shaped data from code or config where possible.

Examples:

- permission matrices
- case dictionaries
- command lists
- status lists
- automation mappings

### 8.5 Docs API Layer

The docs app should use its own docs-shaped loaders and endpoints rather than exposing raw product APIs directly.

Recommended pattern:

- `docs snapshots`
- `docs references`
- `docs workflow explainers`

Example endpoint styles:

- `/api/docs/snapshots/campaign-studio`
- `/api/docs/snapshots/community-os`
- `/api/docs/reference/permissions`
- `/api/docs/reference/trust-cases`

These endpoints should be:

- read-only
- public-safe
- cacheable
- presentation-shaped

## 9. Visual and UX Direction

The docs site should feel like a real Veltrix product surface.

It must not feel like a generic docs template.

### 9.1 Required UX Characteristics

- fixed left sidebar
- strong hierarchy
- fast scanability
- search-first but not search-only
- clear breadcrumbs
- related-page links
- visible tree navigation
- visual snapshots and state explorers

### 9.2 Brand Direction

The docs product should inherit the premium hybrid Veltrix launch style.

It should feel:

- cleaner and more editorial than the admin portal
- more product-rich than a plain help center
- clearly related to the public site and the product family

### 9.3 Interaction Direction

The docs should feel interactive even when the user is not logged in.

That means:

- state toggles
- tabs
- snapshot switches
- reference explorers
- linked object maps

## 10. Initial v1 Scope

v1 should include:

- new docs app
- dedicated docs layout and navigation system
- Overview section
- Project Docs section
- Operator Docs section
- Reference section
- Release Notes section
- shared page primitives
- shared snapshot frame
- interactive state explorer primitives
- docs-safe live snapshot layer
- first flagship interactive pages
- separate Vercel deployment
- separate domain

### 10.1 Flagship v1 Pages

The first rich flagship pages should be:

- Campaign Studio
- Quest Studio
- Community OS
- Trust Console
- Payout Console
- On-chain Console

### 10.2 v1 Success Criteria

v1 is successful when:

- a new reader can understand the Veltrix system from the docs site alone
- every major surface has a clear public explanation
- flagship surfaces have visual and interactive examples
- reference pages make the product feel exact and credible
- project and operator readers can both find their path quickly

## 11. Build Order

Recommended build order:

1. Docs app foundation
2. Information architecture and shared docs primitives
3. Docs-safe data layer
4. Core docs content
5. Interactive flagship pages
6. Encyclopedia expansion
7. Deployment, domain and final polish

### 11.1 Task 1: Docs App Foundation

Build:

- app scaffold
- root layout
- nav shell
- route tree
- docs visual baseline

### 11.2 Task 2: Shared Primitives

Build:

- docs page shell
- sidebar tree
- section blocks
- snapshot frame
- state explorer
- reference blocks
- related pages

### 11.3 Task 3: Docs Data Layer

Build:

- snapshot loaders
- reference loaders
- docs-safe shaping logic
- public read-only endpoints

### 11.4 Task 4: Core Content

Build:

- Overview
- main Project Docs entries
- main Operator Docs entries
- initial Reference pages
- Release Notes base

### 11.5 Task 5: Interactive Flagship Pages

Build:

- Campaign Studio page
- Quest Studio page
- Community OS page
- Trust Console page
- Payout Console page
- On-chain Console page

### 11.6 Task 6: Encyclopedia Expansion

Add:

- wider surface coverage
- more workflow pages
- deeper cross-links
- more complete reference coverage

### 11.7 Task 7: Deploy and Launch

Finalize:

- separate Vercel deploy
- domain connection
- metadata and SEO
- final responsive pass
- final acceptance QA

## 12. Acceptance Standard

The finished docs product should feel like:

- a public Veltrix product
- a system manual
- a visual encyclopedia
- a trustworthy reference surface

It should not feel like:

- a plain docs template
- a hidden internal notes folder
- a pile of markdown pages
- a marketing-only microsite

## 13. Final Recommendation

Build `Veltrix Docs` as a new public app in the current monorepo with its own deploy and domain.

Use a public encyclopedia model with:

- two separated tracks
- three content layers
- docs-safe live snapshots
- interactive state explainers
- exact reference pages

This gives Veltrix a public knowledge product that is strong enough for:

- founders
- project teams
- internal operators
- future customers evaluating the platform

And it does so without weakening the current product architecture or exposing unsafe operational detail.
