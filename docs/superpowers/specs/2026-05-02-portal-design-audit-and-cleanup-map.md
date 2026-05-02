# Portal Design Audit And Cleanup Map

## Why This Exists

The portal has become functionally powerful, but the design system is not evenly applied yet. Some routes already use the newer calm command-center language, while others still render older cards, loud borders, large isolated "tablet" blocks, mixed colors, and dense stacked modules.

The goal of this audit is to prevent page-by-page guesswork. Every route should move toward the same operating contract:

1. One page role.
2. One primary next action.
3. One primary canvas.
4. At most one secondary rail.
5. Minimal borders, softer surfaces, compact typography.
6. No random colored warning panels unless the user truly needs to act.
7. No large empty gaps caused by asymmetric grids or stacked sidebars.

## Audit Method

The scan covered every `app/**/page.tsx` route and the shared component families that render inside them. The key signals were:

- Older border language: `border-white/[0.04]`, `border-white/[0.05]`, `border-line`, `border-white/8`.
- Older card language: `bg-card`, `bg-card2`, `bg-white/[0.02]`, `bg-white/[0.025]`.
- Over-large old surfaces: `rounded-[22px]`, `rounded-[24px]`, `rounded-[26px]`.
- Fragile layouts: custom `grid-cols-[...]` rails that can push tablets/cards out of alignment.
- Loud states: amber/rose/yellow panels and old primary tints that visually compete with the actual next action.

This is a design-risk map, not a visual screenshot score. A page can have a low technical score and still need hierarchy cleanup if its job is unclear.

## Systemic Findings

### 1. Shared Components Are The Biggest Source Of Drift

Several routes look modern at the top but revert to the old UI deeper down because child components still use the older surface language.

Highest-impact shared cleanup targets:

- `components/forms/project/ProjectForm.tsx`
- `components/forms/campaign/CampaignForm.tsx`
- `components/forms/quest/QuestForm.tsx`
- `components/forms/raid/RaidForm.tsx`
- `components/forms/reward/RewardForm.tsx`
- `components/layout/builder/BuilderPrimitives.tsx`
- `components/layout/detail/DetailPrimitives.tsx`
- `components/community/*Panel.tsx`
- `components/support/*Panel.tsx`
- `components/onchain/*Panel.tsx`
- `components/payout/*Panel.tsx`
- `components/trust/*Panel.tsx`

Recommended fix: do not manually polish each route first. Normalize shared primitives and form shells first, then use route-specific work only where hierarchy is wrong.

### 2. Project Workspace Still Has Too Much Hidden Weight

`/projects/[id]` has the highest design-drift score because the page still imports the full project builder/edit system and many detail surfaces. The page should be a calm project home, not a mixed home plus editor plus setup cockpit.

Recommended fix: keep `/projects/[id]` as project command home only. Move all full edit/setup into `/projects/[id]/settings`.

### 3. Creation Flows Need A Unified Studio Style

`/campaigns/new`, plus quest/raid/reward/project forms, still feel more like stacked admin forms than premium guided product flows.

Recommended fix: create one compact builder/studio system:

- Horizontal progress rail.
- One active step visible.
- Preview/status rail as secondary context only.
- No tall vertical progress/sidebar on desktop unless collapsed.
- Same surface sizes and input groups across campaigns, quests, raids, rewards and project settings.

### 4. Analytics Subpages Are Still Legacy

`/analytics` itself is closer to the new direction, but `/analytics/engagement`, `/analytics/rewards`, and `/analytics/users` still use old standalone page layouts and old metric cards.

Recommended fix: either fold them into the main Analytics lens system or restyle them with `PortalPageFrame` + `OpsCommandRead` + one analytics canvas.

### 5. Detail Pages Are Visually Inconsistent

Campaign, quest, raid, reward, claim, submission and user detail pages still use mixed detail-card styling. These pages are important because they are where operators inspect and decide.

Recommended fix: normalize all detail pages to:

- Compact detail hero.
- Left: primary record read.
- Right: status/actions rail.
- Lower: timeline/activity/related items.
- No loud border boxes unless the record requires manual action.

### 6. Internal Ops Pages Are Functionally Strong But Need Calm Grouping

Business, Success, Security, Growth, Support, On-chain, Moderation, QA and Releases are mostly internal/admin surfaces. They can be denser, but they still need predictable layout rules so the portal does not feel like several products stitched together.

Recommended fix: convert all internal ops routes to the same command-center skeleton:

- Command read.
- Primary queue/table.
- Right rail for posture and shortcuts.
- Deep details via detail routes, not stacked under the queue.

## Route Priority Map

### P0: Fix First Because Project Teams Feel These Immediately

- `/projects/[id]`: too much hidden page weight; make it a calm project-home.
- `/projects/[id]/settings`: needs to become the full edit/setup home with horizontal builder progress.
- `/projects/[id]/launch`: still has old blocks in the launch guide; needs route-card style and no heavy outlines.
- `/projects/[id]/campaigns`: layout can push content sideways; needs campaign board consistency.
- `/projects/[id]/community`: newer shell exists, but deep community panels still use old surfaces.
- `/campaigns/new`: large creation flow still has old builder/sidebar/tablet energy.
- `/campaigns`, `/quests`, `/raids`, `/rewards`: main portfolio pages share the same board pattern and should be cleaned together.

### P1: Fix Next Because They Are Core Operating Surfaces

- `/campaigns/[id]`
- `/quests/[id]`
- `/raids/[id]`
- `/rewards/[id]`
- `/claims`
- `/claims/[id]`
- `/submissions`
- `/submissions/[id]`
- `/users`
- `/users/[id]`
- `/xp`

These pages should use the same detail/list system so reviews, users, XP decisions and record inspection do not feel like a different product.

### P2: Fix Admin And Commercial Pages

- `/settings/billing`: already improved conceptually, but needs softer borders and stronger conversion hierarchy.
- `/settings/profile`
- `/settings/security`
- `/settings/team`
- `/account`
- `/account/team`
- `/business`
- `/business/accounts/[id]`
- `/success`
- `/success/accounts/[id]`
- `/security`
- `/security/accounts/[id]`

These should feel premium and calm because billing, team, account and trust are confidence surfaces.

### P3: Fix Internal Ops Pages For Consistency

- `/analytics`
- `/analytics/engagement`
- `/analytics/rewards`
- `/analytics/users`
- `/growth`
- `/growth/leads/[id]`
- `/support`
- `/support/tickets/[id]`
- `/support/incidents/[id]`
- `/onchain`
- `/moderation`
- `/qa`
- `/releases`
- `/releases/[id]`

These are less visible to normal project teams but important for operator confidence.

### P4: Low-Risk Shell/Utility Routes

- `/`
- `/dashboard`
- `/getting-started`
- `/login`
- `/projects/new`
- `/quests/new`
- `/raids/new`
- `/rewards/new`

These should be checked after shared primitives are normalized. Several will improve automatically when the form and builder primitives are fixed.

## Component Cleanup Order

### Wave 1: Design Tokens And Primitives

Normalize these first:

- `OpsPrimitives.tsx`
- `DetailPrimitives.tsx`
- `BuilderPrimitives.tsx`
- `StatePrimitives.tsx`
- shared `SegmentToggle`, table and filter primitives.

Rules:

- Default border: `border-white/[0.024]` to `border-white/[0.03]`.
- Avoid white borders above `0.035` except active focus states.
- Default surface: dark gradient or `bg-white/[0.012]` to `bg-white/[0.018]`.
- Default radius: 14px to 18px for cards; 20px+ only for hero/major containers.
- Accent panels must be rare and action-based, not decorative.

### Wave 2: Forms And Builders

Normalize:

- Project form.
- Campaign form/studio.
- Quest form.
- Raid form.
- Reward form.

Rules:

- One step visible.
- Horizontal progress on wide screens.
- Compact supporting rail.
- Inputs grouped by intent, not dumped into one grid.
- Preview belongs to the rail or below the active step, not both.

### Wave 3: Project Workspace

Rebuild the project workspace around role clarity:

- `/projects/[id]`: home/read/next action.
- `/projects/[id]/settings`: edit/setup/config.
- `/projects/[id]/launch`: launch readiness and next launch moves.
- `/projects/[id]/community`: command center surfaces only.
- `/projects/[id]/campaigns`: project campaign board.
- `/projects/[id]/rewards`: rewards inventory and funding posture.
- `/projects/[id]/trust`, `/onchain`, `/payouts`: safety and operations grouped as secondary modules.

### Wave 4: Portfolio Boards And Detail Pages

Normalize:

- Campaigns, quests, raids, rewards boards.
- Detail pages for each record type.
- Claims, submissions, users and XP review routes.

Rules:

- Boards use one shared board layout.
- Detail pages use one shared detail layout.
- Empty states and errors use the same state primitives.

### Wave 5: Internal Ops

Normalize:

- Analytics lens pages.
- Business, Success, Security.
- Growth, Support, On-chain, Moderation, QA, Releases.

Rules:

- Command read first.
- Primary queue/table second.
- Secondary rail only if it adds action or risk context.
- Deep modules behind detail routes or tabs.

## Decision

The best path is not to keep chasing screenshots one by one. The clean path is:

1. Sweep shared primitives so the whole portal stops showing loud borders and old card language.
2. Rebuild the project-facing route family.
3. Rebuild form/builder flows.
4. Normalize detail/list pages.
5. Polish internal ops.

This gives the largest visual improvement with the least risk of breaking product functionality.
