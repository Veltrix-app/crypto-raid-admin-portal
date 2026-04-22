# Veltrix Docs Site Implementation Plan

Date: 2026-04-22
Scope: Public Veltrix docs product
Status: Ready for implementation

## Goal

Build a new public docs product for Veltrix as a separate app in the existing monorepo with:

- its own deploy
- its own domain
- encyclopedia-style navigation
- separate public tracks for `Project Docs` and `Operator Docs`
- docs-safe live snapshots
- interactive state explorers
- reference pages
- release notes

This plan turns the approved docs-site design into an implementation sequence that can be executed inline.

## Execution Rules

This plan should stay focused on the docs-site product only.

In scope:

- docs app scaffold
- docs routing and IA
- shared docs UI primitives
- docs-safe read-only data shaping
- initial flagship content pages
- separate deploy readiness
- final docs QA

Out of scope:

- new product systems
- new production trust, payout or on-chain features
- major changes to portal or webapp product behavior unrelated to docs
- CMS or multilingual work

Assumption:

- docs app will be created at `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs`

## Task 1: Create the docs app foundation

Files and areas:

- create app root:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs`
- create app shell files:
  - `src\app\layout.tsx`
  - `src\app\page.tsx`
  - `src\app\globals.css`
- create initial route placeholders:
  - `src\app\project-docs\page.tsx`
  - `src\app\operator-docs\page.tsx`
  - `src\app\reference\page.tsx`
  - `src\app\release-notes\page.tsx`

Implementation steps:

- [ ] Scaffold a clean Next.js app structure for `veltrix-docs`.
- [ ] Set up the docs layout, metadata and CSS variables so it already feels like a distinct Veltrix surface.
- [ ] Add the top-level routes for `Overview`, `Project Docs`, `Operator Docs`, `Reference` and `Release Notes`.
- [ ] Make sure this app can build independently inside the monorepo.

Verification:

- [ ] Run the relevant workspace build or app build for `veltrix-docs`.

## Task 2: Build the docs navigation and page primitives

Files and areas:

- create shared docs components under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs\src\components\docs`
- create docs navigation model under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs\src\lib\docs`

Suggested components:

- `DocsShell`
- `DocsSidebar`
- `DocsHeader`
- `DocsBreadcrumbs`
- `DocsSection`
- `DocsHero`
- `DocsRelatedPages`
- `DocsReferenceBlock`
- `DocsStateExplorer`
- `DocsSnapshotFrame`

Implementation steps:

- [ ] Build the fixed left sidebar and top-level docs navigation tree.
- [ ] Add breadcrumbs and page framing so every page feels cross-linked and easy to scan.
- [ ] Create the shared section components for surface pages, workflow pages and reference pages.
- [ ] Create the snapshot frame and state explorer primitives that the flagship pages will use later.

Verification:

- [ ] Build the docs app and visually inspect the navigation shell output.

## Task 3: Define the docs information architecture in code

Files and areas:

- `src\lib\docs\docs-nav.ts`
- `src\lib\docs\docs-pages.ts`
- optional content registry files under:
  - `src\lib\docs\content`

Implementation steps:

- [ ] Encode the approved IA into a structured navigation and page registry.
- [ ] Separate the public tracks clearly:
  - `Project Docs`
  - `Operator Docs`
- [ ] Add placeholders for the major sections:
  - Launch Workspace
  - Campaign Studio
  - Quest Studio
  - Raid Studio
  - Rewards
  - Community OS
  - Member Journey
  - Trust Console
  - Payout Console
  - On-chain Console
  - lifecycle and permissions reference
- [ ] Make related-page linking easy through shared config instead of hardcoding everything inside page files.

Verification:

- [ ] Build and confirm the nav tree renders the right structure.

## Task 4: Build the docs-safe data layer

Files and areas:

- create docs loaders and read-only shaping under:
  - `src\lib\docs-data`
- create docs API routes if needed under:
  - `src\app\api\docs`

Suggested loaders:

- `campaign-studio-snapshot`
- `quest-studio-snapshot`
- `community-os-snapshot`
- `trust-console-snapshot`
- `payout-console-snapshot`
- `onchain-console-snapshot`
- `reference-loaders`

Implementation steps:

- [ ] Build read-only, docs-safe loaders that shape example data for docs use.
- [ ] Make sure snapshots are bounded and do not expose unsafe member or operator detail.
- [ ] Build state-explorer data sources for lifecycle, permissions and case-flow pages.
- [ ] Keep the docs data layer presentation-shaped rather than directly exposing raw product APIs.

Verification:

- [ ] Run the docs app build.
- [ ] Verify snapshot and reference endpoints resolve correctly if routes are used.

## Task 5: Ship the docs home and core section pages

Files and areas:

- `src\app\page.tsx`
- `src\app\project-docs\page.tsx`
- `src\app\operator-docs\page.tsx`
- `src\app\reference\page.tsx`
- `src\app\release-notes\page.tsx`

Implementation steps:

- [ ] Build the Overview landing page with:
  - what Veltrix is
  - start-here paths
  - product architecture view
  - direct entry into project and operator docs
- [ ] Build the top-level Project Docs page as an encyclopedia hub.
- [ ] Build the top-level Operator Docs page as an operator and support hub.
- [ ] Build the top-level Reference page for exact system structures.
- [ ] Build the Release Notes page with a clean launch-ready baseline.

Verification:

- [ ] Build the docs app.
- [ ] Manually inspect the top-level routes.

## Task 6: Build the flagship interactive docs pages

Files and areas:

- create route pages and content for:
  - `Campaign Studio`
  - `Quest Studio`
  - `Community OS`
  - `Trust Console`
  - `Payout Console`
  - `On-chain Console`

Implementation steps:

- [ ] Create the first rich surface pages using the full docs page model:
  - header
  - what it is
  - where to find it
  - live snapshot
  - how it works
  - connected surfaces
  - key rules
  - related references
- [ ] Wire in the docs snapshot frame for each flagship page.
- [ ] Add at least one state explorer on the first reference-heavy flagship pages.
- [ ] Make these pages feel like premium documentation, not like blog posts.

Verification:

- [ ] Build the docs app.
- [ ] Inspect the flagship pages for layout, navigation and snapshot rendering.

## Task 7: Build the reference layer

Files and areas:

- create reference pages under:
  - `src\app\reference\...`

Initial target pages:

- lifecycle states
- permissions
- trust case types
- payout case types
- on-chain case types
- automation types
- bot commands
- status labels

Implementation steps:

- [ ] Create compact but exact reference pages for the major system objects.
- [ ] Use shared reference blocks and matrices instead of one-off page markup everywhere.
- [ ] Cross-link all flagship pages into the relevant reference pages.
- [ ] Keep the tone exact and factual, with minimal fluff.

Verification:

- [ ] Build the docs app.

## Task 8: Build the release notes and cross-linking layer

Files and areas:

- release note content files under:
  - `src\lib\docs\release-notes`
- supporting UI:
  - `DocsRelatedPages`
  - release note cards

Implementation steps:

- [ ] Create a first release note baseline that reflects the major completed product phases.
- [ ] Add meaningful related-links modules across the docs site.
- [ ] Ensure users can move naturally from surface docs to workflows, then to references and release notes.

Verification:

- [ ] Build the docs app.
- [ ] Visually inspect linked navigation behavior.

## Task 9: Final polish, deploy readiness and domain handoff

Files and areas:

- docs app metadata
- Vercel config if needed
- docs route titles and descriptions

Implementation steps:

- [ ] Finalize metadata, title patterns and social-preview posture for the docs app.
- [ ] Make the docs app responsive and premium on both desktop and mobile.
- [ ] Ensure there are no dead-end routes, broken links or low-quality placeholder surfaces left in the v1 slice.
- [ ] Prepare the app for a separate Vercel project and custom domain connection.

Verification:

- [ ] Final docs build
- [ ] final route-by-route QA

## Task 10: Launch acceptance

Acceptance pages:

- docs overview
- top-level project docs
- top-level operator docs
- top-level reference
- release notes
- all flagship interactive pages

Acceptance checklist:

- [ ] The docs site clearly feels like a Veltrix product, not a plain documentation template.
- [ ] `Project Docs` and `Operator Docs` are clearly separated but both public.
- [ ] The flagship pages include live snapshots or interactive state blocks.
- [ ] Reference pages feel exact and trustworthy.
- [ ] Navigation, breadcrumbs, related pages and cross-links all work cleanly.
- [ ] The docs app is ready for its own Vercel deployment and domain.

## Recommended Execution Order

Execute in this order:

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9
10. Task 10

## Final Note

This docs product is not a support appendix.

It is a new public Veltrix surface and should be treated with the same design, architecture and product seriousness as the rest of the platform.
